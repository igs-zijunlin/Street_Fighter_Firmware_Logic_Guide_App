import { useState } from 'react';
import { MapPin, Target, ArrowDownToLine, Layers, Trash2 } from 'lucide-react';
import { MermaidFlowchart } from '../components/ui/MermaidFlowchart';
import { cn } from '../lib/utils';

const DISPENSE_FLOWCHART = `
graph TD
    classDef startEnd fill:#f0f9ff,stroke:#0ea5e9,stroke-width:2px,color:#0f172a,rx:30,ry:30;
    classDef action fill:#ffffff,stroke:#38bdf8,stroke-width:2px,color:#0369a1;
    classDef decision fill:#fff1f2,stroke:#e11d48,stroke-width:2px,color:#881337;
    classDef err fill:#fef2f2,stroke:#ef4444,stroke-width:2px,color:#7f1d1d;

    START(["出卡定位模式"]):::startEnd --> READ_GATES["Step 0~1: 安全互鎖檢查<br>讀取所有電磁鐵 Sensor"]:::action
    READ_GATES --> CHK_GATES{"所有閘門<br>皆已關閉?"}:::decision
    CHK_GATES -- Yes --> CALC["Step 2: 計算目標位置<br>+90度偏移計算"]:::action
    CHK_GATES -- No --> FORCE_CLOSE["強制關閉閘門<br>等待作動 600ms"]:::action
    FORCE_CLOSE --> RECHK_GATES{"超時後確認<br>是否關閉?"}:::decision
    RECHK_GATES -- Yes --> CALC
    RECHK_GATES -- No --> ERR_GATE(["報錯: GATE_NOT_CLOSED<br>停機至 Standby"]):::err
    
    CALC --> IS_ARRIVED{"已在目標<br>位置?"}:::decision
    IS_ARRIVED -- Yes --> FINISH(["目標已達成, 待機"]):::startEnd
    IS_ARRIVED -- No --> MOVE["啟動馬達正轉"]:::action
    
    MOVE --> MONITOR["Step 3: QEI 定位監控"]:::action
    MONITOR --> CHK_ERR{"外部錯誤或<br>超時?"}:::decision
    CHK_ERR -- Yes --> ERR(["停機報錯"]):::decision
    CHK_ERR -- No --> CHK_POS{"到達目標?"}:::decision
    CHK_POS -- No --> MONITOR
    CHK_POS -- Yes --> FINISH2(["急停馬達, 完成出卡定位"]):::startEnd
`;

const REFILL_FLOWCHART = `
graph TD
    classDef startEnd fill:#f0fdf4,stroke:#10b981,stroke-width:2px,color:#064e3b,rx:30,ry:30;
    classDef action fill:#ffffff,stroke:#34d399,stroke-width:2px,color:#047857;
    classDef decision fill:#fff1f2,stroke:#e11d48,stroke-width:2px,color:#881337;
    classDef err fill:#fef2f2,stroke:#ef4444,stroke-width:2px,color:#7f1d1d;

    START(["補卡定位模式"]):::startEnd --> READ_GATES["Step 0~1: 安全互鎖檢查<br>讀取所有電磁鐵 Sensor"]:::action
    READ_GATES --> CHK_GATES{"所有閘門<br>皆已關閉?"}:::decision
    CHK_GATES -- Yes --> CALC["Step 2: 計算目標位置<br>0度偏移計算"]:::action
    CHK_GATES -- No --> FORCE_CLOSE["強制關閉閘門<br>等待作動 600ms"]:::action
    FORCE_CLOSE --> RECHK_GATES{"超時後確認<br>是否關閉?"}:::decision
    RECHK_GATES -- Yes --> CALC
    RECHK_GATES -- No --> ERR_GATE(["報錯: GATE_NOT_CLOSED<br>停機至 Standby"]):::err
    
    CALC --> IS_ARRIVED{"已在目標<br>位置?"}:::decision
    IS_ARRIVED -- Yes --> FINISH(["目標已達成, 待機"]):::startEnd
    IS_ARRIVED -- No --> MOVE["啟動馬達正轉"]:::action
    
    MOVE --> MONITOR["Step 3: QEI 定位監控"]:::action
    MONITOR --> CHK_ERR{"外部錯誤或<br>超時?"}:::decision
    CHK_ERR -- Yes --> ERR(["停機報錯"]):::decision
    CHK_ERR -- No --> CHK_POS{"到達目標?"}:::decision
    CHK_POS -- No --> MONITOR
    CHK_POS -- Yes --> FINISH2(["急停馬達, 完成補卡定位"]):::startEnd
`;

const REJECT_FLOWCHART = `
graph TD
    classDef startEnd fill:#fff7ed,stroke:#f97316,stroke-width:2px,color:#7c2d12,rx:30,ry:30;
    classDef action fill:#ffffff,stroke:#fb923c,stroke-width:2px,color:#9a3412;
    classDef decision fill:#fff1f2,stroke:#e11d48,stroke-width:2px,color:#881337;
    classDef err fill:#fef2f2,stroke:#ef4444,stroke-width:2px,color:#7f1d1d;

    START(["排廢卡異常模式"]):::startEnd --> READ_GATES["Step 0~1: 安全互鎖檢查<br>讀取所有電磁鐵 Sensor"]:::action
    READ_GATES --> CHK_GATES{"所有閘門<br>皆已關閉?"}:::decision
    CHK_GATES -- Yes --> CALC["Step 2: 計算排廢目標<br>+180度偏移計算"]:::action
    CHK_GATES -- No --> FORCE_CLOSE["強制關閉閘門<br>等待作動 600ms"]:::action
    FORCE_CLOSE --> RECHK_GATES{"超時後確認<br>是否關閉?"}:::decision
    RECHK_GATES -- Yes --> CALC
    RECHK_GATES -- No --> ERR_GATE(["報錯: GATE_NOT_CLOSED<br>停機至 Standby"]):::err
    
    CALC --> IS_ARRIVED{"已在目標<br>位置?"}:::decision
    IS_ARRIVED -- No --> MOVE["啟動馬達正轉"]:::action
    MOVE --> MONITOR["QEI 定位監控直到抵達"]:::action
    
    IS_ARRIVED -- Yes --> DELAY
    MONITOR --> DELAY["Step 3~4: 等待 3000ms 延遲<br>機械穩定緩衝"]:::action
    
    DELAY --> OPEN_GATE["Step 5~7: 開啟廢卡回收門<br>監控掉卡"]:::action
    OPEN_GATE --> CHK_DROP{"超時 2s<br>未掉卡?"}:::decision
    CHK_DROP -- Yes --> ERR(["標註廢卡掉落異常"]):::decision
    CHK_DROP -- "No (成功掉卡)" --> CLOSE_GATE
    ERR --> CLOSE_GATE["Step 8~9: 強制關閉排廢門"]:::action
    
    CLOSE_GATE --> FINISH(["排廢流程成功<br>回到 Standby"]):::startEnd
`;

// 模式資料定義
const MODE_DATA = {
    dispense: {
        title: '出卡定位模式',
        desc: 'HADOUKEN_MODE_POS_DISPENSE',
        color: 'cyan',
        icon: ArrowDownToLine,
    },
    refill: {
        title: '補卡定位模式',
        desc: 'HADOUKEN_MODE_POS_REFILL',
        color: 'emerald',
        icon: Layers,
    },
    reject: {
        title: '排廢卡異常模式',
        desc: 'HADOUKEN_MODE_REJECT_PROCESS',
        color: 'orange',
        icon: Trash2,
    }
};

const PositioningFlow = () => {
    const [activeMode, setActiveMode] = useState<keyof typeof MODE_DATA>('dispense');

    const modeKeys: (keyof typeof MODE_DATA)[] = ['dispense', 'refill', 'reject'];

    const currentData = MODE_DATA[activeMode];
    const colorMap = {
        cyan: 'text-cyan-700 border-cyan-500 bg-cyan-50 shadow-sm via-cyan-400/20',
        emerald: 'text-emerald-700 border-emerald-500 bg-emerald-50 shadow-sm via-emerald-400/20',
        orange: 'text-orange-700 border-orange-500 bg-orange-50 shadow-sm via-orange-400/20',
    };
    const activeColorClass = colorMap[currentData.color as keyof typeof colorMap];


    return (
        <div className="p-6 max-w-6xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-200 pb-6 relative">
                <div className="absolute left-0 bottom-0 w-1/3 h-[1px] bg-gradient-to-r from-blue-500 to-transparent" />
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <MapPin className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-widest" style={{ fontFamily: 'var(--font-cyber)' }}>
                        POSITIONING <span className="text-blue-600">MODULES</span>
                    </h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        主程式三大定位流程 (igs_hadouken_main.c - IGS_Hadouken_Main_Process)
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap justify-center gap-4">
                {modeKeys.map(key => {
                    const m = MODE_DATA[key];
                    const isActive = activeMode === key;

                    return (
                        <button
                            key={key}
                            onClick={() => setActiveMode(key)}
                            className={cn(
                                "relative px-6 py-4 rounded-xl font-bold tracking-widest transition-all duration-300 border overflow-hidden group flex items-center gap-3",
                                isActive
                                    ? activeColorClass
                                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 shadow-sm"
                            )}
                        >
                            {isActive && (
                                <div className={cn(
                                    "absolute inset-0 bg-gradient-to-r from-transparent to-transparent -translate-x-full animate-[shimmer_2s_infinite]",
                                    `via-${m.color}-500/10`
                                )} />
                            )}
                            <m.icon className="w-5 h-5" />
                            <div className="text-left">
                                <div className={cn("text-sm", isActive ? "" : "")}>{m.title}</div>
                                <div className={cn("text-[10px] font-mono", isActive ? "opacity-80" : "opacity-0 group-hover:opacity-50 transition-opacity")}>{m.desc}</div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Flowchart Box */}
            <div className={cn(
                "bg-white border rounded-2xl p-6 transition-colors duration-500 mt-8 shadow-sm",
                `border-${currentData.color}-200`
            )}>
                <h3 className={cn("text-lg font-bold mb-4 flex items-center gap-2", `text-${currentData.color}-600`)}>
                    <Target className="w-5 h-5" /> 演算邏輯總覽 (Mermaid 流程圖)
                </h3>
                <MermaidFlowchart
                    chart={activeMode === 'dispense' ? DISPENSE_FLOWCHART : activeMode === 'refill' ? REFILL_FLOWCHART : REJECT_FLOWCHART}
                    className="bg-transparent border-none shadow-none"
                />
            </div>

        </div>
    );
};

export default PositioningFlow;
