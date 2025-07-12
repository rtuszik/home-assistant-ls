import { DidChangeConfigurationParams } from "vscode-languageserver-protocol";
export interface IConfigurationService {
    isConfigured: boolean;
    token?: string;
    url?: string;
    ignoreCertificates: boolean;
    disableAutomaticFileAssociation: boolean;
    autoRenderTemplates: boolean;
    updateConfiguration(config: DidChangeConfigurationParams): void;
}
export interface HomeAssistantConfiguration {
    longLivedAccessToken?: string;
    hostUrl?: string;
    ignoreCertificates: boolean;
    disableAutomaticFileAssociation: boolean;
    autoRenderTemplates: boolean;
}
export declare class ConfigurationService implements IConfigurationService {
    isConfigured: boolean;
    token?: string;
    url?: string;
    ignoreCertificates: boolean;
    disableAutomaticFileAssociation: boolean;
    autoRenderTemplates: boolean;
    constructor();
    updateConfiguration: (config: DidChangeConfigurationParams) => void;
    private setConfigViaEnvironmentVariables;
    private getUri;
}
//# sourceMappingURL=configuration.d.ts.map