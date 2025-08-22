import { Message } from "@/types/a2a";
import { TabKeyType } from "@/types/tab";
import { NaturFactory } from "@/utils/NaturFactory";
import { TabData } from "./tabdata";
import { AgentCard } from "@a2a-js/sdk";
import { createA2AClient } from "@/utils/a2aClient";

const getDefaultTabData = () => ({
    messages: [],
    isLoading: false,
    inputValue: "",
    agentUrl: "",
    isEnabled: false,
    agentConfig: {} as AgentCard,
    apiKey: "",
    isTabLoading: false,
    servers: [] as Array<{
        id: string;
        name: string;
        url: string;
        isEnabled: boolean;
        agentCard?: AgentCard;
    }>,
    selectedServerId: "",
});

const initState = {
    tabChat: {
        tabData: {},
    } as TabData<{
        messages: Message[];
        isLoading: boolean;
        inputValue: string;
        agentUrl: string;
        isEnabled: boolean;
        agentConfig: AgentCard;
        apiKey: string;
        isTabLoading: boolean;
        servers: Array<{
            id: string;
            name: string;
            url: string;
            isEnabled: boolean;
            agentCard?: AgentCard;
        }>;
        selectedServerId: string;
    }>,
};

const state = initState;
type State = typeof state;
const createMap = NaturFactory.mapCreator(state);

const actions = NaturFactory.actionsCreator(state)({
    addMessage: (tabKey: TabKeyType, message: Message) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            s.tabChat.tabData[realKey].messages.push(message);
        });
    },

    setInputValue: (tabKey: TabKeyType, value: string) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            s.tabChat.tabData[realKey].inputValue = value;
        });
    },

    setIsLoading: (tabKey: TabKeyType, loading: boolean) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            s.tabChat.tabData[realKey].isLoading = loading;
        });
    },

    clearMessages: (tabKey: TabKeyType) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            s.tabChat.tabData[realKey].messages = [];
        });
    },

    setAgentUrl: (tabKey: TabKeyType, url: string) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            s.tabChat.tabData[realKey].agentUrl = url;
            s.tabChat.tabData[realKey].isEnabled = false;
            s.tabChat.tabData[realKey].agentConfig = {} as AgentCard;
        });
    },

    toggleAgentEnabled: (tabKey: TabKeyType, enabled: boolean) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            s.tabChat.tabData[realKey].isEnabled = enabled;
        });
    },

    onFetchAgentConfig: (tabKey: TabKeyType, agentUrl: string) => async (api) => {
        const realKey = tabKey ?? "default";
        let agentCard: AgentCard = {} as AgentCard;
        if (agentUrl) {
            const a2aClient = createA2AClient(agentUrl);
            agentCard = await a2aClient.getAgentCard();
        }
        console.log("agentCard", agentCard);
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            s.tabChat.tabData[realKey].agentConfig = agentCard;
            s.tabChat.tabData[realKey].agentUrl = agentUrl;
        });
    },

    removeAgentConfig: (tabKey: TabKeyType) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            s.tabChat.tabData[realKey].agentConfig = {} as AgentCard;
            // Don't clear agentUrl, only clear configuration data
        });
    },

    setApiKey: (tabKey: TabKeyType, apiKey: string) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            s.tabChat.tabData[realKey].apiKey = apiKey;
        });
    },

    updateMessageContent: (tabKey: TabKeyType, messageId: string, content: string) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            const message = s.tabChat.tabData[realKey].messages.find(m => m.id === messageId);
            if (message) {
                message.content = content;
            }
        });
    },

    setTabLoading: (tabKey: TabKeyType, loading: boolean) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            s.tabChat.tabData[realKey].isTabLoading = loading;
        });
    },

    // A2A Server management actions
    addServer: (tabKey: TabKeyType, server: { id: string; name: string; url: string }) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            s.tabChat.tabData[realKey].servers.push({
                ...server,
                isEnabled: false,
                agentCard: undefined
            });
        });
    },

    toggleServer: (tabKey: TabKeyType, serverId: string, enabled: boolean) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            const server = s.tabChat.tabData[realKey].servers.find(s => s.id === serverId);
            if (server) {
                server.isEnabled = enabled;
                if (enabled) {
                    s.tabChat.tabData[realKey].agentUrl = server.url;
                    s.tabChat.tabData[realKey].isEnabled = true;
                    s.tabChat.tabData[realKey].selectedServerId = serverId;
                } else {
                    // 如果禁用的是当前选中的服务器，清除选择
                    if (s.tabChat.tabData[realKey].selectedServerId === serverId) {
                        s.tabChat.tabData[realKey].selectedServerId = "";
                        s.tabChat.tabData[realKey].isEnabled = false;
                        s.tabChat.tabData[realKey].agentUrl = "";
                    }
                }
            }
        });
    },

    selectServer: (tabKey: TabKeyType, serverId: string) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            const server = s.tabChat.tabData[realKey].servers.find(s => s.id === serverId);
            if (server && server.isEnabled) {
                s.tabChat.tabData[realKey].selectedServerId = serverId;
                s.tabChat.tabData[realKey].agentUrl = server.url;
                s.tabChat.tabData[realKey].isEnabled = true;
                s.tabChat.tabData[realKey].agentConfig = server.agentCard || {} as AgentCard;
            }
        });
    },

    updateServerAgentCard: (tabKey: TabKeyType, serverId: string, agentCard: AgentCard) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            const server = s.tabChat.tabData[realKey].servers.find(s => s.id === serverId);
            if (server) {
                server.agentCard = agentCard;
                // 如果这是当前选中的服务器，也更新agentConfig
                if (s.tabChat.tabData[realKey].selectedServerId === serverId) {
                    s.tabChat.tabData[realKey].agentConfig = agentCard;
                }
            }
        });
    },


});

export const maps = {
    mapChat: createMap(
        (state: State) => state.tabChat.tabData,
        (tabData: Record<string, any>) => {
            return (tabKey: TabKeyType) => {
                const key = tabKey ?? "default";
                const res = tabData[key];
                if (!res) {
                    return {
                        messages: [],
                        isLoading: false,
                        inputValue: "",
                        agentUrl: "",
                        isEnabled: false,
                        agentConfig: {} as AgentCard,
                        apiKey: "",
                        isTabLoading: false,
                        servers: [],
                        selectedServerId: "",
                    };
                }
                // 确保返回的数据包含所有必需字段
                return {
                    messages: res.messages || [],
                    isLoading: res.isLoading || false,
                    inputValue: res.inputValue || "",
                    agentUrl: res.agentUrl || "",
                    isEnabled: res.isEnabled || false,
                    agentConfig: res.agentConfig || {} as AgentCard,
                    apiKey: res.apiKey || "",
                    isTabLoading: res.isTabLoading || false,
                    servers: res.servers || [],
                    selectedServerId: res.selectedServerId || "",
                };
            };
        }
    ),
};

export default {
    name: "a2a",
    state,
    actions,
    maps,
}; 