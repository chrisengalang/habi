import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Receipt,
    Wallet,
    Tags,
    ChevronLeft,
    ChevronRight,
    LogOut,
    ClipboardList
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar, onItemClick }) => {
    const location = useLocation();
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Failed to sign out:", error);
        }
    };

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/budgets', label: 'Budgets', icon: Wallet },
        { path: '/transactions', label: 'Transactions', icon: Receipt },
        { path: '/categories', label: 'Categories', icon: Tags },
        { path: '/checklist', label: 'Checklist', icon: ClipboardList },
    ];

    return (
        <div
            className={`fixed top-0 left-0 h-full bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] transition-all duration-300 z-50 shadow-xl overflow-hidden ${isOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'
                }`}
        >
            {/* Logo Area */}
            <div className={`flex items-center border-b border-white/10 transition-all duration-300 ${isOpen ? 'justify-between p-6' : 'justify-center py-6 px-0'}`}>
                {isOpen && (
                    <div className="animate-in fade-in duration-300 flex items-center gap-3">
                        <img src="/logo.svg" alt="habi logo" className="w-9 h-9 rounded-sm" />
                        <div>
                            <h1 className="font-heading font-extrabold text-2xl text-[var(--accent-gold)] whitespace-nowrap lowercase">
                                habi
                            </h1>
                            <span className="text-[10px] font-semibold text-white/40 lowercase tracking-widest">
                                v{__APP_VERSION__}
                            </span>
                        </div>
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    className={`p-1.5 rounded-sm bg-white/10 hover:bg-white/20 transition-colors text-white/60 hidden lg:block ${!isOpen ? 'mx-auto' : ''}`}
                >
                    {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="mt-8 px-4 space-y-4">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={onItemClick}
                            className={`flex items-center transition-all group relative ${isOpen ? 'p-3 rounded-sm' : 'p-3 justify-center rounded-sm'
                                } ${isActive
                                    ? 'bg-[var(--accent-gold)] text-habi-primary shadow-lg shadow-[var(--accent-gold)]/30'
                                    : 'hover:bg-white/10 text-white/60 hover:text-white'
                                }`}
                        >
                            <Icon size={24} className={`shrink-0 ${isActive ? 'text-habi-primary' : 'group-hover:text-[var(--accent-gold)]'}`} />
                            <span className={`ml-4 font-medium transition-all duration-300 whitespace-nowrap ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden hidden'
                                }`}>
                                {item.label}
                            </span>
                            {!isOpen && (
                                <div className="hidden lg:group-hover:block absolute left-20 bg-habi-primary text-white px-2 py-1 rounded-sm text-xs transition-opacity pointer-events-none shadow-xl border border-white/10 whitespace-nowrap z-[60]">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Sign Out */}
            <div className="absolute bottom-8 left-0 w-full px-4 space-y-3">
                {isOpen && (
                    <div className="text-center">
                        <span className="text-[10px] font-semibold text-white/30 lowercase tracking-widest">v{__APP_VERSION__}</span>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className={`flex items-center w-full transition-all group ${isOpen ? 'p-3 rounded-sm' : 'p-3 justify-center rounded-sm'} hover:bg-[var(--color-error)]/10 text-white/60 hover:text-[var(--color-error)]`}
                >
                    <LogOut size={24} className="shrink-0" />
                    <span className={`ml-4 font-medium transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden hidden'}`}>
                        Sign Out
                    </span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
