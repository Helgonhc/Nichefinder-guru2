import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Zap,
    Clock,
    Play,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Plus,
    RefreshCw,
    Search,
    MessageSquare,
    Users,
    MapPin,
    Globe,
    Send,
    Calendar,
    Monitor,
    User,
    Check,
    Trash2,
    Brain,
    Power,
    Activity,
    Sliders,
    Eye,
    Target,
    ZapOff,
    Terminal,
    Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NICHES } from "@/types/business";
import { generateContent } from "@/lib/aiService";
import { RobotHUD } from "@/components/automation/RobotHUD";
import { RobotRealtimeTerminal } from "@/components/automation/RobotRealtimeTerminal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";

export default function Automation() {
    const navigate = useNavigate();
    const { user, profile, loading: authLoading } = useAuth();

    // --- ESTADOS ---
    const [isProcessing, setIsProcessing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTask, setCurrentTask] = useState<string | null>(null);
    const [stats, setStats] = useState({ total: 0, completed: 0, running: 0, queued: 0, hot: 0 });
    const [recentResults, setRecentResults] = useState<any[]>([]);
    const [queuedLeads, setQueuedLeads] = useState<any[]>([]);
    const [robotStatus, setRobotStatus] = useState<'offline' | 'online'>('offline');
    const [isRobotConnected, setIsRobotConnected] = useState(false);
    const [isRobotPaused, setIsRobotPaused] = useState(false);
    const [robotLogs, setRobotLogs] = useState<string[]>([]);
    const [fullName, setFullName] = useState<string>("Você");
    const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
    const [lastPing, setLastPing] = useState<string | null>(null);
    const [currentAction, setCurrentAction] = useState<string>("Iniciando...");
    const [activeTab, setActiveTab] = useState<'control' | 'settings' | 'history' | 'funnel'>('control');
    const [funnelLeads, setFunnelLeads] = useState<any[]>([]);
    const [schedulerConfig, setSchedulerConfig] = useState({
        city: '',
        scansPerDay: 1,
        autoAnalyze: false,
        autoSend: false,
        autoOpenBrowser: false,
        active: false,
        captureStart: '22:00',
        captureEnd: '06:00',
        sendStart: '09:00',
        sendEnd: '18:00',
        forceCapture: false,
        forceSend: false
    });

    // --- REFS E DERIVADOS ---
    const activeTabRef = useRef(activeTab);
    const lastUserActionRef = useRef<number>(0);
    const userId = user?.id || null;
    const userEmail = user?.email || null;

    useEffect(() => {
        activeTabRef.current = activeTab;
    }, [activeTab]);

    // --- FUNÇÕES DE BUSCA ---
    const fetchStats = async () => {
        if (!user) return;
        try {
            const { count: totalCount } = await (supabase as any)
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .neq('name', 'ROBOT_STATUS')
                .eq('user_id', user.id);

            const { count: contactedCount } = await (supabase as any)
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .neq('name', 'ROBOT_STATUS')
                .eq('user_id', user.id)
                .in('status', ['contacted', 'interested', 'closed']);

            const { count: queuedCount } = await (supabase as any)
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .neq('name', 'ROBOT_STATUS')
                .eq('user_id', user.id)
                .eq('automation_status', 'queued');

            // Count Hot Leads (Score >= 70)
            const { data: leadsForScoring } = await (supabase as any)
                .from('leads')
                .select('*')
                .neq('name', 'ROBOT_STATUS')
                .eq('user_id', user.id)
                .limit(100);

            let hotCount = 0;
            if (leadsForScoring) {
                const { scoreLead } = await import("@/lib/conversionEngine");
                hotCount = leadsForScoring.filter((l: any) => {
                    const { score } = scoreLead({
                        ...l,
                        totalRatings: l.total_ratings,
                        presenceScore: l.presence_score,
                        isSecure: l.meta_data?.isSecure,
                        mobileFriendly: l.meta_data?.mobileFriendly,
                        siteType: l.meta_data?.siteType,
                        facebook: l.meta_data?.facebook,
                        tiktok: l.meta_data?.tiktok
                    } as any);
                    return score >= 70;
                }).length;
            }

            setStats({
                total: totalCount || 0,
                completed: contactedCount || 0,
                running: 0,
                queued: queuedCount || 0,
                hot: hotCount || 0
            });

            // Fetch Funnel Leads
            const { data: funnelData } = await (supabase as any)
                .from('leads')
                .select('*')
                .neq('name', 'ROBOT_STATUS')
                .eq('user_id', user.id)
                .not('meta_data->>cadenceStage', 'is', null)
                .order('updated_at', { ascending: false });

            setFunnelLeads(funnelData || []);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchRecentResults = async () => {
        if (!user) return;
        try {
            const { data } = await (supabase as any)
                .from('leads')
                .select('*')
                .eq('user_id', user.id)
                .neq('name', 'ROBOT_STATUS')
                .or('meta_data->>last_generated_script.not.is.null,meta_data->>last_site_analysis.not.is.null')
                .order('updated_at', { ascending: false })
                .limit(10);

            if (data) setRecentResults(data);
        } catch (err) {
            console.error("Error fetching results:", err);
        }
    };

    const fetchQueuedLeads = async () => {
        if (!user) return;
        try {
            const { data } = await (supabase as any)
                .from('leads')
                .select('*')
                .eq('user_id', user.id)
                .eq('automation_status', 'queued')
                .order('updated_at', { ascending: true })
                .limit(20);

            if (data) setQueuedLeads(data);
        } catch (err) {
            console.error("Error fetching queued leads:", err);
        }
    };

    const fetchRobotStatus = async () => {
        if (!user) return;
        try {
            const { data, error } = await (supabase as any)
                .from('leads')
                .select('*')
                .eq('name', 'ROBOT_STATUS')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (!data && !error) {
                await (supabase as any).from('leads').insert([{
                    name: 'ROBOT_STATUS',
                    user_id: user.id,
                    status: 'new',
                    niche: 'system',
                    city: 'system',
                    phone: 'system',
                    address: 'system',
                    website: 'system',
                    rating: 5,
                    total_ratings: 0,
                    presence_score: 100,
                    meta_data: {
                        logs: ["Robô inicializado via Dashboard"],
                        last_ping: new Date().toISOString(),
                        status: 'online',
                        automation_status: 'idle',
                        last_scan_at: new Date().toISOString()
                    }
                }]);
                return;
            }

            if (data?.meta_data) {
                const meta = data.meta_data as any;
                const lastPing = new Date(meta.last_ping).getTime();
                const isOnline = Date.now() - lastPing < 20000;
                setRobotStatus(isOnline ? 'online' : 'offline');
                setRobotLogs(isOnline ? (meta.logs || []) : []);
                setIsRobotConnected(isOnline && !!meta.connected);
                setIsRobotPaused(isOnline && !!meta.paused);
                setLastPing(meta.last_ping || null);
                setCurrentAction(meta.automation_status || "IDLE");

                const hasRecentAction = Date.now() - lastUserActionRef.current < 15000;
                if (activeTabRef.current !== 'settings' && !loading && !hasRecentAction) {
                    if (meta.scheduler) {
                        setSchedulerConfig(prev => {
                            if (JSON.stringify(prev) === JSON.stringify(meta.scheduler)) return prev;
                            return {
                                city: meta.scheduler.city || '',
                                scansPerDay: meta.scheduler.scansPerDay || 0,
                                autoAnalyze: !!meta.scheduler.autoAnalyze,
                                autoSend: !!meta.scheduler.autoSend,
                                autoOpenBrowser: !!meta.scheduler.autoOpenBrowser,
                                active: !!meta.scheduler.active,
                                captureStart: meta.scheduler.captureStart || '22:00',
                                captureEnd: meta.scheduler.captureEnd || '06:00',
                                sendStart: meta.scheduler.sendStart || '09:00',
                                sendEnd: meta.scheduler.sendEnd || '18:00',
                                forceCapture: !!meta.scheduler.forceCapture,
                                forceSend: !!meta.scheduler.forceSend
                            };
                        });
                    }
                    if (meta.selectedNiches) {
                        setSelectedNiches(meta.selectedNiches);
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching robot status:", err);
        }
    };

    // --- EFFECTS ---
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                navigate("/login");
            } else {
                if (profile?.full_name) setFullName(profile.full_name);
                fetchStats();
                fetchRecentResults();
                fetchQueuedLeads();
                fetchRobotStatus();
            }
        }
    }, [user, authLoading, profile]);

    useEffect(() => {
        if (!user) return;
        const channel = (supabase as any)
            .channel(`robot-status-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'leads',
                    filter: `name=eq.ROBOT_STATUS`
                },
                (payload: any) => {
                    if (payload.new.user_id === user.id) {
                        const meta = payload.new.meta_data;
                        if (meta) {
                            const lastPing = new Date(meta.last_ping).getTime();
                            const isOnline = (Date.now() - lastPing < 45000) && meta.status === 'online';
                            setRobotStatus(isOnline ? 'online' : 'offline');
                            setRobotLogs(isOnline ? (meta.logs || []) : []);
                            setIsRobotPaused(isOnline && !!meta.paused);
                            setIsRobotConnected(isOnline && !!meta.connected);
                        }
                    }
                }
            )
            .subscribe();

        const interval = setInterval(fetchRobotStatus, 10000);
        return () => {
            (supabase as any).removeChannel(channel);
            clearInterval(interval);
        };
    }, [user]);

    // --- LÓGICA DE NEGÓCIOS ---
    const startBulkGeneration = async () => {
        try {
            setLoading(true);
            const { data: leads, error: fetchError } = await (supabase as any)
                .from('leads')
                .select('*')
                .neq('name', 'ROBOT_STATUS')
                .is('meta_data->>last_generated_script', null) // Only process leads without scripts
                .limit(20);

            if (fetchError) throw fetchError;
            if (!leads || leads.length === 0) {
                toast.info("Todos os seus leads já possuem scripts gerados ou a lista está vazia.");
                setLoading(false);
                return;
            }

            setIsProcessing(true);
            toast.info(`Iniciando geração de scripts para ${leads.length} leads...`);

            let completedCount = 0;
            for (const lead of leads) {
                setCurrentTask(`Processando: ${lead.name}`);
                try {
                    const result = await generateContent(lead, 'script', fullName);

                    if (result && result.content) {
                        const newMetaData = {
                            ...(lead.meta_data || {}),
                            last_generated_script: result.content,
                            generated_at: new Date().toISOString()
                        };

                        await (supabase as any)
                            .from('leads')
                            .update({
                                meta_data: newMetaData,
                                status: lead.status === 'new' ? 'contacted' : lead.status
                            })
                            .eq('id', lead.id);

                        console.log(`[Automation] script salvo para ${lead.name}`);
                    }

                    completedCount++;
                    setProgress(Math.round((completedCount / leads.length) * 100));
                } catch (err) {
                    console.error(`Error processing ${lead.name}:`, err);
                }
            }

            setIsProcessing(false);
            setCurrentTask(null);
            setProgress(0);
            fetchStats();
            fetchRecentResults();
            toast.success(`Automação concluída! ${completedCount} scripts gerados.`);
        } catch (error: any) {
            toast.error("Erro na automação.");
            console.error(error);
        } finally {
            setIsProcessing(false);
            setLoading(false);
        }
    };

    const startBulkAnalysis = async () => {
        try {
            setLoading(true);
            const { data: leads, error: fetchError } = await (supabase as any)
                .from('leads')
                .select('*')
                .neq('name', 'ROBOT_STATUS')
                .not('website', 'is', null)
                .is('meta_data->>last_site_analysis', null)
                .limit(15);

            if (fetchError) throw fetchError;
            if (!leads || leads.length === 0) {
                toast.info("Todos os seus leads com site já possuem análise ou a lista está vazia.");
                setLoading(false);
                return;
            }

            setIsProcessing(true);
            toast.info(`Iniciando análise técnica de ${leads.length} sites...`);

            let completedCount = 0;
            for (const lead of leads) {
                setCurrentTask(`Analisando: ${lead.name}`);
                try {
                    const result = await generateContent(lead, 'analysis', fullName);

                    if (result && result.content) {
                        const newMetaData = {
                            ...(lead.meta_data || {}),
                            last_site_analysis: result.content,
                            analyzed_at: new Date().toISOString()
                        };

                        await (supabase as any)
                            .from('leads')
                            .update({
                                meta_data: newMetaData
                            })
                            .eq('id', lead.id);
                    }

                    completedCount++;
                    setProgress(Math.round((completedCount / leads.length) * 100));
                } catch (err) {
                    console.error(`Error analyzing ${lead.name}:`, err);
                }
            }

            setIsProcessing(false);
            setCurrentTask(null);
            setProgress(0);
            fetchStats();
            fetchRecentResults();
            toast.success(`Análise concluída! ${completedCount} diagnósticos gerados.`);
        } catch (error: any) {
            toast.error("Erro na análise técnica.");
            console.error(error);
        } finally {
            setIsProcessing(false);
            setLoading(false);
        }
    };

    const runScraper = async () => {
        if (!schedulerConfig.city) {
            toast.warning("Defina uma cidade alvo no 'Plano de Voo' primeiro.");
            setActiveTab('settings');
            return;
        }

        if (selectedNiches.length === 0) {
            toast.warning("Selecione pelo menos um nicho no 'Plano de Voo'.");
            setActiveTab('settings');
            return;
        }

        setLoading(true);
        try {
            // 1. Strict Online Check
            const { data: robotStatusLeads } = await (supabase as any)
                .from('leads')
                .select('*')
                .eq('name', 'ROBOT_STATUS')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);

            const robotStatusLead = robotStatusLeads?.[0];

            const meta = robotStatusLead?.meta_data || {};
            const lastPing = meta.last_ping ? new Date(meta.last_ping).getTime() : 0;
            const isActuallyOnline = Date.now() - lastPing < 20000;

            if (!isActuallyOnline) {
                toast.error("O Robô Scraper está offline. Inicie o terminal primeiro.", {
                    description: "O script bridge/wa-bot.js precisa estar rodando para minerar."
                });
                setRobotStatus('offline');
                setLoading(false);
                return;
            }

            // 2. Send Command
            const newMeta = {
                ...meta,
                selectedNiches, // Ensure niches are synced
                scheduler: {
                    ...(meta.scheduler || {}),
                    city: schedulerConfig.city, // Ensure city is synced
                    forceCapture: true
                }
            };

            await (supabase as any)
                .from('leads')
                .update({ meta_data: newMeta })
                .eq('id', robotStatusLead?.id || '')
                .eq('user_id', userId);

            toast.success("Comando enviado: Minerar Agora!");
            toast.loading("O robô iniciará a varredura em instantes. Acompanhe pelo console.", { duration: 5000 });

        } catch (err) {
            console.error("Error running scraper:", err);
            toast.error("Erro ao enviar comando de mineração.");
        } finally {
            setLoading(false);
        }
    };

    const saveScraperConfig = async () => {
        try {
            setLoading(true);
            const { data: robotStatusLead } = await (supabase as any)
                .from('leads')
                .select('id, meta_data')
                .eq('name', 'ROBOT_STATUS')
                .eq('user_id', userId)
                .maybeSingle();

            if (!robotStatusLead) {
                // Se não existir, criamos o registro inicial para o usuário
                const { error: insertError } = await (supabase as any)
                    .from('leads')
                    .insert([{
                        name: 'ROBOT_STATUS',
                        user_id: userId,
                        status: 'new',
                        niche: 'system',
                        city: 'system',
                        phone: 'system',
                        address: 'system',
                        website: 'system',
                        rating: 5,
                        total_ratings: 0,
                        presence_score: 100,
                        meta_data: {
                            isOnline: false,
                            lastSeen: new Date().toISOString(),
                            selectedNiches,
                            scheduler: schedulerConfig,
                            automation_status: 'idle',
                            last_scan_at: new Date().toISOString()
                        }
                    }]);

                if (insertError) throw insertError;
                toast.success("Plano de Voo inicial criado com sucesso!");
                return;
            }

            const newMetaData = {
                ...(robotStatusLead.meta_data || {}),
                selectedNiches,
                scheduler: schedulerConfig
            };

            const { error: updateError } = await (supabase as any)
                .from('leads')
                .update({ meta_data: newMetaData })
                .eq('id', robotStatusLead.id)
                .eq('user_id', userId);

            if (updateError) throw updateError;

            toast.success("Configurações do Plano de Voo salvas com sucesso!");
        } catch (err) {
            toast.error("Erro ao salvar configurações.");
        } finally {
            setLoading(false);
        }
    };

    const clearRecentResults = async () => {
        // First, get ALL leads that have history fields (not just the 10 shown in UI)
        try {
            setLoading(true);
            const { data: allWithHistory, error: fetchError } = await (supabase as any)
                .from('leads')
                .select('id, meta_data')
                .neq('name', 'ROBOT_STATUS')
                .or('meta_data->>last_generated_script.not.is.null,meta_data->>last_site_analysis.not.is.null');

            if (fetchError) throw fetchError;

            if (!allWithHistory || allWithHistory.length === 0) {
                toast.info("Não há histórico para limpar.");
                return;
            }

            const confirm = window.confirm(`Isso removerá os scripts e análises de ${allWithHistory.length} leads. Deseja continuar?`);
            if (!confirm) return;

            let successCount = 0;
            for (const lead of allWithHistory) {
                const newMetaData = { ...(lead.meta_data || {}) };
                delete newMetaData.last_generated_script;
                delete newMetaData.last_site_analysis;
                delete newMetaData.generated_at;
                delete newMetaData.analyzed_at;

                const { error: updateError } = await (supabase as any)
                    .from('leads')
                    .update({ meta_data: newMetaData })
                    .eq('id', lead.id);

                if (!updateError) successCount++;
            }

            toast.success(`${successCount} registros de histórico limpos!`);
            fetchRecentResults();
            fetchStats();
        } catch (err) {
            console.error("Error clearing history:", err);
            toast.error("Erro ao limpar histórico.");
        } finally {
            setLoading(false);
        }
    };

    const clearRobotLogs = async () => {
        try {
            setLoading(true);
            const { data: robotStatusLeads } = await (supabase as any)
                .from('leads')
                .select('*')
                .eq('name', 'ROBOT_STATUS')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);

            const robotStatusLead = robotStatusLeads?.[0];

            if (robotStatusLead) {
                const newMeta = {
                    ...robotStatusLead.meta_data,
                    logs: ["Histórico de logs limpo em " + new Date().toLocaleString()]
                };
                const { error } = await (supabase as any)
                    .from('leads')
                    .update({ meta_data: newMeta })
                    .eq('id', robotStatusLead?.id || '');

                if (error) throw error;
                setRobotLogs(newMeta.logs);
                toast.success("Log do robô limpo!");
            }
        } catch (err) {
            toast.error("Erro ao limpar log.");
        } finally {
            setLoading(false);
        }
    };

    const togglePauseRobot = async () => {
        if (!userId) {
            toast.error("Usuário não identificado.");
            return;
        }

        try {
            setLoading(true);
            const { data: robotStatusLeads } = await (supabase as any)
                .from('leads')
                .select('*')
                .eq('name', 'ROBOT_STATUS')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);

            const robotStatusLead = robotStatusLeads?.[0];
            const meta = robotStatusLead?.meta_data || {};
            const newPausedState = !meta.paused;

            const logMsg = `[${new Date().toLocaleTimeString('pt-BR')}] 👤 Dashboard: Comando de ${newPausedState ? 'PAUSA' : 'RETOMADA'} enviado.`;
            const updatedLogs = [...(meta.logs || []), logMsg].slice(-15);

            await (supabase as any).from('leads').update({
                meta_data: { ...meta, paused: newPausedState, logs: updatedLogs }
            }).eq('id', robotStatusLead?.id || '');

            toast.success(newPausedState ? "Robô pausado!" : "Robô retomado!");
            setIsRobotPaused(newPausedState);
            setRobotLogs(updatedLogs);
        } catch (err) {
            toast.error("Erro ao alterar estado do robô.");
        } finally {
            setLoading(false);
        }
    };

    const stopRobotInstance = async () => {
        if (!userId) {
            toast.error("Usuário não identificado.");
            return;
        }

        const confirm = window.confirm("Isso encerrará o processo do robô no computador local. Deseja continuar?");
        if (!confirm) return;

        try {
            setLoading(true);
            const { data: robotStatusLeads } = await (supabase as any)
                .from('leads')
                .select('*')
                .eq('name', 'ROBOT_STATUS')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);

            const robotStatusLead = robotStatusLeads?.[0];
            const meta = robotStatusLead?.meta_data || {};

            const logMsg = `[${new Date().toLocaleTimeString('pt-BR')}] 🛑 Dashboard: Comando de ENCERRAMENTO enviado.`;
            const updatedLogs = [...(meta.logs || []), logMsg].slice(-15);

            await (supabase as any).from('leads').update({
                meta_data: { ...meta, requestShutdown: true, logs: updatedLogs }
            }).eq('id', robotStatusLead?.id || '');

            toast.success("Comando de parada enviado!");
            setRobotLogs(updatedLogs);
        } catch (err) {
            toast.error("Erro ao enviar comando de parada.");
        } finally {
            setLoading(false);
        }
    };

    const scheduleDispatch = async (leadId: string) => {
        try {
            const scheduledAt = new Date(Date.now() + 1000 * 60 * 5).toISOString(); // Default to 5 mins from now

            const { data: lead } = await (supabase as any)
                .from('leads')
                .select('meta_data')
                .eq('id', leadId)
                .single();

            const newMetaData = {
                ...(lead?.meta_data || {}),
                automation_status: 'queued',
                scheduled_at: scheduledAt
            };

            const { error } = await (supabase as any)
                .from('leads')
                .update({ meta_data: newMetaData })
                .eq('id', leadId);

            if (error) throw error;
            toast.success("Lead adicionado à fila de disparo!");
            fetchQueuedLeads();
            fetchStats();
        } catch (err) {
            toast.error("Erro ao agendar disparo.");
        }
    };

    const startRobot = async () => {
        setLoading(true);
        try {
            // 1. Fetch latest status directly from DB to avoid stale UI state
            const { data: robotStatusLeads } = await (supabase as any)
                .from('leads')
                .select('*')
                .eq('name', 'ROBOT_STATUS')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);

            const robotStatusLead = robotStatusLeads?.[0];

            const meta = robotStatusLead?.meta_data || {};
            const lastPing = meta.last_ping ? new Date(meta.last_ping).getTime() : 0;
            const isActuallyOnline = Date.now() - lastPing < 20000; // Strict 20s check

            if (!isActuallyOnline) {
                toast.error("O Script Bridge (wa-bot.js) parece estar offline. Verifique o terminal.", {
                    description: "Último sinal de vida: " + (meta.last_ping ? new Date(meta.last_ping).toLocaleTimeString() : "Nunca")
                });
                setRobotStatus('offline'); // Force UI update
                return;
            }

            const currentConnected = !!meta.connected;
            const newConnectedState = !currentConnected;

            const newMeta = {
                ...meta,
                connected: newConnectedState
            };

            await (supabase as any)
                .from('leads')
                .update({ meta_data: newMeta })
                .eq('id', robotStatusLead?.id || '');

            setIsRobotConnected(newConnectedState);
            toast.success(newConnectedState ? "Comando enviado: Conectar Robô" : "Comando enviado: Desconectar Robô");

            // Optimistic update for UI feedback
            if (newConnectedState) {
                const toastId = toast.loading("Aguardando abertura do WhatsApp...");
                setTimeout(() => toast.dismiss(toastId), 4000);
            }

        } catch (err) {
            console.error("Erro no startRobot:", err);
            toast.error("Erro ao comunicar com o robô.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
            {/* Background patterns */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none" />

            <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl relative z-10">
                {/* ROBOT MASTER BANNER */}
                <div className="mb-8 p-1 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-white p-4 sm:p-6 rounded-[22px] flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left">
                            <div className="relative">
                                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-500 ${robotStatus === 'online' ? 'bg-blue-50 border-blue-200 text-blue-600 scale-105' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                    <Monitor className={`w-7 h-7 sm:w-8 sm:h-8 ${robotStatus === 'online' ? 'animate-pulse' : ''}`} />
                                </div>
                                {robotStatus === 'online' && (
                                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-blue-500 border-2 border-white rounded-full shadow-sm" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-900 font-boldx flex-col sm:flex-row items-center gap-2">
                                    Robot Master
                                    <Badge variant="outline" className="text-[9px] sm:text-[10px] py-0 h-5 bg-primary/10 border-primary/20 text-primary">v2.0 Beta</Badge>
                                </h1>
                                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500 mt-1">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${robotStatus === 'online' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                        <span>Núcleo: {robotStatus === 'online' ? 'Ativo' : 'Standby'}</span>
                                    </div>
                                    <span className="hidden sm:inline text-slate-300">|</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isRobotConnected ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
                                        <span>Conexão: {isRobotConnected ? 'Interligado' : 'Aguardando'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto pb-1 mt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200 shadow-sm w-max sm:w-full">
                            {[
                                { id: 'control', label: 'Comando', icon: Zap },
                                { id: 'funnel', label: 'Funil', icon: Target },
                                { id: 'settings', label: 'Plano Voo', icon: Sliders },
                                { id: 'history', label: 'Logs', icon: Activity }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-300 whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                        : 'text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200'
                                        }`}
                                >
                                    <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* REMOTE CONTROL BAR (INTEGRATED) */}
                    <div className="mt-4 flex flex-col sm:flex-row items-center gap-3 justify-center sm:justify-end border-t border-border/10 pt-4 px-2">
                        <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground sm:mr-2">Processo Remoto:</span>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                                variant={isRobotPaused ? "secondary" : "outline"}
                                size="sm"
                                className={`flex-1 sm:flex-none h-9 sm:h-7 text-[10px] sm:text-xs gap-1.5 transition-all duration-300 active:scale-95 shadow-sm ${isRobotPaused ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50 hover:bg-yellow-500/30' : 'text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200'}`}
                                onClick={togglePauseRobot}
                                disabled={!isRobotConnected && robotStatus === 'offline'}
                            >
                                {isRobotPaused ? <Play className="w-3.5 h-3.5 fill-current animate-pulse" /> : <ZapOff className="w-3.5 h-3.5" />}
                                {isRobotPaused ? "RETOMAR" : "PAUSAR"}
                            </Button>

                            <Button
                                variant="destructive"
                                size="sm"
                                className="flex-1 sm:flex-none h-9 sm:h-7 text-[10px] sm:text-xs gap-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-all duration-300 active:scale-95 group shadow-sm"
                                onClick={stopRobotInstance}
                                disabled={robotStatus === 'offline'}
                            >
                                <Power className="w-3.5 h-3.5 group-hover:animate-pulse" />
                                ENCERRAR
                            </Button>
                        </div>
                    </div>
                </div>

                {
                    isProcessing && (
                        <div className="mb-8 p-6 bg-primary/5 border border-primary/20 rounded-2xl animate-fade-in text-card-foreground">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                        <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground truncate max-w-[200px]">{currentTask}</h3>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Processando em Lote...</p>
                                    </div>
                                </div>
                                <span className="text-xl font-display font-bold text-primary">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2 bg-primary/10 [&>div]:bg-gradient-primary" />
                        </div>
                    )
                }

                {/* TAB CONTENT: CONTROL ROOM */}
                {
                    activeTab === 'control' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                            {/* TOP: MISSION CONTROL HUD (FULL WIDTH) */}
                            <RobotHUD
                                status={robotStatus}
                                isPaused={isRobotPaused}
                                isConnected={isRobotConnected}
                                lastPing={lastPing}
                                currentAction={currentAction}
                                stats={stats}
                            />

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* LEFT: COMMANDS (2/3) */}
                                <div className="lg:col-span-2 space-y-8">
                                    {/* MASTER SWITCH & MANUAL TRIGGERS */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                                        <Card className={cn(
                                            "col-span-1 md:col-span-2 bg-white border border-slate-200 shadow-sm transition-all relative overflow-hidden",
                                            schedulerConfig.active ? "border-blue-200" : "hover:border-blue-300"
                                        )}>

                                            <CardContent className="pt-6 relative z-10">
                                                <div
                                                    className="flex items-center justify-between cursor-pointer"
                                                    onClick={async () => {
                                                        lastUserActionRef.current = Date.now();
                                                        const newState = !schedulerConfig.active;
                                                        setSchedulerConfig(prev => ({ ...prev, active: newState }));
                                                        try {
                                                            setLoading(true);
                                                            const { data: robotStatusLead } = await (supabase as any)
                                                                .from('leads')
                                                                .select('meta_data')
                                                                .eq('name', 'ROBOT_STATUS')
                                                                .eq('user_id', userId)
                                                                .maybeSingle();

                                                            const newMeta = {
                                                                ...(robotStatusLead?.meta_data || {}),
                                                                paused: !newState, // Comando de pausa imediata para o robô
                                                                scheduler: {
                                                                    ...(robotStatusLead?.meta_data?.scheduler || {}),
                                                                    active: newState
                                                                }
                                                            };
                                                            await (supabase as any)
                                                                .from('leads')
                                                                .update({ meta_data: newMeta })
                                                                .eq('name', 'ROBOT_STATUS')
                                                                .eq('user_id', userId);

                                                            toast.success(newState ? "Modo Autônomo ATIVADO" : "Modo Autônomo DESATIVADO (Standby)");
                                                        } catch (e) {
                                                            setSchedulerConfig(prev => ({ ...prev, active: !newState }));
                                                            toast.error("Erro ao alterar estado.");
                                                        } finally {
                                                            setLoading(false);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                                            schedulerConfig.active ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-slate-100 text-slate-400"
                                                        )}>
                                                            <Power className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg text-slate-900">{schedulerConfig.active ? "Sistema Online" : "Modo Manual"}</h3>
                                                            <p className="text-xs text-slate-500">
                                                                {schedulerConfig.active ? "Inteligência operando via cronograma" : "Pressione para ativar o piloto automático"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={cn("text-xs font-black uppercase tracking-widest", schedulerConfig.active ? "text-blue-600" : "text-slate-300")}>
                                                            {schedulerConfig.active ? "Ativado" : "Inativo"}
                                                        </span>
                                                        <Switch checked={schedulerConfig.active} className="data-[state=checked]:bg-blue-600" />
                                                    </div>
                                                </div>

                                                {/* Sub-controles rápidos */}
                                                {schedulerConfig.active && (
                                                    <div
                                                        className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn("p-2 rounded-lg", schedulerConfig.autoAnalyze ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                                                                    <Search className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-bold uppercase tracking-tight text-slate-700">Minerar</span>
                                                                    <span className="text-[9px] text-slate-500 font-medium">Auto-Captação</span>
                                                                </div>
                                                            </div>
                                                            <Switch
                                                                checked={schedulerConfig.autoAnalyze}
                                                                onCheckedChange={async (val) => {
                                                                    lastUserActionRef.current = Date.now();
                                                                    const newConfig = { ...schedulerConfig, autoAnalyze: val };
                                                                    setSchedulerConfig(newConfig);
                                                                    // Persistência rápida com trava
                                                                    setLoading(true);
                                                                    try {
                                                                        const { data: robotStatusLead } = await (supabase as any)
                                                                            .from('leads')
                                                                            .select('id, meta_data')
                                                                            .eq('name', 'ROBOT_STATUS')
                                                                            .eq('user_id', userId)
                                                                            .maybeSingle();

                                                                        if (robotStatusLead) {
                                                                            await (supabase as any).from('leads').update({
                                                                                meta_data: { ...robotStatusLead.meta_data, scheduler: newConfig }
                                                                            }).eq('id', robotStatusLead.id);
                                                                            toast.success(val ? "Mineração Automática ATIVADA" : "Mineração Automática DESATIVADA");
                                                                        }
                                                                    } catch (e) {
                                                                        setSchedulerConfig(prev => ({ ...prev, autoAnalyze: !val }));
                                                                        toast.error("Erro ao salvar configuração.");
                                                                    } finally {
                                                                        setLoading(false);
                                                                    }
                                                                }}
                                                            />
                                                        </div>

                                                        <div className="flex items-center justify-between p-3 rounded-xl bg-success/5 border border-success/10">
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn("p-2 rounded-lg", schedulerConfig.autoSend ? "bg-success/20 text-success" : "bg-muted text-muted-foreground")}>
                                                                    <Send className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-bold uppercase tracking-tight text-slate-700">Disparar</span>
                                                                    <span className="text-[9px] text-slate-500 font-medium">Auto-Envio Zap</span>
                                                                </div>
                                                            </div>
                                                            <Switch
                                                                checked={schedulerConfig.autoSend}
                                                                onCheckedChange={async (val) => {
                                                                    lastUserActionRef.current = Date.now();
                                                                    const newConfig = { ...schedulerConfig, autoSend: val };
                                                                    setSchedulerConfig(newConfig);
                                                                    // Persistência rápida com trava
                                                                    setLoading(true);
                                                                    try {
                                                                        const { data: robotStatusLead } = await (supabase as any)
                                                                            .from('leads')
                                                                            .select('id, meta_data')
                                                                            .eq('name', 'ROBOT_STATUS')
                                                                            .eq('user_id', userId)
                                                                            .maybeSingle();

                                                                        if (robotStatusLead) {
                                                                            await (supabase as any).from('leads').update({
                                                                                meta_data: { ...robotStatusLead.meta_data, scheduler: newConfig }
                                                                            }).eq('id', robotStatusLead.id);
                                                                            toast.success(val ? "Disparo Automático ATIVADA" : "Disparo Automático DESATIVADA");
                                                                        }
                                                                    } catch (e) {
                                                                        setSchedulerConfig(prev => ({ ...prev, autoSend: !val }));
                                                                        toast.error("Erro ao salvar configuração.");
                                                                    } finally {
                                                                        setLoading(false);
                                                                    }
                                                                }}
                                                            />
                                                        </div>

                                                        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-100/50">
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn("p-2 rounded-lg", schedulerConfig.autoOpenBrowser ? "bg-blue-100 text-blue-600" : "bg-muted text-muted-foreground")}>
                                                                    <Monitor className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-bold uppercase tracking-tight text-slate-700">Sistema</span>
                                                                    <span className="text-[9px] text-slate-500 font-medium">Auto-Abrir Navegador</span>
                                                                </div>
                                                            </div>
                                                            <Switch
                                                                checked={schedulerConfig.autoOpenBrowser}
                                                                onCheckedChange={async (val) => {
                                                                    lastUserActionRef.current = Date.now();
                                                                    const newConfig = { ...schedulerConfig, autoOpenBrowser: val };
                                                                    setSchedulerConfig(newConfig);
                                                                    // Persistência rápida com trava
                                                                    setLoading(true);
                                                                    try {
                                                                        const { data: robotStatusLead } = await (supabase as any)
                                                                            .from('leads')
                                                                            .select('id, meta_data')
                                                                            .eq('name', 'ROBOT_STATUS')
                                                                            .eq('user_id', userId)
                                                                            .maybeSingle();

                                                                        if (robotStatusLead) {
                                                                            await (supabase as any).from('leads').update({
                                                                                meta_data: { ...robotStatusLead.meta_data, scheduler: newConfig }
                                                                            }).eq('id', robotStatusLead.id);
                                                                            toast.success(val ? "O Chrome abrirá sozinho se necessário" : "Navegador blindado para abertura manual");
                                                                        }
                                                                    } catch (e) {
                                                                        setSchedulerConfig(prev => ({ ...prev, autoOpenBrowser: !val }));
                                                                        toast.error("Erro ao salvar configuração.");
                                                                    } finally {
                                                                        setLoading(false);
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                            {schedulerConfig.active && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-success/5 via-transparent to-transparent pointer-events-none" />
                                            )}
                                        </Card>
                                        <Card className="bg-card border border-slate-200/60 shadow-sm group hover:border-primary/50 transition-all cursor-pointer" onClick={startBulkGeneration}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                        <Brain className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg">Sales Guru</h3>
                                                        <p className="text-xs text-muted-foreground">Gerar scripts para leads frios</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-card border border-slate-200/60 shadow-sm group hover:border-primary/50 transition-all cursor-pointer" onClick={startBulkAnalysis}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                        <Globe className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-slate-900">Analista Técnico</h3>
                                                        <p className="text-xs text-slate-500">Diagnóstico de SEO/Performance</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* GATILHOS RÁPIDOS (ROBOT STATUS) */}
                                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-blue-500" />
                                            Comandos Manuais
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <Button
                                                variant="outline"
                                                className="h-12 sm:h-14 gap-3 bg-card/50 border-primary/20 hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                                                onClick={runScraper}
                                            >
                                                <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                                                Minerar Agora
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="h-12 sm:h-14 gap-3 bg-card/50 border-success/20 hover:bg-success hover:text-success-foreground text-xs sm:text-sm"
                                                onClick={async () => {
                                                    if (stats.queued === 0) {
                                                        toast.warning("Não há leads na fila para abordar. Agende alguns registros primeiro.");
                                                        setActiveTab('history');
                                                        return;
                                                    }

                                                    setLoading(true);
                                                    try {
                                                        // 1. Strict Online Check
                                                        const { data: robotStatusLead } = await (supabase as any)
                                                            .from('leads')
                                                            .select('meta_data')
                                                            .eq('name', 'ROBOT_STATUS')
                                                            .maybeSingle();

                                                        const meta = robotStatusLead?.meta_data || {};
                                                        const lastPing = meta.last_ping ? new Date(meta.last_ping).getTime() : 0;
                                                        const isActuallyOnline = Date.now() - lastPing < 20000;

                                                        if (!isActuallyOnline) {
                                                            toast.error("O Robô está offline. Inicie o terminal primeiro.", {
                                                                description: "O script bridge/wa-bot.js precisa estar rodando para disparar mensagens."
                                                            });
                                                            setRobotStatus('offline');
                                                            setLoading(false);
                                                            return;
                                                        }

                                                        // 2. Send Command
                                                        const newMeta = {
                                                            ...meta,
                                                            scheduler: {
                                                                ...(meta.scheduler || {}),
                                                                forceSend: true
                                                            }
                                                        };
                                                        await (supabase as any).from('leads').update({ meta_data: newMeta }).eq('name', 'ROBOT_STATUS');
                                                        toast.success("Comando: Disparo de Mensagens iniciado!");
                                                    } catch (err) {
                                                        toast.error("Erro ao enviar comando.");
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                            >
                                                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                                                Abordar Agora
                                            </Button>
                                        </div>
                                    </div>

                                    {/* TEST LAB (NEW) */}
                                    <div className="p-4 sm:p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                            Teste Unitário de Campo
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4 items-end">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-slate-700 font-bold">Nome do Lead</Label>
                                                    <Input id="test-name" placeholder="Ex: Lead Teste" className="h-9 bg-slate-50 border-slate-200 text-xs placeholder:text-slate-400 focus:bg-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-slate-700 font-bold">WhatsApp (com DDD)</Label>
                                                    <Input id="test-phone" placeholder="Ex: 5511999999999" className="h-9 bg-slate-50 border-slate-200 text-xs placeholder:text-slate-400 focus:bg-white" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-700 font-bold">Nicho (para Script)</Label>
                                                <select id="test-niche" className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-slate-900 focus:bg-white">
                                                    {NICHES.map(n => <option key={n.value} value={n.value} className="bg-white text-slate-900">{n.label}</option>)}
                                                </select>
                                            </div>
                                            <Button
                                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-9 text-xs"
                                                onClick={async () => {
                                                    const name = (document.getElementById('test-name') as HTMLInputElement).value;
                                                    const phone = (document.getElementById('test-phone') as HTMLInputElement).value;
                                                    const niche = (document.getElementById('test-niche') as HTMLSelectElement).value;

                                                    if (!name || !phone) {
                                                        toast.error("Preencha nome e telefone.");
                                                        return;
                                                    }

                                                    setLoading(true);
                                                    try {
                                                        const { data: { user } } = await (supabase as any).auth.getUser();

                                                        if (!user) {
                                                            toast.error("Você precisa estar logado.");
                                                            return;
                                                        }

                                                        // Gerar o script de teste antes de inserir
                                                        const testLead = { name, phone, niche, city: "Laboratório" };
                                                        const result = await generateContent(testLead as any, 'script', fullName);
                                                        const script = result?.content || "Oi! Vi seu negócio no Google e achei muito legal. Vamos conversar?";

                                                        const { data, error } = await (supabase as any)
                                                            .from('leads')
                                                            .insert([{
                                                                name: name + " (TESTE)",
                                                                niche,
                                                                city: "Laboratório",
                                                                phone,
                                                                user_id: user.id,
                                                                status: 'new',
                                                                meta_data: {
                                                                    source: 'manual_test',
                                                                    last_generated_script: script,
                                                                    automation_status: 'queued',
                                                                    scheduled_at: new Date().toISOString()
                                                                }
                                                            }]);

                                                        if (error) throw error;

                                                        const { data: robotStatusLeads } = await (supabase as any)
                                                            .from('leads')
                                                            .select('*')
                                                            .eq('name', 'ROBOT_STATUS')
                                                            .eq('user_id', user.id)
                                                            .order('created_at', { ascending: false })
                                                            .limit(1);
                                                        const robotStatusLead = robotStatusLeads?.[0];

                                                        await (supabase as any).from('leads').update({
                                                            meta_data: {
                                                                ...(robotStatusLead?.meta_data || {}),
                                                                scheduler: { ...(robotStatusLead?.meta_data?.scheduler || {}), forceSend: true }
                                                            }
                                                        }).eq('id', robotStatusLead?.id || '');

                                                        toast.success("Lead de Teste enviado para a fila de disparo!");
                                                    } catch (err) {
                                                        toast.error("Erro ao criar teste.");
                                                        console.error(err);
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                            >
                                                <Send className="w-3.5 h-3.5 mr-2" />
                                                Testar Disparo
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT: CONSOLE & LAB (1/3) */}
                                <div className="space-y-6">
                                    <RobotRealtimeTerminal
                                        logs={robotLogs}
                                        status={robotStatus}
                                        onClear={clearRobotLogs}
                                        onStop={stopRobotInstance}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* TAB CONTENT: FLIGHT CONFIG */}
                {
                    activeTab === 'settings' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500 pb-20">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="bg-card border border-slate-200/60 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            Destino e Frequência
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-slate-700 font-bold">Cidade Alvo</Label>
                                            <Input
                                                placeholder="Ex: São Paulo, SP"
                                                value={schedulerConfig.city}
                                                onChange={(e) => setSchedulerConfig(prev => ({ ...prev, city: e.target.value }))}
                                                className="bg-slate-50 border-slate-200 placeholder:text-slate-400"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-slate-700 font-bold">Varreduras por Dia</Label>
                                            <Input
                                                type="number"
                                                value={schedulerConfig.scansPerDay}
                                                onChange={(e) => setSchedulerConfig(prev => ({ ...prev, scansPerDay: parseInt(e.target.value) }))}
                                                className="bg-slate-50 border-slate-200"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-card border border-slate-200/60 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-primary" />
                                            Janelas de Operação
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-8">
                                        <div className="space-y-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                            <Label className="text-[10px] uppercase font-bold text-primary">Mineração (Scraper)</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] text-slate-500 font-bold">Início</span>
                                                    <Input type="time" value={schedulerConfig.captureStart} onChange={(e) => setSchedulerConfig(prev => ({ ...prev, captureStart: e.target.value }))} className="bg-slate-100 border-slate-200" />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] text-slate-500 font-bold">Fim</span>
                                                    <Input type="time" value={schedulerConfig.captureEnd} onChange={(e) => setSchedulerConfig(prev => ({ ...prev, captureEnd: e.target.value }))} className="bg-slate-100 border-slate-200" />
                                                </div>
                                            </div>
                                            <div className="pt-2 flex items-center justify-between border-t border-primary/10">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold uppercase">Mineração Automática</span>
                                                    <span className="text-[9px] text-muted-foreground">Capturar e analisar leads novos</span>
                                                </div>
                                                <Switch
                                                    checked={schedulerConfig.autoAnalyze}
                                                    onCheckedChange={(val) => setSchedulerConfig(prev => ({ ...prev, autoAnalyze: val }))}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 p-4 bg-success/5 rounded-2xl border border-success/10">
                                            <Label className="text-[10px] uppercase font-bold text-success">Atendimento (Disparo)</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] text-slate-500 font-bold">Início</span>
                                                    <Input type="time" value={schedulerConfig.sendStart} onChange={(e) => setSchedulerConfig(prev => ({ ...prev, sendStart: e.target.value }))} className="bg-slate-100 border-slate-200" />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] text-slate-500 font-bold">Fim</span>
                                                    <Input type="time" value={schedulerConfig.sendEnd} onChange={(e) => setSchedulerConfig(prev => ({ ...prev, sendEnd: e.target.value }))} className="bg-slate-100 border-slate-200" />
                                                </div>
                                            </div>
                                            <div className="pt-2 flex items-center justify-between border-t border-success/10">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold uppercase">Disparo Automático</span>
                                                    <span className="text-[9px] text-muted-foreground">Enviar mensagens no WhatsApp</span>
                                                </div>
                                                <Switch
                                                    checked={schedulerConfig.autoSend}
                                                    onCheckedChange={(val) => setSchedulerConfig(prev => ({ ...prev, autoSend: val }))}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 p-4 bg-muted/20 rounded-2xl border border-border/50">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Sistema Avançado</Label>
                                            <div className="flex items-center justify-between border-t border-border/50 pt-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold uppercase">Auto Abrir Navegador</span>
                                                    <span className="text-[9px] text-muted-foreground">Rodar rotina 100% em 2º plano localmente</span>
                                                </div>
                                                <Switch
                                                    checked={schedulerConfig.autoOpenBrowser}
                                                    onCheckedChange={(val) => setSchedulerConfig(prev => ({ ...prev, autoOpenBrowser: val }))}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="bg-card border border-slate-200/60 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Target className="w-4 h-4 text-primary" />
                                        Nichos Selecionados
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                        {NICHES.filter(n => {
                                            if (n.value === 'terapias_holisticas') {
                                                return userEmail === 'junioemanuel38@gmail.com' || userEmail === 'helgonhc19@yahoo.com.br';
                                            }
                                            if (n.value === 'telemetria') {
                                                return userEmail === 'junioemanuel38@gmail.com' ||
                                                    userEmail === 'helgonhc19@yahoo.com.br' ||
                                                    userEmail === 'operacaomg@eletricom.me';
                                            }
                                            return true;
                                        }).map((n) => (
                                            <div
                                                key={n.value}
                                                onClick={() => setSelectedNiches(prev => prev.includes(n.value) ? prev.filter(v => v !== n.value) : [...prev, n.value])}
                                                className={`p-3 rounded-xl border text-[11px] cursor-pointer transition-all flex items-center justify-between group ${selectedNiches.includes(n.value) ? 'bg-primary/20 border-primary text-primary' : 'bg-background/40 border-border/50 text-muted-foreground hover:border-primary/50'}`}
                                            >
                                                <span className="font-bold truncate">{n.label}</span>
                                                {selectedNiches.includes(n.value) && <Check className="w-3 h-3" />}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                                <div className="p-6 border-t border-border/50 flex justify-end gap-3 bg-primary/5">
                                    <Button size="lg" className="bg-primary text-primary-foreground px-12 font-bold shadow-xl shadow-primary/20" onClick={saveScraperConfig} disabled={loading}>
                                        SALVAR PLANO DE VOO
                                    </Button>
                                </div>
                            </Card>
                        </div >
                    )
                }

                {/* TAB CONTENT: FUNNEL TRACKING */}
                {
                    activeTab === 'funnel' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-display font-bold text-foreground">Esteira de Conversão</h2>
                                        <p className="text-xs text-muted-foreground mt-1 tracking-tight">Acompanhe a cadência automática de seus leads</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {['D0', 'D2', 'D5', 'D9'].map(s => (
                                            <Badge key={s} variant="outline" className="bg-primary/5 border-primary/20 text-primary font-bold">
                                                {s}: {funnelLeads.filter(l => (l.meta_data.cadenceStage || 'D0') === s).length}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {funnelLeads.length > 0 ? (
                                        funnelLeads.map((lead) => (
                                            <Card key={lead.id} className="bg-card border border-slate-200/60 shadow-sm overflow-hidden hover:border-primary/30 transition-all border-l-4 border-l-primary/40">
                                                <div className="p-5 flex flex-col md:flex-row items-center gap-6">
                                                    <div className="flex-1 w-full md:w-auto">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h4 className="font-bold text-base text-foreground">{lead.name}</h4>
                                                            <Badge className={cn(
                                                                "text-[10px] font-black italic",
                                                                lead.meta_data.cadenceStage === 'D0' ? 'bg-blue-500' :
                                                                    lead.meta_data.cadenceStage === 'D2' ? 'bg-yellow-500' :
                                                                        lead.meta_data.cadenceStage === 'D5' ? 'bg-orange-500' :
                                                                            'bg-green-500'
                                                            )}>
                                                                ESTÁGIO {lead.meta_data.cadenceStage || 'D0'}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</span>
                                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {lead.city}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-center md:items-end gap-1.5 w-full md:w-[200px] bg-primary/5 p-3 rounded-2xl border border-primary/10">
                                                        <span className="text-[10px] uppercase font-black text-primary tracking-widest">Próxima Interação</span>
                                                        <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                                                            <Calendar className="w-3.5 h-3.5 text-primary" />
                                                            {lead.meta_data.scheduled_at ? new Date(lead.meta_data.scheduled_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'Concluído'}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-1.5 justify-center md:justify-end">
                                                        {(lead.meta_data.automation_logs || []).slice(-3).map((log: any, idx: number) => (
                                                            <div key={idx} className="w-7 h-7 rounded-full bg-success/20 border border-success/30 flex items-center justify-center text-[10px] font-bold text-success animate-pulse" title={`${log.stage} em ${new Date(log.date).toLocaleDateString()}`}>
                                                                {log.stage}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center space-y-4 bg-muted/10 rounded-3xl border border-dashed border-border">
                                            <Target className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                                            <p className="text-slate-500 font-semibold">Nenhum lead em cadência no momento.</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    )
                }
                {
                    activeTab === 'history' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                            {queuedLeads.length > 0 && (
                                <section>
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-warning mb-4 flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Fila de Disparo (Aguardando Janela)
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {queuedLeads.map((lead) => (
                                            <Card key={lead.id} className="bg-card border border-slate-200/60 shadow-sm border-l-4 border-l-warning">
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-bold text-xs truncate max-w-[150px]">{lead.name}</h4>
                                                            <p className="text-[10px] text-muted-foreground">{lead.phone}</p>
                                                        </div>
                                                        <Badge variant="outline" className="text-[8px] bg-warning/10">
                                                            {new Date(lead.meta_data.scheduled_at).toLocaleTimeString()}
                                                        </Badge>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="w-full h-7 mt-3 text-[9px] hover:text-destructive" onClick={async () => {
                                                        const newMetaData = { ...(lead.meta_data || {}) }; delete newMetaData.automation_status; delete newMetaData.scheduled_at;
                                                        await (supabase as any).from('leads').update({ meta_data: newMetaData }).eq('id', lead.id);
                                                        fetchQueuedLeads(); fetchStats();
                                                    }}>Cancelar</Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-success flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> Resultados Recentes
                                    </h2>
                                    <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={clearRecentResults} disabled={loading || recentResults.length === 0}>
                                        Limpar Histórico
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {recentResults.map((lead) => (
                                        <Card key={lead.id} className="bg-card border border-slate-200/60 shadow-sm overflow-hidden group hover:border-success/30 transition-all">
                                            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/20">
                                                <div className="p-4 bg-primary/5 min-w-[200px]">
                                                    <h4 className="font-bold text-sm truncate">{lead.name}</h4>
                                                    <div className="text-[10px] text-muted-foreground space-y-1 mt-1">
                                                        <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {lead.city}</p>
                                                        <Badge className="bg-success text-success-foreground text-[8px] h-4">PRONTO</Badge>
                                                    </div>
                                                </div>
                                                <div className="p-4 flex-1">
                                                    <div className="text-[11px] text-foreground/80 italic line-clamp-2 mb-3 leading-relaxed">
                                                        "{lead.meta_data.last_site_analysis || lead.meta_data.last_generated_script}"
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="secondary" size="sm" className="h-7 text-[9px] px-3" onClick={() => { navigator.clipboard.writeText(lead.meta_data.last_site_analysis || lead.meta_data.last_generated_script); toast.success("Copiado!"); }}>Copiar</Button>
                                                        <Button variant="outline" size="sm" className="h-7 text-[9px] px-3" onClick={() => scheduleDispatch(lead.id)}>Re-agendar</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )
                }
            </main>
        </div>
    );
}
