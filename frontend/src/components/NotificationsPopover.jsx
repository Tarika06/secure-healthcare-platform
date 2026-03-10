import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react';
import notificationApi from '../api/notificationApi';

const NotificationsPopover = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
    const bellRef = useRef(null);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const data = await notificationApi.getNotifications(10);
            setNotifications(data.notifications || []);
            const countData = await notificationApi.getUnreadCount();
            setUnreadCount(countData.unreadCount || 0);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                bellRef.current && !bellRef.current.contains(event.target) &&
                dropdownRef.current && !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await notificationApi.markAsRead(id);
            fetchNotifications();
        } catch (err) {
            console.error('Error marking read:', err);
        }
    };

    const markAllRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            fetchNotifications();
        } catch (err) {
            console.error('Error marking all read:', err);
        }
    };

    const togglePopover = () => {
        if (!isOpen && bellRef.current) {
            const rect = bellRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
            });
        }
        setIsOpen(!isOpen);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'WARNING': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'ERROR': return <XCircle className="w-5 h-5 text-rose-500" />;
            case 'INFO':
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <>
            <button
                ref={bellRef}
                onClick={togglePopover}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
            >
                <Bell className="w-6 h-6 text-slate-200" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-rose-500 rounded-full border-2 border-teal-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in"
                    style={{ top: dropdownPos.top, right: dropdownPos.right, zIndex: 99999 }}
                >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Notifications {unreadCount > 0 && <span className="bg-teal-100 text-teal-700 py-0.5 px-2 rounded-full text-xs">{unreadCount} new</span>}
                        </h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs font-bold text-teal-600 hover:text-teal-700">
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-50" />
                                <p className="text-sm">You have no new notifications.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif._id}
                                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 cursor-pointer ${!notif.isRead ? 'bg-teal-50/30' : ''}`}
                                        onClick={() => !notif.isRead && markAsRead(notif._id)}
                                    >
                                        <div className="mt-1 flex-shrink-0">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm ${notif.isRead ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white font-semibold'}`}>
                                                {notif.message}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {new Date(notif.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        {!notif.isRead && (
                                            <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default NotificationsPopover;
