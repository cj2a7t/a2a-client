import { InputSchemaItem } from "@/utils/swagger";

export type xDSParam = {
    api_key?: string;
};

export type IDSItem = {
    id: string;
    name: string;
    tool_ids: string[];
    tds_items?: TDSItem[];
};
export type IDSResponse = IDSItem[];

export type TDSExtInfo = {
    domain: string;
    method: string;
    path: string;
    required_params: Record<string, any>;
    ext_info: Record<string, any>;
};
export type TDSItem = {
    id: string;
    name: string;
    description: string;
    input_schema: Record<string, any>;
    tds_ext_info: TDSExtInfo;
};
export type TDSResponse = TDSItem[];

export enum VisiableComponent {
    Editor = "Editor",
    Overview = "Overview",
    TDSTable = "TDSTable",
    IDSTable = "IDSTable",
}

export type VisiableData = {
    component: VisiableComponent;
    // Editor
    scene: string;
    value?: string;
    editMode?: boolean;
};

export type UploadSwaggerData = {
    visiable: boolean;
    parsedSchemas: InputSchemaItem[];
};
