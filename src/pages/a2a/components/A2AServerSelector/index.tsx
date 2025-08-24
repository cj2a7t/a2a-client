import { SettingA2AServer } from '@/types/a2a';
import { useFlatInject, useHttp } from '@/utils/hooks';
import { RobotOutlined } from '@ant-design/icons';
import { Badge, Popover, Switch, Table, Tooltip, Typography } from 'antd';
import React, { useCallback, useMemo } from 'react';
import './style.less';

const { Text } = Typography;


const A2AServerSelector: React.FC = React.memo(() => {

    const [store] = useFlatInject("setting");
    const { loading: loadingSettingAgents } = useHttp(() => store.onLoadSettingAgents());
    const {
        settingAgents,
        onToggleAgentEnabled
    } = store;

    // Memoize the toggle handler
    const handleToggleAgent = useCallback((agentId: number) => {
        onToggleAgentEnabled(agentId);
    }, [onToggleAgentEnabled]);

    // Memoize the enabled agents count
    const enabledAgentsCount = useMemo(() => 
        settingAgents.filter(agent => agent.enabled).length, [settingAgents]
    );

    // Memoize the columns configuration
    const columns = useMemo(() => [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: 180,
            render: (text: string, record: SettingA2AServer) => (
                <div
                    className={`server-name-cell ${record.enabled ? 'enabled' : 'disabled'}`}
                >
                    <RobotOutlined
                        className={`server-icon ${record.enabled ? 'enabled' : 'disabled'}`}
                    />
                    <span className={`server-name-text ${record.enabled ? 'enabled' : 'disabled'}`}>
                        {text}
                    </span>
                </div>
            ),
        },
        {
            title: 'Skills',
            key: 'skills',
            width: 150,
            render: (_: any, record: SettingA2AServer) => {
                let skillsCount = 0;
                let skillsList: string[] = [];

                try {
                    if (record.agentCardJson) {
                        const agentCard = JSON.parse(record.agentCardJson);
                        skillsCount = agentCard?.skills?.length || 0;
                        skillsList = agentCard?.skills?.map((skill: any) => skill.name) || [];
                    }
                } catch (error) {
                    console.error('Failed to parse agentCardJson:', error);
                    skillsCount = 0;
                    skillsList = [];
                }

                const skillsContent = skillsList.length > 0 ? (
                    <div className="skills-tooltip">
                        <div className="skills-tooltip-title">Skills:</div>
                        <div className="skills-tooltip-list">
                            {skillsList.map((skillName, index) => (
                                <div key={index} className="skill-item">
                                    • {skillName}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : 'No skills available';

                return (
                    <div className="skills-cell">
                        <span className="skills-label">
                            Skills
                        </span>
                        <Tooltip
                            title={skillsContent}
                            placement="top"
                            overlayClassName="skills-tooltip-overlay"
                        >
                            <span className={`skills-badge ${record.enabled ? 'enabled' : 'disabled'}`}>
                                {skillsCount}
                            </span>
                        </Tooltip>
                    </div>
                );
            },
        },
        {
            title: 'Enable',
            key: 'enable',
            width: 100,
            render: (_: any, record: SettingA2AServer) => (
                <div className="enable-cell">
                    <Switch
                        checked={record.enabled}
                        onChange={(_checked) => {
                            if (record.id !== undefined) {
                                handleToggleAgent(record.id);
                            }
                        }}
                        size="small"
                    />
                </div>
            ),
        },
    ], [handleToggleAgent]);

    // Memoize the server table renderer
    const renderServerTable = useCallback(() => (
        <div className="a2a-server-list">
            <div className="server-list-header">
                <Text strong style={{ fontSize: '12px', color: '#262626' }}>
                    A2A Servers
                </Text>
            </div>

            <Table
                showHeader={false}
                className="a2a-servers-table"
                columns={columns}
                dataSource={settingAgents}
                rowKey={(record) => record.id || 0}
                pagination={false}
                size="small"
            />
        </div>
    ), [columns, settingAgents]);

    return (
        <div className="a2a-server-selector">
            <Popover
                content={renderServerTable()}
                title={null}
                trigger="click"
                placement="topLeft"
                rootClassName="a2a-server-popover"
            >
                <button
                    className="server-selector-trigger"
                    type="button"
                >
                    <RobotOutlined className="trigger-icon" />
                    {enabledAgentsCount > 0 && (
                        <Badge
                            count={enabledAgentsCount}
                            style={{ backgroundColor: '#52c41a' }}
                        />
                    )}
                </button>
            </Popover>
        </div>
    );
});

A2AServerSelector.displayName = 'A2AServerSelector';

export default A2AServerSelector; 