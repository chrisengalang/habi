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
            <div className={`flex items-center border-b border-slate-700/50 transition-all duration-300 ${isOpen ? 'justify-between p-6' : 'justify-center py-6 px-0'}`}>
                {isOpen && (
                    <div className="animate-in fade-in duration-300">
                        <h1 className="font-bold text-2xl text-blue-400 whitespace-nowrap lowercase">
                            habi
                        </h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Family Weaver</p>
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    className={`p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400 hidden lg:block ${!isOpen ? 'mx-auto' : ''}`}
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
                            className={`flex items-center transition-all group relative ${isOpen ? 'p-3 rounded-xl' : 'p-3 justify-center rounded-2xl'
                                } ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                        >
                            <Icon size={24} className={`shrink-0 ${isActive ? 'text-white' : 'group-hover:text-blue-400'}`} />
                            <span className={`ml-4 font-medium transition-all duration-300 whitespace-nowrap ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden hidden'
                                }`}>
                                {item.label}
                            </span>
                            {!isOpen && (
                                <div className="hidden lg:group-hover:block absolute left-20 bg-slate-900 text-white px-2 py-1 rounded text-xs transition-opacity pointer-events-none shadow-xl border border-slate-700 whitespace-nowrap z-[60]">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Sign Out */}
            <div className="absolute bottom-8 left-0 w-full px-4">
                <button
                    onClick={handleLogout}
                    className={`flex items-center w-full transition-all group ${isOpen ? 'p-3 rounded-xl' : 'p-3 justify-center rounded-2xl'} hover:bg-red-500/10 text-slate-400 hover:text-red-400`}
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
