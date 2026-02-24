import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface MermaidFlowchartProps {
    chart: string;
    className?: string;
}

export const MermaidFlowchart: React.FC<MermaidFlowchartProps> = ({ chart, className }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svgContent, setSvgContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 初始化 Mermaid 基本設定 (只跑一次)
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            logLevel: 5, // 避免太多 log 噴錯
            securityLevel: 'loose', // 允許點擊事件等
            themeVariables: {
                // 深色背景下清晰可見的高科技配色 (Cyberpunk style)
                primaryColor: '#0f172a', // slate-900 (背景色)
                primaryTextColor: '#cbd5e1', // slate-300 (主文字)
                primaryBorderColor: '#38bdf8', // sky-400 (邊框/線條)
                lineColor: '#0ea5e9', // sky-500 (連接線)
                secondaryColor: '#1e293b', // slate-800
                tertiaryColor: '#334155', // slate-700
                // 判斷菱形 (Decision) 的顏色
                nodeBorder: '#38bdf8',
                clusterBkg: 'rgba(15, 23, 42, 0.5)', // Group 背景
                clusterBorder: '#334155',
                // 邊緣高亮
                edgeLabelBackground: '#020617', // slate-950 (Label 底色)
                fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif, var(--font-cyber)',
                fontSize: '14px',
            }
        });
    }, []);

    // 當 chart 字串改變時重新渲染
    useEffect(() => {
        let isMounted = true;

        const renderChart = async () => {
            if (!chart || !containerRef.current) return;

            setIsLoading(true);
            setError(null);

            try {
                // Mermaid 10+ 版本的 render 回傳 Promise
                // 給一個 unique ID 避免多次渲染衝撞
                const id = `mermaid-svg-${Math.round(Math.random() * 10000000)}`;
                const { svg } = await mermaid.render(id, chart);

                if (isMounted) {
                    setSvgContent(svg);
                    setIsLoading(false);
                }
            } catch (err: any) {
                if (isMounted) {
                    console.error("Mermaid Render Error:", err);
                    setError(err.message || 'Failed to render flowchart');
                    setIsLoading(false);
                }
            }
        };

        renderChart();

        return () => {
            isMounted = false;
        };
    }, [chart]);

    return (
        <div className={cn("relative w-full overflow-x-auto overflow-y-hidden rounded-xl bg-slate-950/50 border border-slate-800/80 p-6 flex flex-col items-center justify-center min-h-[300px]", className)}>
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-10 backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
                    <span className="text-cyan-400 font-mono text-sm tracking-widest animate-pulse">RENDERING FLOWCHART...</span>
                </div>
            )}

            {error ? (
                <div className="text-rose-500 font-mono text-sm text-center bg-rose-500/10 p-4 rounded-lg border border-rose-500/20 max-w-2xl">
                    <p className="font-bold mb-2">Syntax Error in Mermaid Graph:</p>
                    <pre className="text-left whitespace-pre-wrap text-xs">{error}</pre>
                </div>
            ) : (
                <div
                    ref={containerRef}
                    className="w-full flex justify-center mermaid-container"
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                />
            )}
        </div>
    );
};
