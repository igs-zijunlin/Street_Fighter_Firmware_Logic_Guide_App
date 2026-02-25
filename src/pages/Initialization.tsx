import { Power, AlertTriangle, Activity } from 'lucide-react';
import { MermaidFlowchart } from '../components/ui/MermaidFlowchart';

const INIT_FLOWCHART = `
graph TD
    classDef startEnd fill:#f0f9ff,stroke:#0ea5e9,stroke-width:2px,color:#0f172a,rx:30,ry:30;
    classDef action fill:#ffffff,stroke:#38bdf8,stroke-width:2px,color:#0369a1;
    classDef decision fill:#fff1f2,stroke:#e11d48,stroke-width:2px,color:#881337;
    classDef err fill:#fef2f2,stroke:#ef4444,stroke-width:2px,color:#7f1d1d;

    START(["Start 初始化"]):::startEnd --> READ_GATES["第 0 步: 安全互鎖檢查<br>讀取所有電磁鐵 Sensor"]:::action
    READ_GATES --> CHK_GATES{"所有閘門<br>皆已關閉?"}:::decision
    CHK_GATES -- Yes --> WAIT_IO["第 1 步: 等待 IO 穩定"]:::action
    CHK_GATES -- No --> FORCE_CLOSE["強制關閉並等待 600ms"]:::action
    FORCE_CLOSE --> RECHK_GATES{"再次確認<br>是否關閉?"}:::decision
    RECHK_GATES -- Yes --> WAIT_IO
    RECHK_GATES -- No --> ERR_GATE(["報錯 HADOUKEN_ERR_GATE_NOT_CLOSED<br>停機至 Standby"]):::err

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

const Initialization = () => {
    return (
        <div className="p-6 max-w-5xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-200 pb-6 relative">
                <div className="absolute left-0 bottom-0 w-1/3 h-[1px] bg-gradient-to-r from-cyan-500 to-transparent" />
                <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200">
                    <Power className="w-8 h-8 text-cyan-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-widest" style={{ fontFamily: 'var(--font-cyber)' }}>
                        INITIALIZATION <span className="text-cyan-600">FLOW</span>
                    </h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        開機初始化程序 (igs_hadouken_init.c)
                    </p>
                </div>
            </div>

            {/* Intro Box */}
            <div className="bg-white border flex items-start gap-4 border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="p-3 bg-amber-50 rounded-lg shrink-0">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">安全自測與尋找原點</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        系統通電後必須先確定硬體處於安全狀態 (閘門全關)，並旋轉馬達尋找「原點 (Home)」。由於每一台機台可能存在微小公差，系統會在繞第二圈時，重新測量並記錄一整圈的 <strong>QEI 脈衝總數</strong> (`qei_one_round_counts`)，以作為後續精準定位的依據。此過程同時會對 10 個卡盒口進行空盒掃描。
                    </p>
                </div>
            </div>

            {/* Flowchart Section */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-cyan-600 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5" /> 演算邏輯總覽 (Mermaid 流程圖)
                </h3>
                <MermaidFlowchart chart={INIT_FLOWCHART} />
            </div>
        </div>
    );
};

export default Initialization;
