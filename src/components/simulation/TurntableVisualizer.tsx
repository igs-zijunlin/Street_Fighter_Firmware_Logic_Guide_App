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
            <div className="absolute inset-0 rounded-full border-4 border-slate-700 bg-slate-800/50 backdrop-blur-md shadow-[0_0_50px_rgba(6,182,212,0.1)]"></div>

            {/* Rotating Turntable */}
            <motion.div
                className="w-full h-full relative"
                animate={{ rotate: rotation }}
                transition={{ type: "tween", ease: "linear", duration: 0 }} // Direct control
                style={{ transformOrigin: "50% 50%" }}
            >
                {/* Slots */}
                {inventory.map((slot, i) => {
                    const angle = (i * 36) * (Math.PI / 180);
                    const radius = 120; // px
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    return (
                        <div
                            key={i}
                            className={`absolute w-12 h-16 border-2 rounded flex items-center justify-center
                        ${slot.hasCard
                                    ? 'bg-cyan-900/80 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                                    : 'bg-slate-800/50 border-slate-600 border-dashed'}
                    `}
                            style={{
                                left: `calc(50% + ${x}px - 24px)`,
                                top: `calc(50% + ${y}px - 32px)`,
                                transform: `rotate(${i * 36 + 90}deg)`
                            }}
                        >
                            <span className="text-xs font-mono text-white/80">{i}</span>
                        </div>
                    );
                })}

                {/* Center Hub */}
                <div className="absolute top-1/2 left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-700 border-4 border-slate-600 flex items-center justify-center z-10">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 animate-pulse"></div>
                </div>
            </motion.div>

            {/* Sensor/Gate Markers (Static) */}
            {/* Dispense Pos (+90 deg -> Bottom?) Depends on coord sys. Let's assume Top is 0 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4">
                <div className="px-2 py-1 bg-amber-500/20 border border-amber-500 text-amber-500 text-[10px] rounded">Dispense Gate (1P/2P)</div>
                <div className="w-0.5 h-4 bg-amber-500 mx-auto"></div>
            </div>

            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4">
                <div className="w-0.5 h-4 bg-red-500 mx-auto"></div>
                <div className="px-2 py-1 bg-red-500/20 border border-red-500 text-red-500 text-[10px] rounded">Recycle Gate</div>
            </div>

        </div>
    );
};

export default TurntableVisualizer;
