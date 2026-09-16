import { TextDocuments } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { FileAccessor } from "./language-service/src/fileAccessor";
export declare class StandaloneFileAccessor implements FileAccessor {
    private workspaceFolder;
    private documents;
    private workspacePath;
    constructor(workspaceFolder: string, documents: TextDocuments<TextDocument>);
    getFileContents(uri: string): Promise<string>;
    getFilesInFolder(subFolder: string): Promise<string[]>;
    private getAbsoluteFilesInFolder;
    private dealtWithRelativeFrom;
    getFilesInFolderRelativeFrom(subFolder: string, relativeFrom: string): Promise<string[]>;
    getFilesInFolderRelativeFromAsFileUri(subFolder: string, relativeFrom: string): Promise<string[]>;
    getRelativePath: (relativeFrom: string, filename: string) => string;
    getRelativePathAsFileUri: (relativeFrom: string, filename: string) => string;
    fromUriToLocalPath: (uri: string) => string;
}
//# sourceMappingURL=fileAccessor.d.ts.map