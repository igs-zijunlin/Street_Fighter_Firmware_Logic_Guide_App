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

    // Logic Control Loop (Simplified)
    useEffect(() => {
        if (!isSimulating) return;

        const logicInterval = setInterval(() => {
            // --- Initialization Logic ---
            if (initStep === 'FIND_HOME') {
                if (motorState === 'STOP') {
                    setMotorState('FORWARD');
                    addLog('馬達啟動... 尋找原點訊號 (Simulating)');
                }
                // Simulate finding home at QEI ~ 0
                if (qei > 0 && qei < 100 && motorState === 'FORWARD') {
                    setMotorState('STOP');
                    setQei(0); // Snap to 0
                    addLog('原點感測器觸發！與軟體歸零 (Zero Calibrated) 完成。');
                    setInitStep('MEASURE_ROUND');
                }
            }
            else if (initStep === 'MEASURE_ROUND') {
                // Simulate measuring one full round
                if (motorState === 'STOP') {
                    setMotorState('FORWARD');
                    addLog('測量單圈脈衝數中 (Measuring One Round Pulses)...');
                }
                // In real sim, we'd wait for wrap around. Here we just fake it after some time
                // For visualizer, we can just say "Done"
            }
            // ... Add more logic steps here
        }, 100);

        return () => clearInterval(logicInterval);
    }, [isSimulating, initStep, qei, motorState]);

    // Actions
    const startInitialization = () => {
        setIsSimulating(true);
        setInitStep('FIND_HOME');
        setQei(2000); // Random start pos
        addLog('初始化序列開始 (Initialization Sequence Started)。');
    };

    const stopSimulation = () => {
        setIsSimulating(false);
        setMotorState('STOP');
        setInitStep('IDLE');
        addLog('模擬已停止 (Simulation Stopped)。');
    };

    const manualDispense = (slotIndex: number) => {
        setCurrentSlotIndex(slotIndex);
        addLog(`手動出卡 (Manual Dispense): Slot ${slotIndex + 1}`);
        // Future: Trigger animation state
    };

    // Prevent unused setInventory warning (or implement scan logic later)
    useEffect(() => {
        if (initStep === 'SCAN_INVENTORY') {
            setInventory(prev => [...prev]); // Dummy update
        }
    }, [initStep]);

    return {
        qei,
        motorState,
        initStep,
        inventory,
        logs,
        currentSlotIndex,
        startInitialization,
        stopSimulation,
        manualDispense
    };
};
