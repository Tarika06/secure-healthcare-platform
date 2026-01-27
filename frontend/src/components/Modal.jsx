import React from 'react';

const Modal = ({ isOpen, onClose, title, children, icon: Icon }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 transition-opacity bg-slate-900 bg-opacity-75"
                    onClick={onClose}
                ></div>

                {/* Center modal */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-slide-up">
                    <div className="bg-white px-6 pt-6 pb-4">
                        <div className="sm:flex sm:items-start">
                            {Icon && (
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-full bg-primary-100 sm:mx-0 sm:h-12 sm:w-12">
                                    <Icon className="h-7 w-7 text-primary-700" />
                                </div>
                            )}
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                                <h3 className="text-xl font-bold leading-6 text-slate-900">
                                    {title}
                                </h3>
                                <div className="mt-4">
                                    {children}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
