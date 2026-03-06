import { Terminal as TerminalIcon, ShieldCheck, Zap, AlertCircle, Trash2, StopCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

interface RobotRealtimeTerminalProps {
    logs: string[];
    onClear: () => void;
    onStop: () => void;
    status: 'online' | 'offline';
}

export const RobotRealtimeTerminal = ({ logs, onClear, onStop, status }: RobotRealtimeTerminalProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const getLogColor = (log: string) => {
        if (log.includes('✅') || log.toLowerCase().includes('sucesso')) return 'text-green-600 font-semibold';
        if (log.includes('❌') || log.toLowerCase().includes('erro') || log.toLowerCase().includes('falha')) return 'text-red-500 font-semibold';
        if (log.includes('⚡') || log.includes('Groq') || log.includes('IA')) return 'text-blue-600 font-semibold';
        if (log.includes('🔍') || log.includes('Minerando')) return 'text-amber-600 font-semibold';
        return 'text-slate-500';
    };

    return (
        <Card className="bg-white border-slate-200 shadow-sm flex flex-col h-[350px] md:h-[400px]">
            <CardHeader className="p-3 sm:p-4 border-b border-slate-100 flex flex-row items-center justify-between gap-4 space-y-0 bg-slate-50/50">
                <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] flex items-center gap-2 text-slate-600">
                    <TerminalIcon className="w-3.5 h-3.5" />
                    Neural Link Terminal
                    {status === 'online' && (
                        <span className="flex items-center gap-1 ml-2 text-[8px] text-green-700 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            LIVE
                        </span>
                    )}
                </CardTitle>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[8px] font-bold hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200/60"
                        onClick={onClear}
                    >
                        <Trash2 className="w-3 h-3 mr-1" />
                        LIMPAR
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="h-6 text-[8px] font-bold bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-100"
                        onClick={onStop}
                    >
                        <StopCircle className="w-3 h-3 mr-1" />
                        PARAR ROBÔ
                    </Button>
                </div>
            </CardHeader>

            <CardContent
                className="flex-1 p-4 font-mono text-[10px] sm:text-[11px] overflow-y-auto space-y-1.5 custom-scrollbar selection:bg-blue-100"
                ref={scrollRef}
            >
                {logs.length > 0 ? (
                    logs.map((log, i) => (
                        <div key={i} className="flex gap-3 items-start group">
                            <span className="opacity-30 select-none font-bold min-w-[25px] text-right text-slate-400">
                                {i.toString().padStart(3, '0')}
                            </span>
                            <span className="opacity-30 select-none text-blue-400">❯</span>
                            <div className={`${getLogColor(log)} leading-relaxed break-words flex-1`}>
                                {log}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center animate-spin-slow">
                            <Zap className="w-6 h-6 text-slate-300" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-xs uppercase tracking-widest text-slate-600">Aguardando Telemetria</p>
                            <p className="text-[10px] text-slate-500">Inicie a instância local para estabelecer conexão.</p>
                        </div>
                    </div>
                )}
            </CardContent>

            <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-[8px] font-mono text-slate-600 uppercase">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1"><ShieldCheck className="w-2.5 h-2.5" /> Secure Link</span>
                    <span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5" /> High Speed</span>
                </div>
                <span className="font-bold text-slate-700">v3.0.0-vanguard</span>
            </div>
        </Card>
    );
};
