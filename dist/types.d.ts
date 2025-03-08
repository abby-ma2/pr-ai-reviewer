import type { Hunk } from "./patchParser.js";
export type ChangeFile = {
    filename: string;
    sha: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    url: string;
    from: Hunk;
    to: Hunk;
};
