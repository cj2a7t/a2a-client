import userAvatar from '@/assets/cj.jpeg';
import aiAvatar from '@/assets/rust_a2a.png';
import { Message } from '@/types/a2a';
import { formatTime } from '@/utils/date';
import { shouldRenderAsMarkdown } from '@/utils/markdown';
import { CopyOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Flex, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import './style.less';

const { Text } = Typography;

interface MessageItemProps {
    isStreaming: boolean;
    message: Message;
    onCopy: (content: string) => void;
    onHeightChange?: () => void; // ⭐ 新增回调
}

const MessageItem: React.FC<MessageItemProps> = React.memo((
    { isStreaming, message, onCopy, onHeightChange
    }) => {
    const [thinkingEmoji, setThinkingEmoji] = useState('🤔');

    const isThinking = message.content === '🤔 Thinking...';

    // 思考动画
    useEffect(() => {
        if (isThinking) {
            const emojis = ['🤔', '🤨', '🧐', '🤓', '🤯', '💭', '💡', '🎯', '🔍', '⚡'];
            let currentIndex = 0;

            const interval = setInterval(() => {
                setThinkingEmoji(emojis[currentIndex]);
                currentIndex = (currentIndex + 1) % emojis.length;

                onHeightChange?.();
            }, 800);

            return () => clearInterval(interval);
        }
    }, [isThinking, onHeightChange]);

    useEffect(() => {
        onHeightChange?.();
    }, [message.content, onHeightChange]);

    const handleCopyMessage = useCallback(() => {
        onCopy(message.content);
    }, [message.content, onCopy]);

    const handleCopyCode = useCallback((codeContent: string) => {
        onCopy(codeContent);
    }, [onCopy]);

    const markdownComponents = useMemo(() => ({
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
                                onClick={() => handleCopyCode(String(children))}
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
        a: ({ children, href, ...props }: any) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
            </a>
        ),
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
    }), [handleCopyCode]);

    const formattedTime = useMemo(() => formatTime(message.timestamp), [message.timestamp]);
    const shouldRenderMarkdown = useMemo(() => shouldRenderAsMarkdown(message.content), [message.content]);

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
                        {/* user message footer */}
                        <div className="message-footer">
                            <Button
                                type="text"
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={handleCopyMessage}
                                className="copy-btn"
                                title="Copy message"
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {formattedTime}
                            </Text>
                        </div>
                    </div>
                    <Avatar
                        src={userAvatar}
                        style={{
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
                    src={aiAvatar}
                    style={{
                        flexShrink: 0,
                        background: 'linear-gradient(135deg, #b3d9ff 0%, #80bfff 100%)',
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
                        ) : shouldRenderMarkdown ? (
                            <div className="markdown-content">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[]}
                                    components={markdownComponents}
                                >
                                    {message.content}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <Text style={{ whiteSpace: 'pre-wrap' }}>{message.content}</Text>
                        )}
                    </Card>
                    {/* ai message footer */}
                    <div className="message-footer">
                        <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={handleCopyMessage}
                            className="copy-btn"
                            title="Copy message"
                        />
                        {isStreaming && <div className="generating-indicator">generating</div>}
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {formattedTime}
                        </Text>
                    </div>
                </div>
            </Flex>
        </div>
    );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;