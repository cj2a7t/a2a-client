// Mock agent.json return result
export const MOCK_AGENT_CONFIG = {
    name: "Mock Agent Server",
    version: "1.0.0",
    capabilities: [
        "text-generation",
        "code-completion", 
        "chat-completion",
        "function-calling"
    ],
    endpoints: {
        chat: "/v1/chat/completions",
        completion: "/v1/completions",
        functions: "/v1/functions"
    },
    status: "active",
    model: "gpt-4",
    max_tokens: 4096,
    temperature: 0.7,
    features: {
        streaming: true,
        parallel_processing: true,
        context_window: 8192
    }
};

// This function is no longer needed as ReactJson component is used 