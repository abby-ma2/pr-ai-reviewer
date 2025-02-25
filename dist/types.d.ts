import type { CodeSection } from "./patchParser.js";
export type ModifiedFile = {
    filename: string;
    sha: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    url: string;
    original: CodeSection;
    modified: CodeSection;
};
