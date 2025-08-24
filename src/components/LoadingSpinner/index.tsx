import rustA2AIcon from '@/assets/rust_a2a.png';
import React from 'react';
import './style.less';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
    size = 'medium', 
    className = '' 
}) => {
    return (
        <div className={`loading-spinner-container ${className}`}>
            <div className={`loading-spinner ${size}`}>
                <div 
                    className="spinner" 
                    style={{ backgroundImage: `url(${rustA2AIcon})` }}
                ></div>
                <div className="loading-dots">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                </div>
            </div>
        </div>
    );
};

export default LoadingSpinner; 