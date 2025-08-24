import { Message } from "@/types/a2a";
import { TabData, TabKeyType } from "@/types/tab";
import { NaturFactory } from "@/utils/NaturFactory";
import { v4 as uuidv4 } from "uuid";

const getDefaultTabData = () => ({
    messageList: [],
    userMessage: "",
    lastAIMessageId: "",
    isTabLoading: false,
    isStreaming: false,
});

const initState = {
    tabChat: {
        tabData: {},
    } as TabData<{
        messageList: Message[];
        userMessage: string;
        lastAIMessageId: string;
        isTabLoading: boolean;
        isStreaming: boolean;
    }>,
};

const state = initState;
type State = typeof state;
const createMap = NaturFactory.mapCreator(state);

const actions = NaturFactory.actionsCreator(state)({
    onPushMessage: (tabKey: TabKeyType, message: Message) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            s.tabChat.tabData[realKey].messageList.push(message);
        });
    },
    onPushUserMessage: (tabKey: TabKeyType, userMessage: string) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            s.tabChat.tabData[realKey].messageList.push({
                id: uuidv4(),
                content: userMessage,
                type: 'user',
                timestamp: new Date(),
            });
        });
    },
    onInitAIMessage: (tabKey: TabKeyType, userMessage: string) => async (api) => {
        const realKey = tabKey ?? "default";
        const messageId = uuidv4();
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            s.tabChat.tabData[realKey].messageList.push({
                id: messageId,
                content: userMessage,
                type: 'ai',
                timestamp: new Date(),
            });
            // Store the messageId in state for later retrieval
            s.tabChat.tabData[realKey].lastAIMessageId = messageId;
        });
    },
    onUpdateAIMessage: (tabKey: TabKeyType, chunk: string) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            const messageId = s.tabChat.tabData[realKey].lastAIMessageId;
            const message = s.tabChat.tabData[realKey].messageList.find(m => m.id === messageId);
            if (message) {
                message.content = chunk;
            }
        });
    },
    onUpdateUserMessage: (tabKey: TabKeyType, value: string) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            s.tabChat.tabData[realKey].userMessage = value;
        });
    },
    onResetUserMessage: (tabKey: TabKeyType) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            s.tabChat.tabData[realKey].userMessage = "";
        });
    },
    onClearMessages: (tabKey: TabKeyType) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            s.tabChat.tabData[realKey].messageList = [];
        });
    },
    onSetTabLoading: (tabKey: TabKeyType, isTabLoading: boolean) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            s.tabChat.tabData[realKey].isTabLoading = isTabLoading;
        });
    },
    onSetStreaming: (tabKey: TabKeyType, isStreaming: boolean) => async (api) => {
        const realKey = tabKey ?? "default";
        api.setState((s: State) => {
            if (!s.tabChat.tabData[realKey]) {
                s.tabChat.tabData[realKey] = getDefaultTabData();
            }
            s.tabChat.tabData[realKey].isStreaming = isStreaming;
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
                        messageList: [],
                        userMessage: "",
                        lastAIMessageId: "",
                    };
                }
                return {
                    messageList: res.messageList || [],
                    userMessage: res.userMessage || "",
                    lastAIMessageId: res.lastAIMessageId || "",
                    isTabLoading: res.isTabLoading || false,
                    isStreaming: res.isStreaming || false,
                };
            };
        }
    ),
};

export default {
    name: "chat",
    state,
    actions,
    maps,
}; 