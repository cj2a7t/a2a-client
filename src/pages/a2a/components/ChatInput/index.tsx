import { createDyncmicChat } from '@/utils/chat/chat';
import { useFlatInject } from '@/utils/hooks';
import { useTabKey } from '@/utils/tabkey';
import { DeleteOutlined, MessageOutlined, SendOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Button, Mentions } from 'antd';
import { debounce, isEmpty } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const ChatInput: React.FC = React.memo(() => {

    const tabKey = useTabKey();
    const [store] = useFlatInject("chat");
    const [isSending, setIsSending] = useState(false);
    const {
        mapChat,
        onUpdateUserMessage,
        onResetUserMessage,
        onClearMessages,
        onPushUserMessage,
        onInitAIMessage,
        onUpdateAIMessage,
        onSetStreaming
    } = store;
    const { userMessage, isStreaming } = mapChat(tabKey);

    // Memoize the mentions change handler
    const handleMentionsChange = useCallback((text: string) => {
        onUpdateUserMessage(tabKey, text);
    }, [tabKey, onUpdateUserMessage]);

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

    // Memoize the send handler
    const onSend = useCallback(async () => {
        if (isSending || isEmpty(userMessage)) {
            return;
        }
        setIsSending(true);
        try {
            await onPushUserMessage(tabKey, userMessage);
            await onInitAIMessage(tabKey, "🤔 Thinking...");

            const chunks: string[] = [];
            const debouncedUpdate = getDebouncedUpdate();
            const chatUtil = await createDyncmicChat(
                (respChunk) => {
                    chunks.push(respChunk);
                    debouncedUpdate(chunks.join(''));
                },
                (_) => {
                    onSetStreaming(tabKey, false);
                }
            );
            onSetStreaming(tabKey, true);
            try {
                chatUtil.sendMessage(userMessage);
            } finally {
                debouncedUpdate.flush();
                onResetUserMessage(tabKey);
            }
        } finally {
            setIsSending(false);
        }
    }, [isSending, userMessage, tabKey, onPushUserMessage, onInitAIMessage, getDebouncedUpdate, onResetUserMessage]);

    // Memoize the clear messages handler
    const handleClearMessages = useCallback(() => {
        onClearMessages(tabKey);
    }, [tabKey, onClearMessages]);

    // Memoize the key press handler
    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        console.log("handleKeyPress", e.key);
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    }, [onSend]);

    // Memoize the disabled state
    const isDisabled = useMemo(() =>
        isEmpty(userMessage) || isSending, [userMessage, isSending]
    );

    // Memoize the clear button disabled state
    const isClearDisabled = useMemo(() =>
        !userMessage.trim() || isSending, [userMessage, isSending]
    );

    useEffect(() => {
        return () => {
            if (debouncedUpdateRef.current) {
                debouncedUpdateRef.current.cancel();
            }
        };
    }, []);

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
                    disabled={isSending}
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
                        onClick={handleClearMessages}
                        disabled={isClearDisabled}
                        className="clear-btn"
                        title="Clear all messages"
                    />
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={onSend}
                        disabled={isDisabled}
                        loading={isSending}
                        className="send-btn"
                        title="Send message"
                    />
                </div>
            </div>
        </div>
    );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput; 