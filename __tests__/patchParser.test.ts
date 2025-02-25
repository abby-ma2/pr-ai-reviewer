import { parsePatch } from "../src/patchParser";

describe("parsePatch", () => {
  it("should parse patch with conflict markers correctly", () => {
    const patch = `@@ -85,6 +85,10 @@ export async function run(): Promise<void> {
       info(\`deletions: \${file.deletions}\`);
       info(\`changes: \${file.changes}\`);
     });
+<<<<<<< HEAD
+=======
+    info("done");
+>>>>>>> 9b50671 (wip)
   } catch (error) {
     // Fail the workflow run if an error occurs
     if (error instanceof Error) {`;

    const result = parsePatch({ filename: "filename", patch });
    expect(result).toBeDefined();
    expect(result?.original).toEqual({
      startLine: 85,
      lineCount: 6,
      branch: "HEAD",
      commitId: undefined,
      content: [
        "export async function run(): Promise<void> {",
        "       info(`deletions: ${file.deletions}`);",
        "       info(`changes: ${file.changes}`);",
        "     });",
        "   } catch (error) {",
        "     // Fail the workflow run if an error occurs",
        "     if (error instanceof Error) {",
      ], // 変更前コードは空
    });
    expect(result?.modified).toEqual({
      startLine: 85,
      lineCount: 10,
      branch: "wip",
      commitId: "9b50671",
      content: [
        "export async function run(): Promise<void> {",
        "       info(`deletions: ${file.deletions}`);",
        "       info(`changes: ${file.changes}`);",
        "     });",
        '    info("done");',
        "   } catch (error) {",
        "     // Fail the workflow run if an error occurs",
        "     if (error instanceof Error) {",
      ],
    });
  });
});
