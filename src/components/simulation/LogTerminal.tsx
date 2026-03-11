import React, { useEffect, useRef } from 'react';

interface LogTerminalProps {
    logs: string[];
}

const LogTerminal: React.FC<LogTerminalProps> = ({ logs }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            // Scroll only the container, preventing the entire page from jumping on mobile
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div 
            ref={containerRef}
            className="bg-black/80 rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs border border-slate-800 scroll-smooth"
        >
            {logs.length === 0 && <span className="text-slate-600 italic">No logs yet...</span>}
            {logs.map((log, i) => (
                <div key={i} className="mb-1 text-slate-300">
                    <span className="text-cyan-500 mr-2">➜</span>
                    {log}
                </div>
            ))}
        </div>
    );
};

export default LogTerminal;
