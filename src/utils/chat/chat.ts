import { invokeChatCompletion, invokeStreamChat } from "@/request/ipc/invoke";
import { getEnabledSettingA2AServers } from "@/request/ipc/invokeSettingA2A";
import { getEnabledSettingModels } from "@/request/ipc/invokeSettingModel";
import { SettingA2AServer } from "@/types/a2a";
import delay from "delay";
import { isEmpty } from "lodash";
import { createA2AClient } from "../a2aClient";
import { parseToMap, toPrettyJsonString } from "../json";
import { toExtractJsonString, toJsonStringWithPrefix, toXmlStringWithPrefix } from "../markdown";
import { createStreamingChatHandler } from "../streamingChat";
import { XmlUtils } from "../xml";

export class ChatUtil {

    private forceLLM: boolean;
    private onChunk: (chunk: string) => void;

    private a2aServers: SettingA2AServer[];

    constructor(
        onChunk: (chunk: string) => void,
        forceLLM: boolean = true,
        a2aServers: SettingA2AServer[] = []
    ) {
        this.onChunk = onChunk;
        this.forceLLM = forceLLM;
        this.a2aServers = a2aServers;
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
                this.callLLM(model.apiKey, "", userPrompt, true, this.onChunk);
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
                this.onChunk(toJsonStringWithPrefix("Send message result:", response));
                return;
            }

            // build system prompt
            const a2aServers = this.a2aServers;
            const systemPrompts = XmlUtils.buildA2AServersXml(a2aServers);
            this.onChunk(toXmlStringWithPrefix("#### System prompt:", systemPrompts))

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
            this.onChunk(toJsonStringWithPrefix("#### A2A task response: \n", a2aResponseTask));
        } catch (error) {
            console.error("Failed to send message:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.onChunk("#### Error: \n" + toExtractJsonString(errorMessage));
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

            if (onChunk) {
                // Create Promise and set callbacks
                const streamingPromise = new Promise<string>((resolve, reject) => {
                    let timeoutId: NodeJS.Timeout | null = null;

                    const clearTimeoutAndResolve = (result: string) => {
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                            timeoutId = null;
                        }
                        console.log('Streaming completed in callDeepSeekLLM, resolving promise');
                        resolve(result);
                    };

                    const clearTimeoutAndReject = (error: Error) => {
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                            timeoutId = null;
                        }
                        console.error('Streaming error in callDeepSeekLLM, rejecting promise');
                        reject(error);
                    };

                    // Define callbacks directly when creating
                    const handler = createStreamingChatHandler(
                        (chunk) => {
                            onChunk(chunk);
                        },
                        (fullContent) => {
                            console.log('Full content length:', fullContent.length);
                            if (onComplete) {
                                onComplete(fullContent);
                            }
                            clearTimeoutAndResolve(fullContent);
                            console.log('Promise resolved successfully');
                        },
                        (error) => {
                            console.error('Streaming error in callDeepSee, rejecting promise');
                            clearTimeoutAndReject(new Error(error));
                        },
                        (status, message) => {
                            console.log(`Streaming status: ${status} - ${message}`);
                        }
                    );

                    console.log('StreamingChatHandler created with callbacks:', {
                        hasOnChunk: !!handler['onChunk'],
                        hasOnComplete: !!handler['onComplete'],
                        hasOnError: !!handler['onError'],
                        hasOnStatus: !!handler['onStatus']
                    });

                    // Start listening
                    handler.startListening().then(() => {
                        console.log('Streaming listener started');
                    }).catch(err => {
                        console.error('Failed to start streaming listener:', err);
                        clearTimeoutAndReject(new Error('Failed to start streaming listener'));
                    });

                    // Set timeout
                    timeoutId = setTimeout(() => {
                        console.warn('Streaming timeout in callDeepSeekLLM');
                        clearTimeoutAndReject(new Error('Streaming timeout'));
                    }, 5 * 60 * 1000);

                    // Start streaming API
                    invokeStreamChat(
                        systemPrompt,
                        userPrompt,
                        apiKey
                    ).catch(err => {
                        console.error('Failed to start streaming API:', err);
                        clearTimeoutAndReject(new Error('Failed to start streaming API'));
                    });
                });

                return streamingPromise;
            } else {
                // Create Promise and set callbacks
                const streamingPromise = new Promise<string>((resolve, reject) => {
                    let timeoutId: NodeJS.Timeout | null = null;

                    const clearTimeoutAndResolve = (result: string) => {
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                            timeoutId = null;
                        }
                        console.log('Streaming completed in fallback version, resolving promise');
                        resolve(result);
                    };

                    const clearTimeoutAndReject = (error: Error) => {
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                            timeoutId = null;
                        }
                        console.error('Streaming error in fallback version, rejecting promise');
                        reject(error);
                    };

                    // Define callbacks directly when creating
                    const handler = createStreamingChatHandler(
                        undefined, // onChunk
                        (fullContent) => {
                            console.log('Streaming completed in fallback version, resolving promise');
                            clearTimeoutAndResolve(fullContent);
                        },
                        (error) => {
                            console.error('Streaming error in fallback version, rejecting promise');
                            clearTimeoutAndReject(new Error(error));
                        }
                    );

                    // Start listening
                    handler.startListening().then(() => {
                        console.log('Streaming listener started (fallback)');
                    }).catch(err => {
                        clearTimeoutAndReject(new Error('Failed to start streaming listener'));
                    });

                    // Set timeout
                    timeoutId = setTimeout(() => {
                        clearTimeoutAndReject(new Error('Streaming timeout'));
                    }, 60000);

                    // Start streaming API
                    invokeStreamChat(
                        systemPrompt,
                        userPrompt,
                        apiKey
                    ).catch(err => {
                        clearTimeoutAndReject(new Error('Failed to start streaming API'));
                    });
                });

                return streamingPromise;
            }
        } catch (error) {
            console.error('Failed to call LLM:', error);
            throw error;
        }
    }

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

export const createLLMChat = (onChunk: (chunk: string) => void) => {
    return new ChatUtil(onChunk);
}

export const createDyncmicChat = async (onChunk: (chunk: string) => void) => {
    const a2aServers = await getEnabledSettingA2AServers();
    console.log("createDyncmicChat[a2aServers]: ", toPrettyJsonString(a2aServers));
    if (a2aServers.length === 0) {
        return createLLMChat(onChunk);
    }
    return new ChatUtil(onChunk, false, a2aServers);
}



