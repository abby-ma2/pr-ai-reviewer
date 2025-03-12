import { parseReviewComment } from "../src/reviewer";

describe("parseReviewComment", () => {
  it("正しく単一のコメントをパースする", () => {
    const input = `10-15:
コードのインデントが不適切です。修正してください。`;

    const result = parseReviewComment(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      startLine: 10,
      endLine: 15,
      comment: "コードのインデントが不適切です。修正してください。",
      isLGTM: false,
    });
  });

  it("複数のコメントを正しくパースする", () => {
    const input = `10-15:
コードのインデントが不適切です。修正してください。
---
20-25:
変数名がわかりにくいです。より記述的な名前を検討してください。`;

    const result = parseReviewComment(input);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      startLine: 10,
      endLine: 15,
      comment: "コードのインデントが不適切です。修正してください。",
      isLGTM: false,
    });
    expect(result[1]).toEqual({
      startLine: 20,
      endLine: 25,
      comment: "変数名がわかりにくいです。より記述的な名前を検討してください。",
      isLGTM: false,
    });
  });

  it("LGTMフラグを正しく識別する", () => {
    const input = `10-15:
LGTM! コードは綺麗で理解しやすいです。
---
20-25:
この実装は改善の余地があります。`;

    const result = parseReviewComment(input);

    expect(result).toHaveLength(2);
    expect(result[0].isLGTM).toBe(true);
    expect(result[1].isLGTM).toBe(false);
  });

  it("複数行にわたるコメントを正しくパースする", () => {
    const input = `10-15:
これは複数行の
コメントです。
コードレビューの内容を
詳細に記述しています。
---
20-25:
別のコメント`;

    const result = parseReviewComment(input);

    expect(result).toHaveLength(2);
    expect(result[0].comment).toBe(
      "これは複数行の\nコメントです。\nコードレビューの内容を\n詳細に記述しています。",
    );
    expect(result[1].comment).toBe("別のコメント");
  });

  it("空の入力に対して空の配列を返す", () => {
    expect(parseReviewComment("")).toEqual([]);
    expect(parseReviewComment("   ")).toEqual([]);
  });

  it("不正なフォーマットのセクションをスキップする", () => {
    const input = `10-15:
正しいコメント
---
不正なフォーマット
---
20-25:
別のコメント`;

    const result = parseReviewComment(input);

    expect(result).toHaveLength(2);
    expect(result[0].startLine).toBe(10);
    expect(result[1].startLine).toBe(20);
  });

  it("差分コードを含むコメントを正しくパースする", () => {
    const input = `45-45:
不適切な変数名です。より記述的な名前を使用してください。
\`\`\`diff
-        const x = calculateValue();
+        const calculatedTotal = calculateValue();
\`\`\``;

    const result = parseReviewComment(input);

    expect(result).toHaveLength(1);
    expect(result[0].comment).toContain("```diff");
    expect(result[0].comment).toContain(
      "+        const calculatedTotal = calculateValue();",
    );
  });
});
