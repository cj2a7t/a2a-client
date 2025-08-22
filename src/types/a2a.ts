export interface Message {
    id: string;
    content: string;
    type: 'user' | 'ai';
    timestamp: Date;
}

export interface ChatState {
    messages: Message[];
    isLoading: boolean;
    inputValue: string;
    agentUrl: string;
}



// TypeScript type definitions
export interface SettingA2AServer {
    id?: number;
    name: string;
    agentCardUrl: string;
    agentCardJson?: string;
    enabled: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface SettingA2AServerParams {
    name: string;
    agentCardUrl: string;
    agentCardJson?: string;
    enabled: boolean;
}

export interface UpdateSettingA2AServerParams {
    id: number;
    name?: string;
    agentCardUrl?: string;
    agentCardJson?: string;
    enabled?: boolean;
}
