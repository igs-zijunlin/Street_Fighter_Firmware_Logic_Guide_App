import { useState } from 'react';
import { CreditCard, ChevronRight, Activity, Send, CheckCircle2, FileDown, QrCode, Cpu, ShieldAlert, ArrowLeftRight } from 'lucide-react';
import { MermaidFlowchart } from '../components/ui/MermaidFlowchart';
import { cn } from '../lib/utils';

const REFILL_FLOWCHART = `
graph TD
    classDef startEnd fill:#0f172a,stroke:#f43f5e,stroke-width:2px,color:#cbd5e1,rx:30,ry:30;
    classDef action fill:#1e293b,stroke:#f43f5e,stroke-width:2px,color:#f8fafc;
    classDef decision fill:#0f172a,stroke:#f43f5e,stroke-width:2px,color:#cbd5e1;

    START(["備卡流程"]):::startEnd --> REQ["Step 1: 發送 0x19 請求"]:::action
    REQ --> WAIT_ACK["Step 2: 等待 ACK Data=0"]:::action
    WAIT_ACK --> WAIT_EVT["Step 3: 等待備卡成功事件 0x1A"]:::action
    
    WAIT_EVT --> SEND_QR["Step 4: 發送 QR 讀取指令 0x1D"]:::action
    SEND_QR --> WAIT_QR_DATA["Step 5: 接收 QR 資料並寫入 qr_data"]:::action
    
    WAIT_QR_DATA --> FINISH(["備卡流程完成<br>進入 IDLE"]):::startEnd
`;

const DISPENSE_FLOWCHART = `
graph TD
    classDef startEnd fill:#0f172a,stroke:#d946ef,stroke-width:2px,color:#cbd5e1,rx:30,ry:30;
    classDef action fill:#1e293b,stroke:#d946ef,stroke-width:2px,color:#f8fafc;
    classDef decision fill:#0f172a,stroke:#f43f5e,stroke-width:2px,color:#cbd5e1;
    classDef err fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#e2e8f0;

    START(["出卡流程"]):::startEnd --> REQ["Step 1: 發送出卡請求 0x09"]:::action
    REQ --> WAIT_ACK["Step 2: 等待 ACK"]:::action
    
    WAIT_ACK --> CHK_ACK{"Data == 0?"}:::decision
    CHK_ACK -- No --> ERR(["報錯並中斷"]):::err
    CHK_ACK -- Yes --> WAIT_EVT["Step 3: 等待出卡成功事件 0x0A"]:::action
    
    WAIT_EVT --> CHK_EMPTY{"轉盤目標卡盒<br>是否為空?"}:::decision
    CHK_EMPTY -- "No (已有卡)" --> ERR2(["報錯 HADOUKEN_ERR_CARD_EXIST"]):::err
    CHK_EMPTY -- "Yes (空盒)" --> COPY_QR["將讀卡機 qr_data<br>複製到轉盤 card_list"]:::action
    
    COPY_QR --> CLR_QR["清空讀卡機 qr_data"]:::action
    CLR_QR --> FINISH(["出卡流程完成<br>進入 IDLE"]):::startEnd
`;

// 定義備卡流程
const REFILL_STEPS = [
    {
        id: 1,
        stepName: 'DISPENSER_STATE_SEND_REFILL',
        title: '發送備卡請求',
        desc: '向讀卡機送出 0x19 (CMD_REFILL_REQ)',
        icon: Send,
        details: [
            '透過 UART 送出協定指令',
            '清空先前的 ACK 與 Event 旗標'
        ]
    },
    {
        id: 2,
        stepName: 'DISPENSER_STATE_WAIT_REFILL_ACK',
        title: '等待指令接受 ACK',
        desc: '讀卡機回應 Data=0',
        icon: CheckCircle2,
        details: [
            '確認讀卡機收到指令並準備執行',
            '若 Data≠0，記錄錯誤代碼並中斷流程'
        ]
    },
    {
        id: 3,
        stepName: 'DISPENSER_STATE_WAIT_REFILL_EVENT',
        title: '等待備卡成功事件',
        desc: '接收主動事件 0x1A (CMD_REFILL_EVENT)',
        icon: FileDown,
        details: [
            '卡片已經被送到讀卡位置',
            '韌體 (Polling) 自動回覆 ACK',
            '進入觸發讀取 QR 碼狀態'
        ]
    },
    {
        id: 4,
        stepName: 'DISPENSER_STATE_SEND_QR_CMD',
        title: '發送 QR 讀取指令',
        desc: '向讀卡機送出 0x1D (CMD_READ_QR)',
        icon: QrCode,
        details: [
            '要求讀卡機掃描當前備妥的卡片二維碼'
        ]
    },
    {
        id: 5,
        stepName: 'DISPENSER_STATE_WAIT_QR_DATA',
        title: '接收 QR 資料並完成',
        desc: '等待讀卡機回傳包含資料的封包',
        icon: Cpu,
        details: [
            '將資料寫入該出卡機專屬的 `qr_data` 緩衝區',
            '標示備卡流程完成 (ack_refill_complete = 1)',
            '狀態機回到 IDLE'
        ]
    }
];

// 定義出卡流程
const DISPENSE_STEPS = [
    {
        id: 1,
        stepName: 'DISPENSER_STATE_SEND_DISPENSE',
        title: '發送出卡請求',
        desc: '向讀卡機送出 0x09 (CMD_DISPENSE_REQ)',
        icon: Send,
        details: [
            '透過 UART 請求讀卡機將已備妥並讀過 QR 的卡片吐出'
        ]
    },
    {
        id: 2,
        stepName: 'DISPENSER_STATE_WAIT_DISPENSE_ACK',
        title: '等待指令接受 ACK',
        desc: '讀卡機回應 Data=0',
        icon: CheckCircle2,
        details: [
            '若 Data=2 (無卡) 或其他錯誤，記錄錯誤並中斷流程'
        ]
    },
    {
        id: 3,
        stepName: 'DISPENSER_STATE_WAIT_DISPENSE_EVENT',
        title: '出卡成功與 QR 轉移',
        desc: '接收主動事件 0x0A (CMD_DISPENSE_EVENT) 並搬移資料',
        icon: ArrowLeftRight,
        details: [
            '卡片成功落入轉盤機構',
            '【關鍵轉移】將出卡機暫存的 `qr_data` 複製到轉盤對應的 `card_list[target_box_index]` 中',
            '基於防呆保護，只會在目標卡盒為「空」的狀態下寫入，避免覆蓋舊資料或卡片重疊時資料錯亂',
            '清空讀卡機的 `qr_data`，準備下一輪備卡'
        ]
    }
];

const CardDispenserFlow = () => {
    const [activeTab, setActiveTab] = useState<'refill' | 'dispense'>('refill');

    const stepsToRender = activeTab === 'refill' ? REFILL_STEPS : DISPENSE_STEPS;

    // Dynamic color classes based on activeTab
    const activeColorClasses = activeTab === 'refill'
        ? 'text-rose-400 border-rose-500 bg-rose-950/40 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
        : 'text-fuchsia-400 border-fuchsia-500 bg-fuchsia-950/40 shadow-[0_0_20px_rgba(217,70,239,0.2)]';

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-6 relative">
                <div className="absolute left-0 bottom-0 w-1/3 h-[1px] bg-gradient-to-r from-rose-500 to-transparent" />
                <div className="p-3 bg-rose-950/50 rounded-xl border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
                    <CreditCard className="w-8 h-8 text-rose-400 animate-pulse" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-widest" style={{ fontFamily: 'var(--font-cyber)' }}>
                        CARD DISPENSER <span className="text-rose-400">FLOW</span>
                    </h1>
                    <p className="text-slate-400 mt-1 flex items-center gap-2">
                        讀卡/備卡機狀態機流程 (igs_card_dispenser.c)
                    </p>
                </div>
            </div>

            {/* Intro & UART Architecture Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* State Machine Overview */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-3">
                        <Activity className="w-5 h-5 text-rose-400" />
                        狀態機架構
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        控制流程分為兩大階段：主機提出需求等待 <code>ACK (Command OK)</code>，接著等待讀卡機硬體作動完畢後主動發出的 <code>EVENT (Action Done)</code>。這種交握設計確保了非同步硬體通訊的穩定性。
                    </p>
                </div>

                {/* UART Buffer Architecture */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-3">
                        <ShieldAlert className="w-5 h-5 text-amber-500" />
                        雙緩衝與校驗機制
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-3">
                        中斷副程式利用 <code>tmp_RxBuffer</code> 接收變動長度封包。只有在校驗碼 (XOR) 與長度皆正確，且主迴圈已處理完上一包 <code>(RxComplete == 0)</code> 時，資料才會被搬入 <code>RxBuffer</code> 供狀態機解析，防止資料被覆蓋寫壞。
                    </p>
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                        <span className="px-2 py-1 bg-slate-800 rounded text-slate-300">HEAD 0x24</span>
                        <span className="px-2 py-1 bg-slate-800 rounded text-amber-400">LENGTH</span>
                        <span className="px-2 py-1 bg-slate-800 rounded text-rose-400">ID</span>
                        <span className="px-2 py-1 bg-slate-800 rounded text-cyan-400">CMD</span>
                        <span className="px-2 py-1 bg-slate-800 rounded text-emerald-400">DATA...</span>
                        <span className="px-2 py-1 bg-slate-800 rounded text-purple-400">XOR CHK</span>
                        <span className="px-2 py-1 bg-slate-800 rounded text-slate-300">END</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex justify-center gap-4 pt-4">
                <button
                    onClick={() => setActiveTab('refill')}
                    className={cn(
                        "relative px-8 py-4 rounded-xl font-bold tracking-widest transition-all duration-300 border overflow-hidden group",
                        activeTab === 'refill'
                            ? activeColorClasses
                            : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                    )}
                >
                    {activeTab === 'refill' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    )}
                    備卡流程 (REFILL + QR READ)
                </button>
                <button
                    onClick={() => setActiveTab('dispense')}
                    className={cn(
                        "relative px-8 py-4 rounded-xl font-bold tracking-widest transition-all duration-300 border overflow-hidden group",
                        activeTab === 'dispense'
                            ? activeColorClasses
                            : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                    )}
                >
                    {activeTab === 'dispense' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-fuchsia-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    )}
                    出卡流程 (DISPENSE & TRANSFER)
                </button>
            </div>

            {/* Flowchart Box */}
            <div className={cn(
                "bg-slate-900/50 border rounded-2xl p-6 backdrop-blur-sm transition-colors duration-500 mt-8",
                activeTab === 'refill' ? "border-rose-900/50" : "border-fuchsia-900/50"
            )}>
                <h3 className={cn("text-lg font-bold mb-4 flex items-center gap-2", activeTab === 'refill' ? 'text-rose-400' : 'text-fuchsia-400')}>
                    <Activity className="w-5 h-5" /> 演算邏輯總覽 (Mermaid 流程圖)
                </h3>
                <MermaidFlowchart
                    chart={activeTab === 'refill' ? REFILL_FLOWCHART : DISPENSE_FLOWCHART}
                    className="bg-[#0f172a]"
                />
            </div>

            {/* Timeline Flow */}
            <div className="relative pl-8 md:pl-0 mt-8">
                <div className={cn(
                    "absolute left-[31px] md:left-1/2 top-4 bottom-4 w-1 -translate-x-1/2 rounded-full shadow-[0_0_10px_rgba(15,23,42,0.8)] transition-colors duration-500",
                    activeTab === 'refill' ? "bg-rose-950/50" : "bg-fuchsia-950/50"
                )} />
                <div className={cn(
                    "absolute left-[31px] md:left-1/2 top-4 h-full w-1 bg-gradient-to-b from-transparent to-transparent -translate-x-1/2 rounded-full blur-[2px] transition-all duration-1000",
                    activeTab === 'refill' ? "via-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)]" : "via-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.5)]"
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
                                    activeTab === 'refill' ? "group-hover:border-rose-500/80" : "group-hover:border-fuchsia-500/80"
                                )}>
                                    <step.icon className={cn(
                                        "w-6 h-6 text-slate-400 transition-all duration-300",
                                        activeTab === 'refill' ? "group-hover:text-rose-400 group-hover:drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" : "group-hover:text-fuchsia-400 group-hover:drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]"
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
                                        activeTab === 'refill' ? "group-hover:bg-rose-900" : "group-hover:bg-fuchsia-900"
                                    )} />

                                    <div className={cn(
                                        "w-full max-w-lg bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 group-hover:-translate-y-1",
                                        activeTab === 'refill' ? "group-hover:border-rose-500/50 group-hover:shadow-[0_0_25px_rgba(244,63,94,0.2)]" : "group-hover:border-fuchsia-500/50 group-hover:shadow-[0_0_25px_rgba(217,70,239,0.2)]"
                                    )}>

                                        {/* 卡片高光裝飾 */}
                                        <div className={cn(
                                            "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-30 transition-all duration-500",
                                            activeTab === 'refill' ? "group-hover:via-rose-400" : "group-hover:via-fuchsia-400"
                                        )} />

                                        {/* 標題 */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className={cn(
                                                    "font-mono text-xs mb-1 font-semibold flex items-center gap-2",
                                                    activeTab === 'refill' ? "text-rose-500/80" : "text-fuchsia-500/80"
                                                )}>
                                                    STEP 0{step.id}
                                                    {idx < stepsToRender.length - 1 && <ChevronRight className="w-3 h-3" />}
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
                                                            activeTab === 'refill' ? "group-hover:bg-rose-500" : "group-hover:bg-fuchsia-500"
                                                        )} />
                                                        <span className="leading-relaxed">{detail}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* 出卡 QR 轉移特別標示 */}
                                        {activeTab === 'dispense' && step.id === 3 && (
                                            <div className="mt-4 flex flex-col gap-2 text-xs text-emerald-400/90 bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/20">
                                                <div className="flex items-center gap-2 font-bold text-sm">
                                                    <ArrowLeftRight className="w-4 h-4 shrink-0" /> QR Code Swap Logic
                                                </div>
                                                <span>1. 確認卡盒 <code>card_list[target_box_index - 1]</code>。</span>
                                                <span>2. 若空，則將 <code>pDisp-&gt;qr_data</code> 複製進去。</span>
                                                <span>3. 清空讀卡機 <code>pDisp-&gt;qr_data</code>。</span>
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

export default CardDispenserFlow;
