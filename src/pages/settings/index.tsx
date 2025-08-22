import React, { useState } from 'react';
import { Typography } from 'antd';
import { RobotOutlined, ApiOutlined, BookOutlined, InfoCircleOutlined } from '@ant-design/icons';
import Models from './components/models';
import Agents from './components/agents';
import Changelog from './components/changelog';
import About from './components/about';
import './style.less';

const { Title } = Typography;

interface MenuItem {
    key: string;
    label: string;
    icon: React.ReactNode;
    component: React.ReactNode;
}

const SettingsPage: React.FC = () => {
    const [activeMenu, setActiveMenu] = useState('agents');

    // Menu items configuration - Models, Agents, Changelog, and About
    const menuItems: MenuItem[] = [
        {
            key: 'agents',
            label: 'A2A Servers',
            icon: <ApiOutlined />,
            component: <Agents />
        },
        {
            key: 'models',
            label: 'Models',
            icon: <RobotOutlined />,
            component: <Models />
        },
        {
            key: 'changelog',
            label: 'Changelog',
            icon: <BookOutlined />,
            component: <Changelog />
        },
        {
            key: 'about',
            label: '关于',
            icon: <InfoCircleOutlined />,
            component: <About />
        }
    ];

    const currentMenu = menuItems.find(item => item.key === activeMenu);

    return (
        <div className="settings-container">
            <div className="settings-nav">
                <div className="nav-menu">
                    {menuItems.map(item => (
                        <div
                            key={item.key}
                            className={`nav-item ${activeMenu === item.key ? 'active' : ''}`}
                            onClick={() => setActiveMenu(item.key)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
            {/* Right Content */}
            <div className="settings-content">
                {currentMenu?.component}
            </div>
        </div >
    );
};

export default SettingsPage; 