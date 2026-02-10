import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Shield, LogOut, BarChart3, ClipboardList, Activity, Upload, Plus, Eye, Bell, Stethoscope, FlaskConical, Settings } from 'lucide-react';
import logo from '../assets/logo.png';

const Sidebar = ({ role, onLogout, pendingConsents = 0, items, activeItem, onItemClick, user }) => {
    const navigate = useNavigate();

    const patientMenuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/patient/dashboard', tab: 'overview' },
        { icon: FileText, label: 'My Records', path: '/patient/dashboard', tab: 'records' },
        { icon: Shield, label: 'Consent Manager', path: '/patient/dashboard', tab: 'consent', badge: pendingConsents },
        { icon: Eye, label: 'Access History', path: '/patient/dashboard', tab: 'history' }
    ];

    const doctorMenuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/doctor/dashboard', tab: 'overview' },
        { icon: ClipboardList, label: 'My Records', path: '/doctor/dashboard', tab: 'myrecords' },
        { icon: Plus, label: 'Create Report', path: '/doctor/dashboard', tab: 'create' },
        { icon: Users, label: 'Patients', path: '/doctor/dashboard', tab: 'patients' }
    ];

    const adminMenuItems = [
        { icon: BarChart3, label: 'Overview', id: 'overview' },
        { icon: Users, label: 'User Management', id: 'users' },
        { icon: ClipboardList, label: 'Audit Logs', id: 'audit' }
    ];

    const effectiveRole = role || user?.role;

    const getRoleIcon = () => {
        switch (effectiveRole) {
            case 'ADMIN': return Shield;
            case 'DOCTOR': return Stethoscope;
            case 'PATIENT': return Users;
            case 'NURSE': return Activity;
            case 'LAB_TECHNICIAN': return FlaskConical;
            default: return LayoutDashboard;
        }
    };

    const getRoleLabel = () => {
        switch (effectiveRole) {
            case 'ADMIN': return 'Administrator';
            case 'DOCTOR': return 'Doctor Portal';
            case 'PATIENT': return 'Patient Portal';
            case 'NURSE': return 'Nurse Station';
            case 'LAB_TECHNICIAN': return 'Lab Portal';
            default: return 'Dashboard';
        }
    };

    const RoleIcon = getRoleIcon();

    const renderMenuItem = (item, isActive) => {
        const Icon = item.icon;
        return (
            <div className="relative">
                <div className={isActive ? 'nav-item-glass-active' : 'nav-item-glass group'}>
                    <div className={`transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <span className={isActive ? 'font-medium' : 'font-normal'}>{item.label}</span>
                    {item.badge > 0 && (
                        <span className="ml-auto notification-badge">
                            {item.badge}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    // Custom items mode (Admin sidebar)
    if (items && onItemClick) {
        return (
            <div className="sidebar-glass w-72">
                {/* Header with Logo */}
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="SecureCare" className="w-12 h-12 object-contain" />
                        <div>
                            <h1 className="text-xl font-bold text-gradient">SecureCare<span className="text-primary-400">+</span></h1>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <RoleIcon className="w-3 h-3" />
                                {getRoleLabel()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* User Info Card */}
                {user && (
                    <div
                        className="user-card-glass"
                        onClick={() => {
                            const profilePath = effectiveRole === 'ADMIN' ? '/admin/profile'
                                : effectiveRole === 'DOCTOR' ? '/doctor/profile'
                                    : effectiveRole === 'PATIENT' ? '/patient/profile'
                                        : effectiveRole === 'NURSE' ? '/nurse/profile'
                                            : '/lab/profile';
                            navigate(profilePath);
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-white font-semibold text-sm group-hover:scale-105 transition-transform">
                                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 truncate">{user.firstName} {user.lastName}</p>
                                <p className="text-xs text-slate-500 truncate">{user.userId}</p>
                            </div>
                            <div className="text-slate-400 group-hover:text-primary-600 transition-colors">
                                <Settings className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-3">Navigation</p>
                    {items.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onItemClick(item.id)}
                        >
                            {renderMenuItem(item, activeItem === item.id)}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 space-y-2">
                    <button
                        onClick={() => {
                            const profilePath = effectiveRole === 'ADMIN' ? '/admin/profile'
                                : effectiveRole === 'DOCTOR' ? '/doctor/profile'
                                    : effectiveRole === 'PATIENT' ? '/patient/profile'
                                        : effectiveRole === 'NURSE' ? '/nurse/profile'
                                            : '/lab/profile';
                            navigate(profilePath);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-primary-50 hover:text-primary-700 transition-all duration-300 group"
                    >
                        <Settings className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">View Profile</span>
                    </button>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-300 group"
                    >
                        <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>
        );
    }

    // Default role-based menu
    let menuItems;
    if (effectiveRole === 'ADMIN') {
        menuItems = adminMenuItems;
    } else if (effectiveRole === 'PATIENT') {
        menuItems = patientMenuItems;
    } else {
        menuItems = doctorMenuItems;
    }

    return (
        <div className="sidebar-glass w-72 h-screen flex flex-col sticky top-0">
            {/* Header with Logo */}
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="SecureCare" className="w-12 h-12 object-contain" />
                    <div>
                        <h1 className="text-xl font-bold text-gradient">SecureCare<span className="text-primary-400">+</span></h1>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <RoleIcon className="w-3 h-3" />
                            {getRoleLabel()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-3">Menu</p>
                {menuItems.map((item) => {
                    const isActive = item.id
                        ? window.location.search.includes(`tab=${item.id}`)
                        : window.location.search.includes(`tab=${item.tab}`);

                    return (
                        <a
                            key={item.label}
                            href={item.id ? `/admin/dashboard?tab=${item.id}` : `${item.path}?tab=${item.tab}`}
                            className="block"
                        >
                            {renderMenuItem(item, isActive)}
                        </a>
                    );
                })}
            </nav>

            {/* Security Badge */}
            <div className="mx-4 mb-4 p-3 rounded-xl bg-gradient-to-r from-primary-50 to-teal-50 border border-primary-100">
                <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary-600" />
                    <span className="text-xs font-medium text-primary-700">256-bit Encrypted</span>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 space-y-2">
                <button
                    onClick={() => {
                        const profilePath = effectiveRole === 'ADMIN' ? '/admin/profile'
                            : effectiveRole === 'DOCTOR' ? '/doctor/profile'
                                : effectiveRole === 'PATIENT' ? '/patient/profile'
                                    : effectiveRole === 'NURSE' ? '/nurse/profile'
                                        : '/lab/profile';
                        navigate(profilePath);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-primary-50 hover:text-primary-700 transition-all duration-300 group"
                >
                    <Settings className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">View Profile</span>
                </button>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-300 group"
                >
                    <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
