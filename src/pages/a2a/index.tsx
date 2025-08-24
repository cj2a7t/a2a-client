import { LoadingSpinner } from '@/components';
import { useFlatInject } from '@/utils/hooks';
import { useTabKey } from '@/utils/tabkey';
import React, { useMemo } from 'react';
import { ChatInput, MessageList } from './components';
import "./style.less";

const A2APage: React.FC = React.memo(() => {

    const tabKey = useTabKey();
    const [store] = useFlatInject("chat");
    const { mapChat } = store;
    const { isTabLoading } = mapChat(tabKey);

    // Memoize the loading overlay to prevent unnecessary re-renders
    const loadingOverlay = useMemo(() => {
        if (!isTabLoading) return null;

        return (
            <div className="tab-loading-overlay">
                <LoadingSpinner size="medium" />
            </div>
        );
    }, [isTabLoading]);

    return (
        <div className="a2a-container">
            {loadingOverlay}
            <MessageList />
            <ChatInput />
        </div>
    );
});

A2APage.displayName = 'A2APage';

export default A2APage; 