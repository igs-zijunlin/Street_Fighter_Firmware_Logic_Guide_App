import { useState } from 'react';
import { CreditCard, Activity, ShieldAlert } from 'lucide-react';
import { MermaidFlowchart } from '../components/ui/MermaidFlowchart';
import { cn } from '../lib/utils';

const REFILL_FLOWCHART = `
graph TD
    classDef startEnd fill:#fff1f2,stroke:#e11d48,stroke-width:2px,color:#881337,rx:30,ry:30;
    classDef action fill:#ffffff,stroke:#fb7185,stroke-width:2px,color:#9f1239;
    classDef decision fill:#fdf4ff,stroke:#d946ef,stroke-width:2px,color:#86198f;

    START(["備卡流程"]):::startEnd --> REQ["Step 1: 發送 0x19 請求"]:::action
    REQ --> WAIT_ACK["Step 2: 等待 ACK Data=0"]:::action
    WAIT_ACK --> WAIT_EVT["Step 3: 等待備卡成功事件 0x1A"]:::action
    
    WAIT_EVT --> SEND_QR["Step 4: 發送 QR 讀取指令 0x1D"]:::action
    SEND_QR --> WAIT_QR_DATA["Step 5: 接收 QR 資料並寫入 qr_data"]:::action
    
    WAIT_QR_DATA --> FINISH(["備卡流程完成<br>進入 IDLE"]):::startEnd
`;

const DISPENSE_FLOWCHART = `
graph TD
    classDef startEnd fill:#fdf4ff,stroke:#d946ef,stroke-width:2px,color:#701a75,rx:30,ry:30;
    classDef action fill:#ffffff,stroke:#e879f9,stroke-width:2px,color:#86198f;
    classDef decision fill:#fff1f2,stroke:#e11d48,stroke-width:2px,color:#be123c;
    classDef err fill:#faf5ff,stroke:#9333ea,stroke-width:2px,color:#581c87;

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



const CardDispenserFlow = () => {
    const [activeTab, setActiveTab] = useState<'refill' | 'dispense'>('refill');

    // Dynamic color classes based on activeTab
    const activeColorClasses = activeTab === 'refill'
        ? 'text-rose-700 border-rose-500 bg-rose-50 shadow-sm via-rose-400/20'
        : 'text-fuchsia-700 border-fuchsia-500 bg-fuchsia-50 shadow-sm via-fuchsia-400/20';

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-200 pb-6 relative">
                <div className="absolute left-0 bottom-0 w-1/3 h-[1px] bg-gradient-to-r from-rose-500 to-transparent" />
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                    <CreditCard className="w-8 h-8 text-rose-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-widest" style={{ fontFamily: 'var(--font-cyber)' }}>
                        CARD DISPENSER <span className="text-rose-600">FLOW</span>
                    </h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        讀卡/備卡機狀態機流程 (igs_card_dispenser.c)
                    </p>
                </div>
            </div>

            {/* Intro & UART Architecture Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* State Machine Overview */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
                        <Activity className="w-5 h-5 text-rose-500" />
                        狀態機架構
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        控制流程分為兩大階段：主機提出需求等待 <code>ACK (Command OK)</code>，接著等待讀卡機硬體作動完畢後主動發出的 <code>EVENT (Action Done)</code>。這種交握設計確保了非同步硬體通訊的穩定性。
                    </p>
                </div>

                {/* UART Buffer Architecture */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
                        <ShieldAlert className="w-5 h-5 text-amber-500" />
                        雙緩衝與校驗機制
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-3">
                        中斷副程式利用 <code>tmp_RxBuffer</code> 接收變動長度封包。只有在校驗碼 (XOR) 與長度皆正確，且主迴圈已處理完上一包 <code>(RxComplete == 0)</code> 時，資料才會被搬入 <code>RxBuffer</code> 供狀態機解析，防止資料被覆蓋寫壞。
                    </p>
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                        <span className="px-2 py-1 bg-slate-100 rounded text-slate-600 border border-slate-200">HEAD 0x24</span>
                        <span className="px-2 py-1 bg-amber-50 rounded text-amber-700 border border-amber-200">LENGTH</span>
                        <span className="px-2 py-1 bg-rose-50 rounded text-rose-700 border border-rose-200">ID</span>
                        <span className="px-2 py-1 bg-cyan-50 rounded text-cyan-700 border border-cyan-200">CMD</span>
                        <span className="px-2 py-1 bg-emerald-50 rounded text-emerald-700 border border-emerald-200">DATA...</span>
                        <span className="px-2 py-1 bg-purple-50 rounded text-purple-700 border border-purple-200">XOR CHK</span>
                        <span className="px-2 py-1 bg-slate-100 rounded text-slate-600 border border-slate-200">END</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex justify-center gap-4 pt-4">
                <button
                    onClick={() => setActiveTab('refill')}
                    className={cn(
                        "relative px-8 py-4 rounded-xl font-bold tracking-widest transition-all duration-300 border overflow-hidden group shadow-sm",
                        activeTab === 'refill'
                            ? activeColorClasses
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    )}
                >
                    {activeTab === 'refill' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-400/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    )}
                    備卡流程 (REFILL + QR READ)
                </button>
                <button
                    onClick={() => setActiveTab('dispense')}
                    className={cn(
                        "relative px-8 py-4 rounded-xl font-bold tracking-widest transition-all duration-300 border overflow-hidden group shadow-sm",
                        activeTab === 'dispense'
                            ? activeColorClasses
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    )}
                >
                    {activeTab === 'dispense' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-fuchsia-400/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    )}
                    出卡流程 (DISPENSE & TRANSFER)
                </button>
            </div>

            {/* Flowchart Box */}
            <div className={cn(
                "bg-white border rounded-2xl p-6 transition-colors duration-500 mt-8 shadow-sm",
                activeTab === 'refill' ? "border-rose-200" : "border-fuchsia-200"
            )}>
                <h3 className={cn("text-lg font-bold mb-4 flex items-center gap-2", activeTab === 'refill' ? 'text-rose-600' : 'text-fuchsia-600')}>
                    <Activity className="w-5 h-5" /> 演算邏輯總覽 (Mermaid 流程圖)
                </h3>
                <MermaidFlowchart
                    chart={activeTab === 'refill' ? REFILL_FLOWCHART : DISPENSE_FLOWCHART}
                    className="bg-transparent border-none shadow-none"
                />
            </div>

        </div>
    );
};

export default CardDispenserFlow;
