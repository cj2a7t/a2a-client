import React, { useRef, useEffect } from 'react';
import { Typography } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { Message } from '@/types/a2a';
import MessageItem from '../MessageItem';
import './style.less';
import { useTabKey } from '@/utils/tabkey';
import { useFlatInject } from '@/utils/hooks';

const { Text } = Typography;

interface MessageListProps {
    onCopyMessage: (content: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ onCopyMessage }) => {
    const tabKey = useTabKey();
    const [store] = useFlatInject("chat");
    const { mapChat } = store;
    const { messageList } = mapChat(tabKey);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messageList]);

    if (messageList.length === 0) {
        return (
            <div className="empty-state">
                <RobotOutlined />
                <Text type="secondary">
                    Start chatting with A2A Client!
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
                    onCopy={onCopyMessage}
                />
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList; 