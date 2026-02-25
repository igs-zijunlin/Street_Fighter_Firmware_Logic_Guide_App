
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen bg-slate-50">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
