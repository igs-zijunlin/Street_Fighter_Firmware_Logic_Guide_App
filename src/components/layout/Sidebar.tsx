
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Cpu, Activity, Power, DoorOpen, MapPin, CreditCard } from 'lucide-react';
import { cn } from '../../lib/utils';

const Sidebar = () => {
    const navItems = [
        { to: '/', icon: LayoutDashboard, label: '總覽 (Dashboard)' },
        { to: '/simulation', icon: Cpu, label: '出卡模組動作模擬 (Simulation)' },
        { to: '/initialization', icon: Power, label: '初始化流程 (Initialization)' },
        { to: '/gate-control', icon: DoorOpen, label: '開關門流程 (Gate Control)' },
        { to: '/positioning', icon: MapPin, label: '定位模組 (Positioning)' },
        { to: '/card-dispenser', icon: CreditCard, label: '讀卡/備卡機 (Card Reader)' },
    ];

    return (
        <aside className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0">
            <div className="p-6 border-b border-slate-200">
                <div className="flex items-center gap-2 text-blue-600">
                    <Activity className="w-8 h-8 animate-pulse" />
                    <h1 className="text-xl font-bold tracking-wider" style={{ fontFamily: 'var(--font-cyber)' }}>
                        HADOUKEN IO
                    </h1>
                </div>
                <p className="text-xs text-slate-500 mt-1">韌體邏輯視覺化工具</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                                "hover:bg-slate-50 hover:text-blue-600",
                                isActive
                                    ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-bold"
                                    : "text-slate-600 border-l-4 border-transparent"
                            )
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium tracking-wide">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-200">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500">系統狀態</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs text-emerald-600 font-mono font-bold">線上 (ONLINE)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono">v1.0.0 | STM32F215</p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
