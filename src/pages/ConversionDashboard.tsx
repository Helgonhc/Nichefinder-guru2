import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { BusinessData } from "@/types/business";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
    TrendingUp, Users, MessageSquare, Target, CheckCircle,
    DollarSign, MapPin, Briefcase, Clock, Calendar, Zap, Sparkles
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

import { useAuth } from "@/contexts/AuthContext";

const ConversionDashboard = () => {
    const [leads, setLeads] = useState<BusinessData[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                navigate("/login");
            } else {
                fetchMetrics();
            }
        }
    }, [user, authLoading]);

    const fetchMetrics = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('leads')
                .select('*')
                .eq('user_id', user.id)
                .neq('name', 'ROBOT_STATUS');

            if (error) throw error;
            if (data) {
                setLeads(data.map((item: any) => ({
                    ...item,
                    score: item.meta_data?.lead_score || item.score || 0,
                    temperature: (item.meta_data?.temperature || item.temperature || 'frio').toLowerCase(),
                    status: item.status || 'new',
                    conversionResult: item.conversion_result || 'nulo',
                    ticketMedio: item.ticket_medio || 0,
                    motivoOferta: item.motivo_oferta || item.meta_data?.motivoPrincipalDaOferta,
                    created_at: item.created_at
                })));
            }
        } catch (err) {
            console.error("Dashboard metric error:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || authLoading) return (
        <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
    );

    // --- CALCULATIONS ---
    const totalLeads = leads.length;
    const contacted = leads.filter(l => l.status === 'contacted' || l.status === 'interested' || l.status === 'closed').length;
    const interested = leads.filter(l => l.status === 'interested' || l.status === 'closed').length;
    const meetings = leads.filter(l => l.conversionResult === 'reuniao' || l.status === 'closed').length;
    const closed = leads.filter(l => l.status === 'closed').length;

    const contactRate = totalLeads > 0 ? (contacted / totalLeads) * 100 : 0;
    const interestedRate = contacted > 0 ? (interested / contacted) * 100 : 0;
    const meetingRate = interested > 0 ? (meetings / interested) * 100 : 0;
    const closingRate = totalLeads > 0 ? (closed / totalLeads) * 100 : 0;

    const totalROI = leads.reduce((acc, lead) => acc + (lead.ticketMedio || 0), 0);
    const potentialRevenue = leads.filter(l => l.status === 'interested').reduce((acc, l) => acc + (l.ticketMedio || 0), 0);
    const realizedRevenue = leads.filter(l => l.status === 'closed').reduce((acc, l) => acc + (l.ticketMedio || 0), 0);
    const replyCount = leads.filter(l => (l as any).meta_data?.reply_detected).length;
    const replyRate = contacted > 0 ? (replyCount / contacted) * 100 : 0;

    // Ranking by Niche
    const nicheMetrics = leads.reduce((acc: any, lead) => {
        if (!acc[lead.niche]) acc[lead.niche] = { name: lead.niche, leads: 0, closed: 0 };
        acc[lead.niche].leads += 1;
        if (lead.status === 'closed') acc[lead.niche].closed += 1;
        return acc;
    }, {});
    const nicheData = Object.values(nicheMetrics).sort((a: any, b: any) => b.leads - a.leads).slice(0, 5);

    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#0088FE', '#00C49F'];

    return (
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tighter uppercase italic">
                        Dashboard de <span className="text-primary italic-none">Conversão</span>
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">Métricas em tempo real da sua máquina de aquisição.</p>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                    <div className="flex-1 sm:flex-none flex items-center gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 shadow-sm">
                        <div className="text-left">
                            <p className="text-[10px] uppercase font-bold text-blue-600 tracking-widest leading-none mb-1">Leads Quentes</p>
                            <h2 className="text-2xl font-black text-blue-700">{leads.filter(l => l.temperature === 'quente').length}</h2>
                        </div>
                        <Zap className="w-8 h-8 text-blue-600 opacity-20" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <KPICard title="Total" value={totalLeads} subtitle="Capturados" icon={Users} color="text-blue-500" />
                <KPICard title="Contato" value={`${contactRate.toFixed(1)}%`} subtitle="Contactados" icon={MessageSquare} color="text-yellow-500" />
                <KPICard title="Resposta" value={`${replyRate.toFixed(1)}%`} subtitle="Feedback" icon={Zap} color="text-emerald-500" />
                <KPICard title="Conversão" value={`${closingRate.toFixed(1)}%`} subtitle="Final" icon={CheckCircle} color="text-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* --- FUNNEL CHART --- */}
                <Card className="lg:col-span-2 bg-white border-slate-100 shadow-sm rounded-2xl overflow-hidden group">
                    <CardHeader className="border-b border-slate-50 bg-slate-50/50 p-4">
                        <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2 uppercase tracking-widest">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Funil de Aquisição
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 sm:pt-8 px-1 sm:px-6">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'Total', value: totalLeads },
                                    { name: 'Contatos', value: contacted },
                                    { name: 'Interessados', value: interested },
                                    { name: 'Reuniões', value: meetings },
                                    { name: 'Fechados', value: closed }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                                    <YAxis fontSize={9} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f111a', border: '1px solid rgba(255,102,0,0.2)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {[0, 1, 2, 3, 4].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8 + (index * 0.05)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* --- TEMPERATURE DISTRIBUTION --- */}
                <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
                    <CardHeader className="border-b border-slate-50 p-4">
                        <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2 uppercase tracking-widest">
                            <Zap className="w-4 h-4 text-primary" />
                            Qualidade da Base
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Quente', value: leads.filter(l => l.temperature === 'quente').length },
                                            { name: 'Morno', value: leads.filter(l => l.temperature === 'morno').length },
                                            { name: 'Frio', value: leads.filter(l => l.temperature === 'frio').length }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        <Cell fill="#ef4444" opacity={0.8} />
                                        <Cell fill="#f59e0b" opacity={0.8} />
                                        <Cell fill="#3b82f6" opacity={0.8} />
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f111a', border: '1px solid rgba(255,102,0,0.2)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-2">
                            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] uppercase font-bold text-red-500">
                                <span className="w-2 h-2 rounded-full bg-red-500" /> Quente
                            </div>
                            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] uppercase font-bold text-orange-500">
                                <span className="w-2 h-2 rounded-full bg-orange-500" /> Morno
                            </div>
                            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] uppercase font-bold text-blue-500">
                                <span className="w-2 h-2 rounded-full bg-blue-500" /> Frio
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* --- SECOND LINE METRICS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
                    <CardHeader className="border-b border-slate-50 p-4 flex flex-row justify-between items-center">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-40">Métricas Geo</CardTitle>
                        <MapPin className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent className="py-8 sm:py-10">
                        <p className="text-[10px] text-muted-foreground uppercase text-center">
                            Processando ranking geográfico...
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
                    <CardHeader className="border-b border-slate-50 p-4 flex flex-row justify-between items-center">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-40">Timing & Feedback</CardTitle>
                        <Clock className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            <div className="p-4 bg-blue-50/30 rounded-xl border border-blue-100 flex justify-between items-center transition-all hover:bg-blue-50/50">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-blue-600 tracking-tight">Melhor Horário</p>
                                    <p className="text-lg font-bold text-slate-800">09:30 - 11:00</p>
                                </div>
                                <Clock className="w-4 h-4 text-primary opacity-30" />
                            </div>
                            <div className="p-4 bg-indigo-50/30 rounded-xl border border-indigo-100 flex justify-between items-center transition-all hover:bg-indigo-50/50">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-indigo-600 tracking-tight">Melhor Nicho</p>
                                    <p className="text-lg font-bold text-slate-800">Advocacia</p>
                                </div>
                                <Briefcase className="w-4 h-4 text-primary opacity-30" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
                    <CardHeader className="border-b border-slate-50 p-4 flex flex-row justify-between items-center">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-40">Engajamento</CardTitle>
                        <Zap className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent className="py-6 flex flex-col items-center justify-center">
                        <p className="text-3xl sm:text-4xl font-black text-primary">{replyCount}</p>
                        <p className="text-[10px] text-muted-foreground uppercase mt-1">Respostas Detectadas</p>
                    </CardContent>
                </Card>
            </div>

            {/* --- HOT LEADS LIST --- */}
            <Card className="bg-white border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-blue-50 bg-blue-50/30 p-4 sm:p-5">
                    <CardTitle className="text-lg font-black flex items-center gap-2 uppercase tracking-tighter">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Oportunidades de Ouro (Top 5)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-border/10">
                        {leads
                            .sort((a, b) => (b.score || 0) - (a.score || 0))
                            .filter(l => l.temperature === 'quente')
                            .slice(0, 5)
                            .map((lead, idx) => (
                                <div key={lead.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors group gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded">#{idx + 1}</span>
                                            <h4 className="font-bold text-sm truncate uppercase tracking-tight">{lead.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 font-bold animate-pulse whitespace-nowrap">🔥 QUENTE</span>
                                                <span className="text-[9px] text-muted-foreground font-black whitespace-nowrap">SCORE: {lead.score}</span>
                                            </div>
                                        </div>
                                        <p className="text-[11px] sm:text-xs text-primary font-bold italic line-clamp-1 opacity-80">
                                            “{(lead as any).motivoOferta || (lead as any).meta_data?.motivoPrincipalDaOferta || lead.offerReason || "Oportunidade identificada."}”
                                        </p>
                                    </div>
                                    <div className="shrink-0 flex sm:block">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full sm:w-auto h-9 sm:h-8 text-[10px] font-bold uppercase tracking-widest border-primary/20 hover:bg-primary hover:text-white transition-all"
                                            onClick={() => navigate('/leads')}
                                        >
                                            Abordar Agora
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        {leads.filter(l => l.temperature === 'quente').length === 0 && (
                            <div className="p-12 text-center text-muted-foreground">
                                <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-xs uppercase tracking-widest font-black opacity-30">Buscando leads quentes...</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const KPICard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-all hover:translate-y-[-2px] overflow-hidden relative rounded-2xl">
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${color === 'text-green-500' ? 'from-green-500' : 'from-blue-600'} to-transparent opacity-30`} />
        <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
                    <h3 className="text-2xl font-black text-foreground">{value}</h3>
                </div>
                <div className={`p-2 bg-muted/50 rounded-xl ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <p className="text-[10px] text-muted-foreground font-bold italic">{subtitle}</p>
        </CardContent>
    </Card>
);

export default ConversionDashboard;
