import { useState, useEffect } from 'react';

// Firmware Constants
const QEI_ONE_ROUND = 4096;
const MOTOR_SPEED = 20; // QEI counts per tick
const TICK_RATE = 10; // ms

export type InitStep =
    | 'IDLE'
    | 'WAIT_STABLE'
    | 'FIND_HOME'
    | 'MEASURE_ROUND'
    | 'SCAN_INVENTORY'
    | 'COMPLETE'
    | 'ERROR';

export type GateState = 'CLOSED' | 'OPENING' | 'OPEN' | 'CLOSING';

export interface BoxState {
    index: number;
    hasCard: boolean;
    qrData: string | null;
}

export const useHadoukenLogic = () => {
    // System State
    const [qei, setQei] = useState(0);
    const [motorState, setMotorState] = useState<'STOP' | 'FORWARD' | 'BACKWARD'>('STOP');
    const [initStep, setInitStep] = useState<InitStep>('IDLE');
    const [currentSlotIndex, setCurrentSlotIndex] = useState(0); // 0-9
    const [targetQei, setTargetQei] = useState<number | null>(null);
    const [scanPhase, setScanPhase] = useState<'IDLE' | 'MOVING' | 'PAUSED' | 'WAITING'>('IDLE');
    const [scanSlotCount, setScanSlotCount] = useState(0);
    const [inventory, setInventory] = useState<BoxState[]>(
        Array.from({ length: 10 }, (_, i) => ({ index: i, hasCard: Math.random() > 0.3, qrData: null }))
    );

    // Simulation State
    const [isSimulating, setIsSimulating] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
    };

    // Motor Physics Loop
    useEffect(() => {
        if (!isSimulating) return;

        const interval = setInterval(() => {
            if (motorState === 'FORWARD') {
                setQei(prev => (prev + MOTOR_SPEED) % QEI_ONE_ROUND);
            } else if (motorState === 'BACKWARD') {
                setQei(prev => (prev - MOTOR_SPEED + QEI_ONE_ROUND) % QEI_ONE_ROUND);
            }
        }, TICK_RATE);

        return () => clearInterval(interval);
    }, [isSimulating, motorState]);

    // Logic Control Loop
    useEffect(() => {
        if (!isSimulating) return;

        // --- Initialization Logic ---
        if (initStep === 'FIND_HOME') {
            if (motorState === 'STOP') {
                setMotorState('FORWARD');
                addLog('馬達啟動... 尋找原點訊號 (Simulating)');
            }
            if (qei > 0 && qei < MOTOR_SPEED * 2 && motorState === 'FORWARD') {
                setMotorState('STOP');
                setQei(0); // Snap home. QEI=0 puts Slot 1 at Refill (0 deg).
                addLog('原點感測器觸發！已校正 QEI = 0，1號卡盒位於補卡口。');
                setInitStep('MEASURE_ROUND');
            }
        }
        else if (initStep === 'MEASURE_ROUND') {
            if (motorState === 'STOP') {
                setMotorState('FORWARD');
                addLog('測量單圈脈衝數中 (Measuring One Round Pulses)...');
            }
            // Simulate measuring one round (when QEI wraps close to 4096)
            if (qei > 4000 && motorState === 'FORWARD') {
                setMotorState('STOP');
                setQei(0); // Ensure it ends exactly at home again
                setInitStep('SCAN_INVENTORY');
                setScanPhase('PAUSED');
                setScanSlotCount(0);
                addLog('測量完成 (4096 counts)。返回原點 (Slot 1 位於補卡口)。');
                addLog('開始卡盒掃描 (Scanning Inventory)...');
            }
        }
        else if (initStep === 'SCAN_INVENTORY') {
            if (scanPhase === 'PAUSED') {
                setScanPhase('WAITING');
                if (scanSlotCount >= 10) {
                    setTimeout(() => {
                        setInitStep('IDLE');
                        setScanPhase('IDLE');
                        setMotorState('STOP');
                        addLog('自動掃描完畢！初始化完成，進入待命狀態 (IDLE)。');
                    }, 300);
                } else {
                    setTimeout(() => {
                        setMotorState('FORWARD');
                        setScanPhase('MOVING');
                    }, 300); // 0.3s pause for QR Read
                }
            } else if (scanPhase === 'MOVING') {
                const target = Math.round((scanSlotCount + 1) * (QEI_ONE_ROUND / 10));
                let reached = false;
                if (scanSlotCount + 1 === 10) {
                    if (qei >= 4000) reached = true;
                } else {
                    if (qei >= target) reached = true;
                }

                if (reached && motorState === 'FORWARD') {
                    setMotorState('STOP');
                    setQei(scanSlotCount + 1 === 10 ? 0 : target);
                    setScanSlotCount(prev => prev + 1);
                    setScanPhase('PAUSED');
                }
            }
        }

        // --- Positioning Logic ---
        if (targetQei !== null && motorState === 'FORWARD') {
            const diff = Math.abs(qei - targetQei);
            // Check if we reached the target
            if (diff <= MOTOR_SPEED || Math.abs(diff - QEI_ONE_ROUND) <= MOTOR_SPEED) {
                setMotorState('STOP');
                setQei(targetQei); // Snap to exact position
                setTargetQei(null); // Clear target
                addLog(`到達 Slot ${currentSlotIndex + 1} 目標物理位置。等待下一步操作...`);
            }
        }
    }, [isSimulating, initStep, qei, motorState, targetQei, currentSlotIndex, scanPhase, scanSlotCount]);

    // Actions
    const startInitialization = () => {
        setIsSimulating(true);
        setInitStep('FIND_HOME');
        setScanPhase('IDLE');
        setScanSlotCount(0);
        setQei(2000); // Random start pos
        addLog('初始化序列開始 (Initialization Sequence Started)。');
    };

    const stopSimulation = () => {
        setIsSimulating(false);
        setMotorState('STOP');
        setInitStep('IDLE');
        setScanPhase('IDLE');
        addLog('模擬已停止 (Simulation Stopped)。');
    };

    type TargetPosition = 'REFILL' | '1P_DISPENSE' | '2P_DISPENSE' | 'REJECT';

    const moveToPosition = (slotIndex: number, position: TargetPosition) => {
        setCurrentSlotIndex(slotIndex);

        let desiredAbsoluteAngle = 0;
        let posLabel = '';
        switch (position) {
            case 'REFILL':
                desiredAbsoluteAngle = 0;
                posLabel = '補卡口 (0°)';
                break;
            case '1P_DISPENSE':
                desiredAbsoluteAngle = 90;
                posLabel = '1P出卡口 (+90°)';
                break;
            case '2P_DISPENSE':
                desiredAbsoluteAngle = 270;
                posLabel = '2P出卡口 (-90°)';
                break;
            case 'REJECT':
                desiredAbsoluteAngle = 180;
                posLabel = '排廢區 (180°)';
                break;
        }

        const targetAngle = (desiredAbsoluteAngle - slotIndex * 36 + 360 * 10) % 360;
        const calcQei = Math.round((targetAngle / 360) * QEI_ONE_ROUND);

        setTargetQei(calcQei);
        setIsSimulating(true);
        setInitStep('IDLE');

        if (motorState === 'STOP') {
            setMotorState('FORWARD');
        }
        addLog(`定位指令: 移動 Slot ${slotIndex + 1} 至 ${posLabel} (目標 QEI: ${calcQei}) ...`);
    };

    const performDispense = (slotIndex: number) => {
        setInventory(prev => {
            const slot = prev.find(s => s.index === slotIndex);
            if (slot && !slot.hasCard) {
                addLog(`[錯誤] Slot ${slotIndex + 1} 為空盒，無法執行出卡！`);
                return prev;
            }
            addLog(`[成功] Slot ${slotIndex + 1} 出卡動作完成，卡盒已清空！`);
            return prev.map(s => s.index === slotIndex ? { ...s, hasCard: false } : s);
        });
    };

    const performRefill = (slotIndex: number) => {
        setInventory(prev => {
            const slot = prev.find(s => s.index === slotIndex);
            if (slot && slot.hasCard) {
                addLog(`[錯誤] Slot ${slotIndex + 1} 已有卡，無法重複補卡！`);
                return prev;
            }
            addLog(`[成功] Slot ${slotIndex + 1} 補卡動作完成！`);
            return prev.map(s => s.index === slotIndex ? { ...s, hasCard: true } : s);
        });
    };

    const performReject = (slotIndex: number) => {
        setInventory(prev => {
            const slot = prev.find(s => s.index === slotIndex);
            if (slot && !slot.hasCard) {
                addLog(`[警告] Slot ${slotIndex + 1} 為空盒，排廢無效。`);
                return prev;
            }
            addLog(`[成功] Slot ${slotIndex + 1} 排廢完成，不良品已丟棄。`);
            return prev.map(s => s.index === slotIndex ? { ...s, hasCard: false } : s);
        });
    };

    // Refresh inventory reference when scanning starts
    useEffect(() => {
        if (initStep === 'SCAN_INVENTORY') {
            setInventory(prev => [...prev]);
        }
    }, [initStep]);

    return {
        qei,
        motorState,
        initStep,
        inventory,
        logs,
        currentSlotIndex,
        setCurrentSlotIndex,
        startInitialization,
        stopSimulation,
        moveToPosition,
        performDispense,
        performRefill,
        performReject
    };
};
