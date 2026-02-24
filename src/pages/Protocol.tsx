
import { Database, ArrowRightLeft } from 'lucide-react';

const ProtocolField = ({ offset, name, desc, values }: { offset: string, name: string, desc: string, values?: string[] }) => (
    <tr className="hover:bg-slate-800/50 transition-colors border-b border-slate-800 last:border-0">
        <td className="p-4 font-mono text-cyan-400 border-r border-slate-800/50">{offset}</td>
        <td className="p-4 font-bold text-slate-200 border-r border-slate-800/50">{name}</td>
        <td className="p-4 text-slate-400">
            <div className="mb-1">{desc}</div>
            {values && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {values.map((v, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                            {v}
                        </span>
                    ))}
                </div>
            )}
        </td>
    </tr>
);

const Protocol = () => {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-cyber">
                    通訊協定參考
                </h2>
                <p className="text-slate-400 mt-2">
                    系統使用基於 UART 的 Polling 式協定 (IGS_Protocol)。
                    主機 (Master) 發送固定長度的封包，IO 板 (Slave) 回覆狀態。
                </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg shadow-cyan-900/10">
                <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-slate-200">RX 封包結構 (主機 → IO)</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-400 font-mono uppercase tracking-wider text-xs">
                        <tr>
                            <th className="p-4 w-24">Byte 偏移量</th>
                            <th className="p-4 w-48">欄位名稱</th>
                            <th className="p-4">描述與數值</th>
                        </tr>
                    </thead>
                    <tbody>
                        <ProtocolField
                            offset="0"
                            name="SOH"
                            desc="檔頭 (Start of Header)"
                            values={['0x01 (PROTOCOL_SOH_RX)']}
                        />
                        <ProtocolField
                            offset="1"
                            name="PollingNum"
                            desc="封包序號 (Sequence Number)"
                        />
                        <ProtocolField
                            offset="2"
                            name="Hadouken_SW"
                            desc="手動馬達開關 (僅在 DEMO 模式有效)"
                            values={['0: OFF', '1: ON']}
                        />
                        <ProtocolField
                            offset="26 (High)"
                            name="Hadouken_Mode"
                            desc="模式設定請求"
                            values={[
                                '1: 待機 (Standby)',
                                '2: 等待出卡 (Wait Dispense)',
                                '3: 等待補卡 (Wait Refill)',
                                '4: 出卡定位 (Pos Dispense)',
                                '5: 補卡定位 (Pos Refill)',
                                '6: 排廢程序 (Reject Process)',
                                '7: 演示模式 (Demo)'
                            ]}
                        />
                        <ProtocolField
                            offset="27"
                            name="Slot_Id"
                            desc="目標卡盒索引 (Slot Index)"
                            values={['1 - 10']}
                        />
                        <ProtocolField
                            offset="Var"
                            name="CardGate_Mode_1P"
                            desc="1P 通道閘門控制"
                            values={['0: 閒置 (Idle)', '1: 關閉 (Close)', '2: 開啟 (Open)']}
                        />
                        <ProtocolField
                            offset="Var"
                            name="CardGate_Mode_2P"
                            desc="2P 通道閘門控制"
                            values={['0: 閒置 (Idle)', '1: 關閉 (Close)', '2: 開啟 (Open)']}
                        />
                        <ProtocolField
                            offset="Last"
                            name="Checksum"
                            desc="總和檢查碼 (Sum)"
                        />
                    </tbody>
                </table>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg shadow-cyan-900/10">
                <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center gap-2">
                    <Database className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-slate-200">TX 封包結構 (IO → 主機)</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-400 font-mono uppercase tracking-wider text-xs">
                        <tr>
                            <th className="p-4 w-24">Byte 偏移量</th>
                            <th className="p-4 w-48">欄位名稱</th>
                            <th className="p-4">描述與數值</th>
                        </tr>
                    </thead>
                    <tbody>
                        <ProtocolField
                            offset="15"
                            name="ACK_Flags"
                            desc="操作完成旗標 (ACK Flags)"
                            values={[
                                'Bit: DispensePos_ACK (出卡定位完成)',
                                'Bit: RefillPos_ACK (補卡定位完成)',
                                'Bit: RejectPos_ACK (排廢完成)',
                                'Bit: CardReady_ACK (卡片準備就緒)',
                                'Bit: CardIssuance_Complete_ACK (出卡完成)'
                            ]}
                        />
                        <ProtocolField
                            offset="Var"
                            name="Hadouken_Status"
                            desc="當前運作模式"
                        />
                        <ProtocolField
                            offset="Var"
                            name="Hadouken_Err"
                            desc="錯誤代碼"
                            values={['0: 無錯誤 (None)', '1: 馬達超時 (Motor Timeout)', '2: 閘門錯誤 (Gate Error)', '...']}
                        />
                        <ProtocolField
                            offset="Var"
                            name="CardQR"
                            desc="讀取到的 QR Code 資料 (64-byte)"
                        />
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Protocol;
