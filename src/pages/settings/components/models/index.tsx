import React from 'react';
import { Switch, Space, Input, Button, message } from 'antd';
import deepseekIcon from '@/assets/deepseek.png';
import openaiIcon from '@/assets/openai.png';
import {
    SaveOutlined,
} from '@ant-design/icons';
import { useFlatInject, useHttp } from '@/utils/hooks';
import './style.less';

const { Password } = Input;

const Models: React.FC = () => {
    const [store] = useFlatInject("setting");
    const { loading: loadingSettingModels } = useHttp(() =>
        store.onLoadSettingModels()
    );
    const {
        settingModels,
        selectedModel, onSelectModel,
        onToggleModelEnabled,
        onSaveModel,
        onUpdateLocalModel
    } = store;


    const handleSaveModel = async () => {
        if (!selectedModel) {
            message.error('Please select a model first');
            return;
        }

        try {
            await onSaveModel(selectedModel);
            message.success(`${selectedModel.modelKey} configuration saved successfully`);
        } catch (error) {
            console.error('Save model error:', error);
            const errorMessage = error instanceof Error
                ? error.message
                : 'Unknown error';
            message.error(`Failed to save ${selectedModel.modelKey}: ${errorMessage}`);
        }
    };

    const handleInputChange = (field: keyof typeof selectedModel, value: string) => {
        if (selectedModel) {
            onUpdateLocalModel({ [field]: value });
        }
    };

    return (
        <div className="models-container">
            <div className="models-layout">
                {/* Left Provider List */}
                <div className="providers-sidebar">
                    <div className="providers-list">
                        {settingModels.map((model: any) => (
                            <div
                                key={model.modelKey}
                                className={`provider-item ${selectedModel?.modelKey === model.modelKey ? 'selected' : ''} ${model.comingSoon ? 'coming-soon' : ''}`}
                                onClick={() => !model.comingSoon && onSelectModel(model)}
                            >
                                <div className="provider-info">
                                    <div className="provider-icon">
                                        <img
                                            src={model.modelKey === 'DeepSeek' ? deepseekIcon : openaiIcon}
                                            alt={model.modelKey}
                                            className="provider-logo"
                                        />
                                    </div>
                                    <div className="provider-name">
                                        {model.modelKey}
                                    </div>
                                </div>
                                {model.comingSoon ? (
                                    <div className="coming-soon-switch">Coming Soon</div>
                                ) : (
                                    <Switch
                                        checked={model.enabled}
                                        onChange={async () => {
                                            try {
                                                await onToggleModelEnabled(model.id);
                                                const action = model.enabled ? 'disabled' : 'enabled';
                                                message.success(`${model.modelKey} ${action} successfully`);
                                            } catch (error) {
                                                console.error('Toggle model enabled error:', error);
                                                const action = model.enabled ? 'disable' : 'enable';
                                                const errorMessage = error instanceof Error
                                                    ? error.message
                                                    : 'Unknown error';
                                                message.error(
                                                    `Failed to ${action} ${model.modelKey}: ${errorMessage}`
                                                );
                                            }
                                        }}
                                        size="small"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Configuration */}
                <div className="provider-details">
                    {selectedModel && (
                        <>
                            {selectedModel.comingSoon ? (
                                <div className="coming-soon-content">
                                    <div className="coming-soon-message">
                                        <div className="message-icon">🚀</div>
                                        <div className="message-text">
                                            <h3>Coming Soon: {selectedModel.modelKey}</h3>
                                            <p>We are working hard to integrate {selectedModel.modelKey} services. Stay tuned!</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* API URL */}
                                    <div className="config-section">
                                        <div className="section-title">API URL</div>
                                        <Input
                                            value={selectedModel.apiUrl}
                                            placeholder="Enter API URL"
                                            className="config-input"
                                            onChange={(e) => handleInputChange('apiUrl', e.target.value)}
                                        />
                                        <div className="api-example">
                                            API Example: {selectedModel.apiUrl}
                                        </div>
                                    </div>

                                    {/* API Key */}
                                    <div className="config-section">
                                        <div className="section-title">API Key</div>
                                        <Password
                                            value={selectedModel.apiKey}
                                            placeholder="Enter API Key"
                                            className="config-input"
                                            onChange={(e) => handleInputChange('apiKey', e.target.value)}
                                        />
                                        <div className="key-actions">
                                            <Space size="small">
                                                {/* Removed Verify Key button */}
                                            </Space>
                                        </div>
                                        <div className="key-help">
                                            How to get: Please visit{' '}
                                            <a href="#" className="provider-link">
                                                {selectedModel.modelKey}
                                            </a>
                                            {' '}to get your API Key
                                        </div>
                                    </div>

                                    {/* Save Button */}
                                    <div className="save-section">
                                        <Button
                                            type="primary"
                                            icon={<SaveOutlined />}
                                            loading={false}
                                            onClick={handleSaveModel}
                                            size="small"
                                            className="save-button"
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Models; 