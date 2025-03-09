export class Hunk {
  constructor(
    public filename: string,
    public startLine: number,
    public lineCount: number,
    public content: string[],
    public branch?: string,
    public commitId?: string,
  ) {}
}

export class PatchParseResult {
  constructor(
    public from: Hunk,
    public to: Hunk,
  ) {}
}

/**
 * parseChunkHeader
 */
const parseChunkHeader = (
  line: string,
): {
  fromStart: number;
  fromCount: number;
  toStart: number;
  toCount: number;
  firstLine: string;
} | null => {
  const headerMatch = line.match(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@ (.+)/);
  if (!headerMatch) {
    return null;
  }

  return {
    fromStart: Number.parseInt(headerMatch[1], 10),
    fromCount: Number.parseInt(headerMatch[2], 10),
    toStart: Number.parseInt(headerMatch[3], 10),
    toCount: Number.parseInt(headerMatch[4], 10),
    firstLine: headerMatch[5],
  };
};

/**
 * processConflictMarker
 */
const processConflictMarker = (
  lines: string[],
  patchLineNo: number,
  lineNo: number,
  fromContent: string[],
  toContent: string[],
): {
  origBranch?: string;
  modBranch?: string;
  modCommitId?: string;
  nextIndex: number;
} => {
  // start conflict
  // const markerLine = lines[lineNo].replace(/^\+*/, "");
  const markerLine = lines[lineNo];
  const parts = markerLine.split(" ");
  const origBranch = parts[1]; // e.g. HEAD
  let index = lineNo + 1;

  // original code
  while (
    index < lines.length &&
    !lines[index].replace(/^\+*/, "").startsWith("=======")
  ) {
    // origContent.push(lines[index].replace(/^\+/, ""));
    fromContent.push(lines[index]);
    index++;
  }

  // スキップ "=======" 行
  index++;

  // modified code
  while (
    index < lines.length &&
    !lines[index].replace(/^\+*/, "").startsWith(">>>>>>>")
  ) {
    // modContent.push(lines[index].replace(/^\+/, ""));
    toContent.push(`${patchLineNo} ${lines[index]}`);
    index++;
  }

  let modBranch: string | undefined;
  let modCommitId: string | undefined;

  // parse branch and commit id
  if (index < lines.length) {
    // const marker = lines[index].replace(/^\+*/, "");
    const marker = lines[index];
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
  lineNo: number,
  line: string,
  fromContent: string[],
  toContent: string[],
) => {
  if (line.startsWith("+")) {
    // const markerLine = line.replace(/^\+*/, " ");
    toContent.push(`${lineNo + 1} ${line}`);
  } else if (line.startsWith("-")) {
    // const markerLine = line.replace(/^-*/, " ");
    fromContent.push(line);
  } else {
    fromContent.push(line);
    toContent.push(`${lineNo + 1} ${line}`);
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

  const { fromStart, fromCount, toStart, toCount, firstLine } = headerResult;
  let lineNo = toStart - 1;
  const fromContent: string[] = [firstLine];
  const toContent: string[] = [`${lineNo}  ${firstLine}`];

  let origBranch: string | undefined;
  let modBranch: string | undefined;
  let modCommitId: string | undefined;
  let i = startIndex + 1;

  while (i < lines.length && !lines[i].startsWith("@@")) {
    const currentLine = lines[i];

    if (currentLine.includes("<<<<<<<")) {
      lineNo++;
      const conflict = processConflictMarker(
        lines,
        lineNo,
        i,
        fromContent,
        toContent,
      );

      origBranch = conflict.origBranch;
      modBranch = conflict.modBranch;
      modCommitId = conflict.modCommitId;
      i = conflict.nextIndex;
      continue;
    }

    processNormalLine(lineNo, currentLine, fromContent, toContent);
    i++;
    lineNo++;
  }

  const result = new PatchParseResult(
    new Hunk(
      filename,
      fromStart,
      fromCount,
      fromContent,
      origBranch,
      undefined,
    ),
    new Hunk(filename, toStart, toCount, toContent, modBranch, modCommitId),
  );

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
