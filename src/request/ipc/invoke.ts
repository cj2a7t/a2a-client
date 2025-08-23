import { InvokeResult } from "@/types/invoke";
import { AgentCard } from "@a2a-js/sdk";
import { invoke } from "@tauri-apps/api/core";


export const invokeChatCompletion = async (
    systemPrompt: string,
    userPrompt: string,
    apiKey: string
): Promise<string> => {
    const res: InvokeResult<string> = await invoke("chat_completion", {
        params: {
            system_prompt: systemPrompt,
            user_prompt: userPrompt,
            api_key: apiKey,
        }
    });

    console.log("invokeChatCompletion res: ", res);

    if (res.code === 0 && res.data !== undefined) {
        return res.data;
    } else {
        throw new Error(res.message || "Unknown error while calling chat completion");
    }
};

export const invokeChatCompletionStream = async (
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    maxTokens?: number,
    temperature?: number
): Promise<string> => {
    const res: InvokeResult<string> = await invoke("chat_completion_stream", {
        params: {
            system_prompt: systemPrompt,
            user_prompt: userPrompt,
            api_key: apiKey,
            max_tokens: maxTokens,
            temperature: temperature,
        }
    });

    console.log("invokeChatCompletionStream res: ", res);

    if (res.code === 0 && res.data !== undefined) {
        return res.data;
    } else {
        throw new Error(res.message || "Unknown error while calling streaming chat completion");
    }
};

// New: Start streaming chat without waiting for result
export const startChatCompletionStream = async (
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    maxTokens?: number,
    temperature?: number
): Promise<void> => {
    // This function only starts the streaming process, doesn't wait for result
    // Results are received asynchronously through Tauri event system
    await invoke("chat_completion_stream", {
        params: {
            system_prompt: systemPrompt,
            user_prompt: userPrompt,
            api_key: apiKey,
            max_tokens: maxTokens,
            temperature: temperature,
        }
    });
};


export const invokeStreamChat = async (
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    maxTokens?: number,
    temperature?: number
): Promise<void> => {
    const res: InvokeResult<string> = await invoke("stream_chat", {
        params: {
            system_prompt: systemPrompt,
            user_prompt: userPrompt,
            api_key: apiKey,
            max_tokens: maxTokens,
            temperature: temperature,
        }
    });

    console.log("invokeStreamChat res: ", res);

    if (res.code !== 0) {
        throw new Error(res.message || "Unknown error while calling streaming chat");
    }
};


export const invokeGetAgentCard = async (url: string): Promise<AgentCard> => {
    const res: InvokeResult<AgentCard> = await invoke("get_agent_card", {
        params: {
            url: url,
        }
    });

    console.log("invokeGetAgentCard res: ", res);

    if (res.code === 0 && res.data !== undefined) {
        return res.data;
    } else {
        throw new Error(res.message || "Unknown error while getting agent card");
    }
};

export const invokeSendA2AMessage = async (
    a2aUrl: string,
    taskId: string,
    messageId: string,
    headerSkillId: string,
    text: string
): Promise<any> => {
    const res: InvokeResult<string> = await invoke("send_a2a_message", {
        params: {
            a2a_url: a2aUrl,
            task_id: taskId,
            message_id: messageId,
            header_skill_id: headerSkillId,
            text: text,
        }
    });

    console.log("invokeSendA2AMessage res: ", res);

    if (res.code === 0 && res.data !== undefined) {
        try {
            if (typeof res.data === "string") {
                return JSON.parse(res.data);
            }
            if (typeof res.data === "object") {
                return res.data;
            }
            return res.data;
        } catch (parseError) {
            console.warn("Failed to parse response as JSON, returning original string:", parseError);
            return res.data;
        }
    } else {
        throw new Error(res.message || "Unknown error while sending A2A message");
    }
};
