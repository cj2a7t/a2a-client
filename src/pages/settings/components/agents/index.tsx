import { SettingA2AServer } from '@/types/a2a';
import { useFlatInject, useHttp } from '@/utils/hooks';
import { initMonacoTheme } from '@/utils/monaco';
import { CloudServerOutlined, DeleteOutlined, EditOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';
import { Editor } from '@monaco-editor/react';
import { Button, Form, Input, Layout, Modal, Popconfirm, Spin, Table, Typography, message } from 'antd';
import React, { useState } from 'react';
import './style.less';

const { Text, Title } = Typography;
const { Header, Content } = Layout;

const Agents: React.FC = () => {
    const [store] = useFlatInject("setting");
    const { loading: loadingSettingAgents } = useHttp(() => store.onLoadSettingAgents());
    const {
        settingAgents,
        onSaveAgent,
        onDeleteAgent,
        isAgentModalVisible, editingAgent,
        onShowAgentModal, onHideAgentModal, onSetEditingAgent
    } = store;

    const [form] = Form.useForm();
    const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

    const handleAddAgent = () => {
        onSetEditingAgent(null);
        form.resetFields();
        onShowAgentModal();
    };

    const handleEditAgent = (agent: SettingA2AServer) => {
        onSetEditingAgent(agent);
        form.setFieldsValue({
            agent_card_url: agent.agentCardUrl
        });
        onShowAgentModal();
    };

    // 初始化 Monaco 主题
    React.useEffect(() => {
        const initMonaco = async () => {
            try {
                await initMonacoTheme();
            } catch (error) {
                console.error('Failed to initialize Monaco theme:', error);
            }
        };
        initMonaco();
    }, []);

    // 表格列定义
    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
                <span style={{ color: '#1f2937', fontSize: '12px', fontWeight: '500' }}>
                    {text}
                </span>
            ),
        },
        {
            title: 'URL',
            dataIndex: 'agentCardUrl',
            key: 'agentCardUrl',
            render: (text: string) => (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <LinkOutlined style={{ marginRight: 4, color: '#6b7280' }} />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                        {text}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text: string) => (
                <Text type="secondary" style={{ fontSize: '11px' }}>
                    {text}
                </Text>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: SettingA2AServer) => (
                <div style={{ display: 'flex', gap: 4 }}>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEditAgent(record)}
                        size="small"
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete A2A Server"
                        description="Are you sure you want to delete this A2A server?"
                        onConfirm={() => handleDeleteAgent(record.id!)}
                        okText="Delete"
                        cancelText="Cancel"
                        placement="topRight"
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                        >
                            Delete
                        </Button>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    // 展开行渲染
    const expandedRowRender = (record: SettingA2AServer) => {
        console.log('Rendering expanded row for agent:', record.id, record.name);

        const jsonValue = (() => {
            try {
                return record.agentCardJson ? JSON.stringify(JSON.parse(record.agentCardJson), null, 2) : '{}';
            } catch (error) {
                console.error('JSON parsing error:', error);
                return JSON.stringify({ error: 'Invalid JSON format' }, null, 2);
            }
        })();

        return (
            <div key={`expanded-${record.id}`} style={{ padding: '16px', background: '#fafafa', borderRadius: '6px', margin: '8px 0' }}>
                <div style={{ height: '300px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                    <Editor
                        height="100%"
                        defaultLanguage="json"
                        value={jsonValue}
                        options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            fontSize: 12,
                            lineNumbers: 'on',
                            wordWrap: 'on',
                            theme: 'vs',
                            scrollbar: {
                                vertical: 'visible',
                                horizontal: 'visible',
                                verticalScrollbarSize: 6,
                                horizontalScrollbarSize: 6,
                                verticalSliderSize: 6,
                                horizontalSliderSize: 6
                            }
                        }}
                        onMount={(editor) => {
                            console.log('Monaco editor mounted for agent:', record.id);
                            editor.focus();
                        }}
                    />
                </div>
            </div>
        );
    };

    const handleDeleteAgent = async (agentId: number) => {
        try {
            await onDeleteAgent(agentId);
            message.success('A2A server deleted successfully');
        } catch (error) {
            console.error('Delete agent error:', error);
            const errorMessage = error instanceof Error
                ? error.message
                : 'Unknown error';
            message.error(`Failed to delete A2A server: ${errorMessage}`);
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();

            if (editingAgent) {
                // Update existing agent
                try {
                    await onSaveAgent({
                        ...editingAgent,
                        agentCardUrl: values.agent_card_url
                    });
                    message.success('A2A server updated successfully');
                } catch (error) {
                    console.error('Update agent error:', error);
                    const errorMessage = error instanceof Error
                        ? error.message
                        : 'Unknown error';
                    message.error(`Failed to update A2A server: ${errorMessage}`);
                }
            } else {
                // Add new agent
                try {
                    await onSaveAgent({
                        name: `A2A Server ${Date.now()}`, // Generate a default name
                        agentCardUrl: values.agent_card_url,
                        enabled: false,
                        agentCardJson: ''
                    });
                    message.success('A2A server added successfully');
                } catch (error) {
                    console.error('Add agent error:', error);
                    const errorMessage = error instanceof Error
                        ? error.message
                        : 'Unknown error';
                    message.error(`Failed to add A2A server: ${errorMessage}`);
                }
            }

            onHideAgentModal();
            form.resetFields();
        } catch (error) {
            console.error('Form validation failed:', error);
        }
    };

    const handleModalCancel = () => {
        onHideAgentModal();
        form.resetFields();
    };

    return (
        <Layout className="agents-container">
            <Header className="agents-header">
                <div className="header-content">
                    <div className="header-title">
                        <Title level={4}>A2A Servers</Title>
                        <Text type="secondary">Manage your A2A servers and their configurations</Text>
                    </div>
                    {settingAgents.length > 0 && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAddAgent}
                            size="small"
                            className="add-button"
                        >
                            Add A2A Server
                        </Button>
                    )}
                </div>
            </Header>

            <Content className="agents-content">
                {loadingSettingAgents ? (
                    <div className="loading-overlay">
                        <div className="loading-content">
                            <Spin size="large" />
                            <Text type="secondary" style={{ marginTop: 16, fontSize: 14 }}>Loading A2A servers...</Text>
                        </div>
                    </div>
                ) : (settingAgents && settingAgents.length > 0) ? (
                    <Table
                        showHeader={false}
                        className="agents-table"
                        columns={columns}
                        dataSource={settingAgents}
                        expandable={{
                            expandedRowRender: expandedRowRender,
                            expandRowByClick: false,
                            expandedRowKeys: expandedRowKeys,
                            onExpand: (expanded, record) => {
                                if (expanded) {
                                    setExpandedRowKeys([record.id || record.name]);
                                } else {
                                    setExpandedRowKeys([]);
                                }
                            }
                        }}
                        rowKey={(record) => record.id || record.name}
                        pagination={false}
                        size="small"
                    />
                ) : (
                    <div className="empty-state">
                        <div className="empty-content">
                            <CloudServerOutlined style={{ fontSize: 48, color: '#d1d5db', marginBottom: 16 }} />
                            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>No A2A servers configured</Text>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 12 }}>Get started by adding your first A2A server</Text>
                            <Button
                                type="primary"
                                onClick={handleAddAgent}
                                size="small"
                            >
                                Add your first A2A server
                            </Button>
                        </div>
                    </div>
                )}
            </Content>

            <Modal
                title={editingAgent ? 'Edit A2A Server' : 'Add New A2A Server'}
                open={isAgentModalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                okText={editingAgent ? 'Update' : 'Add'}
                cancelText="Cancel"
                width={500}
            >
                <Form
                    form={form}
                    layout="vertical"
                    size="small"
                >
                    <Form.Item
                        name="agent_card_url"
                        label="A2A Server URL"
                        rules={[
                            { required: true, message: 'Please enter A2A server URL' },
                            { type: 'url', message: 'Please enter a valid URL' }
                        ]}
                    >
                        <Input placeholder="https://your-a2a-server-url.com" />
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
};

export default Agents; 