import { CompletionItem } from "vscode-languageserver-protocol";
import { Method } from "axios";
import { type HassEntities, type HassServices } from "home-assistant-js-websocket";
import { IConfigurationService } from "../configuration";
export interface HassArea {
    area_id: string;
    floor_id: string | null;
    name: string;
    picture: string | null;
    icon: string | null;
    labels: string[];
    aliases: string[];
}
export interface HassAreas {
    [area_id: string]: HassArea;
}
export interface HassFloor {
    floor_id: string;
    name: string;
    level: number | null;
    icon: string | null;
    aliases: string[];
}
export interface HassFloors {
    [floor_id: string]: HassFloor;
}
export interface HassLabel {
    label_id: string;
    name: string;
    icon: string | null;
    color: string | null;
    description: string | null;
}
export interface HassDevice {
    area_id: string | null;
    configuration_url: string | null;
    config_entries: string[];
    connections: [string, string][];
    disabled_by: string | null;
    entry_type: string | null;
    hw_version: string | null;
    id: string;
    identifiers: [string, string][];
    manufacturer: string | null;
    model: string | null;
    name_by_user: string | null;
    name: string | null;
    sw_version: string | null;
    via_device_id: string | null;
    labels: string[];
}
export interface HassDevices {
    [device_id: string]: HassDevice;
}
export interface HassLabels {
    [label_id: string]: HassLabel;
}
export interface HassEntityRegistryEntry {
    area_id: string | null;
    config_entry_id: string | null;
    device_id: string | null;
    disabled_by: string | null;
    entity_category: string | null;
    entity_id: string;
    has_entity_name: boolean;
    hidden_by: string | null;
    icon: string | null;
    id: string;
    name: string | null;
    options: Record<string, any>;
    original_name: string | null;
    platform: string;
    translation_key: string | null;
    unique_id: string | null;
    labels: string[];
}
export interface HassEntityRegistry {
    [entity_id: string]: HassEntityRegistryEntry;
}
export interface IHaConnection {
    tryConnect(): Promise<void>;
    notifyConfigUpdate(conf: any): Promise<void>;
    getAreaCompletions(): Promise<CompletionItem[]>;
    getDeviceCompletions(): Promise<CompletionItem[]>;
    getDomainCompletions(): Promise<CompletionItem[]>;
    getEntityCompletions(): Promise<CompletionItem[]>;
    getFloorCompletions(): Promise<CompletionItem[]>;
    getLabelCompletions(): Promise<CompletionItem[]>;
    getServiceCompletions(): Promise<CompletionItem[]>;
    getHassEntities(): Promise<HassEntities>;
    getHassDevices(): Promise<HassDevices>;
    getHassEntityRegistry(): Promise<HassEntityRegistry>;
    getHassServices(): Promise<HassServices>;
}
export declare class HaConnection implements IHaConnection {
    private configurationService;
    private connection;
    private hassAreas;
    private hassDevices;
    private hassEntities;
    private hassEntityRegistry;
    private hassFloors;
    private hassLabels;
    private hassServices;
    private lastSuccessfulConfig;
    onConnectionEstablished: ((info: {
        name?: string;
        version?: string;
    }) => void) | undefined;
    onConnectionFailed: ((error: string) => void) | undefined;
    private lastEntityCount;
    constructor(configurationService: IConfigurationService);
    tryConnect: () => Promise<void>;
    private createConnection;
    private handleConnectionError;
    notifyConfigUpdate: () => Promise<void>;
    private getHassAreas;
    getAreaCompletions(): Promise<CompletionItem[]>;
    private getHassFloors;
    getFloorCompletions(): Promise<CompletionItem[]>;
    private getHassDevicesInternal;
    getHassDevices(): Promise<HassDevices>;
    getDeviceCompletions(): Promise<CompletionItem[]>;
    getHassEntities(): Promise<HassEntities>;
    private getHassEntityRegistryInternal;
    getHassEntityRegistry(): Promise<HassEntityRegistry>;
    private getHassLabels;
    getLabelCompletions(): Promise<CompletionItem[]>;
    private getAreaName;
    private getFloorName;
    private getDeviceForEntity;
    getEntityCompletions(): Promise<CompletionItem[]>;
    private createEntityCompletionMarkdown;
    getDomainCompletions(): Promise<CompletionItem[]>;
    getHassServices(): Promise<HassServices>;
    getServiceCompletions(): Promise<CompletionItem[]>;
    disconnect(): void;
    callApi: (method: Method, api: string, requestBody?: any) => Promise<any>;
    callService: (domain: string, service: string, serviceData: any) => Promise<any>;
}
//# sourceMappingURL=haConnection.d.ts.map