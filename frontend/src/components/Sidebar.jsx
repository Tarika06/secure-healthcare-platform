import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Shield, LogOut, BarChart3, ClipboardList } from 'lucide-react';

const Sidebar = ({ role, onLogout, pendingConsents = 0, items, activeItem, onItemClick, user }) => {
    const patientMenuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/patient/dashboard', tab: 'overview' },
        { icon: FileText, label: 'My Records', path: '/patient/dashboard', tab: 'records' },
        { icon: Shield, label: 'Consent Manager', path: '/patient/dashboard', tab: 'consent', badge: pendingConsents }
    ];

    const doctorMenuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/doctor/dashboard', tab: 'overview' },
        { icon: FileText, label: 'Create Report', path: '/doctor/dashboard', tab: 'create' },
        { icon: Users, label: 'Patients', path: '/doctor/dashboard', tab: 'patients' }
    ];

    const adminMenuItems = [
        { icon: BarChart3, label: 'Overview', id: 'overview' },
        { icon: Users, label: 'User Management', id: 'users' },
        { icon: ClipboardList, label: 'Audit Logs', id: 'audit' }
    ];

    // Determine which role to use
    const effectiveRole = role || user?.role;

    // If custom items are passed (used by AdminDashboard), render those
    if (items && onItemClick) {
        return (
            <div className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col">
                <div className="p-6 border-b border-slate-200">
                    <h1 className="text-2xl font-bold text-primary-700">SecureCare<span className="text-primary-500">+</span></h1>
                    <p className="text-xs text-slate-500 mt-1">Admin Panel</p>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {items.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onItemClick(item.id)}
                                className={`sidebar-link w-full text-left ${activeItem === item.id ? 'bg-primary-50 text-primary-700' : ''}`}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-slate-200">
                    <button onClick={onLogout} className="sidebar-link w-full text-red-600 hover:bg-red-50">
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        );
    }

    // Default menu items based on role
    let menuItems;
    if (effectiveRole === 'ADMIN') {
        menuItems = adminMenuItems;
    } else if (effectiveRole === 'PATIENT') {
        menuItems = patientMenuItems;
    } else {
        menuItems = doctorMenuItems;
    }

    return (
        <div className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-slate-200">
                <h1 className="text-2xl font-bold text-primary-700">SecureCare<span className="text-primary-500">+</span></h1>
                <p className="text-xs text-slate-500 mt-1">Healthcare Management</p>
            </div>

            {/* Menu */}
            <nav className="flex-1 p-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    
                    // For admin with id-based items
                    if (item.id) {
                        return (
                            <a
                                key={item.label}
                                href={`/admin/dashboard?tab=${item.id}`}
                                className="sidebar-link group relative"
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </a>
                        );
                    }
                    
                    return (
                        <a
                            key={item.label}
                            href={`${item.path}?tab=${item.tab}`}
                            className="sidebar-link group relative"
                        >
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                            {item.badge > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    {item.badge}
                                </span>
                            )}
                        </a>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-slate-200">
                <button
                    onClick={onLogout}
                    className="sidebar-link w-full text-red-600 hover:bg-red-50"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
