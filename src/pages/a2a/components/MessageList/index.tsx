import rustA2AIcon from '@/assets/rust_a2a.png';
import { Message } from '@/types/a2a';
import { useFlatInject } from '@/utils/hooks';
import { useTabKey } from '@/utils/tabkey';
import { message, Typography } from 'antd';
import React, { useCallback, useEffect, useRef } from 'react';
import MessageItem from '../MessageItem';
import './style.less';

const { Text } = Typography;

const MessageList: React.FC = () => {
    const tabKey = useTabKey();
    const [store] = useFlatInject("chat");
    const { mapChat } = store;
    const { messageList } = mapChat(tabKey);

    // smooth scroll to bottom when new message is added
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleCopyMessage = useCallback(async (content: string) => {
        try {
            await navigator.clipboard.writeText(content);
            message.success('Copy successful');
        } catch (error) {
            console.error('Failed to copy message:', error);
            message.error('Copy failed');
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messageList]);

    if (messageList.length === 0) {
        return (
            <div className="empty-state">
                <img src={rustA2AIcon} alt="Rust A2A" className="rust-a2a-icon" />
                <Text type="secondary">
                    Welcome to A2A Client UI
                </Text>
            </div>
        );
    }

    return (
        <div className="messages-container">
            {messageList.map((message: Message) => (
                <MessageItem
                    key={message.id}
                    message={message}
                    onCopy={handleCopyMessage}
                />
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList; 