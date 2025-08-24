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
    const { messageList, isStreaming } = mapChat(tabKey);

    const virtuosoRef = useRef<VirtuosoHandle>(null);

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
        if (messageList.length > 0) {
            virtuosoRef.current?.scrollToIndex({
                index: messageList.length - 1,
                align: 'end',
                behavior: 'smooth',
            });
        }
    }, [messageList.length]);

    useEffect(() => {
        scrollToBottom();
    }, [messageList, scrollToBottom]);

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
        return (
            <MessageItem
                isStreaming={isStreaming}
                key={message.id}
                message={message}
                onCopy={handleCopyMessage}
                onHeightChange={scrollToBottom}
            />
        );
    }, [messageList, handleCopyMessage, scrollToBottom]);

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
            />
        </div>
    );
});

MessageList.displayName = 'MessageList';

export default MessageList;
