import { Disc, QrCode, Zap, Network } from 'lucide-react';

const DetailCard = ({ title, icon: Icon, color, children }: { title: string, icon: any, color: string, children: React.ReactNode }) => (
    <div className={`p-6 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all`}>
        <div className="flex items-center gap-4 mb-4 border-b border-slate-100 pb-4">
            <div className={`w-12 h-12 rounded-lg bg-${color}-50 flex items-center justify-center shrink-0`}>
                <Icon className={`w-6 h-6 text-${color}-600`} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 tracking-wide">{title}</h3>
        </div>
        <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
            {children}
        </div>
    </div>
);

const Dashboard = () => {
    return (
        <div className="space-y-8 pb-12">
            <div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-600 font-cyber">
                    系統概覽與核心模組
                </h2>
                <p className="text-slate-500 mt-2 font-medium">Street Fighter-6_PK (波動拳 IO) - 基於 STM32F215xx 的硬體控制邏輯</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DetailCard title="QEI 絕對定位系統 (Turntable Positioning)" icon={Disc} color="emerald">
                    <p>
                        為解決機構傳感器安裝帶來的長期累積誤差，轉盤定位邏輯已全面改為依賴 <strong>QEI 絕對數值</strong> 進行高精度控制。
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li><strong>硬體規格</strong>：使用 4096 PPR 編碼器（軟體四倍頻）。</li>
                        <li><strong>動態零點校正</strong>：每次轉盤經過 <code>Refill Sensor</code>（補卡原點光眼）時，系統會自動重置 <code>home_offset</code>，完美消除機械累積誤差。</li>
                        <li><strong>開機自檢測量</strong>：每次開機執行 <code>MEASURE_ROUND</code> 步驟，動態測量並記錄該機台實際的單圈總脈衝數。</li>
                        <li><strong>幾何目標計算</strong>：基於總脈衝數精確切分 10 個卡盒位置，並加入出卡口偏移（+18度/半格）與排廢口偏移（+180度/對角）。</li>
                    </ul>
                </DetailCard>

                <DetailCard title="出卡、備卡與 QR 讀取模組 (Card Dispenser & Scanner)" icon={QrCode} color="blue">
                    <p>
                        負責控制外部的序列介面出卡機與備卡機系統，並深度整合了 QR Code 條碼讀取功能，達成卡片的精確追蹤與分配。
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li><strong>轉盤槽位讀取 (Slot 1-10)</strong>：針對轉盤上的 10 個實體卡盒進行序列讀取操作。</li>
                        <li><strong>擴充通訊槽位 (Slot 14/15)</strong>：新增 <code>Tx_Process_QR_Data</code> 協定擴充，支援直接強制讀取兩台外部備卡機（Reader 0 與 Reader 1）的資料狀態。</li>
                        <li><strong>狀態與庫存管理</strong>：透過通訊協定協調發卡與補卡流程的安全性驗證。</li>
                    </ul>
                </DetailCard>

                <DetailCard title="LED 跑馬燈特效驅動 (Marquee Lighting)" icon={Zap} color="amber">
                    <p>
                        提供低延遲、高刷新率的燈條特效渲染，用於機台遊戲氛圍的營造。
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li><strong>雙重晶片支援</strong>：同時相容並解析 WS2811 (RGB) 與 WS2812 (GRB) 兩種常見的色彩排列時序。</li>
                        <li><strong>PWM + DMA 控制機制</strong>：透過硬體 DMA 緩解 CPU 負載。並針對 APB1 (84MHz) 與 APB2 (168MHz) 不同 Timer 總線的頻率差異，實作了自動化的 PWM Pulse 比例換算 (60/30 與 120/60)。</li>
                        <li><strong>記憶體最佳化</strong>：實作多通道共享 Buffer，將 RAM 佔用大幅降低；並加入 <code>updated flag</code> 更新旗標機制解決資料競爭造成的閃爍問題。</li>
                    </ul>
                </DetailCard>

                <DetailCard title="序列通訊與系統防護 (Serial Protocol & Watchdog)" icon={Network} color="indigo">
                    <p>
                        維護與遊戲主機端穩定、即時的自定義雙向資料流。
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li><strong>自定義 IGS 協定</strong>：處理來自遊戲板的主控指令，執行複雜的非同步轉圈、開門、讀碼組合任務，並回報動作完成狀態。</li>
                        <li><strong>安全機制互鎖</strong>：在任何致動器（馬達）運作前，邏輯強制確認所有電磁鐵/閘門皆已關閉或處於安全狀態。</li>
                        <li><strong>看門狗防護 (IWDG)</strong>：結合心跳燈 (Heart_led)，若系統 MCU 發生無預警卡死，硬體將自動重啟以維持無人機台的可用性。</li>
                    </ul>
                </DetailCard>
            </div>
        </div>
    );
};

export default Dashboard;
