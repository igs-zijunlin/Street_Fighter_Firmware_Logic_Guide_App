
import { Cpu, Server, Activity, Disc } from 'lucide-react';

const ArchitectureBlock = ({ title, icon: Icon, details, color }: { title: string, icon: any, details: string, color: string }) => (
    <div className={`p-6 rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:border-${color}-500 transition-all cursor-pointer group`}>
        <div className={`w-12 h-12 rounded-lg bg-${color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
        <h3 className="text-lg font-bold text-slate-100 mb-2">{title}</h3>
        <p className="text-sm text-slate-400">{details}</p>
    </div>
);

const Dashboard = () => {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-cyber">
                    系統架構圖
                </h2>
                <p className="text-slate-400 mt-2">Street Fighter 6 PK IO 板硬體概覽</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ArchitectureBlock
                    title="STM32F215 MCU"
                    icon={Cpu}
                    details="核心控制器 (FreeRTOS)。負責通訊協定、馬達控制與 IO 邏輯。"
                    color="cyan"
                />
                <ArchitectureBlock
                    title="馬達與編碼器 (Motor & QEI)"
                    icon={Disc}
                    details="4096 PPR 高解析度定位轉盤。支援自動歸零校正。"
                    color="emerald"
                />
                <ArchitectureBlock
                    title="出卡機 (Card Dispenser)"
                    icon={Server}
                    details="管理 10 個卡盒插槽，具備獨立閘門與光學感測器。"
                    color="amber"
                />
            </div>

            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    即時系統狀態
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-black/40 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-500 uppercase">系統運行時間</span>
                        <p className="text-xl font-mono text-emerald-400">00:12:45</p>
                    </div>
                    <div className="p-4 bg-black/40 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-500 uppercase">馬達位置 (QEI)</span>
                        <p className="text-xl font-mono text-cyan-400">2048</p>
                    </div>
                    <div className="p-4 bg-black/40 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-500 uppercase">通訊狀態</span>
                        <p className="text-xl font-mono text-blue-400">IDLE</p>
                    </div>
                    <div className="p-4 bg-black/40 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-500 uppercase">看門狗 (Watchdog)</span>
                        <p className="text-xl font-mono text-green-400">OK</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
