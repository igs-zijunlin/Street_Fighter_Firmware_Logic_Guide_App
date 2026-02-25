
import { useState } from 'react';
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
        moveToPosition,
        performDispense,
        performRefill,
        performReject,
        currentSlotIndex,
        setCurrentSlotIndex
    } = useHadoukenLogic();

    type TargetPosition = 'REFILL' | '1P_DISPENSE' | '2P_DISPENSE' | 'REJECT';
    const [targetPos, setTargetPos] = useState<TargetPosition>('1P_DISPENSE');

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-700 font-cyber">
                    出卡模組動作模擬
                </h2>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <span className="text-xs text-slate-500 uppercase block">初始化步驟</span>
                        <span className="font-mono text-cyan-600 font-bold">{initStep}</span>
                    </div>
                    <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <span className="text-xs text-slate-500 uppercase block">QEI 位置</span>
                        <span className="font-mono text-emerald-600 font-bold">{Math.round(qei)}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visualizer Panel */}
                <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-100/50 via-transparent to-transparent pointer-events-none"></div>

                    <TurntableVisualizer qei={qei} inventory={inventory} />


                    <div className="mt-14 text-slate-500 text-sm font-mono">
                        馬達狀態: <span className={motorState === 'STOP' ? 'text-slate-400' : 'text-amber-600 animate-pulse'}>{motorState}</span>
                    </div>
                </div>
                {/* Controls Panel */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col h-full overflow-hidden">
                    <h3 className="text-xl font-bold mb-4 font-cyber text-slate-900 shrink-0">控制面板</h3>

                    <div className="space-y-4 shrink-0">
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

                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                            <label className="text-xs text-slate-600 uppercase block mb-3 font-bold border-b border-slate-200 pb-2">手動控制 (機台調試)</label>

                            <div className="space-y-3">
                                {/* Positioning Controls */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <div className="flex flex-col flex-1 gap-1">
                                            <label className="text-[10px] text-slate-500">卡盒選擇 (Slot)</label>
                                            <select
                                                className="bg-white text-slate-800 border border-slate-300 rounded px-2 py-2 outline-none focus:border-cyan-500 text-xs"
                                                onChange={(e) => setCurrentSlotIndex(Number(e.target.value))}
                                                value={currentSlotIndex}
                                            >
                                                {inventory.map(slot => (
                                                    <option key={slot.index} value={slot.index}>Slot {slot.index + 1}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col flex-1 gap-1">
                                            <label className="text-[10px] text-slate-500">目標位置 (Target)</label>
                                            <select
                                                className="bg-white text-slate-800 border border-slate-300 rounded px-2 py-2 outline-none focus:border-cyan-500 text-xs"
                                                onChange={(e) => setTargetPos(e.target.value as TargetPosition)}
                                                value={targetPos}
                                            >
                                                <option value="1P_DISPENSE">1P出卡口 (+90°)</option>
                                                <option value="2P_DISPENSE">2P出卡口 (-90°)</option>
                                                <option value="REFILL">補卡口 (0°)</option>
                                                <option value="REJECT">排廢區 (180°)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => moveToPosition(currentSlotIndex, targetPos)}
                                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs transition-colors shadow-sm"
                                    >
                                        定位移動
                                    </button>
                                </div>

                                {/* Action Controls */}
                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 mt-2">
                                    <button
                                        onClick={() => performRefill(currentSlotIndex)}
                                        className="py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded shadow-sm text-xs border border-rose-200 transition-colors"
                                    >
                                        執行補卡
                                    </button>
                                    <button
                                        onClick={() => performDispense(currentSlotIndex)}
                                        className="py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded shadow-sm text-xs border border-emerald-200 transition-colors"
                                    >
                                        執行出卡
                                    </button>
                                    <button
                                        onClick={() => performReject(currentSlotIndex)}
                                        className="py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold rounded shadow-sm text-xs border border-orange-200 transition-colors"
                                    >
                                        執行廢卡
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex-1 flex flex-col">
                        <h4 className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-wider shrink-0">系統日誌 (System Logs)</h4>
                        <div className="flex-1">
                            <LogTerminal logs={logs} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Simulation;
