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
    public from: Hunk,
    public to: Hunk,
  ) {}
}
