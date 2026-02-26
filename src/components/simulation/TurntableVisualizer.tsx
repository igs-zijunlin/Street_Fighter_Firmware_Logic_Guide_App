import React from 'react';
import { motion } from 'framer-motion';

interface TurntableProps {
    qei: number; // 0-4096
    inventory: Array<{ index: number; hasCard: boolean }>;
}

const TurntableVisualizer: React.FC<TurntableProps> = ({ qei, inventory }) => {
    // Convert QEI to degrees (0-360)
    const rotation = (qei / 4096) * 360;

    return (
        <div className="relative w-80 h-80 flex items-center justify-center">
            {/* Base */}
            <div className="absolute inset-0 rounded-full border-4 border-slate-200 bg-white shadow-xl shadow-slate-200/50"></div>

            {/* Rotating Turntable */}
            <motion.div
                className="w-full h-full relative"
                animate={{ rotate: rotation }}
                transition={{ type: "tween", ease: "linear", duration: 0 }} // Direct control
                style={{ transformOrigin: "50% 50%" }}
            >
                {/* Slots */}
                {inventory.map((slot, i) => {
                    const angle = (-i * 36) * (Math.PI / 180);
                    const radius = 120; // px
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    return (
                        <div
                            key={i}
                            className={`absolute w-12 h-16 border-2 rounded flex items-center justify-center
                        ${slot.hasCard
                                    ? 'bg-cyan-50 border-cyan-400 shadow-sm'
                                    : 'bg-white border-slate-300 border-dashed'}
                    `}
                            style={{
                                left: `calc(50% + ${x}px - 24px)`,
                                top: `calc(50% + ${y}px - 32px)`,
                                transform: `rotate(${-i * 36 + 270}deg)`
                            }}
                        >
                            <span className="text-xs font-mono text-slate-700 font-medium">{i + 1}</span>
                        </div>
                    );
                })}

                {/* Center Hub */}
                <div className="absolute top-1/2 left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-100 border-4 border-slate-200 flex items-center justify-center z-10 shadow-sm text-[10px] font-bold text-slate-400">
                    <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-cyan-400 animate-pulse opacity-50"></div>
                    v3
                </div>
            </motion.div>

            {/* Sensor/Gate Markers (Static) */}
            {/* 2P Dispense (-90 deg / Top) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12">
                <div className="px-2 py-1 bg-emerald-50 border border-emerald-300 text-emerald-700 text-[10px] rounded shadow-sm font-medium whitespace-nowrap">2P 出卡口 (-90°)</div>
                <div className="w-0.5 h-12 bg-emerald-400 mx-auto"></div>
            </div>

            {/* 1P Dispense (+90 deg / Bottom) */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-12">
                <div className="w-0.5 h-12 bg-cyan-400 mx-auto"></div>
                <div className="px-2 py-1 bg-cyan-50 border border-cyan-300 text-cyan-700 text-[10px] rounded shadow-sm font-medium whitespace-nowrap">1P 出卡口 (+90°)</div>
            </div>

            {/* Refill (0 deg / Right) */}
            <div className="absolute right-0 top-1/2 translate-x-20 -translate-y-1/2 flex items-center">
                <div className="w-12 h-0.5 bg-rose-400"></div>
                <div className="px-2 py-1 bg-rose-50 border border-rose-300 text-rose-700 text-[10px] rounded shadow-sm font-medium whitespace-nowrap">補卡口 (0°)</div>
            </div>

            {/* Reject (180 deg / Left) */}
            <div className="absolute left-0 top-1/2 -translate-x-20 -translate-y-1/2 flex items-center">
                <div className="px-2 py-1 bg-orange-50 border border-orange-300 text-orange-700 text-[10px] rounded shadow-sm font-medium whitespace-nowrap">排廢區 (180°)</div>
                <div className="w-12 h-0.5 bg-orange-400"></div>
            </div>

        </div>
    );
};

export default TurntableVisualizer;
