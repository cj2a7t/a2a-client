import { useFlatInject } from '@/utils/hooks';
import { useTabKey } from '@/utils/tabkey';
import React from 'react';
import { ChatInput, MessageList } from './components';
import "./style.less";

const A2APage: React.FC = () => {

    const tabKey = useTabKey();
    const [store] = useFlatInject("chat");
    const { mapChat } = store;
    const { isTabLoading } = mapChat(tabKey);

    return (
        <div className="a2a-container">
            {isTabLoading && (
                <div className="tab-loading-overlay">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <div className="loading-text">Loading...</div>
                    </div>
                </div>
            )}
            <MessageList />
            <ChatInput />
        </div>
    );
};

export default A2APage; 