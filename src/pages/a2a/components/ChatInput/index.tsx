import { createDyncmicChat } from '@/utils/chat/chat';
import { useFlatInject } from '@/utils/hooks';
import { useTabKey } from '@/utils/tabkey';
import { DeleteOutlined, MessageOutlined, SendOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Button, Mentions } from 'antd';
import { debounce, isEmpty } from 'lodash';
import React, { useCallback, useEffect, useRef } from 'react';
import A2AServerSelector from '../A2AServerSelector';
import './style.less';

const commands = [
    {
        value: '/message/send',
        label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageOutlined style={{ color: '#1890ff' }} />
                <span>/message/send</span>
            </div>
        )
    },
    {
        value: '/message/stream',
        label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ThunderboltOutlined style={{ color: '#1890ff' }} />
                <span>/message/stream[coming soon]</span>
            </div>
        ),
        disabled: true
    }
];

const ChatInput: React.FC = () => {

    const tabKey = useTabKey();
    const [store] = useFlatInject("chat");
    const {
        mapChat,
        onUpdateUserMessage,
        onResetUserMessage,
        onClearMessages,
        onPushUserMessage,
        onInitAIMessage,
        onUpdateAIMessage
    } = store;
    const { userMessage } = mapChat(tabKey);

    const handleMentionsChange = (text: string) => {
        onUpdateUserMessage(tabKey, text);
    };

    // help cpu usage
    const debouncedUpdateRef = useRef<ReturnType<typeof debounce>>();
    const getDebouncedUpdate = useCallback(() => {
        if (!debouncedUpdateRef.current) {
            debouncedUpdateRef.current = debounce((content: string) => {
                onUpdateAIMessage(tabKey, content);
            }, 100);
        }
        return debouncedUpdateRef.current;
    }, [tabKey, onUpdateAIMessage]);

    const onSend = async () => {
        await onPushUserMessage(tabKey, userMessage);
        await onInitAIMessage(tabKey, "🤔 Thinking...");

        const chunks: string[] = [];
        const debouncedUpdate = getDebouncedUpdate();
        const chatUtil = await createDyncmicChat((respChunk) => {
            chunks.push(respChunk);
            // O(n)
            debouncedUpdate(chunks.join(''));
        });
        try {
            chatUtil.sendMessage(userMessage);
        } finally {
            debouncedUpdate.flush();
            onResetUserMessage(tabKey);
        }
    };

    useEffect(() => {
        return () => {
            if (debouncedUpdateRef.current) {
                debouncedUpdateRef.current.cancel();
            }
        };
    }, []);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        console.log("handleKeyPress", e.key);
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <div className="chat-input-container">
            <div className="input-wrapper">
                <Mentions
                    value={userMessage}
                    onChange={handleMentionsChange}
                    placeholder="Type your message... (use @ to show commands)"
                    autoSize={{ minRows: 2, maxRows: 2 }}
                    className="chat-input"
                    autoFocus
                    options={commands}
                    prefix="@"
                    placement="top"
                    onPressEnter={handleKeyPress}
                    spellCheck={false}
                    autoCapitalize="off"
                />
            </div>
            <div className="bottom-actions">
                <div className="left-actions">
                    <A2AServerSelector />
                </div>
                <div className="send-action">
                    <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => onClearMessages(tabKey)}
                        disabled={!userMessage.trim()}
                        className="clear-btn"
                        title="Clear all messages"
                    />
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={onSend}
                        disabled={isEmpty(userMessage)}
                        loading={false}
                        className="send-btn"
                        title="Send message"
                    />
                </div>
            </div>
        </div>
    );
};

export default ChatInput; 