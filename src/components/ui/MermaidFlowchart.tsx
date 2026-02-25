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
                // 明亮背景下的乾淨配色 (Light Theme style)
                primaryColor: '#ffffff', // white (背景色)
                primaryTextColor: '#334155', // slate-700 (主文字)
                primaryBorderColor: '#94a3b8', // slate-400 (邊框/線條)
                lineColor: '#64748b', // slate-500 (連接線)
                secondaryColor: '#f1f5f9', // slate-100
                tertiaryColor: '#e2e8f0', // slate-200
                // 判斷菱形 (Decision) 的顏色
                nodeBorder: '#94a3b8',
                clusterBkg: 'rgba(241, 245, 249, 0.5)', // Group 背景 (slate-100)
                clusterBorder: '#cbd5e1',
                // 邊緣高亮
                edgeLabelBackground: '#ffffff', // white (Label 底色)
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
        <div className={cn("relative w-full overflow-x-auto overflow-y-hidden rounded-xl bg-white border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center min-h-[300px]", className)}>
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 text-cyan-600 animate-spin mb-4" />
                    <span className="text-cyan-700 font-mono text-sm tracking-widest animate-pulse">RENDERING FLOWCHART...</span>
                </div>
            )}

            {error ? (
                <div className="text-rose-600 font-mono text-sm text-center bg-rose-50 p-4 rounded-lg border border-rose-200 max-w-2xl">
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
