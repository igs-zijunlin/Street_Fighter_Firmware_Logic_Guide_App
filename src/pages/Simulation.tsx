
import { useHadoukenLogic } from '../hooks/useHadoukenLogic';
import TurntableVisualizer from '../components/simulation/TurntableVisualizer';
import LogTerminal from '../components/simulation/LogTerminal';
import { Play, Square } from 'lucide-react';

const Simulation = () => {
    const {
        qei,
        motorState,
        initStep,
        inventory,
        logs,
        startInitialization,
        stopSimulation,
        manualDispense,
        currentSlotIndex
    } = useHadoukenLogic();

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-cyber">
                    邏輯模擬器
                </h2>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
                        <span className="text-xs text-slate-500 uppercase block">初始化步驟</span>
                        <span className="font-mono text-cyan-400 font-bold">{initStep}</span>
                    </div>
                    <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
                        <span className="text-xs text-slate-500 uppercase block">QEI 位置</span>
                        <span className="font-mono text-emerald-400 font-bold">{Math.round(qei)}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Visualizer Panel */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none"></div>

                    <TurntableVisualizer qei={qei} inventory={inventory} />


                    <div className="mt-8 text-slate-500 text-sm font-mono">
                        馬達狀態: <span className={motorState === 'STOP' ? 'text-slate-400' : 'text-amber-400 animate-pulse'}>{motorState}</span>
                    </div>
                </div>
            </div>

            {/* Controls Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
                <h3 className="text-xl font-bold mb-4 font-cyber text-slate-200">控制面板</h3>

                <div className="space-y-4 mb-auto">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={startInitialization}
                            disabled={initStep !== 'IDLE'}
                            className="flex items-center justify-center gap-2 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold transition-colors text-white"
                        >
                            <Play className="w-4 h-4" /> 開始初始化
                        </button>
                        <button
                            onClick={stopSimulation}
                            className="flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold transition-colors text-white"
                        >
                            <Square className="w-4 h-4" /> 停止模擬
                        </button>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                        <label className="text-xs text-slate-400 uppercase block mb-2">手動控制 (出卡測試)</label>
                        <div className="flex gap-2">
                            <select
                                className="bg-slate-900 text-slate-200 border border-slate-600 rounded px-3 py-2 flex-1 outline-none focus:border-cyan-500 text-sm"
                                onChange={(e) => manualDispense(Number(e.target.value))}
                                value={currentSlotIndex}
                            >
                                {inventory.map(slot => (
                                    <option key={slot.index} value={slot.index}>Slot {slot.index + 1}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => manualDispense(currentSlotIndex)}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
                            >
                                執行
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <h4 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">系統日誌 (System Logs)</h4>
                    <LogTerminal logs={logs} />
                </div>
            </div>
        </div>
    );
};

export default Simulation;
