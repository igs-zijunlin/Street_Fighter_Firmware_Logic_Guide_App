import React from 'react';
import { Power, CheckCircle2, CircleDashed, ArrowRight, AlertTriangle, RotateCcw, Search, QrCode, Crosshair, Cpu, Activity, CornerDownLeft } from 'lucide-react';
import { MermaidFlowchart } from '../components/ui/MermaidFlowchart';
import { cn } from '../lib/utils';

const INIT_FLOWCHART = `
graph TD
    classDef startEnd fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#cbd5e1,rx:30,ry:30;
    classDef action fill:#1e293b,stroke:#0ea5e9,stroke-width:2px,color:#f8fafc;
    classDef decision fill:#0f172a,stroke:#f43f5e,stroke-width:2px,color:#cbd5e1;

    START(["Start 初始化"]):::startEnd --> CLOSE_GATES["第 0 步: 強制關閉閘門與電磁鐵"]:::action
    CLOSE_GATES --> WAIT_IO["第 1 步: 等待 IO 穩定"]:::action
    WAIT_IO --> FIND_HOME["第 2 步: 尋找原點 (歸零)"]:::action
    FIND_HOME --> MEASURE_ROUND["第 3 步: 旋轉測量 QEI<br>計算單圈脈衝總數"]:::action
    
    MEASURE_ROUND --> LOOP_START(("進入卡盒掃描迴圈")):::startEnd
    
    LOOP_START --> CHK_CARD["第 4 步: 卡盒偵測<br>判定 Sensor 狀態"]:::action
    
    CHK_CARD --> HAS_CARD{"Sensor 有卡?"}:::decision
    HAS_CARD -- Yes --> SEND_QR["觸發 QR Code 掃描"]:::action
    SEND_QR --> WAIT_QR["第 5 步: 等待掃描結果<br>寫入 card_list"]:::action
    HAS_CARD -- No --> MOVE_NEXT
    
    WAIT_QR --> MOVE_NEXT["第 6 步: QEI 定位移動<br>移動到下一個卡盒"]:::action
    
    MOVE_NEXT --> CHK_LOOP{"10 個卡盒<br>皆已掃描?"}:::decision
    
    CHK_LOOP -- "No (繼續下一個)" --> LOOP_START
    CHK_LOOP -- "Yes (掃描完畢)" --> FINISH(["第 7 步: 初始化完成<br>is_initialized = 1"]):::startEnd
`;

interface InitStep {
    id: number;
    stepName: string;
    title: string;
    desc: string;
    icon: React.ElementType;
    details: string[];
    isLooping?: boolean;
}

const INIT_STEPS: InitStep[] = [
    {
        id: 0,
        stepName: 'INIT_STEP_CLOSE_GATES',
        title: '強制關閉閘門與電磁鐵',
        desc: '確保轉盤旋轉時卡片不會掉落',
        icon: Power,
        details: [
            '強制重置兩個閘門狀態機至關門流程',
            '強制控制排廢卡的電磁吸鐵到關門位置',
            '等待閘門關閉的確認訊號 (Sensor ACK)',
            '超時檢查以防止硬體卡死'
        ]
    },
    {
        id: 1,
        stepName: 'INIT_STEP_1_WAIT_IO_STABLE',
        title: '等待 IO 穩定',
        desc: '確認所有硬體電氣訊號穩定',
        icon: CircleDashed,
        details: [
            '靜置等待 1000 毫秒',
            '準備控制馬達正轉 (Forward)'
        ]
    },
    {
        id: 2,
        stepName: 'INIT_STEP_2_FIND_HOME',
        title: '尋找原點 (歸零)',
        desc: '馬達運轉尋找轉盤原點光眼',
        icon: Search,
        details: [
            '判定轉盤原點訊號 (sig_zero == 1)',
            '觸發後急停馬達 (STOP)',
            '等待 1 秒讓轉盤完全靜止'
        ]
    },
    {
        id: 3,
        stepName: 'INIT_STEP_3_MEASURE_ROUND',
        title: '旋轉測量 QEI',
        desc: '測量單圈編碼器脈衝數',
        icon: RotateCcw,
        details: [
            '將 QEI 參數歸 0，重新正轉',
            '尋找下一次原點訊號 Rising Edge',
            '計算單圈的脈衝總數 (qei_one_round_counts)',
            '應用間隙誤差修正 (Gap Correction)'
        ]
    },
    {
        id: 4,
        stepName: 'INIT_STEP_4_CHECK_CARD_TRIGGER',
        title: '卡盒偵測與 QR 觸發',
        desc: '確認卡片是否存在並讀取條碼',
        icon: QrCode,
        details: [
            '透過 Sensor 偵測當前卡盒有無卡片 (sig_card_det)',
            '如果有卡，觸發 QR Code 掃描指令',
            '沒有卡則直接進入移動步驟'
        ]
    },
    {
        id: 5,
        stepName: 'INIT_STEP_5_WAIT_QR_RESULT',
        title: '等待掃描結果',
        desc: '處理 QR 讀取資料',
        icon: CheckCircle2,
        details: [
            '成功: 將資料存入卡盒結構 (card_list)',
            '失敗/超時: 紀錄錯誤代碼，填入 0xFF',
            '不論成功失敗，皆繼續往下一步移動'
        ]
    },
    {
        id: 6,
        stepName: 'INIT_STEP_6_MOVE_NEXT',
        title: 'QEI 定位移動',
        desc: '精確移動到下一個卡盒',
        icon: Crosshair,
        isLooping: true,
        details: [
            '依據單圈總脈衝計算下一個格位 (Grid)',
            '監控 QEI 定位，計算最短距離 (diff)',
            '到達容許誤差範圍時急停'
        ]
    },
    {
        id: 7,
        stepName: 'INIT_STEP_7_COMPLETE',
        title: '初始化完成',
        desc: '系統準備就緒',
        icon: Cpu,
        details: [
            '10 個卡盒全部檢查與定位完畢',
            '標記 is_initialized = 1'
        ]
    }
];

const Initialization = () => {
    return (
        <div className="p-6 max-w-5xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-6 relative">
                <div className="absolute left-0 bottom-0 w-1/3 h-[1px] bg-gradient-to-r from-cyan-500 to-transparent" />
                <div className="p-3 bg-cyan-950/50 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                    <Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-widest" style={{ fontFamily: 'var(--font-cyber)' }}>
                        INITIALIZATION <span className="text-cyan-400">FLOW</span>
                    </h1>
                    <p className="text-slate-400 mt-1 flex items-center gap-2">
                        出卡模組啟動狀態機流程 (igs_hadouken_init.c)
                    </p>
                </div>
            </div>

            {/* Flowchart Section */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5" /> 演算邏輯總覽 (Mermaid 流程圖)
                </h3>
                <MermaidFlowchart chart={INIT_FLOWCHART} />
            </div>

            {/* Timeline Flow */}
            <div className="relative pl-8 md:pl-0 mt-8">
                {/* 背景中央貫穿線 (Desktop) / 左側貫穿線 (Mobile) */}
                <div className="absolute left-[31px] md:left-1/2 top-4 bottom-4 w-1 bg-slate-800 -translate-x-1/2 rounded-full shadow-[0_0_10px_rgba(15,23,42,0.8)]" />
                {/* 發光流動特效線段 */}
                <div className="absolute left-[31px] md:left-1/2 top-4 h-[30%] w-1 bg-gradient-to-b from-transparent via-cyan-400 to-transparent -translate-x-1/2 rounded-full blur-[2px] animate-pulse" />

                <div className="space-y-16">
                    {INIT_STEPS.map((step, idx) => {
                        const isLeft = idx % 2 === 0;

                        return (
                            <div key={step.id} className="relative flex flex-col md:flex-row items-start md:items-center w-full group">

                                {/* 節點中心 Icon */}
                                <div className="absolute left-0 md:left-1/2 top-6 md:top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 
                                bg-slate-900 border-4 border-slate-800 rounded-full p-4 
                                group-hover:border-cyan-500 transition-colors duration-500 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                                    <step.icon className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all duration-300" />
                                </div>

                                {/* 文字卡片區域 */}
                                <div className={cn(
                                    "w-full md:w-1/2 pl-16 md:px-12 relative flex",
                                    isLeft ? "md:justify-end" : "md:ml-auto md:justify-start"
                                )}>

                                    {/* 連接線 (Desktop) */}
                                    <div className={cn(
                                        "hidden md:block absolute top-1/2 -translate-y-1/2 w-12 h-1 bg-slate-800 group-hover:bg-cyan-900 transition-colors duration-500",
                                        isLeft ? "right-0" : "left-0"
                                    )} />

                                    <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] group-hover:-translate-y-1">

                                        {/* 卡片高光裝飾 */}
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent group-hover:via-cyan-400 opacity-30 transition-all duration-500" />

                                        {/* 標題 */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="text-cyan-500/80 font-mono text-xs mb-1 font-semibold flex items-center gap-2">
                                                    STEP 0{step.id}
                                                    {idx < INIT_STEPS.length - 1 && <ArrowRight className="w-3 h-3" />}
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
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-cyan-500 mt-1.5 shrink-0 transition-colors" />
                                                        <span className="leading-relaxed">{detail}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* 提示區塊 (Security/Logic highlights) */}
                                        {step.id === 0 && (
                                            <div className="mt-4 flex items-start gap-2 text-xs text-amber-500/90 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                                <span>安全性檢查：確保機構並未卡死才能繼續進行。</span>
                                            </div>
                                        )}

                                        {step.id === 3 && (
                                            <div className="mt-4 flex items-start gap-2 text-xs text-cyan-400/90 bg-cyan-500/10 p-3 rounded-lg border border-cyan-500/20">
                                                <Crosshair className="w-4 h-4 shrink-0" />
                                                <span>精準定位核心：捨棄實體光眼分割，利用脈衝差值計算。</span>
                                            </div>
                                        )}

                                        {/* 迴圈標示 */}
                                        {step.isLooping && (
                                            <div className="mt-6 flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5">
                                                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold tracking-wide">
                                                    <RotateCcw className="w-4 h-4" />
                                                    掃描計數 &lt; 10
                                                </div>
                                                <div className="text-xs text-emerald-500/70 mt-1 flex items-center gap-1">
                                                    <CornerDownLeft className="w-3 h-3" /> 返回 <strong>Step 4</strong> 繼續掃描下一個卡盒
                                                </div>
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

export default Initialization;
