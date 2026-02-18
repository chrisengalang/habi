import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Menu, LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import MonthSelector from './MonthSelector';

export default function AuthenticatedLayout({ children, selectedDate, setSelectedDate }) {
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 1024);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const userInitials = user?.email?.substring(0, 2).toUpperCase() || '??';

    const handleSidebarItemClick = () => {
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[var(--bg-primary)] transition-colors duration-300 relative">
            <Sidebar
                isOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                onItemClick={handleSidebarItemClick}
            />

            {isSidebarOpen && window.innerWidth < 1024 && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen && window.innerWidth >= 1024 ? 'ml-64' : 'lg:ml-20 ml-0'}`}>
                <header className="sticky top-0 z-30 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-3 sm:px-4 lg:px-8 py-3 sm:py-4 flex justify-between items-center shadow-sm">
                    <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-2 rounded-sm bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-habi-primary transition-colors border border-[var(--border-color)]"
                        >
                            <Menu size={18} />
                        </button>
                        <h2 className="text-lg lg:text-xl font-heading font-bold text-[var(--text-primary)] hidden sm:block">Overview</h2>
                        <MonthSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="p-2 rounded-sm bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-habi-gold transition-colors border border-[var(--border-color)]"
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button
                            onClick={logout}
                            title="Sign Out"
                            className="p-2 rounded-sm bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-habi-error transition-colors border border-[var(--border-color)]"
                        >
                            <LogOut size={18} />
                        </button>
                        <div className="h-8 w-8 rounded-sm bg-habi-primary flex items-center justify-center text-white font-bold text-xs shadow-lg shrink-0">
                            {userInitials}
                        </div>
                    </div>
                </header>

                <main className="p-3 sm:p-4 lg:p-8 container mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
