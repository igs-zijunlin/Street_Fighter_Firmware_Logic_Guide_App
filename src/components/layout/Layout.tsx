import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 relative">
            {/* Mobile Top Navigation */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center px-4 shadow-sm">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 -ml-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div className="ml-4 font-bold text-slate-800 tracking-wider" style={{ fontFamily: 'var(--font-cyber)' }}>
                    HADOUKEN IO
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <main className="flex-1 transition-all duration-300 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto h-[100dvh] bg-slate-50 w-full">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
