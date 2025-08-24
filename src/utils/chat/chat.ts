import { invokeChatCompletion, invokeStreamChat } from "@/request/ipc/invoke";
import { getEnabledSettingA2AServers } from "@/request/ipc/invokeSettingA2A";
import { getEnabledSettingModels } from "@/request/ipc/invokeSettingModel";
import { SettingA2AServer } from "@/types/a2a";
import delay from "delay";
import { isEmpty } from "lodash";
import { createA2AClient } from "../a2aClient";
import { parseToMap } from "../json";
import { toJsonStringWithPrefix, toXmlStringWithPrefix } from "../markdown";
import { tauriEventListener } from "../TauriEventListener";
import { XmlUtils } from "../xml";

export class ChatUtil {

    private forceLLM: boolean;
    private onChunk: (chunk: string) => void;
    private onComplete?: (chunk: string) => void;

    private a2aServers: SettingA2AServer[];

    constructor(
        onChunk: (chunk: string) => void,
        onComplete?: (chunk: string) => void,
        forceLLM: boolean = true,
        a2aServers: SettingA2AServer[] = []
    ) {
        this.onChunk = onChunk;
        this.forceLLM = forceLLM;
        this.a2aServers = a2aServers;
        this.onComplete = onComplete;
    }

    async sendMessage(userPrompt: string) {

        try {
            // get all model list
            // TODO hardcode
            const modelList = await getEnabledSettingModels();
            const model = modelList.find(model => model.modelKey === "DeepSeek");
            if (!model) {
                throw new Error("Currently only deepseek models are supported, please configure your model configuration first.");
            }

            // direct call llm, unuse a2a function
            if (this.forceLLM) {
                // call llm
                await this.callLLM(model.apiKey, "", userPrompt, true, this.onChunk, this.onComplete);
                this.onComplete?.("finished");
                return;
            }

            // help interactive use
            await delay(2000);
            // exract a2a protocol method: @/message/send or @/message/stream
            const a2aProtocolMethod = userPrompt.match(/@\/message\/send|\@\/message\/stream/);
            if (isEmpty(a2aProtocolMethod)) {
                const response = {
                    userprompt: userPrompt,
                    message: "Use the @A2A command to get started. If you’d prefer not to use A2A, you can disable A2A Servers anytime."
                };
                const resultText = toJsonStringWithPrefix("Send message result:", response);
                await this.streamText(resultText, this.onChunk);
                this.onComplete?.("finished");
                return;
            }

            // build system prompt
            const a2aServers = this.a2aServers;
            const systemPrompts = XmlUtils.buildA2AServersXml(a2aServers);
            const systemPromptText = toXmlStringWithPrefix("#### System prompt:", systemPrompts);
            await this.streamText(systemPromptText, this.onChunk);


            // call LLM with the generated system prompt
            let chunkIndex = 0;
            let finalResponse = "";
            await this.callLLM(
                model.apiKey,
                systemPrompts,
                userPrompt,
                true,
                (chunk) => {
                    if (chunkIndex === 0) {
                        this.onChunk("#### Model Response: \n ```json \n")
                    }
                    this.onChunk(chunk);
                    chunkIndex++;
                },
                (fullContent) => {
                    finalResponse = fullContent;
                    this.onChunk("\n ``` \n")
                }
            );
            const modelResponseMap = parseToMap(finalResponse);
            console.log("modelResponseMap: ", modelResponseMap);

            // send A2A task
            const a2aAgentUrl = String(modelResponseMap.agentUrl || '');
            const a2aResponseTask = await this.sendTaskToAgent(a2aAgentUrl, modelResponseMap.userPrompts, modelResponseMap.skillId);
            const a2aResponseTaskText = toJsonStringWithPrefix("#### A2A task response: \n", a2aResponseTask);
            await this.streamText(a2aResponseTaskText, this.onChunk);
            this.onComplete?.("finished");
        } catch (error) {
            console.error("Failed to send message:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorText = toJsonStringWithPrefix("#### Error: \n", errorMessage);
            await this.streamText(errorText, this.onChunk);
            this.onComplete?.("finished");
        }
    }

    private async callLLM(
        apiKey: string,
        systemPrompt: string,
        userPrompt: string,
        useStreaming: boolean = true,
        onChunk?: (chunk: string) => void,
        onComplete?: (chunk: string) => void,
    ): Promise<string> {
        try {
            // If not using streaming, directly call non-streaming API
            if (!useStreaming) {
                return await invokeChatCompletion(systemPrompt, userPrompt, apiKey);
            }

            if (!onChunk) {
                throw new Error("onChunk is not defined");
            }

            // Create Promise and set callbacks
            const streamingPromise = new Promise<string>((resolve, reject) => {
                try {
                    let timeoutId: NodeJS.Timeout | null = null;
                    const clearTimeoutAndResolve = (result: string) => {
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                            timeoutId = null;
                        }
                        console.log('Streaming completed in callLLM, resolving promise');
                        resolve(result);
                    };

                    const clearTimeoutAndReject = (error: Error) => {
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                            timeoutId = null;
                        }
                        console.error('Streaming error in callLLM, rejecting promise');
                        reject(error);
                    };

                    // Use chat stream listener
                    tauriEventListener.startListening('chat_stream_chunk', {
                        onChunk: (chunk: string) => {
                            onChunk(chunk);
                        },
                        onComplete: (fullContent: string) => {
                            console.log('Full content length:', fullContent.length);
                            if (onComplete) {
                                onComplete(fullContent);
                            }
                            clearTimeoutAndResolve(fullContent);
                            console.log('Promise resolved successfully');
                        },
                        onError: (error: string) => {
                            console.error('Streaming error in callLLM, rejecting promise');
                            clearTimeoutAndReject(new Error(error));
                        },
                        onStatus: (status: string, message: string) => {
                            console.log(`Streaming status: ${status} - ${message}`);
                        }
                    }).then(() => {
                        console.log('Global event listener started');
                    }).catch((err: any) => {
                        console.error('Failed to start global event listener:', err);
                        clearTimeoutAndReject(new Error('Failed to start global event listener'));
                    });

                    // Set timeout
                    timeoutId = setTimeout(() => {
                        console.warn('Streaming timeout in callLLM');
                        clearTimeoutAndReject(new Error('Streaming timeout'));
                    }, 5 * 60 * 1000);

                    // Start streaming API
                    invokeStreamChat(systemPrompt, userPrompt, apiKey)
                        .then(result => {
                            console.log('Streaming API started successfully:', result);
                        })
                        .catch(err => {
                            console.log("invokeStreamChat err: ", err);
                            clearTimeoutAndReject(err);
                        });
                } catch (error) {
                    console.error('Failed to call streaming:', error);
                    throw error;
                }
            });
            return streamingPromise;
        } catch (error) {
            console.error('Failed to call LLM:', error);
            throw error;
        }
    }

    private streamText = async (
        text: string,
        onChunk: (chunk: string) => void,
    ) => {
        let i = 0;
        while (i < text.length) {
            const randomChunkSize = Math.floor(Math.random() * 6) + 5;
            const chunk = text.slice(i, i + randomChunkSize);
            onChunk(chunk);
            if (i + randomChunkSize < text.length) {
                const randomDelay = Math.floor(Math.random() * 101) + 100;
                await delay(randomDelay);
            }
            i += randomChunkSize;
        }
        await delay(200);
        onChunk("\r");
    };

    private async sendTaskToAgent(agentUrl: string, userPrompt: string, headerSkillId: string): Promise<any> {
        try {
            // create new client instance for specified Agent URL
            const agentClient = createA2AClient(agentUrl);
            // use A2A client to send message
            const response = await agentClient.sendMessage(userPrompt, agentUrl, headerSkillId);
            // check response
            if ('error' in response && response.error) {
                throw new Error(`Failed to send task: ${response.error.message}`);
            }
            return response;
        } catch (error) {
            console.error('Failed to send task to Agent:', error);
            throw error;
        }
    }
}

export const createLLMChat = (onChunk: (chunk: string) => void, onComplete?: (chunk: string) => void) => {
    return new ChatUtil(onChunk, onComplete);
}

export const createDyncmicChat = async (onChunk: (chunk: string) => void, onComplete?: (chunk: string) => void) => {
    const a2aServers = await getEnabledSettingA2AServers();
    if (a2aServers.length === 0) {
        return createLLMChat(onChunk, onComplete);
    }
    return new ChatUtil(onChunk, onComplete, false, a2aServers);
}



