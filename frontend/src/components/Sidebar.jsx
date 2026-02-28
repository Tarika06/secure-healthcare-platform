import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Shield, LogOut, BarChart3, ClipboardList, Activity, Upload, Plus, Eye, Bell, Stethoscope, FlaskConical, Settings, ChevronLeft, ChevronRight, Sun, Moon, KeyRound, MailCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo.png';

const Sidebar = ({ role, onLogout, pendingConsents = 0, items, activeItem, onItemClick, user, collapsed = false, onToggleCollapse }) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(collapsed);
    const { isDark: isThemeDark, toggleTheme } = useTheme();

    const effectiveRole = role || user?.role;
    const isDark = effectiveRole === 'ADMIN';

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
        onToggleCollapse?.(!isCollapsed);
    };

    const patientMenuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/patient/dashboard', tab: 'overview' },
        { icon: FileText, label: 'My Records', path: '/patient/dashboard', tab: 'records' },
        { icon: Shield, label: 'Consent Manager', path: '/patient/dashboard', tab: 'consent', badge: pendingConsents },
        { icon: Eye, label: 'Access History', path: '/patient/dashboard', tab: 'history' }
    ];

    const doctorMenuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/doctor/dashboard', tab: 'overview' },
        { icon: ClipboardList, label: 'My Records', path: '/doctor/dashboard', tab: 'myrecords' },
        { icon: MailCheck, label: 'Consultations', path: '/doctor/dashboard', tab: 'collaboration' },
        { icon: Plus, label: 'Create Report', path: '/doctor/dashboard', tab: 'create' },
        { icon: Users, label: 'Patients', path: '/doctor/dashboard', tab: 'patients' }
    ];

    const adminMenuItems = [
        { icon: BarChart3, label: 'Overview', id: 'overview' },
        { icon: Users, label: 'User Management', id: 'users' },
        { icon: Shield, label: 'Security Alerts', id: 'alerts' },
        { icon: ClipboardList, label: 'Audit Logs', id: 'audit' }
    ];

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

    const getProfilePath = () => {
        switch (effectiveRole) {
            case 'ADMIN': return '/admin/profile';
            case 'DOCTOR': return '/doctor/profile';
            case 'PATIENT': return '/patient/profile';
            case 'NURSE': return '/nurse/profile';
            default: return '/lab/profile';
        }
    };

    const RoleIcon = getRoleIcon();

    const navItemClass = isDark ? 'nav-item-dark' : 'nav-item-glass';
    const navItemActiveClass = isDark ? 'nav-item-dark-active' : 'nav-item-glass-active';

    const renderMenuItem = (item, isActive) => {
        const Icon = item.icon;
        return (
            <div className="relative">
                <div className={`${isActive ? navItemActiveClass : navItemClass} group`}>
                    <div className={`transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`}>
                        <Icon className="h-5 w-5 flex-shrink-0" />
                    </div>
                    {!isCollapsed && (
                        <span className={`${isActive ? 'font-medium' : 'font-normal'} transition-opacity duration-200`}>
                            {item.label}
                        </span>
                    )}
                    {!isCollapsed && item.badge > 0 && (
                        <span className="ml-auto notification-badge">
                            {item.badge}
                        </span>
                    )}
                    {isCollapsed && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                            {item.badge}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    const sidebarWidth = isCollapsed ? 'w-[72px]' : 'w-72';
    const sidebarClass = isDark ? 'sidebar-dark' : 'sidebar-glass';

    // Custom items mode (Admin / other callback-based navs)
    if (items && onItemClick) {
        return (
            <div className={`${sidebarClass} ${sidebarWidth} transition-all duration-300 ease-out-expo sticky top-0`}>
                {/* Header */}
                <div className={`p-4 ${isCollapsed ? 'px-3' : 'p-6'} border-b ${isDark ? 'border-white/6' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="SecureCare" className={`${isCollapsed ? 'w-10 h-10' : 'w-11 h-11'} object-contain transition-all duration-300`} />
                        {!isCollapsed && (
                            <div className="animate-fade-in">
                                <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gradient'}`}>
                                    SecureCare<span className={isDark ? 'text-violet-400' : 'text-primary-400'}>+</span>
                                </h1>
                                <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    <RoleIcon className="w-3 h-3" />
                                    {getRoleLabel()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* User Info Card */}
                {user && !isCollapsed && (
                    <div className={`mx-4 mt-4 ${isDark ? 'p-3 rounded-xl bg-white/5 border border-white/6 cursor-pointer hover:bg-white/8 transition-all' : 'user-card-glass'}`}
                        onClick={() => navigate(getProfilePath())}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${isDark
                                ? 'bg-gradient-to-br from-violet-500 to-purple-600'
                                : 'bg-gradient-to-br from-teal-500 to-cyan-600'
                                }`}>
                                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                    {user.firstName} {user.lastName}
                                </p>
                                <p className={`text-xs truncate font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {user.userId}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
                    {!isCollapsed && (
                        <p className={`text-[10px] font-semibold uppercase tracking-widest px-4 mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Navigation
                        </p>
                    )}
                    {items.map((item) => (
                        <div key={item.id} onClick={() => onItemClick(item.id)}>
                            {renderMenuItem(item, activeItem === item.id)}
                        </div>
                    ))}
                </nav>

                {/* Security Badge */}
                {!isCollapsed && (
                    <div className={`mx-4 mb-3 p-3 rounded-xl ${isDark
                        ? 'bg-violet-500/10 border border-violet-500/15'
                        : 'bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100'
                        }`}>
                        <div className="flex items-center gap-2">
                            <Shield className={`w-4 h-4 ${isDark ? 'text-violet-400' : 'text-teal-600'}`} />
                            <span className={`text-xs font-medium ${isDark ? 'text-violet-300' : 'text-teal-700'}`}>
                                256-bit Encrypted
                            </span>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className={`p-3 border-t space-y-1 ${isDark ? 'border-white/6' : 'border-slate-100'}`}>
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group ${isDark
                            ? 'text-amber-400 hover:bg-amber-500/10'
                            : 'text-indigo-600 hover:bg-indigo-50'
                            }`}
                    >
                        {isThemeDark
                            ? <Sun className="h-5 w-5 group-hover:scale-110 group-hover:rotate-45 transition-all flex-shrink-0" />
                            : <Moon className="h-5 w-5 group-hover:scale-110 group-hover:-rotate-12 transition-all flex-shrink-0" />
                        }
                        {!isCollapsed && <span className="font-medium">{isThemeDark ? 'Light Mode' : 'Dark Mode'}</span>}
                    </button>
                    <button
                        onClick={() => navigate(getProfilePath())}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group ${isDark
                            ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                            : 'text-slate-600 hover:bg-teal-50 hover:text-teal-700'
                            }`}
                    >
                        <Settings className="h-5 w-5 group-hover:scale-110 transition-transform flex-shrink-0" />
                        {!isCollapsed && <span className="font-medium">Profile</span>}
                    </button>
                    <button
                        onClick={() => navigate('/mfa-setup')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group ${isDark
                            ? 'text-emerald-400 hover:bg-emerald-500/10'
                            : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                    >
                        <KeyRound className="h-5 w-5 group-hover:scale-110 transition-transform flex-shrink-0" />
                        {!isCollapsed && <span className="font-medium">MFA Security</span>}
                    </button>
                    <button
                        onClick={onLogout}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group ${isDark
                            ? 'text-red-400 hover:bg-red-500/10'
                            : 'text-red-600 hover:bg-red-50'
                            }`}
                    >
                        <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform flex-shrink-0" />
                        {!isCollapsed && <span className="font-medium">Logout</span>}
                    </button>
                </div>

                {/* Collapse Toggle */}
                <button
                    onClick={toggleCollapse}
                    className={`absolute top-20 -right-3 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${isDark
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
                        : 'bg-white text-slate-500 hover:text-teal-600 border border-slate-200 shadow-sm'
                        }`}
                >
                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                </button>
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
        <div className={`${sidebarClass} ${sidebarWidth} transition-all duration-300 ease-out-expo sticky top-0 relative`}>
            {/* Header */}
            <div className={`p-4 ${isCollapsed ? 'px-3' : 'p-6'} border-b ${isDark ? 'border-white/6' : 'border-slate-100'}`}>
                <div className="flex items-center gap-3">
                    <img src={logo} alt="SecureCare" className={`${isCollapsed ? 'w-10 h-10' : 'w-11 h-11'} object-contain transition-all duration-300`} />
                    {!isCollapsed && (
                        <div className="animate-fade-in">
                            <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gradient'}`}>
                                SecureCare<span className={isDark ? 'text-violet-400' : 'text-primary-400'}>+</span>
                            </h1>
                            <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                <RoleIcon className="w-3 h-3" />
                                {getRoleLabel()}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-1">
                {!isCollapsed && (
                    <p className={`text-[10px] font-semibold uppercase tracking-widest px-4 mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Menu
                    </p>
                )}
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
            {!isCollapsed && (
                <div className={`mx-4 mb-3 p-3 rounded-xl ${isDark
                    ? 'bg-violet-500/10 border border-violet-500/15'
                    : 'bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100'
                    }`}>
                    <div className="flex items-center gap-2">
                        <Shield className={`w-4 h-4 ${isDark ? 'text-violet-400' : 'text-teal-600'}`} />
                        <span className={`text-xs font-medium ${isDark ? 'text-violet-300' : 'text-teal-700'}`}>
                            256-bit Encrypted
                        </span>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className={`p-3 border-t space-y-1 ${isDark ? 'border-white/6' : 'border-slate-100'}`}>
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group ${isDark
                        ? 'text-amber-400 hover:bg-amber-500/10'
                        : 'text-indigo-600 hover:bg-indigo-50'
                        }`}
                >
                    {isThemeDark
                        ? <Sun className="h-5 w-5 group-hover:scale-110 group-hover:rotate-45 transition-all flex-shrink-0" />
                        : <Moon className="h-5 w-5 group-hover:scale-110 group-hover:-rotate-12 transition-all flex-shrink-0" />
                    }
                    {!isCollapsed && <span className="font-medium">{isThemeDark ? 'Light Mode' : 'Dark Mode'}</span>}
                </button>
                <button
                    onClick={() => navigate(getProfilePath())}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group ${isDark
                        ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                        : 'text-slate-600 hover:bg-teal-50 hover:text-teal-700'
                        }`}
                >
                    <Settings className="h-5 w-5 group-hover:scale-110 transition-transform flex-shrink-0" />
                    {!isCollapsed && <span className="font-medium">Profile</span>}
                </button>
                <button
                    onClick={() => navigate('/mfa-setup')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group ${isDark
                        ? 'text-emerald-400 hover:bg-emerald-500/10'
                        : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                >
                    <KeyRound className="h-5 w-5 group-hover:scale-110 transition-transform flex-shrink-0" />
                    {!isCollapsed && <span className="font-medium">MFA Security</span>}
                </button>
                <button
                    onClick={onLogout}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group ${isDark
                        ? 'text-red-400 hover:bg-red-500/10'
                        : 'text-red-600 hover:bg-red-50'
                        }`}
                >
                    <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform flex-shrink-0" />
                    {!isCollapsed && <span className="font-medium">Logout</span>}
                </button>
            </div>

            {/* Collapse Toggle */}
            <button
                onClick={toggleCollapse}
                className={`absolute top-20 -right-3 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${isDark
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
                    : 'bg-white text-slate-500 hover:text-teal-600 border border-slate-200 shadow-sm'
                    }`}
            >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
        </div >
    );
};

export default Sidebar;
