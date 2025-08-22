import React from 'react';
import { Typography } from 'antd';
import './style.less';

const { Title, Text, Paragraph } = Typography;

const About: React.FC = () => {
    return (
        <div className="about-container">
            <div className="about-content">
                {/* App Name */}
                <Title level={2} className="app-name">
                    A2A Client UI
                </Title>

                {/* Version */}
                <Text className="version">v0.1.0</Text>

                {/* Slogan */}
                <Paragraph className="slogan">
                    A2A Client UI is a cross-platform A2A client dedicated to helping more Agent developers debug A2A Server.
                </Paragraph>

                {/* Links */}
                <div className="links">
                    <Text className="link">GitHub</Text>
                    <Text className="link">Apache License 2.0</Text>
                </div>
            </div>
        </div>
    );
};

export default About; 