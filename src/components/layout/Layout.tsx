
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
