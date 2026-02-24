import React, { useEffect, useRef } from 'react';

interface LogTerminalProps {
    logs: string[];
}

const LogTerminal: React.FC<LogTerminalProps> = ({ logs }) => {
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="bg-black/80 rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs border border-slate-800">
            {logs.length === 0 && <span className="text-slate-600 italic">No logs yet...</span>}
            {logs.map((log, i) => (
                <div key={i} className="mb-1 text-slate-300">
                    <span className="text-cyan-500 mr-2">➜</span>
                    {log}
                </div>
            ))}
            <div ref={endRef} />
        </div>
    );
};

export default LogTerminal;
