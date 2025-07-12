import { TextDocuments } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
export interface FileAccessor {
    getFileContents(fileName: string): Promise<string>;
    getFilesInFolder(subFolder: string): string[];
    getFilesInFolderRelativeFrom(subFolder: string, relativeFrom: string): string[];
    getFilesInFolderRelativeFromAsFileUri(subFolder: string, relativeFrom: string): string[];
    getRelativePath(relativeFrom: string, filename: string): string;
    getRelativePathAsFileUri(relativeFrom: string, filename: string): string;
    fromUriToLocalPath(uri: string): string;
}
export declare class StandaloneFileAccessor implements FileAccessor {
    private workspaceFolder;
    private documents;
    private ourRoot;
    constructor(workspaceFolder: string, documents: TextDocuments<TextDocument>);
    getFileContents(uri: string): Promise<string>;
    getFilesInFolder(subFolder: string, filelist?: string[]): string[];
    private dealtWithRelativeFrom;
    getFilesInFolderRelativeFrom(subFolder: string, relativeFrom: string): string[];
    getFilesInFolderRelativeFromAsFileUri(subFolder: string, relativeFrom: string): string[];
    getRelativePath: (relativeFrom: string, filename: string) => string;
    getRelativePathAsFileUri: (relativeFrom: string, filename: string) => string;
    fromUriToLocalPath: (uri: string) => string;
}
//# sourceMappingURL=fileAccessor.d.ts.map