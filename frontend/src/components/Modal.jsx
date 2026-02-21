
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
        <div className="modal-backdrop px-4">
            {/* Backdrop Layer */}
            <div
                className="absolute inset-0 cursor-pointer"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className={`modal-glass relative w-full ${widthClass} shadow-2xl`}>
                {/* Header */}
                <div className="flex items-center gap-4 p-6 border-b border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-slate-900 truncate">{title}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Secure Medical Document</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors group"
                    >
                        <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};


export default Modal;
