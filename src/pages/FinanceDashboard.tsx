import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { BusinessData } from "@/types/business";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    TrendingUp, DollarSign, Wallet, PieChart as PieIcon,
    ChevronRight, ArrowUpRight, ArrowDownRight, Briefcase
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie
} from 'recharts';

import { useAuth } from "@/contexts/AuthContext";

const FinanceDashboard = () => {
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
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('leads')
                .select('*')
                .neq('name', 'ROBOT_STATUS');

            if (error) throw error;
            if (data) {
                setLeads(data.map((item: any) => ({
                    ...item,
                    status: item.status || 'new',
                    ticketMedio: item.ticket_medio || 0,
                    niche: item.niche || 'N/A'
                })));
            }
        } catch (err) {
            console.error("Finance metric error:", err);
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
    const closedLeads = leads.filter(l => l.status === 'closed');
    const interestedLeads = leads.filter(l => l.status === 'interested');

    const realizedRevenue = closedLeads.reduce((acc, l) => acc + (l.ticketMedio || 0), 0);
    const potentialRevenue = interestedLeads.reduce((acc, l) => acc + (l.ticketMedio || 0), 0);
    const totalPipeline = leads.reduce((acc, l) => acc + (l.ticketMedio || 0), 0);
    const avgTicket = closedLeads.length > 0 ? realizedRevenue / closedLeads.length : 0;

    // Niche Data (Revenue focus)
    const nicheMetrics = leads.reduce((acc: any, lead) => {
        if (!acc[lead.niche]) acc[lead.niche] = { name: lead.niche, revenue: 0, potential: 0 };
        if (lead.status === 'closed') acc[lead.niche].revenue += (lead.ticketMedio || 0);
        if (lead.status === 'interested') acc[lead.niche].potential += (lead.ticketMedio || 0);
        return acc;
    }, {});

    const nicheRevenueData = Object.values(nicheMetrics)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);

    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#0088FE', '#00C49F'];

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">
                        Painel de <span className="text-primary italic-none">Finanças & ROI</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">Sua máquina de lucros em números reais.</p>
                </div>
                <div className="flex gap-2">
                    <Card className="bg-primary/5 border-primary/20 p-4 flex flex-col justify-center items-center">
                        <p className="text-[10px] font-black uppercase text-primary">Saldo Projetado</p>
                        <p className="text-xl font-black">R$ {(realizedRevenue + potentialRevenue).toLocaleString('pt-BR')}</p>
                    </Card>
                </div>
            </div>

            {/* --- TOP KPIs --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FinanceKPICard
                    title="Faturamento Realizado"
                    value={`R$ ${realizedRevenue.toLocaleString('pt-BR')}`}
                    subtitle="Dinheiro no bolso"
                    icon={Wallet}
                    color="text-emerald-500"
                    trend="+12%" // Fixed for now
                />
                <FinanceKPICard
                    title="Receita Potencial"
                    value={`R$ ${potentialRevenue.toLocaleString('pt-BR')}`}
                    subtitle="Leads interessados"
                    icon={DollarSign}
                    color="text-primary"
                    trend="+25%"
                />
                <FinanceKPICard
                    title="Ticket Médio"
                    value={`R$ ${Math.round(avgTicket).toLocaleString('pt-BR')}`}
                    subtitle="Média por venda"
                    icon={TrendingUp}
                    color="text-blue-500"
                />
                <FinanceKPICard
                    title="Pipeline Total"
                    value={`R$ ${totalPipeline.toLocaleString('pt-BR')}`}
                    subtitle="Oportunidade total"
                    icon={Briefcase}
                    color="text-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- REVENUE BY NICHE --- */}
                <Card className="lg:col-span-2 card-glass border-primary/10">
                    <CardHeader className="border-b border-border/10 bg-muted/20">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-primary" />
                            Faturamento por Nicho (Top 5)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={nicheRevenueData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} hide />
                                    <YAxis dataKey="name" type="category" fontSize={10} axisLine={false} tickLine={false} width={100} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f111a', border: '1px solid rgba(255,102,0,0.2)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR')}`}
                                    />
                                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]} fill="#22c55e">
                                        {nicheRevenueData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* --- COMPOSITION --- */}
                <Card className="card-glass border-primary/10">
                    <CardHeader className="border-b border-border/10">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <PieIcon className="w-4 h-4 text-primary" />
                            Distribuição Financeira
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Realizado', value: realizedRevenue },
                                            { name: 'Potencial', value: potentialRevenue },
                                            { name: 'Perda Estimada', value: totalPipeline - realizedRevenue - potentialRevenue }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        <Cell fill="#10b981" />
                                        <Cell fill="#ff6600" />
                                        <Cell fill="#334155" />
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f111a', border: '1px solid rgba(255,102,0,0.2)', borderRadius: '12px' }}
                                        formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR')}`}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 mt-4">
                            <div className="flex justify-between items-center text-[10px] uppercase font-bold">
                                <span className="text-emerald-500">Realizado</span>
                                <span>{totalPipeline > 0 ? Math.round((realizedRevenue / totalPipeline) * 100) : 0}%</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] uppercase font-bold">
                                <span className="text-primary">Potencial</span>
                                <span>{totalPipeline > 0 ? Math.round((potentialRevenue / totalPipeline) * 100) : 0}%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const FinanceKPICard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => (
    <Card className="card-glass border-primary/10 hover:border-primary/30 transition-all hover:translate-y-[-2px] overflow-hidden relative group">
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${color.includes('emerald') ? 'from-emerald-500' : 'from-primary'} to-transparent opacity-30`} />
        <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
                    <h3 className="text-3xl font-black text-foreground tracking-tighter">{value}</h3>
                </div>
                <div className={`p-2 bg-muted/50 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
                <p className="text-[10px] text-muted-foreground font-bold italic">{subtitle}</p>
                {trend && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${trend.includes('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'} flex items-center gap-0.5`}>
                        {trend.includes('+') ? <ArrowUpRight className="w-2 h-2" /> : <ArrowDownRight className="w-2 h-2" />}
                        {trend}
                    </span>
                )}
            </div>
        </CardContent>
    </Card>
);

export default FinanceDashboard;
