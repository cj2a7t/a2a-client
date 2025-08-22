import React, { useEffect } from 'react';
import { useTabKey } from "@/utils/tabkey";
import { useChatLogic } from './hooks';
import { MessageList, ChatInput } from './components';
import { useFlatInject } from '@/utils/hooks';
import "./style.less";

const A2APage: React.FC = () => {
    const tabKey = useTabKey();
    const [store] = useFlatInject("a2a");

    const {
        chatData,
        handleSendMessage,
        handleCopyMessage,
        handleClearMessages,
        setInputValue,
    } = useChatLogic();

    useEffect(() => {
        if (tabKey && chatData.isTabLoading) {
            const timer = setTimeout(() => {
                store.setTabLoading(tabKey, false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [tabKey, chatData.isTabLoading, store]);

    useEffect(() => {
        if (tabKey && chatData.servers && chatData.servers.length === 0) {
            store.addServer(tabKey, {
                id: 'server-1',
                name: 'Local A2A Server',
                url: 'http://localhost:8080'
            });
            store.addServer(tabKey, {
                id: 'server-2',
                name: 'Production A2A',
                url: 'https://a2a.example.com'
            });
            store.addServer(tabKey, {
                id: 'server-3',
                name: 'Test Environment',
                url: 'https://test-a2a.example.com'
            });
        }
    }, [tabKey, chatData.servers, store]);

    return (
        <div className="a2a-container">
            {chatData.isTabLoading && (
                <div className="tab-loading-overlay">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <div className="loading-text">Loading...</div>
                    </div>
                </div>
            )}

            <MessageList
                messages={chatData.messages}
                onCopyMessage={handleCopyMessage}
            />
            <ChatInput />
        </div>
    );
};

export default A2APage; 