
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Cpu, ScrollText, FileText, Activity, Power, DoorOpen, MapPin, CreditCard, GitMerge } from 'lucide-react';
import { cn } from '../../lib/utils';

const Sidebar = () => {
    const navItems = [
        { to: '/', icon: LayoutDashboard, label: '總覽 (Dashboard)' },
        { to: '/simulation', icon: Cpu, label: '邏輯模擬 (Simulation)' },
        { to: '/initialization', icon: Power, label: '初始化流程 (Initialization)' },
        { to: '/gate-control', icon: DoorOpen, label: '開關門流程 (Gate Control)' },
        { to: '/positioning', icon: MapPin, label: '定位模組 (Positioning)' },
        { to: '/card-dispenser', icon: CreditCard, label: '讀卡/備卡機 (Card Reader)' },
        { to: '/flowchart', icon: GitMerge, label: '演算法流程圖 (Flowchart)' },
        { to: '/protocol', icon: ScrollText, label: '通訊協定 (Protocol)' },
        { to: '/docs', icon: FileText, label: '文件 (Docs)' },
    ];

    return (
        <aside className="w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0">
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400">
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
                                "hover:bg-slate-800 hover:text-cyan-300 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]",
                                isActive
                                    ? "bg-slate-800 text-cyan-400 border-l-4 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                                    : "text-slate-400 border-l-4 border-transparent"
                            )
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium tracking-wide">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-400">系統狀態</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs text-emerald-400 font-mono">線上 (ONLINE)</span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-2 font-mono">v1.0.0 | STM32F215</p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
