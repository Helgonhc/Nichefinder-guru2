import { useState, useEffect, useCallback, useRef } from "react";
import { BusinessData } from "@/types/business";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BusinessCard } from "@/components/BusinessCard";
import { GeneratorModal } from "@/components/GeneratorModal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Radar, ArrowLeft, Users, Download, Trash2, Clock, MessageSquare, Target, CheckCircle, Search, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { scoreLead } from "@/lib/conversionEngine";
import { useAuth } from "@/contexts/AuthContext";
import { exportLeadsToCSV } from "@/lib/exportCSV";
import { PipelineAlerts } from "@/components/PipelineAlerts";
import { calculateOpportunity } from "@/lib/opportunityEngine";

const Leads = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [leads, setLeads] = useState<BusinessData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBusiness, setSelectedBusiness] = useState<BusinessData | null>(null);
    const [modalType, setModalType] = useState<'script' | 'prompt'>('script');
    const [modalOpen, setModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const migrationAttempted = useRef(false);

    const fetchLeads = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('leads')
                .select('*')
                .eq('user_id', user.id)
                .neq('name', 'ROBOT_STATUS')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const mappedLeads: BusinessData[] = data.map((item: any) => {
                    const leadBase: BusinessData = {
                        id: item.id,
                        name: item.name,
                        niche: item.niche,
                        city: item.city,
                        address: item.address,
                        phone: item.phone,
                        website: item.website,
                        instagram: item.meta_data?.socialLinks?.instagram || item.meta_data?.instagram || item.instagram,
                        facebook: item.meta_data?.socialLinks?.facebook || item.meta_data?.facebook || item.facebook,
                        tiktok: item.meta_data?.socialLinks?.tiktok || item.meta_data?.tiktok || item.tiktok,
                        whatsapp: item.meta_data?.socialLinks?.whatsapp || item.meta_data?.whatsapp || item.whatsapp,
                        rating: item.rating,
                        totalRatings: item.total_ratings || item.meta_data?.totalRatings,
                        presenceScore: item.presence_score || item.meta_data?.presenceScore || 0,
                        missingItems: item.meta_data?.missingItems || [],
                        foundItems: item.meta_data?.foundItems || [],
                        performanceScore: item.meta_data?.performanceScore || item.meta_data?.technical_audit?.speedScore,
                        seoScore: item.meta_data?.seoScore || (item.meta_data?.technical_audit?.seoBasics ? 70 : 30),
                        mobileFriendly: item.meta_data?.mobileFriendly || item.meta_data?.technical_audit?.isResponsive,
                        status: item.status || "new",
                        notes: item.notes,
                        googleMapsUrl: item.google_maps_url || item.meta_data?.googleMapsUrl,
                        siteType: item.meta_data?.siteType || 'none',
                        isSecure: item.meta_data?.isSecure || !!item.meta_data?.technical_audit?.isSecure,
                        audit: item.meta_data?.technical_audit || item.meta_data?.audit,
                        ticketMedio: item.ticket_medio || item.meta_data?.ticket_medio || 0,
                        conversionResult: item.conversion_result || item.meta_data?.conversion_result || 'nulo',
                        cadenceStage: item.cadence_stage || item.meta_data?.cadenceStage || 'D0',
                        automationStatus: item.automation_status || item.meta_data?.automation_status || 'idle',
                        motivoOferta: item.motivo_oferta || item.meta_data?.motivoPrincipalDaOferta,

                        // Opportunity Engine Mapping
                        opportunity_score: item.opportunity_score || item.meta_data?.opportunity_score,
                        opportunity_level: item.opportunity_level || item.meta_data?.opportunity_level,
                        primary_reason: item.primary_reason || item.meta_data?.primary_reason,
                        secondary_reason: item.secondary_reason || item.meta_data?.secondary_reason,
                        recommended_offer: item.recommended_offer || item.meta_data?.recommended_offer,
                        opportunity_summary: item.opportunity_summary || item.meta_data?.opportunity_summary,
                        opportunity_flags: item.opportunity_flags || item.meta_data?.opportunity_flags
                    };

                    const { score, temperature, reason } = scoreLead(leadBase);
                    return {
                        ...leadBase,
                        score,
                        temperature,
                        offerReason: reason
                    };
                });
                setLeads(mappedLeads);
            }
        } catch (error: any) {
            console.error("Error fetching leads:", error);
            toast.error(error.message || "Erro ao carregar seus leads.");
        } finally {
            setLoading(false);
        }
    }, [user]); // fetchLeads

    const migrateLocalLeads = useCallback(async (userId: string) => {
        if (migrationAttempted.current) return;
        migrationAttempted.current = true;

        const local = localStorage.getItem('leadradar_leads');
        if (!local) return;

        try {
            const localLeads: BusinessData[] = JSON.parse(local);
            if (localLeads.length === 0) return;

            toast.info("Sincronizando registros locais...");

            const leadsToInsert = localLeads.map(lead => ({
                user_id: userId,
                name: lead.name,
                niche: lead.niche,
                city: lead.city,
                address: lead.address,
                phone: lead.phone,
                website: lead.website,
                rating: lead.rating,
                total_ratings: lead.totalRatings,
                presence_score: lead.presenceScore,
                status: 'new',
                meta_data: {
                    googleMapsUrl: lead.googleMapsUrl,
                    instagram: lead.instagram,
                    facebook: lead.facebook,
                    tiktok: lead.tiktok,
                    whatsapp: lead.whatsapp,
                    missingItems: lead.missingItems,
                    foundItems: lead.foundItems,
                    performanceScore: lead.performanceScore,
                    seoScore: lead.seoScore,
                    mobileFriendly: lead.mobileFriendly,
                    // --- OPPORTUNITY ENGINE INTEGRATION ---
                    ...calculateOpportunity(lead)
                }
            }));

            const { error } = await (supabase as any).from('leads').insert(leadsToInsert);

            if (!error) {
                localStorage.removeItem('leadradar_leads');
                toast.success("Sincronização concluída.");
                await fetchLeads();
            }
        } catch (err) {
            console.error("Migration error:", err);
        }
    }, [user, fetchLeads]); // migrateLocalLeads

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                navigate("/login");
            } else {
                migrateLocalLeads(user.id);
                fetchLeads();
            }
        }
    }, [user, authLoading, migrateLocalLeads, fetchLeads, navigate]);

    const handleDeleteLead = async (id: string) => {
        try {
            const { error } = await (supabase as any)
                .from('leads')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setLeads(leads.filter(l => l.id !== id));
            toast.success("Lead removido com sucesso.");
        } catch (error: any) {
            toast.error("Erro ao remover lead.");
        }
    };

    const handleExportLeads = () => {
        const toExport = filteredLeads.length > 0 ? filteredLeads : leads;
        exportLeadsToCSV(toExport, `leads_leadradar_${new Date().toISOString().slice(0, 10)}.csv`);
        toast.success(`${toExport.length} leads exportados em CSV!`);
    };

    const handleGenerateScript = (business: BusinessData) => {
        setSelectedBusiness(business);
        setModalType('script');
        setModalOpen(true);
    };

    const handleGeneratePrompt = (business: BusinessData) => {
        setSelectedBusiness(business);
        setModalType('prompt');
        setModalOpen(true);
    };

    const handleStatusChange = async (id: string, newStatus: BusinessData["status"]) => {
        try {
            const { error } = await (supabase as any)
                .from('leads')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
            toast.success(`Status atualizado`);
        } catch (error: any) {
            toast.error("Erro ao atualizar status.");
        }
    };

    const handleClearAllLeads = async () => {
        if (!window.confirm("Atenção: Isso irá apagar TODOS os seus leads permanentemente. Continuar?")) return;

        try {
            const { error } = await (supabase as any)
                .from('leads')
                .delete()
                .neq('name', 'ROBOT_STATUS');

            if (error) throw error;

            setLeads([]);
            toast.success("Todos os leads foram removidos.");
        } catch (err) {
            toast.error("Erro ao limpar lista.");
        }
    };

    const handleScheduleDispatch = async (id: string) => {
        try {
            const scheduledAt = new Date(Date.now() + 1000 * 60 * 5).toISOString(); // 5 mins from now
            const { data: lead } = await (supabase as any).from('leads').select('meta_data').eq('id', id).single();
            const newMetaData = { ...(lead?.meta_data || {}), automation_status: 'queued', scheduled_at: scheduledAt };
            await (supabase as any).from('leads').update({ meta_data: newMetaData }).eq('id', id);
            toast.success("Adicionado à fila de disparo automático!");
        } catch (err) {
            toast.error("Erro ao agendar.");
        }
    };

    const filteredLeads = leads.filter(lead => {
        const matchesTab = activeTab === "all" ? true : (activeTab === "hot" ? (lead.score || 0) >= 70 : lead.status === activeTab);
        const matchesSearch = !searchTerm ||
            lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.city.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesTab && matchesSearch;
    });

    return (
        <div className="bg-background">
            <main className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl">
                <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-display font-bold text-foreground tracking-tight">
                            Meus Leads
                        </h2>
                        <p className="text-muted-foreground text-sm sm:text-base">Oportunidades salvas e gestão de contatos</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {leads.length > 0 && (
                            <>
                                <Button variant="outline" size="sm" className="flex-1 sm:flex-none gap-2 text-destructive hover:bg-destructive/10 h-10 sm:h-9" onClick={handleClearAllLeads}>
                                    <Trash2 className="w-4 h-4" />
                                    <span>Limpar</span>
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1 sm:flex-none gap-2 h-10 sm:h-9" onClick={handleExportLeads}>
                                    <Download className="w-4 h-4" />
                                    <span>Exportar</span>
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Pipeline Alerts — B3 */}
                {leads.length > 0 && <PipelineAlerts leads={leads} />}

                {leads.length > 0 && (
                    <div className="mb-6 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <Search className="w-4 h-4" />
                        </div>
                        <Input
                            placeholder="Pesquisar leads..."
                            className="pl-10 pr-10 h-12 bg-slate-50 border-slate-200 text-base sm:text-sm focus:ring-1 focus:ring-primary/20 transition-all font-mediumShadow"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSearchTerm("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                ) : leads.length === 0 ? (
                    <div className="text-center py-24 bg-white border-2 border-slate-100 border-dashed rounded-3xl shadow-sm">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <h3 className="text-xl font-semibold mb-2">Nenhum lead</h3>
                        <p className="text-muted-foreground mb-6 max-w-xs mx-auto text-sm">Comece escaneando negócios e salve as melhores oportunidades.</p>
                        <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 h-11 px-8 font-bold shadow-lg shadow-blue-500/20">
                            <Link to="/">Voltar para Busca</Link>
                        </Button>
                    </div>
                ) : (
                    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
                            <TabsList className="flex md:grid w-max md:w-full md:grid-cols-6 bg-slate-50 border border-slate-100 h-auto p-1 mb-2 gap-1 ring-offset-background">
                                <TabsTrigger value="all" className="whitespace-nowrap px-4 py-2 text-xs font-bold">Todos ({leads.length})</TabsTrigger>
                                <TabsTrigger value="hot" className="whitespace-nowrap px-4 py-2 text-xs gap-1 bg-red-50 text-red-600 border border-red-100 font-black">
                                    <Target className="w-3 h-3 text-red-500" />
                                    QUENTES ({leads.filter(l => (l.score || 0) >= 70).length})
                                </TabsTrigger>
                                <TabsTrigger value="new" className="whitespace-nowrap px-4 py-2 text-xs gap-1 font-bold">
                                    <Clock className="w-3 h-3 text-blue-500" />
                                    Novos ({leads.filter(l => l.status === 'new').length})
                                </TabsTrigger>
                                <TabsTrigger value="contacted" className="whitespace-nowrap px-4 py-2 text-xs gap-1 font-bold">
                                    <MessageSquare className="w-3 h-3 text-amber-500" />
                                    Contato ({leads.filter(l => l.status === 'contacted').length})
                                </TabsTrigger>
                                <TabsTrigger value="interested" className="whitespace-nowrap px-4 py-2 text-xs gap-1 font-bold">
                                    <Target className="w-3 h-3 text-green-500" />
                                    Interessados ({leads.filter(l => l.status === 'interested').length})
                                </TabsTrigger>
                                <TabsTrigger value="closed" className="whitespace-nowrap px-4 py-2 text-xs gap-1 font-bold">
                                    <CheckCircle className="w-3 h-3 text-slate-400" />
                                    Fechados ({leads.filter(l => l.status === 'closed').length})
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mt-6">
                            {filteredLeads.map((lead, i) => (
                                <div key={lead.id} className="relative group/lead-card">
                                    <BusinessCard
                                        business={lead}
                                        index={i}
                                        onGenerateScript={handleGenerateScript}
                                        onGeneratePrompt={handleGeneratePrompt}
                                        onStatusChange={handleStatusChange}
                                        onUpdateBusiness={(updatedLead) => {
                                            setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
                                        }}
                                        isSavedView={true}
                                    />
                                    <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover/lead-card:opacity-100 transition-opacity z-20">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-8 w-8 sm:w-auto gap-2 bg-primary/20 text-primary hover:bg-primary/30 backdrop-blur-md border border-primary/20"
                                            onClick={() => handleScheduleDispatch(lead.id!)}
                                            title="Agendar Disparo"
                                        >
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Agendar</span>
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-8 w-8 backdrop-blur-md shadow-lg"
                                            onClick={() => handleDeleteLead(lead.id!)}
                                            title="Remover Lead"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredLeads.length === 0 && (
                            <div className="text-center py-20 bg-slate-50 border border-slate-100 border-dashed rounded-3xl">
                                <p className="text-muted-foreground">Nenhum lead nesta categoria.</p>
                            </div>
                        )}
                    </Tabs>
                )}
            </main>

            <GeneratorModal
                business={selectedBusiness}
                type={modalType}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </div>
    );
};

export default Leads;
