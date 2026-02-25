import { useState } from 'react';
import { DoorOpen } from 'lucide-react';
import { MermaidFlowchart } from '../components/ui/MermaidFlowchart';
import { cn } from '../lib/utils';

const OPEN_FLOWCHART = `
graph TD
    classDef startEnd fill:#f0f9ff,stroke:#0ea5e9,stroke-width:2px,color:#0f172a,rx:30,ry:30;
    classDef action fill:#ffffff,stroke:#38bdf8,stroke-width:2px,color:#0369a1;
    classDef decision fill:#fff1f2,stroke:#e11d48,stroke-width:2px,color:#881337;
    classDef err fill:#fdf4ff,stroke:#d946ef,stroke-width:2px,color:#86198f;

    START(["主機請求出卡 - OPENING"]):::startEnd --> TRIGGER["Step 0: 設定開門參數<br>1P / 2P / 電磁鐵 / 重置 Accept"]:::action
    TRIGGER --> CHK_ACK["Step 1: 檢查 ACK 狀態"]:::action
    
    CHK_ACK --> IS_ACK{"硬體回覆<br>狀態確認?"}:::decision
    IS_ACK -- Err --> ERR1(["回報硬體錯誤<br>返回 IDLE"]):::err
    IS_ACK -- "Ack (開門成功)" --> WAIT_DROP["Step 2: 等待廢卡出卡掉落<br>IGS_ACCEPT_GetAckValue"]:::action
    
    WAIT_DROP --> CHK_DROP{"2秒內偵測<br>到掉卡成功?"}:::decision
    CHK_DROP -- "No (2s 超時)" --> ERR2(["報錯無卡 (NO_CARD)<br>返回 IDLE"]):::err
    CHK_DROP -- "Yes (成功落下)" --> CLR_QR["清除對應卡盒的 QR Data<br>以防資料殘留"]:::action
    
    CLR_QR --> FINISH(["開門完成, 保留開門狀態<br>返回 IDLE"]):::startEnd
`;

const CLOSE_FLOWCHART = `
graph TD
    classDef startEnd fill:#f0fdf4,stroke:#10b981,stroke-width:2px,color:#064e3b,rx:30,ry:30;
    classDef action fill:#ffffff,stroke:#34d399,stroke-width:2px,color:#047857;
    classDef decision fill:#fff1f2,stroke:#e11d48,stroke-width:2px,color:#881337;
    classDef err fill:#fdf4ff,stroke:#d946ef,stroke-width:2px,color:#86198f;

    START(["主機請求關門 - CLOSING"]):::startEnd --> TRIGGER["Step 0: 設定關門參數<br>DEF_DIR_CLOSE 啟動"]:::action
    TRIGGER --> CHK_ACK["Step 1: 檢查 ACK 狀態"]:::action
    
    CHK_ACK --> IS_ACK{"硬體回覆<br>狀態確認?"}:::decision
    IS_ACK -- Err --> ERR1(["回報硬體錯誤<br>返回 IDLE"]):::err
    IS_ACK -- "Ack (關門成功)" --> FINISH(["關門完成<br>返回 IDLE"]):::startEnd
`;

const GateControl = () => {
    const [activeTab, setActiveTab] = useState<'open' | 'close'>('open');

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-200 pb-6 relative">
                <div className="absolute left-0 bottom-0 w-1/3 h-[1px] bg-gradient-to-r from-purple-500 to-transparent" />
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <DoorOpen className="w-8 h-8 text-purple-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-widest" style={{ fontFamily: 'var(--font-cyber)' }}>
                        GATE CONTROL <span className="text-purple-600">FLOW</span>
                    </h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        閘門控制狀態機流程 (igs_hadouken_main.c - IGS_Hadouken_Gate_Process)
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 border border-purple-200 text-purple-700">
                            雙通道 1P/2P 獨立控制
                        </span>
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex justify-center gap-4">
                <button
                    onClick={() => setActiveTab('open')}
                    className={cn(
                        "relative px-8 py-4 rounded-xl font-bold tracking-widest transition-all duration-300 border overflow-hidden group shadow-sm",
                        activeTab === 'open'
                            ? "bg-cyan-50 border-cyan-500 text-cyan-700"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    )}
                >
                    {activeTab === 'open' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    )}
                    出卡/開門模式 (OPENING)
                </button>
                <button
                    onClick={() => setActiveTab('close')}
                    className={cn(
                        "relative px-8 py-4 rounded-xl font-bold tracking-widest transition-all duration-300 border overflow-hidden group shadow-sm",
                        activeTab === 'close'
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    )}
                >
                    {activeTab === 'close' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    )}
                    關門模式 (CLOSING)
                </button>
            </div>

            {/* Intro & Flowchart Box */}
            <div className={cn(
                "bg-white border rounded-2xl p-6 transition-colors duration-500 shadow-sm",
                activeTab === 'open' ? "border-cyan-200" : "border-emerald-200"
            )}>
                <p className="text-slate-600 leading-relaxed font-medium mb-6">
                    {activeTab === 'open'
                        ? "在開門模式中，韌體會指揮電磁鐵作動，並監控卡片落下的 ACK 訊號。如果超過 2 秒都沒有偵測到掉卡，系統將自動報錯交由主機處理。在成功掉卡後，會順便清空該槽位原本掃描到的 QR Data 以防資料殘留。"
                        : "關門模式相對單純，主要送出關門指令並等待硬體回傳成功 ACK (或發出 Err)。一旦收到確認信號，狀態機會自動重置為 IDLE 待命。"}
                </p>
                <MermaidFlowchart chart={activeTab === 'open' ? OPEN_FLOWCHART : CLOSE_FLOWCHART} className="bg-transparent border-none shadow-none" />
            </div>

        </div>
    );
};

export default GateControl;
