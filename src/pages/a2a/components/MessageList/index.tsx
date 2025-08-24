import rustA2AIcon from '@/assets/rust_a2a.png';
import { useFlatInject } from '@/utils/hooks';
import { useTabKey } from '@/utils/tabkey';
import { message, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import MessageItem from '../MessageItem';
import './style.less';

const { Text } = Typography;

const MessageList: React.FC = React.memo(() => {
    const tabKey = useTabKey();
    const [store] = useFlatInject("chat");
    const { mapChat } = store;
    const { messageList, isStreaming, lastAIMessageId } = mapChat(tabKey);


    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const isUserScrollingRef = useRef(false);

    const handleCopyMessage = useCallback(async (content: string) => {
        try {
            await navigator.clipboard.writeText(content);
            message.success('Copy successful');
        } catch (error) {
            console.error('Failed to copy message:', error);
            message.error('Copy failed');
        }
    }, []);


    const scrollToBottom = useCallback(() => {
        if (messageList.length > 0 && !isUserScrollingRef.current && virtuosoRef.current) {
            virtuosoRef.current.scrollToIndex({
                index: messageList.length - 1,
                align: 'end',
                behavior: 'smooth',
            });
        }
    }, [messageList.length]);

    useEffect(() => {
        if (messageList.length > 0) {
            scrollToBottom();
        }
    }, [messageList.length, scrollToBottom]);

    useEffect(() => {
        if (messageList.length > 0) {
            const timer = setTimeout(() => {
                scrollToBottom();
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [tabKey]);


    const EmptyState = useMemo(() => (
        <div className="empty-state">
            <img src={rustA2AIcon} alt="Rust A2A" className="rust-a2a-icon" />
            <Text type="secondary">
                Welcome to A2A Client UI
            </Text>
        </div>
    ), []);

    const MessageItemRenderer = useCallback((index: number) => {
        const message = messageList[index];
        const isStreamingMessage = isStreaming && message.id === lastAIMessageId;
        return (
            <MessageItem
                isStreaming={isStreamingMessage}
                key={tabKey + ":" + message.id}
                message={message}
                onCopy={handleCopyMessage}
                onHeightChange={scrollToBottom}
            />
        );
    }, [messageList, isStreaming, lastAIMessageId, handleCopyMessage, scrollToBottom]);

    if (messageList.length === 0) {
        return EmptyState;
    }

    return (
        <div className="messages-container">
            <Virtuoso
                ref={virtuosoRef}
                data={messageList}
                itemContent={MessageItemRenderer}
                overscan={5}
                isScrolling={(scrolling: boolean) => {
                    isUserScrollingRef.current = scrolling;
                }}
            />
        </div>
    );
});

MessageList.displayName = 'MessageList';

export default MessageList;
