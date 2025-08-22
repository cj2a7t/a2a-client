import React, { useState } from 'react';
import { Button, Modal, Typography, Tag, Space, Divider, Tooltip } from 'antd';
import { BookOutlined, CheckCircleOutlined, SyncOutlined, ApiOutlined } from '@ant-design/icons';
import './style.less';

const { Title, Text, Paragraph } = Typography;

interface ChangelogEntry {
    version: string;
    date: string;
    type: 'feature' | 'improvement' | 'fix' | 'breaking';
    title: string;
    description: string[];
}

interface ChangelogModalProps {
    visible?: boolean;
    onClose?: () => void;
    trigger?: React.ReactNode;
    showTrigger?: boolean;
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({
    visible,
    onClose,
    trigger,
    showTrigger = false
}) => {
    const [isVisible, setIsVisible] = useState(false);

    // Changelog data
    const changelogData: ChangelogEntry[] = [
        {
            version: "0.1.4",
            date: "2024-08-14",
            type: "improvement",
            title: "HeaderTab and Streaming Integration Improvements",
            description: [
                "Adjusted HeaderTab styling for better browser-like interaction experience",
                "Integrated streaming model API calls with real-time result updates",
                "Added IPC and HTTP stream conversion capabilities for seamless data flow"
            ]
        },
        {
            version: "0.1.3",
            date: "2025-08-13",
            type: "fix",
            title: "IPC Model Interface and Splash Loading Fixes",
            description: [
                "Fixed IPC call model interface parsing error issues",
                "Added splash loading animation to resolve white screen problem when directly opening main window"
            ]
        },
    ];

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'feature': return 'blue';
            case 'improvement': return 'green';
            case 'fix': return 'orange';
            case 'breaking': return 'red';
            default: return 'default';
        }
    };

    const getTypeText = (type: string) => {
        switch (type) {
            case 'feature': return 'Feature';
            case 'improvement': return 'Improvement';
            case 'fix': return 'Fix';
            case 'breaking': return 'Breaking';
            default: return type;
        }
    };

    // Get icon for description item based on content
    const getDescriptionIcon = (description: string) => {
        if (description.includes('styling') || description.includes('UI') || description.includes('interaction')) {
            return <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />;
        } else if (description.includes('streaming') || description.includes('real-time')) {
            return <SyncOutlined style={{ color: '#1890ff', marginRight: 8 }} />;
        } else if (description.includes('IPC') || description.includes('HTTP') || description.includes('API')) {
            return <ApiOutlined style={{ color: '#722ed1', marginRight: 8 }} />;
        } else {
            return <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />;
        }
    };

    const handleOpen = () => {
        setIsVisible(true);
    };

    const handleClose = () => {
        setIsVisible(false);
        onClose?.();
    };

    const isModalVisible = visible !== undefined ? visible : isVisible;

    return (
        <>
            {showTrigger && (
                <Tooltip title="Changelog">
                    <Button
                        type="text"
                        icon={<BookOutlined style={{ color: '#ff8c00' }} />}
                        onClick={handleOpen}
                        className="changelog-btn"
                        title="View Changelog"
                    />
                </Tooltip>
            )}

            {trigger && (
                <div onClick={handleOpen}>
                    {trigger}
                </div>
            )}

            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BookOutlined style={{ color: '#ff8c00' }} />
                        <span>Changelog</span>
                    </div>
                }
                open={isModalVisible}
                onCancel={handleClose}
                footer={null}
                width={600}
                className="changelog-modal"
            >
                <div className="changelog-content">
                    {changelogData.map((entry, index) => (
                        <div key={index} className="changelog-entry">
                            <div className="changelog-header">
                                <Space align="center">
                                    <Title level={4} style={{ margin: 0 }}>
                                        v{entry.version}
                                    </Title>
                                    <Tag color={getTypeColor(entry.type)}>
                                        {getTypeText(entry.type)}
                                    </Tag>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {entry.date}
                                    </Text>
                                </Space>
                            </div>
                            <Title level={5} style={{ margin: '8px 0 4px 0' }}>
                                {entry.title}
                            </Title>
                            <Paragraph style={{ margin: 0, color: '#666' }}>
                                {entry.description.map((desc, descIndex) => (
                                    <div key={descIndex} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                        {getDescriptionIcon(desc)}
                                        <span>{desc}</span>
                                    </div>
                                ))}
                            </Paragraph>
                            {index < changelogData.length - 1 && <Divider style={{ margin: '16px 0' }} />}
                        </div>
                    ))}
                </div>
            </Modal>
        </>
    );
};

export default ChangelogModal;
