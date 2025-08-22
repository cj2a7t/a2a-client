import React from 'react';
import { Popover, Typography } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import ReactJson from 'react-json-view';
import { isEmpty } from 'lodash';
import './style.less';

const { Text } = Typography;

interface AgentStatusIndicatorProps {
    isEnabled: boolean;
    agentConfig: any;
}

const AgentStatusIndicator: React.FC<AgentStatusIndicatorProps> = ({ isEnabled, agentConfig }) => {
    const renderJsonViewer = () => {
        if (!agentConfig || isEmpty(agentConfig)) {
            return (
                <div className="no-config-container">
                    <Text type="secondary" style={{ fontSize: '13px', color: '#8c8c8c' }}>
                        No agent configuration available
                    </Text>
                </div>
            );
        }

        return (
            <div className="json-viewer-container">
                <ReactJson
                    src={agentConfig}
                    name={null}
                    theme="rjv-default"
                    style={{
                        backgroundColor: 'transparent',
                        fontSize: '12px',
                        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
                    }}
                    displayDataTypes={false}
                    displayObjectSize={false}
                    enableClipboard={false}
                    collapsed={false}
                    collapseStringsAfterLength={false}
                    iconStyle="triangle"
                    sortKeys={false}
                    quotesOnKeys={false}
                    validationMessage={undefined}
                />
            </div>
        );
    };

    return (
        <div className="a2a-status-section">
            <Popover
                content={renderJsonViewer()}
                title="Agent Configuration"
                trigger="click"
                placement="topRight"
                overlayStyle={{
                    maxWidth: '600px',
                    width: '600px',
                    maxHeight: '400px'
                }}
                overlayClassName="agent-config-popover"
            >
                <div
                    className={`a2a-status-indicator ${isEnabled ? 'enabled' : 'disabled'}`}
                    title={isEnabled ? 'A2A Server Enabled - Click to view config' : 'A2A Server Disabled - Click to view config'}
                >
                    <RobotOutlined className="a2a-icon" />
                    <span className="a2a-label">A2A Client</span>
                    {isEnabled && (
                        <span className="status-dot enabled"></span>
                    )}
                </div>
            </Popover>
        </div>
    );
};

export default AgentStatusIndicator; 