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

export const parsePatch = ({
  filename,
  patch,
}: {
  filename: string;
  patch?: string;
}) => {
  if (!patch) {
    return;
  }
  const lines = patch.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("@@")) {
      // パッチチャンクヘッダーの解析
      const headerMatch = line.match(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@ (.+)/);
      if (!headerMatch) {
        i++;
        continue;
      }
      const origStart = Number.parseInt(headerMatch[1], 10);
      const origCount = Number.parseInt(headerMatch[2], 10);
      const modStart = Number.parseInt(headerMatch[3], 10);
      const modCount = Number.parseInt(headerMatch[4], 10);

      const firstLine = headerMatch[5];

      const origContent: string[] = [firstLine];
      const modContent: string[] = [firstLine];

      let origBranch: string | undefined = undefined;
      let modBranch: string | undefined = undefined;
      let modCommitId: string | undefined = undefined;
      i++;
      // チャンク内の行を読み進める
      while (i < lines.length && !lines[i].startsWith("@@")) {
        const currentLine = lines[i];

        if (currentLine.includes("<<<<<<<")) {
          // 衝突マーカー開始。行頭の '+' は削除しておく
          const markerLine = currentLine.replace(/^\+*/, "");
          const parts = markerLine.split(" ");
          origBranch = parts[1]; // e.g. HEAD
          i++;
          // 変更前コード
          while (
            i < lines.length &&
            !lines[i].replace(/^\+*/, "").startsWith("=======")
          ) {
            origContent.push(lines[i].replace(/^\+/, ""));
            i++;
          }
          // スキップ "=======" 行
          i++;
          // 変更後コード
          while (
            i < lines.length &&
            !lines[i].replace(/^\+*/, "").startsWith(">>>>>>>")
          ) {
            modContent.push(lines[i].replace(/^\+/, ""));
            i++;
          }
          // 変更後マーカーに含まれるコミットIDとブランチ名を解析
          if (i < lines.length) {
            const marker = lines[i].replace(/^\+*/, "");
            const commitMatch = marker.match(/>>>>>>> (\w+)\s+\(([^)]+)\)/);
            if (commitMatch) {
              modCommitId = commitMatch[1];
              modBranch = commitMatch[2];
            }
            i++;
          }

          continue; // 衝突部分解析済みなのでチャンク終了
        }
        origContent.push(currentLine);
        modContent.push(currentLine);

        // 衝突マーカー以外はスキップ
        i++;
      }
      return {
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
    }
    i++;
  }
};
