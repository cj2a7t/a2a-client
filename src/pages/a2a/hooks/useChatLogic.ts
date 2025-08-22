import { useCallback } from 'react';
import { message } from 'antd';
import { useTabKey } from '@/utils/tabkey';
import { useFlatInject } from '@/utils/hooks';
import { Message } from '@/types/a2a';
import { executeA2AWorkflowStream } from '@/utils/a2aWorkflow';

export const useChatLogic = () => {
    const tabKey = useTabKey();
    const [store] = useFlatInject("a2a");

    const defaultChatData = {
        messages: [],
        isLoading: false,
        inputValue: '',
        agentUrl: '',
        isEnabled: false,
        agentConfig: {},
        apiKey: '',
        servers: [],
        selectedServerId: '',
    };

    const chatData = store.tabChat.tabData[tabKey] || defaultChatData;

    const createMessage = useCallback((content: string, type: 'user' | 'ai'): Message => ({
        id: Date.now().toString(),
        content,
        type,
        timestamp: new Date(),
    }), []);

    const handleSendMessage = useCallback(async () => {
        if (!chatData.inputValue.trim() || chatData.isLoading) {
            return;
        }

        const userMessage = createMessage(chatData.inputValue.trim(), 'user');
        await store.addMessage(tabKey, userMessage);
        await store.setInputValue(tabKey, "");
        await store.setIsLoading(tabKey, true);

        try {
            const aiMessage = createMessage("🤔 Thinking...", 'ai');
            await store.addMessage(tabKey, aiMessage);

            let stepMessages: string[] = [];
            let streamingContent = '';
            let isStreaming = false;
            let hasError = false;
            let streamCompleted = false;

            const isAgentConfigured = chatData.isEnabled &&
                chatData.agentConfig &&
                chatData.agentConfig.skills &&
                Array.isArray(chatData.agentConfig.skills) &&
                chatData.agentConfig.skills.length > 0 &&
                chatData.agentUrl;

            const result = await executeA2AWorkflowStream(
                chatData.agentUrl,
                chatData.agentConfig,
                userMessage.content,
                chatData.apiKey || "your-api-key-here",
                isAgentConfigured ? async (step: number, message: string, data?: any) => {
                    console.log(`Step ${step}: ${message}`, data);

                    if (hasError) {
                        return;
                    }

                    if (!isAgentConfigured && (message.includes('Model response chunk:') || message.includes('LLM response chunk:'))) {
                        const chunkMatch = message.match(/chunk: ([\s\S]+)/);
                        if (chunkMatch && chunkMatch[1]) {
                            const chunk = chunkMatch[1];

                            const contentMatch = chunk.match(/content:\s*([\s\S]*?)(?=\n\w+:|$)/);
                            const actualContent = contentMatch ? contentMatch[1].trim() : chunk;

                            if (actualContent) {
                                streamingContent += actualContent;

                                await store.updateMessageContent(tabKey, aiMessage.id, streamingContent);

                                await new Promise(resolve => setTimeout(resolve, 50));
                            }

                            if (chunk.includes('streaming_completed')) {
                                streamCompleted = true;
                                isStreaming = false;
                            }
                        }
                    }

                    if (!isAgentConfigured && (message.includes('Streaming completed') || message.includes('Streaming timeout'))) {
                        streamCompleted = true;
                        isStreaming = false;
                        return;
                    }

                    if (!message.includes('chunk:') && isAgentConfigured) {
                        const stepMatch = message.match(/step (\d+):\s*(.+)/);
                        if (stepMatch) {
                            const stepNumber = parseInt(stepMatch[1]);
                            const stepDescription = stepMatch[2];
                            console.log(`Step ${stepNumber}: ${stepDescription}`);
                        }

                        if (isStreaming) {
                            return;
                        }

                        stepMessages.push(`[Step ${step}] ${message}`);

                        if (!isStreaming) {
                            const fullStepMessage = stepMessages.join('\n');
                            await store.updateMessageContent(tabKey, aiMessage.id, fullStepMessage);
                        }

                        return new Promise(resolve => setTimeout(resolve, 800));
                    }
                } : async (step: number, message: string, data?: any) => {
                    if (message.includes('Model response chunk:') || message.includes('LLM response chunk:')) {
                        const chunkMatch = message.match(/chunk: ([\s\S]+)/);
                        if (chunkMatch && chunkMatch[1]) {
                            const chunk = chunkMatch[1];

                            const contentMatch = chunk.match(/content:\s*([\s\S]*?)(?=\n\w+:|$)/);
                            const actualContent = contentMatch ? contentMatch[1].trim() : chunk;

                            if (actualContent) {
                                streamingContent += actualContent;
                                isStreaming = true;

                                await store.updateMessageContent(tabKey, aiMessage.id, streamingContent);

                                await new Promise(resolve => setTimeout(resolve, 30));
                            }
                        }
                    }

                    if (message.includes('Streaming completed') || message.includes('Streaming timeout')) {
                        streamCompleted = true;
                        isStreaming = false;
                    }
                }
            );

            if (!isAgentConfigured && isStreaming && !streamCompleted) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            if (result.success && !hasError) {
                let finalMessage: string;

                if (!isAgentConfigured) {
                    if (isStreaming && streamingContent) {
                        finalMessage = streamingContent;
                    } else {
                        finalMessage = [
                            '✅ Direct model call completed!',
                            '',
                            '📝 Note: This was a direct model call since no agent was configured.',
                            '',
                            '🤖 Model response:',
                            result.modelResponse || ''
                        ].join('\n');
                    }
                } else {
                    if (!isAgentConfigured && isStreaming && streamingContent) {
                        finalMessage = streamingContent;
                    } else {
                        finalMessage = [
                            '✅ A2A workflow executed successfully!',
                            '',
                            '📋 System prompt:',
                            '```xml',
                            result.systemPromptXml || '',
                            '```',
                            '',
                            '🤖 Model response:',
                            result.modelResponse || '',
                            '',
                            '🚀 A2A task:',
                            '```json',
                            JSON.stringify(result.a2aResponseTask, null, 2),
                            '```'
                        ].join('\n');
                    }
                }

                if (!isAgentConfigured && (isStreaming && streamingContent)) {
                    await store.updateMessageContent(tabKey, aiMessage.id, finalMessage);
                } else if (!isStreaming || !streamingContent) {
                    await store.updateMessageContent(tabKey, aiMessage.id, finalMessage);
                }

                if (isAgentConfigured) {
                    isStreaming = false;
                    streamCompleted = false;
                } else {
                    isStreaming = false;
                    streamCompleted = false;
                }
            } else {
                const errorMessage = {
                    status: 'error',
                    message: 'Workflow execution failed',
                    error: result.error || 'Unknown error',
                    timestamp: new Date().toISOString()
                };
                await store.updateMessageContent(tabKey, aiMessage.id, `❌ Workflow execution failed:\n\n\`\`\`json\n${JSON.stringify(errorMessage, null, 2)}\n\`\`\``);

                if (isAgentConfigured) {
                    isStreaming = false;
                    streamCompleted = false;
                } else {
                    isStreaming = false;
                    streamCompleted = false;
                }
            }
        } catch (error) {
            console.error('A2A workflow execution error:', error);
            const errorObj = {
                status: 'error',
                message: 'Error occurred while executing A2A workflow',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
            const errorMessage = `❌ Error occurred while executing A2A workflow:\n\n\`\`\`json\n${JSON.stringify(errorObj, null, 2)}\n\`\`\``;
            const messageObj = createMessage(errorMessage, 'ai');
            await store.addMessage(tabKey, messageObj);
        } finally {
            await store.setIsLoading(tabKey, false);
            console.log('Chat loading state reset to false');
        }
    }, [chatData, store, tabKey, createMessage]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);

    const handleCopyMessage = useCallback(async (content: string) => {
        try {
            await navigator.clipboard.writeText(content);
            message.success('Copy successful');
        } catch (error) {
            console.error('Failed to copy message:', error);
            message.error('Copy failed');
        }
    }, []);

    const handleClearMessages = useCallback(async () => {
        try {
            await store.clearMessages(tabKey);
            message.success('Clear successful');
        } catch (error) {
            console.error('Failed to clear messages:', error);
            message.error('Clear failed');
        }
    }, [store, tabKey]);

    return {
        chatData,
        handleSendMessage,
        handleKeyPress,
        handleCopyMessage,
        handleClearMessages,
        setInputValue: (value: string) => store.setInputValue(tabKey, value),
    };
}; 