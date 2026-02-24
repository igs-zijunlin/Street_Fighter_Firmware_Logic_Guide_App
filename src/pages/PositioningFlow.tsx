import { useState } from 'react';
import { ArrowRight, AlertTriangle, DoorOpen, MapPin, Target, Crosshair, ArrowDownToLine, Layers, Trash2, CircleDashed } from 'lucide-react';
import { MermaidFlowchart } from '../components/ui/MermaidFlowchart';
import { cn } from '../lib/utils';

const DISPENSE_FLOWCHART = `
graph TD
    classDef startEnd fill:#0f172a,stroke:#22d3ee,stroke-width:2px,color:#cbd5e1,rx:30,ry:30;
    classDef action fill:#1e293b,stroke:#0ea5e9,stroke-width:2px,color:#f8fafc;
    classDef decision fill:#0f172a,stroke:#f43f5e,stroke-width:2px,color:#cbd5e1;

    START(["出卡定位模式"]):::startEnd --> INTERLOCK["Step 0~1: 安全互鎖檢查<br>強制驗證所有閘門"]:::action
    INTERLOCK --> CALC["Step 2: 計算目標位置<br>+90度偏移計算"]:::action
    
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
    classDef startEnd fill:#0f172a,stroke:#34d399,stroke-width:2px,color:#cbd5e1,rx:30,ry:30;
    classDef action fill:#1e293b,stroke:#10b981,stroke-width:2px,color:#f8fafc;
    classDef decision fill:#0f172a,stroke:#f43f5e,stroke-width:2px,color:#cbd5e1;

    START(["補卡定位模式"]):::startEnd --> INTERLOCK["Step 0~1: 安全互鎖檢查<br>強制驗證所有閘門"]:::action
    INTERLOCK --> CALC["Step 2: 計算目標位置<br>0度偏移計算"]:::action
    
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
    classDef startEnd fill:#0f172a,stroke:#fb923c,stroke-width:2px,color:#cbd5e1,rx:30,ry:30;
    classDef action fill:#1e293b,stroke:#f97316,stroke-width:2px,color:#f8fafc;
    classDef decision fill:#0f172a,stroke:#f43f5e,stroke-width:2px,color:#cbd5e1;

    START(["排廢卡異常模式"]):::startEnd --> INTERLOCK["Step 0~1: 安全互鎖檢查<br>強制驗證所有閘門"]:::action
    INTERLOCK --> CALC["Step 2: 計算排廢目標<br>+180度偏移計算"]:::action
    
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

// 定義共用的安全檢查步驟 (因為出卡、補卡、排廢都會先走這個)
const INTERLOCK_STEP = {
    id: 0,
    stepName: 'SUB_STEP_0 ~ 1',
    title: '安全互鎖檢查 (Interlock)',
    desc: '馬達啟動前強制驗證閘門狀態',
    icon: AlertTriangle,
    details: [
        '讀取所有電磁鐵 (1P, 2P, 排廢) 的 Open/Close感測器信號',
        '若皆為安全關閉狀態，直接進入定位計算 (Step 2)',
        '若有任何閘門未關：送出強制關閉指令並等待 600ms 給予作動時間。若超時仍未關閉，則報出 HADOUKEN_ERR_GATE_NOT_CLOSED 並停機至 Standby。'
    ]
};

// 模式資料定義
const MODE_DATA = {
    dispense: {
        title: '出卡定位模式',
        desc: 'HADOUKEN_MODE_POS_DISPENSE',
        color: 'cyan',
        icon: ArrowDownToLine,
        steps: [
            INTERLOCK_STEP,
            {
                id: 1,
                stepName: 'SUB_STEP_2',
                title: '計算目標位置與啟動',
                desc: '+90度偏移計算 (Offset)',
                icon: Crosshair,
                details: [
                    '取得 QEI 總脈衝數的 1/4 (即 90度偏移量)',
                    '由 目標卡盒 (target_box_index) 配合 90度偏移 算出最終 QEI 目標值 target_pos',
                    '若已在此位置，直接送出 ack_pos_dispense 並待機',
                    '若未在位置，啟動馬達正轉並跳入監控。'
                ]
            },
            {
                id: 2,
                stepName: 'SUB_STEP_3',
                title: 'QEI 定位監控',
                desc: '等待馬達抵達指定目標位置',
                icon: Target,
                details: [
                    '優先確認這段期間內有無外部插入的錯誤',
                    '監測馬達旋轉超時限制',
                    '一旦到達目標 (target_pos)，急停馬達、送出 ACK，轉入 WAIT_DISPENSE_GATE 模式。'
                ]
            }
        ]
    },
    refill: {
        title: '補卡定位模式',
        desc: 'HADOUKEN_MODE_POS_REFILL',
        color: 'emerald',
        icon: Layers,
        steps: [
            INTERLOCK_STEP,
            {
                id: 1,
                stepName: 'SUB_STEP_2',
                title: '計算目標位置與啟動',
                desc: '無偏移量計算 (0度)',
                icon: Crosshair,
                details: [
                    '因補卡口與基準點一致，不需帶入偏移量 (offset = 0)',
                    '利用 目標卡盒算 出目標 QEI 位置 (target_pos)',
                    '已到位則待機；未到位啟動馬達並跳轉監控'
                ]
            },
            {
                id: 2,
                stepName: 'SUB_STEP_3',
                title: 'QEI 定位監控',
                desc: '等待馬達抵達指定目標位置',
                icon: Target,
                details: [
                    '安全與超時驗證',
                    '到達無偏移目標點，立刻停機、送出 ack_pos_refill 並轉入 WAIT_REFILL_GATE 模式。'
                ]
            }
        ]
    },
    reject: {
        title: '排廢卡異常模式',
        desc: 'HADOUKEN_MODE_REJECT_PROCESS',
        color: 'orange',
        icon: Trash2,
        steps: [
            INTERLOCK_STEP,
            {
                id: 1,
                stepName: 'SUB_STEP_2',
                title: '計算排廢目標位置',
                desc: '+180度偏移計算 (Offset)',
                icon: Crosshair,
                details: [
                    '取得 QEI 總脈衝數的 1/2 (即 180度偏移量) 配合卡盒索引計算',
                    '若到位則等 3 秒；若未到則啟動馬達進入監控'
                ]
            },
            {
                id: 2,
                stepName: 'SUB_STEP_3 ~ 4',
                title: 'QEI 定位與機械穩定緩衝',
                desc: '到位後等待 3 秒延遲',
                icon: CircleDashed,
                details: [
                    '到點後馬達急停',
                    '進入延遲步驟 (Step 4) 等待 3000ms，確保盒內卡片受慣性影響減小，避免卡卡。'
                ]
            },
            {
                id: 3,
                stepName: 'SUB_STEP_5 ~ 7',
                title: '開門與掉卡偵測',
                desc: '觸發排廢電磁鐵與監控掉落',
                icon: Target,
                details: [
                    '開啟廢卡回收電磁鐵 (RECTCLE_SOLENOID)',
                    '等待並確認開門成功 ACK (成功後主動清空該卡盒的 QR Data 保安)',
                    '偵測掉卡事件。若超過 2 秒未掉，標註錯誤。皆強制進入下一步驟。'
                ]
            },
            {
                id: 4,
                stepName: 'SUB_STEP_8 ~ 9',
                title: '強制關閉排廢門',
                desc: '確保機構歸位',
                icon: DoorOpen,
                details: [
                    '送出關閉排廢電磁鐵指令',
                    '確認收到關門 ACK 後，發送整體排廢流程成功 (ack_reject_success) 並回到 Standby。'
                ]
            }
        ]
    }
};

const PositioningFlow = () => {
    const [activeMode, setActiveMode] = useState<keyof typeof MODE_DATA>('dispense');

    const modeKeys: (keyof typeof MODE_DATA)[] = ['dispense', 'refill', 'reject'];

    const currentData = MODE_DATA[activeMode];
    const colorMap = {
        cyan: 'text-cyan-400 border-cyan-500 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.2)] via-cyan-500 hover:border-cyan-400 hover:text-cyan-200',
        emerald: 'text-emerald-400 border-emerald-500 bg-emerald-950/40 shadow-[0_0_20px_rgba(16,185,129,0.2)] via-emerald-500 hover:border-emerald-400 hover:text-emerald-200',
        orange: 'text-orange-400 border-orange-500 bg-orange-950/40 shadow-[0_0_20px_rgba(249,115,22,0.2)] via-orange-500 hover:border-orange-400 hover:text-orange-200',
    };
    const activeColorClass = colorMap[currentData.color as keyof typeof colorMap];


    return (
        <div className="p-6 max-w-6xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-6 relative">
                <div className="absolute left-0 bottom-0 w-1/3 h-[1px] bg-gradient-to-r from-blue-500 to-transparent" />
                <div className="p-3 bg-blue-950/50 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                    <MapPin className="w-8 h-8 text-blue-400 animate-pulse" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-widest" style={{ fontFamily: 'var(--font-cyber)' }}>
                        POSITIONING <span className="text-blue-400">MODULES</span>
                    </h1>
                    <p className="text-slate-400 mt-1 flex items-center gap-2">
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
                                    : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
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
                "bg-slate-900/50 border rounded-2xl p-6 backdrop-blur-sm transition-colors duration-500 mt-8",
                `border-${currentData.color}-900/50`
            )}>
                <h3 className={cn("text-lg font-bold mb-4 flex items-center gap-2", `text-${currentData.color}-400`)}>
                    <Target className="w-5 h-5" /> 演算邏輯總覽 (Mermaid 流程圖)
                </h3>
                <MermaidFlowchart
                    chart={activeMode === 'dispense' ? DISPENSE_FLOWCHART : activeMode === 'refill' ? REFILL_FLOWCHART : REJECT_FLOWCHART}
                    className="bg-[#0f172a]"
                />
            </div>

            {/* Timeline Flow */}
            <div className="relative pl-8 md:pl-0 mt-12">
                <div className={cn(
                    "absolute left-[31px] md:left-1/2 top-4 bottom-4 w-1 -translate-x-1/2 rounded-full shadow-[0_0_10px_rgba(15,23,42,0.8)] transition-colors duration-500",
                    `bg-${currentData.color}-950/50`
                )} />
                <div className={cn(
                    "absolute left-[31px] md:left-1/2 top-4 h-full w-1 bg-gradient-to-b from-transparent to-transparent -translate-x-1/2 rounded-full blur-[2px] transition-all duration-1000",
                    `via-${currentData.color}-400 shadow-[0_0_15px_rgba(0,0,0,0.5)]`
                )} />

                <div className="space-y-16">
                    {currentData.steps.map((step, idx) => {
                        const isLeft = idx % 2 === 0;

                        return (
                            <div key={idx} className="relative flex flex-col md:flex-row items-start md:items-center w-full group animate-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: `${idx * 150}ms` }}>

                                {/* 節點中心 Icon */}
                                <div className={cn(
                                    "absolute left-0 md:left-1/2 top-6 md:top-1/2 -translate-x-1/2 -translate-y-1/2 z-10",
                                    "bg-slate-900 border-4 border-slate-800 rounded-full p-4 transition-colors duration-500 shadow-[0_0_20px_rgba(0,0,0,0.5)]",
                                    `group-hover:border-${currentData.color}-500/80`
                                )}>
                                    <step.icon className={cn(
                                        "w-6 h-6 text-slate-400 transition-all duration-300",
                                        `group-hover:text-${currentData.color}-400`
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
                                        `group-hover:bg-${currentData.color}-900`
                                    )} />

                                    <div className={cn(
                                        "w-full max-w-lg bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 group-hover:-translate-y-1",
                                        `group-hover:border-${currentData.color}-500/50 group-hover:shadow-[0_0_25px_rgba(0,0,0,0.2)]`
                                    )}>

                                        {/* 卡片高光裝飾 */}
                                        <div className={cn(
                                            "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-30 transition-all duration-500",
                                            `group-hover:via-${currentData.color}-400`
                                        )} />

                                        {/* 標題 */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className={cn(
                                                    "font-mono text-xs mb-1 font-semibold flex items-center gap-2",
                                                    `text-${currentData.color}-500/80`
                                                )}>
                                                    STEP 0{step.id + 1}
                                                    {idx < currentData.steps.length - 1 && <ArrowRight className="w-3 h-3" />}
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
                                                            `group-hover:bg-${currentData.color}-500`
                                                        )} />
                                                        <span className="leading-relaxed">{detail}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Interlock 專屬警告 */}
                                        {step.id === 0 && (
                                            <div className="mt-4 flex items-start gap-2 text-xs text-amber-500/90 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                                <span>保護機制啟動。強制確認所有安全閘門關閉後，才會允許馬達旋轉以防卡機構損壞。</span>
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

export default PositioningFlow;
