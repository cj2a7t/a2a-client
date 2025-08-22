import { startChatCompletionStream } from '@/request/ipc/invoke';
import { AgentCard } from '@a2a-js/sdk';
import { A2AClientUtil, createA2AClient } from './a2aClient';
import { parseToMap } from './json';
import { createStreamingChatHandler } from './streamingChat';

/**
 * Workflow step callback interface
 */
export interface WorkflowStepCallback {
    (step: number, message: string, data?: any): Promise<void> | void;
}

/**
 * A2A workflow utility class
 * Implements complete A2A workflow: discover agent -> build system prompt -> call LLM -> send task
 */
export class A2AWorkflowUtil {
    private a2aClient: A2AClientUtil;
    private apiKey: string;

    constructor(a2aServerUrl: string, apiKey: string) {
        this.a2aClient = createA2AClient(a2aServerUrl);
        this.apiKey = apiKey;
    }

    /**
     * Execute complete A2A workflow (streaming version)
     * @param userPrompt User prompt
     * @param agentCard Agent card information
     * @param stepCallback Step callback function
     * @returns Workflow execution result
     */
    async executeWorkflowStream(
        userPrompt: string,
        agentCard: AgentCard,
        stepCallback: WorkflowStepCallback
    ): Promise<A2AWorkflowResult> {
        try {
            // Check if agentCard is configured
            const isAgentConfigured = agentCard &&
                agentCard.skills &&
                Array.isArray(agentCard.skills) &&
                agentCard.skills.length > 0 &&
                agentCard.url;

            if (!isAgentConfigured) {
                // If agentCard is not configured, directly call the model to complete user request
                // Only show step info if stepCallback is provided
                if (stepCallback) {
                    await stepCallback(0, 'Agent not configured, directly calling model...');
                }

                const modelResponse = await this.callDeepSeekLLM(
                    "You are a helpful AI assistant. Please help the user with their request.",
                    userPrompt,
                    async (chunk) => {
                        // Stream each chunk to the UI only if stepCallback is provided
                        if (stepCallback) {
                            await stepCallback(1, `Model response chunk: ${chunk}`, { chunk });
                        }
                    },
                    true
                );

                if (stepCallback) {
                    await stepCallback(1, 'Model call completed', { modelResponse });
                }

                return {
                    success: true,
                    agentCard,
                    modelResponse,
                    resultAnalysis: 'Direct model call (no agent configuration)'
                };
            }

            // Original A2A workflow logic
            await stepCallback(0, 'A2A workflow started');

            // 1. Build system prompt XML
            await stepCallback(1, 'Building system prompt XML...');
            const systemPrompt = this.buildSystemPrompt(agentCard);
            await stepCallback(1, 'System prompt built successfully', { systemPrompt });

            // 2. User prompt
            await stepCallback(2, 'Processing user prompt...');
            await stepCallback(2, 'User prompt processed successfully', { userPrompt });

            // 3. Call DeepSeek LLM
            await stepCallback(3, 'Calling DeepSeek LLM...');
            const modelResponse = await this.callDeepSeekLLM(
                systemPrompt,
                userPrompt,
                undefined, // Don't use streaming callback
                false // Don't use streaming when agent is configured
            );
            await stepCallback(3, 'LLM call completed', { modelResponse });

            // 4. Parse model response
            await stepCallback(4, 'Parsing model response...');
            const modelResponseMap = parseToMap(modelResponse);
            await stepCallback(4, 'Model response parsed successfully', { modelResponseMap });

            // 5. Send A2A task
            await stepCallback(5, 'Sending A2A task...');
            const a2aAgentUrl = String(modelResponseMap.agentUrl || '');
            delete modelResponseMap.agentUrl;
            const a2aText = JSON.stringify(modelResponseMap);
            const a2aResponseTask = await this.sendTaskToAgent(a2aAgentUrl, a2aText);
            await stepCallback(5, 'A2A task sent successfully', { a2aResponseTask, a2aText });

            return {
                success: true,
                agentCard,
                systemPromptXml: systemPrompt,
                modelResponse,
                modelResponseMap,
                a2aResponseTask,
                a2aText,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (stepCallback) {
                await stepCallback(-1, `Workflow execution failed: ${errorMessage}`, { error });
            }

            return {
                success: false,
                error: errorMessage,
                agentCard,
            };
        }
    }


    /**
     * Call DeepSeek LLM with streaming support
     * @param systemPrompt System prompt
     * @param userPrompt User prompt
     * @param onChunk Callback for each chunk received
     * @param useStreaming Whether to use streaming (default: true for backward compatibility)
     * @returns LLM response
     */
    public async callDeepSeekLLM(
        systemPrompt: string,
        userPrompt: string,
        onChunk?: (chunk: string) => void,
        useStreaming: boolean = true
    ): Promise<string> {
        try {
            // If not using streaming, directly call non-streaming API
            if (!useStreaming) {
                const { invokeChatCompletion } = await import('@/request/ipc/invoke');
                return await invokeChatCompletion(systemPrompt, userPrompt, this.apiKey);
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
                            clearTimeoutAndResolve(fullContent);
                            console.log('Promise resolved successfully');
                        },
                        (error) => {
                            console.error('Streaming error in callDeepSeekLLM, rejecting promise');
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
                    }, 60000);

                    // Start streaming API
                    startChatCompletionStream(
                        systemPrompt,
                        userPrompt,
                        this.apiKey
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
                        console.error('Failed to start streaming listener (fallback):', err);
                        clearTimeoutAndReject(new Error('Failed to start streaming listener'));
                    });

                    // Set timeout
                    timeoutId = setTimeout(() => {
                        console.warn('Streaming timeout in fallback version');
                        clearTimeoutAndReject(new Error('Streaming timeout'));
                    }, 60000);

                    // Start streaming API
                    startChatCompletionStream(
                        systemPrompt,
                        userPrompt,
                        this.apiKey
                    ).catch(err => {
                        console.error('Failed to start streaming API (fallback):', err);
                        clearTimeoutAndReject(new Error('Failed to start streaming API'));
                    });
                });

                return streamingPromise;
            }
        } catch (error) {
            console.error('Failed to call DeepSeek LLM:', error);
            throw error;
        }
    }

    /**
     * Build system prompt
     * @param agentCard Agent card information
     * @returns System prompt string
     */
    private buildSystemPrompt(agentCard: AgentCard): string {
        // const skillsXml = XmlUtils.buildSkillsXml(agentCard);
        return `<system_prompt>
</system_prompt>`;
    }


    /**
     * Send task to specified Agent
     * @param agentUrl Agent URL
     * @param taskParams Task parameters
     * @returns Response result
     */
    private async sendTaskToAgent(agentUrl: string, userPrompt: string): Promise<any> {
        try {
            // Create new client instance for specified Agent URL
            const agentClient = createA2AClient(agentUrl);
            // Use A2A client to send message
            const response = await agentClient.sendMessage(userPrompt, agentUrl, "");
            // Check response
            if ('error' in response && response.error) {
                throw new Error(`Failed to send task: ${response.error.message}`);
            }
            return response;
        } catch (error) {
            console.error('Failed to send task to Agent:', error);
            throw error;
        }
    }


    /**
     * Get A2A client
     * @returns A2A client instance
     */
    getA2AClient(): A2AClientUtil {
        return this.a2aClient;
    }
}

/**
 * A2A workflow result interface
 */
export interface A2AWorkflowResult {
    success: boolean;
    error?: string;
    agentCard?: AgentCard;
    systemPromptXml?: string;
    modelResponse?: string;
    modelResponseMap?: Record<string, any>;
    a2aResponseTask?: any;
    a2aText?: string;
    resultAnalysis?: string;
}

/**
 * Create A2A workflow utility class instance
 * @param a2aServerUrl A2A server URL
 * @param apiKey DeepSeek API key
 * @returns A2A workflow utility class instance
 */
export const createA2AWorkflow = (a2aServerUrl: string, apiKey: string): A2AWorkflowUtil => {
    return new A2AWorkflowUtil(a2aServerUrl, apiKey);
};

/**
 * Convenience function to execute A2A workflow (streaming version)
 * @param a2aServerUrl A2A server URL
 * @param agentCard Agent card information
 * @param userPrompt User prompt
 * @param apiKey DeepSeek API key
 * @param stepCallback Step callback function (optional)
 * @returns Workflow execution result
 */
export const executeA2AWorkflowStream = async (
    a2aServerUrl: string,
    agentCard: AgentCard,
    userPrompt: string,
    apiKey: string,
    stepCallback?: WorkflowStepCallback
): Promise<A2AWorkflowResult> => {
    const workflow = createA2AWorkflow(a2aServerUrl, apiKey);

    // If no step callback provided, create a dummy one that does nothing
    const dummyCallback: WorkflowStepCallback = async () => { };

    return await workflow.executeWorkflowStream(userPrompt, agentCard, stepCallback || dummyCallback);
}; 