import { ShieldAlert, AlertTriangle, Disc, Scan, Search } from 'lucide-react';
import { cn } from '../lib/utils';

const ErrorCodes = () => {
    // 錯誤分類資料 (精簡版 + 感測器檢查點)
    const errorCategories = [
        {
            title: '閘門相關 (Solenoid & Gate)',
            icon: ShieldAlert,
            color: 'text-amber-600',
            bg: 'bg-amber-100',
            border: 'border-amber-200',
            items: [
                {
                    code: 'HADOUKEN_ERR_GATE_NOT_CLOSED',
                    name: '閘門未關閉 / 安全互鎖',
                    description: '轉盤啟動前檢查到閘門未關。嘗試強制關門 600ms 後仍未到位，觸發異常並鎖死轉盤以防撞擊。',
                    sensors: ['1P 關門極限開關 (微動)', '2P 關門極限開關 (微動)', '排廢口關門極限開關 (微動)']
                },
                {
                    code: 'HADOUKEN_ERR_SOLENOID_1P',
                    name: '1P 閘門異常',
                    description: '1P 閘門執行開關動作時，逾時未抵達極限微動開關 (機構卡住或訊號異常)。',
                    sensors: ['1P 開門與關門極限開關 (微動)', '1P 閘門推桿馬達/電磁閥']
                },
                {
                    code: 'HADOUKEN_ERR_SOLENOID_2P',
                    name: '2P 閘門異常',
                    description: '2P 閘門執行開關動作時，逾時未抵達極限微動開關。',
                    sensors: ['2P 開門與關門極限開關 (微動)', '2P 閘門推桿馬達/電磁閥']
                },
                {
                    code: 'HADOUKEN_ERR_SOLENOID_RECTCLE',
                    name: '排廢閘門異常',
                    description: '廢卡排除流程中，排廢閘門執行開關動作時，逾時未到位。',
                    sensors: ['排廢口開門與關門極限開關 (微動)', '排廢推桿馬達/電磁閥']
                }
            ]
        },
        {
            title: '掉卡檢測相關 (Card Check)',
            icon: AlertTriangle,
            color: 'text-red-600',
            bg: 'bg-red-100',
            border: 'border-red-200',
            items: [
                {
                    code: 'HADOUKEN_ERR_NO_CARD_1P',
                    name: '1P 未掉卡',
                    description: '1P 開門出卡後，超過 2 秒光眼仍未偵測到卡片掉落 (可能為空盒或卡彈)。',
                    sensors: ['1P 出卡通道掉落檢測光眼 (對射/反射式)']
                },
                {
                    code: 'HADOUKEN_ERR_NO_CARD_2P',
                    name: '2P 未掉卡',
                    description: '2P 開門出卡後，超過 2 秒光眼仍未偵測到卡片掉落。',
                    sensors: ['2P 出卡通道掉落檢測光眼 (對射/反射式)']
                },
                {
                    code: 'HADOUKEN_ERR_NO_CARD_RECTCLE',
                    name: '排廢口未掉卡',
                    description: '排廢閘門開啟後，超過 2 秒排廢口光眼仍未偵測到廢卡掉出。',
                    sensors: ['排廢通道掉落檢測光眼 (對射/反射式)']
                },
                {
                    code: 'HADOUKEN_ERR_CARD_EXIST',
                    name: '出卡機口異物/殘卡',
                    description: '外部出卡機準備作動時，偵測到通道內已有異物或殘留前一張卡片。',
                    sensors: ['外部備卡/出卡機內部感測器 (透過通訊回傳)']
                }
            ]
        },
        {
            title: '轉動定位相關 (Motor & QEI)',
            icon: Disc,
            color: 'text-purple-600',
            bg: 'bg-purple-100',
            border: 'border-purple-200',
            items: [
                {
                    code: 'HADOUKEN_ERR_TIMEOUT_MOTOR',
                    name: '轉盤馬達超時',
                    description: '主轉盤馬達啟動後，超過規定時間仍未抵達目標編碼器位置 (轉速過慢或阻力過大)。',
                    sensors: ['伺服/步進轉盤主馬達', '原點/補卡點定位光眼 (若找不到基準點)']
                },
                {
                    code: 'HADOUKEN_ERR_ENCODER_FAULT',
                    name: '編碼器故障',
                    description: '已送出馬達驅動訊號，但 QEI 編碼器數值無變化。可能為線路脫落、馬達卡死或皮帶斷裂。',
                    sensors: ['主馬達編碼器 (QEI A/B 相訊號線)']
                }
            ]
        },
        {
            title: '掃描器相關 (QR Reader)',
            icon: Scan,
            color: 'text-blue-600',
            bg: 'bg-blue-100',
            border: 'border-blue-200',
            items: [
                {
                    code: 'HADOUKEN_ERR_QR_CONFIG_FAIL',
                    name: 'QR 配置失敗',
                    description: '開機對 QR 掃描器進行參數設定時，等待回應逾時 (掃描器未通電或斷線)。',
                    sensors: ['QR Code 掃描器 (串列通訊檢查)']
                },
                {
                    code: 'HADOUKEN_ERR_QR_FAIL',
                    name: 'QR 掃描失敗',
                    description: '轉盤帶動卡盒至掃描位置後，讀取逾時或未收到有效 QR 資料 (標籤髒污/移失)。',
                    sensors: ['QR Code 掃描器鏡頭', '硬體卡盒標籤貼紙']
                }
            ]
        }
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in zoom-in duration-500">
            {/* Header Section */}
            <div className="flex items-start gap-4 p-6 bg-white border-l-4 border-red-500 rounded-lg shadow-sm">
                <div className="p-3 bg-red-100 rounded-xl">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-wider text-slate-800" style={{ fontFamily: 'var(--font-cyber)' }}>
                        錯誤碼對照 <span className="text-slate-500 text-lg ml-2">Error Codes</span>
                    </h2>
                    <p className="text-slate-500 mt-1">HADOUKEN_ERR 機構與邏輯異常錯誤代碼查詢清單</p>
                </div>
            </div>

            {/* List Layout */}
            <div className="space-y-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                {errorCategories.map((category, idx) => (
                    <div key={idx} className="relative">
                        {/* 分類標題 */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className={cn("p-2 rounded-lg", category.bg)}>
                                <category.icon className={cn("w-5 h-5", category.color)} />
                            </div>
                            <h3 className="text-xl font-bold tracking-wide text-slate-800 border-b-2 pb-1" style={{ borderColor: 'var(--tw-colors-slate-200)' }}>
                                {category.title}
                            </h3>
                        </div>

                        {/* 該分類底下的列表 */}
                        <div className="space-y-2 ml-2 sm:ml-6 border-l-2 border-slate-100 pl-4 sm:pl-6 py-1">
                            {category.items.map((err, errIdx) => (
                                <div key={errIdx} className="group py-3 hover:bg-slate-50 transition-colors rounded-lg px-2 sm:px-4 -ml-4 sm:-ml-6 flex flex-col md:flex-row md:items-start gap-1 md:gap-4 lg:gap-8">
                                    <div className="md:w-[320px] flex-shrink-0">
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-500 transition-colors"></span>
                                            <h4 className="font-bold text-slate-800 tracking-wider font-mono text-sm leading-tight text-blue-600">
                                                {err.code}
                                            </h4>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-600 ml-3.5 mt-0.5">{err.name}</p>
                                    </div>
                                    <div className="flex-1 mt-2 md:mt-0 lg:mt-1 space-y-3">
                                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line ml-3.5 md:ml-0">
                                            {err.description}
                                        </p>

                                        {/* Sensor Information Block */}
                                        {err.sensors && err.sensors.length > 0 && (
                                            <div className="ml-3.5 md:ml-0 flex flex-col sm:flex-row sm:items-start gap-2 pt-2 border-t border-slate-100 border-dashed">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mt-0.5 whitespace-nowrap">
                                                    <Search className="w-3.5 h-3.5" />
                                                    檢查點:
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {err.sensors.map((sensor, sIdx) => (
                                                        <span key={sIdx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                            {sensor}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ErrorCodes;
