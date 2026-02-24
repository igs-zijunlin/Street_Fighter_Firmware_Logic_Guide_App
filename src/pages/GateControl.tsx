import { useState } from 'react';
import { Power, CheckCircle2, ArrowRight, AlertTriangle, Play, RefreshCcw, Database, DoorOpen, Trash2 } from 'lucide-react';
import { MermaidFlowchart } from '../components/ui/MermaidFlowchart';
import { cn } from '../lib/utils';

const OPEN_FLOWCHART = `
graph TD
    classDef startEnd fill:#0f172a,stroke:#22d3ee,stroke-width:2px,color:#cbd5e1,rx:30,ry:30;
    classDef action fill:#1e293b,stroke:#0ea5e9,stroke-width:2px,color:#f8fafc;
    classDef decision fill:#0f172a,stroke:#f43f5e,stroke-width:2px,color:#cbd5e1;
    classDef err fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#e2e8f0;

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
    classDef startEnd fill:#0f172a,stroke:#34d399,stroke-width:2px,color:#cbd5e1,rx:30,ry:30;
    classDef action fill:#1e293b,stroke:#10b981,stroke-width:2px,color:#f8fafc;
    classDef decision fill:#0f172a,stroke:#f43f5e,stroke-width:2px,color:#cbd5e1;
    classDef err fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#e2e8f0;

    START(["主機請求關門 - CLOSING"]):::startEnd --> TRIGGER["Step 0: 設定關門參數<br>DEF_DIR_CLOSE 啟動"]:::action
    TRIGGER --> CHK_ACK["Step 1: 檢查 ACK 狀態"]:::action
    
    CHK_ACK --> IS_ACK{"硬體回覆<br>狀態確認?"}:::decision
    IS_ACK -- Err --> ERR1(["回報硬體錯誤<br>返回 IDLE"]):::err
    IS_ACK -- "Ack (關門成功)" --> FINISH(["關門完成<br>返回 IDLE"]):::startEnd
`;

// 定義開門流程
const OPENING_STEPS = [
    {
        id: 0,
        stepName: 'SUB_STEP_0',
        title: '設定開門參數與啟動',
        desc: '觸發指定通道 (1P/2P) 的電磁鐵開門動作',
        icon: Play,
        details: [
            '根據目標卡盒選擇通道 1P 或 2P，以及對應的清除 QR 索引',
            '設定電磁鐵狀態為 DEF_DIR_OPEN',
            '重置卡片接收器 (IGS_ACCEPT_Reset) 準備進行掉卡偵測'
        ]
    },
    {
        id: 1,
        stepName: 'SUB_STEP_1',
        title: '檢查 ACK 狀態',
        desc: '確認硬體是否成功收到並執行開門指令',
        icon: RefreshCcw,
        details: [
            '若發生硬體錯誤 (Err)，回報相對應通道的電磁閥錯誤並回到 IDLE',
            '若收到確認 (Ack)，清除舊的掉卡狀態標記'
        ]
    },
    {
        id: 2,
        stepName: 'SUB_STEP_2',
        title: '等待廢卡/出卡掉落',
        desc: '透過 Accept 模組確認卡片確實落下',
        icon: Database,
        details: [
            '監控掉卡感測器 (IGS_ACCEPT_GetAckValue)',
            '成功掉卡：標示 ack_success，回到 IDLE (不自動關門)，並清除該槽位的 QR Data',
            '超過 2 秒未掉卡 (Timeout)：會報錯「無卡 (NO_CARD)」，回到 IDLE 交由主機處理後續'
        ]
    }
];

// 定義關門流程
const CLOSING_STEPS = [
    {
        id: 0,
        stepName: 'SUB_STEP_0',
        title: '設定關門參數與啟動',
        desc: '觸發指定通道 (1P/2P) 的電磁鐵關門動作',
        icon: Power,
        details: [
            '設定電磁鐵狀態為 DEF_DIR_CLOSE',
            '傳送啟動訊號'
        ]
    },
    {
        id: 1,
        stepName: 'SUB_STEP_1',
        title: '檢查 ACK 狀態',
        desc: '確認硬體關門是否確實完成',
        icon: CheckCircle2,
        details: [
            '若發生錯誤 (Err)，回報電磁閥錯誤並回到 IDLE',
            '若收到確認 (Ack)，標示 ack_success，回到 IDLE 狀態'
        ]
    }
];

const GateControl = () => {
    const [activeTab, setActiveTab] = useState<'open' | 'close'>('open');

    const stepsToRender = activeTab === 'open' ? OPENING_STEPS : CLOSING_STEPS;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-6 relative">
                <div className="absolute left-0 bottom-0 w-1/3 h-[1px] bg-gradient-to-r from-purple-500 to-transparent" />
                <div className="p-3 bg-purple-950/50 rounded-xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                    <DoorOpen className="w-8 h-8 text-purple-400 animate-pulse" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-widest" style={{ fontFamily: 'var(--font-cyber)' }}>
                        GATE CONTROL <span className="text-purple-400">FLOW</span>
                    </h1>
                    <p className="text-slate-400 mt-1 flex items-center gap-2">
                        閘門控制狀態機流程 (igs_hadouken_main.c - IGS_Hadouken_Gate_Process)
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
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
                        "relative px-8 py-4 rounded-xl font-bold tracking-widest transition-all duration-300 border overflow-hidden group",
                        activeTab === 'open'
                            ? "bg-cyan-950/40 border-cyan-500 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                            : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                    )}
                >
                    {activeTab === 'open' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    )}
                    出卡/開門模式 (OPENING)
                </button>
                <button
                    onClick={() => setActiveTab('close')}
                    className={cn(
                        "relative px-8 py-4 rounded-xl font-bold tracking-widest transition-all duration-300 border overflow-hidden group",
                        activeTab === 'close'
                            ? "bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                            : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                    )}
                >
                    {activeTab === 'close' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    )}
                    關門模式 (CLOSING)
                </button>
            </div>

            {/* Intro & Flowchart Box */}
            <div className={cn(
                "bg-slate-900/50 border rounded-2xl p-6 backdrop-blur-sm transition-colors duration-500",
                activeTab === 'open' ? "border-cyan-900/50" : "border-emerald-900/50"
            )}>
                <p className="text-slate-300 leading-relaxed font-medium mb-6">
                    {activeTab === 'open'
                        ? "在開門模式中，韌體會指揮電磁鐵作動，並監控卡片落下的 ACK 訊號。如果超過 2 秒都沒有偵測到掉卡，系統將自動報錯交由主機處理。在成功掉卡後，會順便清空該槽位原本掃描到的 QR Data 以防資料殘留。"
                        : "關門模式相對單純，主要送出關門指令並等待硬體回傳成功 ACK (或發出 Err)。一旦收到確認信號，狀態機會自動重置為 IDLE 待命。"}
                </p>
                <MermaidFlowchart chart={activeTab === 'open' ? OPEN_FLOWCHART : CLOSE_FLOWCHART} className="bg-[#0f172a]" />
            </div>

            {/* Timeline Flow */}
            <div className="relative pl-8 md:pl-0 mt-8">
                <div className={cn(
                    "absolute left-[31px] md:left-1/2 top-4 bottom-4 w-1 -translate-x-1/2 rounded-full shadow-[0_0_10px_rgba(15,23,42,0.8)] transition-colors duration-500",
                    activeTab === 'open' ? "bg-cyan-950" : "bg-emerald-950"
                )} />
                <div className={cn(
                    "absolute left-[31px] md:left-1/2 top-4 h-full w-1 bg-gradient-to-b from-transparent to-transparent -translate-x-1/2 rounded-full blur-[2px] transition-all duration-1000",
                    activeTab === 'open' ? "via-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]" : "via-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                )} />

                <div className="space-y-16">
                    {stepsToRender.map((step, idx) => {
                        const isLeft = idx % 2 === 0;

                        return (
                            <div key={step.id} className="relative flex flex-col md:flex-row items-start md:items-center w-full group animate-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: `${idx * 150}ms` }}>

                                {/* 節點中心 Icon */}
                                <div className={cn(
                                    "absolute left-0 md:left-1/2 top-6 md:top-1/2 -translate-x-1/2 -translate-y-1/2 z-10",
                                    "bg-slate-900 border-4 border-slate-800 rounded-full p-4 transition-colors duration-500 shadow-[0_0_20px_rgba(0,0,0,0.5)]",
                                    activeTab === 'open' ? "group-hover:border-cyan-500/80" : "group-hover:border-emerald-500/80"
                                )}>
                                    <step.icon className={cn(
                                        "w-6 h-6 text-slate-400 transition-all duration-300",
                                        activeTab === 'open' ? "group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "group-hover:text-emerald-400 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                                    )} />
                                </div>

                                {/* 文字卡片區域 */}
                                <div className={cn(
                                    "w-full md:w-1/2 pl-16 md:px-12 relative flex",
                                    isLeft ? "md:justify-end" : "md:ml-auto md:justify-start"
                                )}>

                                    {/* 連接線 (Desktop) */}
                                    <div className={cn(
                                        "hidden md:block absolute top-1/2 -translate-y-1/2 w-12 h-1 bg-slate-800 transition-colors duration-500",
                                        isLeft ? "right-0" : "left-0",
                                        activeTab === 'open' ? "group-hover:bg-cyan-900" : "group-hover:bg-emerald-900"
                                    )} />

                                    <div className={cn(
                                        "w-full max-w-lg bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 group-hover:-translate-y-1",
                                        activeTab === 'open' ? "group-hover:border-cyan-500/50 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]" : "group-hover:border-emerald-500/50 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                                    )}>

                                        {/* 卡片高光裝飾 */}
                                        <div className={cn(
                                            "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-30 transition-all duration-500",
                                            activeTab === 'open' ? "group-hover:via-cyan-400" : "group-hover:via-emerald-400"
                                        )} />

                                        {/* 標題 */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className={cn(
                                                    "font-mono text-xs mb-1 font-semibold flex items-center gap-2",
                                                    activeTab === 'open' ? "text-cyan-500/80" : "text-emerald-500/80"
                                                )}>
                                                    STEP 0{step.id + 1}
                                                    {idx < stepsToRender.length - 1 && <ArrowRight className="w-3 h-3" />}
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-200 tracking-wide">{step.title}</h3>
                                                <p className="text-slate-500 text-xs font-mono mt-1">{step.stepName}</p>
                                            </div>
                                        </div>

                                        <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium">
                                            {step.desc}
                                        </p>

                                        {/* 實作細節 */}
                                        <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50 group-hover:border-slate-700 transition-colors">
                                            <ul className="space-y-3">
                                                {step.details.map((detail, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                                                        <div className={cn(
                                                            "w-1.5 h-1.5 rounded-full bg-slate-700 mt-1.5 shrink-0 transition-colors",
                                                            activeTab === 'open' ? "group-hover:bg-cyan-500" : "group-hover:bg-emerald-500"
                                                        )} />
                                                        <span className="leading-relaxed">{detail}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* 特殊提示 */}
                                        {activeTab === 'open' && step.id === 2 && (
                                            <div className="mt-4 flex items-start gap-2 text-xs text-amber-500/90 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                                <span>硬體不會自動關門。掉卡成功後保留開門狀態供主機決定關閉時機；超時亦然。</span>
                                            </div>
                                        )}

                                        {activeTab === 'open' && step.id === 2 && (
                                            <div className="mt-2 flex items-start gap-2 text-xs text-cyan-500/90 bg-cyan-500/10 p-3 rounded-lg border border-cyan-500/20">
                                                <Trash2 className="w-4 h-4 shrink-0" />
                                                <span>資料清除機制：將該卡盒結構中 `qr_data` 全部填為 0。</span>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default GateControl;
