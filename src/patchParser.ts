export type CodeSection = {
  filename: string;
  startLine: number;
  lineCount: number;
  branch?: string;
  commitId?: string;
  content: string[];
};

export type PatchParseResult = {
  original: CodeSection;
  modified: CodeSection;
};

/**
 * parseChunkHeader
 */
const parseChunkHeader = (
  line: string,
): {
  origStart: number;
  origCount: number;
  modStart: number;
  modCount: number;
  firstLine: string;
} | null => {
  const headerMatch = line.match(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@ (.+)/);
  if (!headerMatch) {
    return null;
  }

  return {
    origStart: Number.parseInt(headerMatch[1], 10),
    origCount: Number.parseInt(headerMatch[2], 10),
    modStart: Number.parseInt(headerMatch[3], 10),
    modCount: Number.parseInt(headerMatch[4], 10),
    firstLine: headerMatch[5],
  };
};

/**
 * processConflictMarker
 */
const processConflictMarker = (
  lines: string[],
  i: number,
  origContent: string[],
  modContent: string[],
): {
  origBranch?: string;
  modBranch?: string;
  modCommitId?: string;
  nextIndex: number;
} => {
  // start conflict
  const markerLine = lines[i].replace(/^\+*/, "");
  const parts = markerLine.split(" ");
  const origBranch = parts[1]; // e.g. HEAD
  let index = i + 1;

  // original code
  while (
    index < lines.length &&
    !lines[index].replace(/^\+*/, "").startsWith("=======")
  ) {
    origContent.push(lines[index].replace(/^\+/, ""));
    index++;
  }

  // スキップ "=======" 行
  index++;

  // modified code
  while (
    index < lines.length &&
    !lines[index].replace(/^\+*/, "").startsWith(">>>>>>>")
  ) {
    modContent.push(lines[index].replace(/^\+/, ""));
    index++;
  }

  let modBranch: string | undefined;
  let modCommitId: string | undefined;

  // parse branch and commit id
  if (index < lines.length) {
    const marker = lines[index].replace(/^\+*/, "");
    const commitMatch = marker.match(/>>>>>>> (\w+)\s+\(([^)]+)\)/);
    if (commitMatch) {
      modCommitId = commitMatch[1];
      modBranch = commitMatch[2];
    }
    index++;
  }

  return { origBranch, modBranch, modCommitId, nextIndex: index };
};

/**
 * processNormalLine
 */
const processNormalLine = (
  line: string,
  origContent: string[],
  modContent: string[],
) => {
  if (line.startsWith("+")) {
    const markerLine = line.replace(/^\+*/, " ");
    modContent.push(markerLine);
  } else if (line.startsWith("-")) {
    const markerLine = line.replace(/^-*/, " ");
    origContent.push(markerLine);
  } else {
    origContent.push(line);
    modContent.push(line);
  }
};

/**
 * processChunk
 */
const processChunk = (
  lines: string[],
  startIndex: number,
  filename: string,
): { result: PatchParseResult | null; nextIndex: number } => {
  const headerResult = parseChunkHeader(lines[startIndex]);
  if (!headerResult) {
    return { result: null, nextIndex: startIndex + 1 };
  }

  const { origStart, origCount, modStart, modCount, firstLine } = headerResult;

  const origContent: string[] = [firstLine];
  const modContent: string[] = [firstLine];

  let origBranch: string | undefined;
  let modBranch: string | undefined;
  let modCommitId: string | undefined;
  let i = startIndex + 1;

  while (i < lines.length && !lines[i].startsWith("@@")) {
    const currentLine = lines[i];

    if (currentLine.includes("<<<<<<<")) {
      const conflict = processConflictMarker(lines, i, origContent, modContent);

      origBranch = conflict.origBranch;
      modBranch = conflict.modBranch;
      modCommitId = conflict.modCommitId;
      i = conflict.nextIndex;
      continue;
    }

    processNormalLine(currentLine, origContent, modContent);
    i++;
  }

  const result: PatchParseResult = {
    original: {
      filename,
      startLine: origStart,
      lineCount: origCount,
      branch: origBranch,
      commitId: undefined,
      content: origContent,
    },
    modified: {
      filename,
      startLine: modStart,
      lineCount: modCount,
      branch: modBranch,
      commitId: modCommitId,
      content: modContent,
    },
  };

  return { result, nextIndex: i };
};

export const parsePatch = ({
  filename,
  patch,
}: {
  filename: string;
  patch?: string;
}) => {
  const results: PatchParseResult[] = [];
  if (!patch) {
    return results;
  }

  const lines = patch.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("@@")) {
      const { result, nextIndex } = processChunk(lines, i, filename);
      if (result) {
        results.push(result);
      }
      i = nextIndex;
    } else {
      i++;
    }
  }

  return results;
};
