import { Activity, Zap, Cpu, Clock, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface RobotHUDProps {
    status: 'online' | 'offline';
    isPaused: boolean;
    isConnected: boolean;
    lastPing: string | null;
    currentAction: string;
    stats: {
        total: number;
        queued: number;
        completed: number;
    };
}

export const RobotHUD = ({
    status,
    isPaused,
    isConnected,
    lastPing,
    currentAction,
    stats
}: RobotHUDProps) => {
    const [pingAge, setPingAge] = useState<number>(0);

    useEffect(() => {
        const timer = setInterval(() => {
            if (lastPing) {
                const diff = Math.floor((Date.now() - new Date(lastPing).getTime()) / 1000);
                setPingAge(diff);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [lastPing]);

    const isActuallyOnline = status === 'online' && pingAge < 30;

    return (
        <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-stretch">
                    {/* Status Principal */}
                    <div className={cn(
                        "p-6 flex items-center gap-4 border-b md:border-b-0 md:border-r border-slate-100 min-w-0 md:min-w-[240px]",
                        isActuallyOnline ? 'bg-blue-50/30' : 'bg-slate-50'
                    )}>
                        <div className="relative">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isActuallyOnline ? 'bg-white border-blue-100 text-blue-600 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-400'} border`}>
                                <Cpu className={`w-6 h-6 ${isActuallyOnline && !isPaused ? 'animate-pulse' : ''}`} />
                            </div>
                            {isActuallyOnline && (
                                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 tracking-tight">LeadRadar Engine</h3>
                                <Badge variant={isActuallyOnline ? "outline" : "destructive"} className={`text-[10px] uppercase font-black px-1.5 h-4 ${isActuallyOnline ? 'border-green-200 text-green-700 bg-green-50' : ''}`}>
                                    {isActuallyOnline ? (isPaused ? 'PAUSADO' : 'ATIVO') : 'OFFLINE'}
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                                {isActuallyOnline ? (
                                    <>
                                        <Wifi className="w-3 h-3 text-green-500" />
                                        Conectado ao Núcleo
                                    </>
                                ) : (
                                    <>
                                        <WifiOff className="w-3 h-3 text-red-400" />
                                        Aguardando Sinal Local
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Atividade Atual */}
                    <div className="flex-1 p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/30">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2 flex items-center gap-1.5">
                            <Activity className="w-3 h-3 text-blue-600" />
                            Estado da Missão
                        </span>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <div className="flex justify-between items-end mb-1.5">
                                    <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
                                        {isActuallyOnline ? (currentAction || "Monitorando Janelas...") : "Sistema em Standby"}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                                        {isActuallyOnline ? `LATENCY: ${pingAge}s` : 'N/A'}
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden border border-slate-300/30">
                                    <div
                                        className={`h-full bg-blue-600 transition-all duration-1000 ${isActuallyOnline && !isPaused ? 'animate-shimmer' : ''}`}
                                        style={{ width: isActuallyOnline && !isPaused ? '100%' : '0%' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Métricas Rápidas */}
                    <div className="p-6 grid grid-cols-3 gap-4 md:gap-6 min-w-0 md:min-w-[340px]">
                        <div className="text-center">
                            <span className="text-[9px] uppercase font-black text-slate-400 block mb-1">Fila</span>
                            <div className="text-xl font-black text-slate-900">{stats.queued}</div>
                        </div>
                        <div className="text-center border-x border-slate-100 px-6">
                            <span className="text-[9px] uppercase font-black text-slate-400 block mb-1">Sucesso</span>
                            <div className="text-xl font-black text-green-600">{stats.completed}</div>
                        </div>
                        <div className="text-center">
                            <span className="text-[9px] uppercase font-black text-slate-400 block mb-1">Total</span>
                            <div className="text-xl font-black text-blue-600">{stats.total}</div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
