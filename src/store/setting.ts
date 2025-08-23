import { deleteSettingA2AServer, getAllSettingA2AServers, saveSettingA2AServer, toggleSettingA2AServerEnabled, updateSettingA2AServer } from "@/request/ipc/invokeSettingA2A";
import { getAllSettingModels, saveSettingModel, toggleSettingModelEnabled, updateSettingModel } from "@/request/ipc/invokeSettingModel";
import { SettingA2AServer } from "@/types/a2a";
import { SettingModel } from "@/types/setting";
import { NaturFactory } from "@/utils/NaturFactory";
import { isEmpty, isNil } from 'lodash';

const initState = {
    selectedModel: {
        modelKey: "DeepSeek",
        enabled: false,
        apiUrl: "https://api.deepseek.com/v1",
        apiKey: "",
        comingSoon: false,
    } as SettingModel,
    settingModels: [] as SettingModel[],
    // Agents related state
    selectedAgent: null as SettingA2AServer | null,
    settingAgents: [] as SettingA2AServer[],
    // Agents modal state
    isAgentModalVisible: false,
    editingAgent: null as SettingA2AServer | null,
};

const settingModels = [
    {
        modelKey: "DeepSeek",
        enabled: false,
        apiUrl: "https://api.deepseek.com/v1",
        apiKey: "",
        comingSoon: false,
    },
    {
        modelKey: "OpenAI",
        enabled: false,
        apiUrl: "https://api.openai.com/v1",
        apiKey: "",
        comingSoon: true,
    }
] as SettingModel[];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const state = initState;
type State = typeof state;
const createMap = NaturFactory.mapCreator(state);

const actions = NaturFactory.actionsCreator(state)({
    onLoadSettingModels:
        () => async (api) => {
            let models = await getAllSettingModels();
            if (isEmpty(models)) {
                models = settingModels;
            } else {
                const hasOpenAI = models.some(model => model.modelKey === "OpenAI");
                if (!hasOpenAI) {
                    const openAIModel = settingModels.find(model => model.modelKey === "OpenAI");
                    if (openAIModel) {
                        models.push(openAIModel);
                    }
                }
            }
            const updatedModels = models.map(model => ({
                ...model,
                comingSoon: model.modelKey === "OpenAI"
            }));
            console.log("updatedModels===>>", updatedModels)
            api.setState((s: State) => {
                s.settingModels = updatedModels;
                s.selectedModel = updatedModels[0];
            });
        },
    onSelectModel:
        (settingModel: SettingModel) => async (api) => {
            api.setState((s: State) => {
                s.selectedModel = settingModel;
            });
        },
    onToggleModelEnabled: (settingModelId: number | undefined) => async (api) => {
        if (isNil(settingModelId)) {
            throw new Error('Please save model configuration first');
        }
        try {
            await toggleSettingModelEnabled(settingModelId);
            let models = await getAllSettingModels();
            if (isEmpty(models)) {
                models = settingModels;
            } else {
                const hasOpenAI = models.some(model => model.modelKey === "OpenAI");
                if (!hasOpenAI) {
                    const openAIModel = settingModels.find(model => model.modelKey === "OpenAI");
                    if (openAIModel) {
                        models.push(openAIModel);
                    }
                }
            }
            const updatedModels = models.map(model => ({
                ...model,
                comingSoon: model.modelKey === "OpenAI"
            }));

            api.setState((s: State) => {
                s.settingModels = updatedModels;
                s.selectedModel.enabled = updatedModels.find(model => model.id === settingModelId)?.enabled || false;
            });
        } catch (error) {
            console.error('Failed to toggle model enabled:', error);
            throw error;
        }
    },
    onSaveModel: (modelData: SettingModel) => async (api) => {
        if (isEmpty(modelData.modelKey) || isEmpty(modelData.apiUrl)) {
            throw new Error('Model key and API URL are required');
        }

        try {
            let modelId = modelData.id;
            if (isNil(modelId)) {
                modelId = await saveSettingModel({
                    modelKey: modelData.modelKey,
                    enabled: modelData.enabled,
                    apiUrl: modelData.apiUrl,
                    apiKey: modelData.apiKey
                });
                api.setState((s: State) => {
                    s.selectedModel = { ...s.selectedModel, id: modelId };
                });
                api.setState((s: State) => {
                    s.settingModels = s.settingModels.map(model =>
                        model.modelKey === modelData.modelKey
                            ? { ...model, id: modelId }
                            : model
                    );
                });
            } else {
                const result = await updateSettingModel({
                    id: modelId,
                    enabled: modelData.enabled,
                    apiUrl: modelData.apiUrl,
                    apiKey: modelData.apiKey
                });
                api.setState((s: State) => {
                    s.settingModels = s.settingModels.map(model =>
                        model.id === modelId
                            ? { ...model, ...modelData }
                            : model
                    );
                });
            }
        } catch (error) {
            console.error('Failed to save model:', error);
            throw error;
        }
    },
    onUpdateLocalModel: (updates: Partial<SettingModel>) => (api) => {
        api.setState((s: State) => {
            s.selectedModel = { ...s.selectedModel, ...updates };
        });
    },

    onLoadSettingAgents:
        () => async (api) => {
            const agents = await getAllSettingA2AServers();
            api.setState((s: State) => {
                s.settingAgents = agents;
                s.selectedAgent = agents.length > 0 ? agents[0] : null;
            });
        },
    onSelectAgent:
        (agent: SettingA2AServer) => async (api) => {
            api.setState((s: State) => {
                s.selectedAgent = agent;
            });
        },
    onToggleAgentEnabled: (agentId: number | undefined) => async (api) => {
        if (isNil(agentId)) {
            throw new Error('Please save agent configuration first');
        }
        try {
            await toggleSettingA2AServerEnabled(agentId);
            const agents = await getAllSettingA2AServers();
            api.setState((s: State) => {
                s.settingAgents = agents;
                if (s.selectedAgent) {
                    s.selectedAgent.enabled = agents.find(agent => agent.id === agentId)?.enabled || false;
                }
            });
        } catch (error) {
            console.error('Failed to toggle agent enabled:', error);
            throw error;
        }
    },
    onSaveAgent: (agentData: SettingA2AServer) => async (api) => {
        if (isEmpty(agentData.name) || isEmpty(agentData.agentCardUrl)) {
            throw new Error('Agent name and URL are required');
        }

        try {
            let agentId = agentData.id;
            if (isNil(agentId)) {
                agentId = await saveSettingA2AServer({
                    name: agentData.name,
                    enabled: agentData.enabled,
                    agentCardUrl: agentData.agentCardUrl,
                    agentCardJson: agentData.agentCardJson
                });
                api.setState((s: State) => {
                    if (s.selectedAgent) {
                        s.selectedAgent = { ...s.selectedAgent, id: agentId };
                    }
                });
                const updatedAgents = await getAllSettingA2AServers();
                api.setState((s: State) => {
                    s.settingAgents = updatedAgents;
                    s.selectedAgent = updatedAgents.length > 0 ? updatedAgents[0] : null;
                });
            } else {
                await updateSettingA2AServer({
                    id: agentId,
                    enabled: agentData.enabled,
                    agentCardUrl: agentData.agentCardUrl,
                    agentCardJson: agentData.agentCardJson
                });
                const updatedAgents = await getAllSettingA2AServers();
                api.setState((s: State) => {
                    s.settingAgents = updatedAgents;
                    s.selectedAgent = updatedAgents.length > 0 ? updatedAgents[0] : null;
                });
            }
        } catch (error) {
            console.error('Failed to save agent:', error);
            throw error;
        }
    },
    onDeleteAgent: (agentId: number) => async (api) => {
        try {
            await deleteSettingA2AServer(agentId);
            const agents = await getAllSettingA2AServers();
            api.setState((s: State) => {
                s.settingAgents = agents;
                s.selectedAgent = agents.length > 0 ? agents[0] : null;
            });
        } catch (error) {
            console.error('Failed to delete agent:', error);
            throw error;
        }
    },
    onUpdateLocalAgent: (updates: Partial<SettingA2AServer>) => (api) => {
        api.setState((s: State) => {
            if (s.selectedAgent) {
                s.selectedAgent = { ...s.selectedAgent, ...updates };
            }
        });
    },

    onShowAgentModal: () => (api) => {
        api.setState((s: State) => {
            s.isAgentModalVisible = true;
        });
    },
    onHideAgentModal: () => (api) => {
        api.setState((s: State) => {
            s.isAgentModalVisible = false;
            s.editingAgent = null;
        });
    },
    onSetEditingAgent: (agent: SettingA2AServer | null) => (api) => {
        api.setState((s: State) => {
            s.editingAgent = agent;
        });
    },
});

export default {
    name: "setting",
    state,
    actions
};
