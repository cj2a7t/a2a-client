import { Message } from '@/types/a2a';
import { formatTime } from '@/utils/date';
import { shouldRenderAsMarkdown } from '@/utils/markdown';
import { CopyOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Flex, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import './style.less';

const { Text } = Typography;

interface MessageItemProps {
    message: Message;
    onCopy: (content: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onCopy }) => {
    const [thinkingEmoji, setThinkingEmoji] = useState('🤔');

    // thinking and use emoji animation
    const isThinking = message.content === '🤔 Thinking...';
    useEffect(() => {
        if (isThinking) {
            const emojis = ['🤔', '🤨', '🧐', '🤓', '🤯', '💭', '💡', '🎯', '🔍', '⚡'];
            let currentIndex = 0;

            const interval = setInterval(() => {
                setThinkingEmoji(emojis[currentIndex]);
                currentIndex = (currentIndex + 1) % emojis.length;
            }, 800);

            return () => clearInterval(interval);
        }
    }, [isThinking]);

    if (message.type === 'user') {
        return (
            <div className="message-item user-message">
                <Flex align="flex-start" gap={12} justify="flex-end">
                    <div className="message-content">
                        <Card
                            size="small"
                            className="message-card user-card"
                        >
                            <Text style={{ whiteSpace: 'pre-wrap' }}>{message.content}</Text>
                        </Card>
                        <div className="message-footer">
                            <Button
                                type="text"
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => onCopy(message.content)}
                                className="copy-btn"
                                title="Copy message"
                            />
                            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, textAlign: 'right' }}>
                                {formatTime(message.timestamp)}
                            </Text>
                        </div>
                    </div>
                    <Avatar
                        icon={<UserOutlined />}
                        style={{
                            backgroundColor: '#1890ff',
                            flexShrink: 0,
                        }}
                    />
                </Flex>
            </div>
        );
    }

    return (
        <div className="message-item ai-message">
            <Flex align="flex-start" gap={12}>
                <Avatar
                    icon={<RobotOutlined />}
                    style={{
                        backgroundColor: '#52c41a',
                        flexShrink: 0,
                    }}
                />
                <div className="message-content">
                    <Card
                        size="small"
                        className="message-card ai-card"
                    >
                        {isThinking ? (
                            <div className="thinking-animation">
                                <div className="thinking-emoji">
                                    <span className="emoji-text">{thinkingEmoji}</span>
                                </div>
                                <div className="thinking-dots">
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                </div>
                                <Text style={{ marginLeft: 8 }}>Thinking...</Text>
                            </div>
                        ) : shouldRenderAsMarkdown(message.content) ? (
                            <div className="markdown-content">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[]}
                                    components={{
                                        // Enhanced code block with syntax highlighting
                                        code: ({ className, children, ...props }: any) => {
                                            const match = /language-(\w+)/.exec(className || '');
                                            const language = match ? match[1] : '';

                                            if (match) {
                                                return (
                                                    <div className="code-block-container">
                                                        <div className="code-block-header">
                                                            <span className="language-label">{language}</span>
                                                            <Button
                                                                type="text"
                                                                size="small"
                                                                icon={<CopyOutlined />}
                                                                onClick={() => onCopy(String(children))}
                                                                className="copy-code-btn"
                                                                title="Copy code"
                                                            />
                                                        </div>
                                                        <SyntaxHighlighter
                                                            style={oneLight}
                                                            language={language}
                                                            PreTag="div"
                                                            customStyle={{
                                                                margin: 0,
                                                                fontSize: '12px',
                                                                lineHeight: '1.5',
                                                                background: 'transparent'
                                                            }}
                                                        >
                                                            {String(children).replace(/\n$/, '')}
                                                        </SyntaxHighlighter>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <code className={`inline-code ${className}`} {...props}>
                                                    {children}
                                                </code>
                                            );
                                        },
                                        // Custom link styles
                                        a: ({ children, href, ...props }: any) => (
                                            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                                                {children}
                                            </a>
                                        ),
                                        // Custom details and summary components
                                        details: ({ children, ...props }: any) => (
                                            <details {...props} className="markdown-details">
                                                {children}
                                            </details>
                                        ),
                                        summary: ({ children, ...props }: any) => (
                                            <summary {...props} className="markdown-summary">
                                                {children}
                                            </summary>
                                        )
                                    }}
                                >
                                    {message.content}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <Text style={{ whiteSpace: 'pre-wrap' }}>{message.content}</Text>
                        )}
                    </Card>
                    <div className="message-footer">
                        <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => onCopy(message.content)}
                            className="copy-btn"
                            title="Copy message"
                        />
                        <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                            {formatTime(message.timestamp)}
                        </Text>
                    </div>
                </div>
            </Flex>
        </div>
    );
};

export default MessageItem; 