import React from 'react';

const PageWrapper = ({ children, className = '' }) => {
    return (
        <div className={`animate-fade-in ${className}`}>
            {children}
        </div>
    );
};

export default PageWrapper;
