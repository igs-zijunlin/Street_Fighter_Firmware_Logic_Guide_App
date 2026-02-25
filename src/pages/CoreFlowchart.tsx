import { useState } from 'react';
import { GitMerge, Code2, TerminalSquare, MousePointerClick } from 'lucide-react';
import { MermaidFlowchart } from '../components/ui/MermaidFlowchart';
import { cn } from '../lib/utils';

// Mermaid 語法字串定義
const FLOWCHART_EXAMPLES = {
    gateInterlock: `
graph TD
    classDef startEnd fill:#f0f9ff,stroke:#0ea5e9,stroke-width:2px,color:#0f172a,rx:30,ry:30;
    classDef action fill:#ffffff,stroke:#38bdf8,stroke-width:2px,color:#0369a1;
    classDef decision fill:#fff1f2,stroke:#f43f5e,stroke-width:2px,color:#be123c;
    classDef err fill:#fdf4ff,stroke:#d946ef,stroke-width:2px,color:#86198f;

    START(["Start 定位流程"]):::startEnd --> A["Step 0: 安全互鎖檢查<br>讀取所有閘門感測器"]:::action
    A --> B{"閘門皆為<br>關閉狀態?"}:::decision
    
    B -- "Yes (安全)" --> C["Step 2: 進入目標位置定位算法"]:::action
    B -- "No (未關)" --> D["強制送出關門控制指令<br>1P / 2P / 排廢閘門"]:::action
    
    D --> E["等待 600ms"]:::action
    E --> F{"閘門是否<br>成功關閉?"}:::decision
    
    F -- "Yes (成功補救)" --> C
    F -- "No (超時未關)" --> G["拋出錯誤<br>HADOUKEN_ERR_GATE_NOT_CLOSED"]:::err
    
    C --> END_NODE(["進入馬達 QEI 旋轉監控流程"]):::startEnd
    G --> HALT(["停機並進入 Standby 等待硬體復歸"]):::startEnd
  `,
    uartReceive: `
flowchart TD
    classDef startEnd fill:#f0fdf4,stroke:#10b981,stroke-width:2px,color:#064e3b,rx:30,ry:30;
    classDef action fill:#ffffff,stroke:#34d399,stroke-width:2px,color:#047857;
    classDef decision fill:#fffbeb,stroke:#f59e0b,stroke-width:2px,color:#b45309;
    classDef var fill:#f8fafc,stroke:#94a3b8,stroke-width:2px,color:#334155;

    START(["UART Rx 中斷觸發<br>收進 1 byte RxData"]):::startEnd --> CHK_TIME{"距上次接收大於 5ms?"}:::decision
    CHK_TIME -- "Yes (超時)" --> RST_INDEX["重置 RxCount = 0<br>RxSize = 0"]:::action
    CHK_TIME -- "No (連續接收)" --> BUF_LIMIT{"RxCount >= 256?"}:::decision
    
    RST_INDEX --> BUF_LIMIT
    
    BUF_LIMIT -- "Yes (溢位防護)" --> RST_BUF["RxCount = 0"]:::action
    BUF_LIMIT -- No --> SAVE_DATA["寫入暫存區<br>tmp_RxBuffer[RxCount] = RxData"]:::action
    
    RST_BUF --> SAVE_DATA
    SAVE_DATA --> SWITCH_CNT{"RxCount<br>目前是多少?"}:::decision
    
    SWITCH_CNT -- "0 (檢查 Head)" --> CHK_HEAD{"RxData == 0x24?"}:::decision
    CHK_HEAD -- Yes --> SET_HD["RxCount++<br>RxSize = 3"]:::action
    CHK_HEAD -- No --> DROP(["丟棄, 繼續等待"]):::startEnd
    
    SWITCH_CNT -- "1 (接收 Length)" --> SET_LEN["RxSize = RxData + 3<br>RxCount++"]:::action
    
    SWITCH_CNT -- ">= 2 (接收資料)" --> SET_INC["RxCount++"]:::action
    
    SET_INC --> CHK_DONE{"RxCount >= RxSize?"}:::decision
    CHK_DONE -- "No (尚未收完)" --> WAIT_NODE(["等待下個字元"]):::startEnd
    CHK_DONE -- "Yes (接收達長度)" --> CHK_END{"尾碼(End)<br>是不是 0x24?"}:::decision
    
    CHK_END -- "No (封包錯誤)" --> CLEAN(["RxCount=0<br>丟棄整包"]):::startEnd
    CHK_END -- "Yes (封包正確)" --> CHK_MAIN{"主迴圈是否已處理完<br>RxComplete == 0?"}:::decision
    
    CHK_MAIN -- "No (來不及處理)" --> DROP2(["保護不被覆寫, 直接丟棄新包"]):::startEnd
    CHK_MAIN -- "Yes (可以寫入)" --> COPY_DATA["將 tmp_RxBuffer 複製到正版 RxBuffer<br>設定 RxComplete = 1通知主程式"]:::action
    
    COPY_DATA --> CLEAN
  `
};

const CoreFlowchart = () => {
    const [activeTab, setActiveTab] = useState<'gateInterlock' | 'uartReceive'>('gateInterlock');

    const currentChart = FLOWCHART_EXAMPLES[activeTab];

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-200 pb-6 relative">
                <div className="absolute left-0 bottom-0 w-1/3 h-[1px] bg-gradient-to-r from-teal-500 to-transparent" />
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
                    <GitMerge className="w-8 h-8 text-teal-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-widest" style={{ fontFamily: 'var(--font-cyber)' }}>
                        CORE ALGORITHM <span className="text-teal-600">FLOWCHART</span>
                    </h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        系統核心邏輯演算法 (Mermaid.js 視覺化渲染)
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 border border-teal-200 text-teal-700 ml-2">Standard Flowchart</span>
                    </p>
                </div>
            </div>

            {/* Intro Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
                    <Code2 className="w-5 h-5 text-teal-500" />
                    硬體邏輯與防護機制演算法
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                    我們使用標準演算法流程圖（Flowcharts）來解析系統底層最關乎穩定性與安全性的關鍵邏輯。透過方塊區分「處理動作 (Action)」，及菱形區分「If/Else 判斷條件 (Decision)」，幫助軟硬體工程師快速對齊邏輯觀念。<br />
                    您可以使用上方的按鈕來切換不同的核心邏輯圖。圖表皆由 <span className="text-teal-600 font-mono text-xs">Mermaid.js</span> 於前端即時渲染。
                </p>

                <div className="flex flex-wrap gap-4 text-xs font-mono">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-sky-400 bg-white" />
                        <span className="text-slate-600">起點 / 終點</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-4 border-2 border-emerald-400 bg-white" />
                        <span className="text-slate-600">執行動作 (Action)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rotate-45 border-2 border-rose-400 bg-white ml-2" />
                        <span className="text-slate-600 ml-1">條件判斷 (If/Else)</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-4 pt-4">
                <button
                    onClick={() => setActiveTab('gateInterlock')}
                    className={cn(
                        "relative px-6 py-3 rounded-xl font-bold tracking-widest transition-all duration-300 border overflow-hidden group flex items-center gap-2 shadow-sm",
                        activeTab === 'gateInterlock'
                            ? "text-sky-700 border-sky-500 bg-sky-50"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    )}
                >
                    {activeTab === 'gateInterlock' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-400/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    )}
                    <MousePointerClick className="w-4 h-4" />
                    安全閘門互鎖 (Interlock) 判斷
                </button>
                <button
                    onClick={() => setActiveTab('uartReceive')}
                    className={cn(
                        "relative px-6 py-3 rounded-xl font-bold tracking-widest transition-all duration-300 border overflow-hidden group flex items-center gap-2 shadow-sm",
                        activeTab === 'uartReceive'
                            ? "text-emerald-700 border-emerald-500 bg-emerald-50"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    )}
                >
                    {activeTab === 'uartReceive' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    )}
                    <TerminalSquare className="w-4 h-4" />
                    UART 封包接收演算法 (Interrupt)
                </button>
            </div>

            {/* Flowchart Render Area */}
            <div className="relative group mt-8">
                {/* 裝飾線 */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-teal-400/20 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />

                <div className="relative bg-white rounded-2xl p-2 border border-slate-200 shadow-xl overflow-hidden min-h-[500px]">
                    <div className="absolute top-4 left-4 flex gap-2 z-10 opacity-60">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    </div>

                    <div className="pt-8 w-full h-full flex items-center justify-center">
                        <MermaidFlowchart
                            chart={currentChart}
                            className="bg-transparent border-none shadow-none"
                        />
                    </div>
                </div>
            </div>

        </div>
    );
};

export default CoreFlowchart;
