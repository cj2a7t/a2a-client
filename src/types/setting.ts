// TypeScript type definitions
export interface SettingModel {
    id?: number;
    modelKey: string;
    enabled: boolean;
    apiUrl: string;
    apiKey: string;
    // ext field
    comingSoon?: boolean;
}

export interface SettingModelParams {
    modelKey: string;
    enabled: boolean;
    apiUrl: string;
    apiKey: string;
}

export interface UpdateSettingModelParams {
    id: number;
    enabled?: boolean;
    apiUrl?: string;
    apiKey?: string;
}