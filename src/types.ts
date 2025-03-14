import type { Hunk } from "./patchParser.js";

export class ChangeFile {
  constructor(
    public filename: string,
    public sha: string,
    public status: string,
    public additions: number,
    public deletions: number,
    public changes: number,
    public url: string,
    public patch: string,
    public diff: FileDiff[],
  ) {}
}

export class FileDiff {
  constructor(
    public filename: string,
    public from: Hunk,
    public to: Hunk,
  ) {}

  renderHunk(): string {
    const fromContent = this.from.content.join("\n");
    const toContent = this.to.content.join("\n");

    return `---new_hunk---\n\`\`\`\n${toContent}\n\`\`\`\n\n---old_hunk---\n\`\`\`\n${fromContent}\n\`\`\``;
  }
}
