import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Terminal, Activity, ShieldCheck, Zap, Globe, Cpu, Radio, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function WarRoom() {
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState<'online' | 'offline'>('offline');
    const [lastPing, setLastPing] = useState<string>('');
    const [stats, setStats] = useState({ total: 0, sending: 0, contacted: 0 });
    const scrollRef = useRef<HTMLDivElement>(null);

    const { user } = useAuth();

    const fetchRobotStatus = async () => {
        if (!user) return;
        try {
            const { data: systemLead } = await (supabase as any)
                .from('leads')
                .select('*')
                .eq('name', 'ROBOT_STATUS')
                .eq('user_id', user.id)
                .maybeSingle();

            if (systemLead) {
                setLogs(systemLead.meta_data?.logs || []);
                setStatus(systemLead.meta_data?.status || 'offline');
                setLastPing(systemLead.meta_data?.last_ping || '');
            }

            // Fetch basic stats
            const { data: allLeads } = await (supabase as any).from('leads').select('status, automation_status').eq('user_id', user.id);
            if (allLeads) {
                setStats({
                    total: allLeads.length,
                    sending: allLeads.filter((l: any) => l.automation_status === 'sending').length,
                    contacted: allLeads.filter((l: any) => l.status === 'contacted').length
                });
            }
        } catch (err) {
            console.error("Error fetching robot status:", err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchRobotStatus();
            const interval = setInterval(fetchRobotStatus, 5000);
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="p-4 space-y-4 animate-fade-in">
            {/* Header / HUD */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black gradient-text tracking-tighter uppercase flex items-center gap-2">
                        <Activity className="w-6 h-6 text-primary animate-pulse" />
                        Live War Room
                    </h1>
                    <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider opacity-60">Deep Matrix Telemetry System</p>
                </div>
                <div className="flex items-center gap-3 bg-card/40 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/5 shadow-2xl">
                    <div className={cn(
                        "w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_12px]",
                        status === 'online' ? "bg-emerald-500 shadow-emerald-500/50" : "bg-rose-500 shadow-rose-500/50"
                    )} />
                    <div className="text-right">
                        <p className="text-[8px] uppercase font-black tracking-[0.2em] leading-none mb-0.5 opacity-40">Status</p>
                        <p className={cn("text-[10px] font-bold uppercase tracking-widest", status === 'online' ? "text-emerald-500" : "text-rose-500")}>
                            {status === 'online' ? "OPERATIONAL" : "OFFLINE"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Metrics grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard icon={Hash} label="Total Leads" value={stats.total} color="primary" />
                <MetricCard icon={Radio} label="Ativos" value={stats.sending} color="orange" />
                <MetricCard icon={Zap} label="Contactados" value={stats.contacted} color="emerald" />
                <MetricCard icon={Cpu} label="Latência" value="84ms" color="blue" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Main Terminal */}
                <Card className="lg:col-span-2 card-glass border-white/5 overflow-hidden flex flex-col h-[350px] sm:h-[450px]">
                    <CardHeader className="bg-white/5 border-b border-white/5 py-3 flex flex-row justify-between items-center">
                        <CardTitle className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest opacity-50 flex items-center gap-2">
                            <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                            System Raw Feed
                        </CardTitle>
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500/50" />
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-500/50" />
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500/50" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 bg-black/40 font-mono text-[9px] sm:text-[11px] relative overflow-hidden">
                        <div className="absolute inset-0 scan-line pointer-events-none opacity-20" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />

                        <div
                            ref={scrollRef}
                            className="p-3 sm:p-4 h-full overflow-y-auto custom-scrollbar space-y-1 relative z-10"
                        >
                            {logs.length > 0 ? (
                                logs.map((log, i) => (
                                    <div key={i} className="flex gap-3 group">
                                        <span className="text-primary/40 select-none">[{i.toString().padStart(3, '0')}]</span>
                                        <span className={cn(
                                            "transition-colors",
                                            log.includes('✅') ? "text-emerald-400" :
                                                log.includes('❌') ? "text-rose-400" :
                                                    log.includes('⚠️') ? "text-amber-400" : "text-white/80"
                                        )}>
                                            {log}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex items-center justify-center opacity-20">
                                    <p className="uppercase tracking-[0.3em] font-black italic">Initialize System...</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Side Control / Map Mock */}
                <div className="space-y-4">
                    <Card className="card-glass border-white/5 p-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-50">Mapa de Frequência</h3>
                        <div className="aspect-square bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden flex items-center justify-center group cursor-crosshair">
                            {/* Animated Grid / Pulse */}
                            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 border border-white/5 opacity-20">
                                {Array.from({ length: 36 }).map((_, i) => (
                                    <div key={i} className="border border-white/5" />
                                ))}
                            </div>
                            <div className="w-32 h-32 rounded-full border border-primary/20 animate-ping opacity-20" />
                            <div className="w-24 h-24 rounded-full border border-primary/40 animate-pulse absolute" />
                            <Globe className="w-12 h-12 text-primary opacity-30 group-hover:opacity-60 transition-opacity duration-700" />
                            <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-md rounded-lg p-1.5 border border-white/5">
                                <p className="text-[7px] font-black uppercase tracking-tighter text-center">Satellite Node: Active</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="card-glass border-white/5 p-4 bg-gradient-to-br from-primary/5 to-transparent">
                        <h3 className="text-[9px] font-black uppercase tracking-widest mb-3 opacity-60">Manual Override</h3>
                        <div className="space-y-2">
                            <Button variant="outline" className="w-full h-9 border-white/10 hover:bg-white/5 text-[9px] font-black uppercase tracking-widest gap-2">
                                <RefreshCw className="w-3.5 h-3.5" /> Reset Log
                            </Button>
                            <Button className="w-full h-9 bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 text-[9px] font-black uppercase tracking-widest gap-2">
                                <Zap className="w-3.5 h-3.5" /> Scan Force
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
    const colorClasses: Record<string, string> = {
        primary: "bg-primary/10 border-primary/20 text-primary",
        orange: "bg-orange-500/10 border-orange-500/20 text-orange-500",
        emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
        blue: "bg-blue-500/10 border-blue-500/20 text-blue-500"
    };

    return (
        <div className={cn("p-3 rounded-xl border backdrop-blur-md flex items-center gap-3 transition-transform hover:scale-[1.02]", colorClasses[color])}>
            <div className="p-2 rounded-lg bg-white/5">
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <p className="text-[8px] uppercase font-black opacity-50 tracking-widest leading-none mb-1">{label}</p>
                <p className="text-lg font-black">{value}</p>
            </div>
        </div>
    );
}

function RefreshCw(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    )
}
