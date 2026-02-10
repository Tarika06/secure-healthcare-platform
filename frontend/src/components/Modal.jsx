
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, icon: Icon = AlertTriangle, children, size = 'md', maxWidth }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl'
    };

    const widthClass = maxWidth || sizeClasses[size];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative w-full ${widthClass} bg-white rounded-2xl shadow-2xl animate-slide-up overflow-hidden`}>
                {/* Header */}
                <div className="flex items-center gap-4 p-6 border-b border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 flex-1">{title}</h3>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};


export default Modal;
