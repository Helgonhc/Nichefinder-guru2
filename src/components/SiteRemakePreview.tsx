import { BusinessData } from "@/types/business";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    Star,
    ArrowRight,
    Layout,
    Sparkles,
    Zap,
    Globe,
    Quote,
    Code2,
    Copy,
    RefreshCw,
    Palette,
    MapPin,
    Phone,
    ExternalLink,
    Instagram,
    Facebook,
    MessageCircle,
    Youtube,
    Cpu,
    Brain,
    AlertTriangle,
    Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { generateRemakePreview, analyzeWebsite } from "@/lib/remakePreviewEngine";
import { supabase } from "@/integrations/supabase/client";

interface SiteRemakePreviewProps {
    business: BusinessData;
    open: boolean;
    onClose: () => void;
    onRegenerate?: (newBusiness: BusinessData) => void;
}

export function SiteRemakePreview({ business, open, onClose, onRegenerate }: SiteRemakePreviewProps) {
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedModel, setSelectedModel] = useState<'gpt-5.3' | 'Llama-4-maverick'>('gpt-5.3');

    const preview = business.site_preview;
    const htmlPreview = business.generated_site_code || business.meta_data?.generated_site_code || business.html_preview || business.meta_data?.html_preview;
    const vibePrompt = business.vibe_prompt || business.meta_data?.vibe_prompt || preview?.builder_prompt;

    const [activeTab, setActiveTab] = useState<'analise' | 'problemas' | 'comparacao' | 'site_gerado' | 'prompt' | 'site_atual' | 'codigo'>(htmlPreview ? 'comparacao' : 'analise');
    const [diagnostics, setDiagnostics] = useState(preview?.site_diagnostics || { score: 0, problems: [], suggestions: [] });
    const stats = business.audit;

    // Executar análise automática se não houver score
    useEffect(() => {
        if (open && diagnostics.score === 0 && !isAnalyzing) {
            handleAnalysis();
        }
    }, [open]);

    const handleAnalysis = async () => {
        setIsAnalyzing(true);
        const toastId = toast.loading("Realizando Auditoria Profissional (Google + IA)...");
        try {
            const { analyzeLead } = await import("@/lib/leadAnalysisPipeline");
            const result = await analyzeLead(business);

            if (result.preview) {
                setDiagnostics(result.preview.preview_data.site_diagnostics || { score: 0, problems: [], suggestions: [] });

                const updatedBusiness = {
                    ...business,
                    audit: result.audit,
                    site_preview: result.preview.preview_data,
                    site_preview_summary: result.preview.summary,
                    opportunity_score: result.opportunity?.opportunity_score,
                    meta_data: {
                        ...business.meta_data,
                        technical_audit: result.audit,
                        site_preview: result.preview.preview_data,
                        opportunity_score: result.opportunity?.opportunity_score
                    }
                };

                // Persiste no banco se tiver ID
                const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
                if (isUUID(business.id)) {
                    await (supabase as any).from('leads').update({
                        meta_data: updatedBusiness.meta_data,
                        opportunity_score: result.opportunity?.opportunity_score
                    }).eq('id', business.id);
                }

                if (onRegenerate) onRegenerate(updatedBusiness);
                toast.success("Dossiê Elite concluído!", { id: toastId });

                // 3. Dispara a geração de HTML em background se não existir
                if (!updatedBusiness.html_preview && !updatedBusiness.generated_site_code) {
                    try {
                        console.log("[SiteRemakePreview] Disparando geração de HTML em background...");
                        const htmlRes = await fetch('/api/generate-html', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                leadData: {
                                    ...updatedBusiness,
                                    services: updatedBusiness.site_preview.services,
                                    testimonials: updatedBusiness.site_preview.testimonials,
                                    colorPalette: updatedBusiness.site_preview.color_palette,
                                    font: updatedBusiness.site_preview.font_family,
                                    builder_prompt: updatedBusiness.site_preview.builder_prompt
                                },
                                model: 'gpt-5.3-codex'
                            })
                        });

                        if (htmlRes.ok) {
                            const htmlData = await htmlRes.json();
                            const finalBusiness = {
                                ...updatedBusiness,
                                generated_site_code: htmlData.html,
                                html_preview: htmlData.html,
                                meta_data: {
                                    ...updatedBusiness.meta_data,
                                    generated_site_code: htmlData.html,
                                    html_preview: htmlData.html
                                }
                            };

                            if (isUUID(business.id)) {
                                await (supabase as any).from('leads').update({
                                    generated_site_code: htmlData.html,
                                    meta_data: finalBusiness.meta_data
                                }).eq('id', business.id);
                            }

                            if (onRegenerate) onRegenerate(finalBusiness);
                            console.log("[SiteRemakePreview] HTML de background concluído.");
                        }
                    } catch (htmlErr) {
                        console.warn("[SiteRemakePreview] Erro na geração de HTML de background:", htmlErr);
                    }
                }
            }
        } catch (err) {
            console.error("Erro na análise profunda:", err);
            toast.error("Falha na auditoria técnica.", { id: toastId });
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Fallback seguro se preview for nulo
    const safePreview = useMemo(() => {
        return preview || {
            headline: "Análise em Processamento...",
            subheadline: "Estamos preparando o dossiê estratégico do lead.",
            benefits: [],
            services: [],
            testimonials: [],
            cta_text: "Aguardando...",
            cta_action: "WhatsApp",
            design_style: "Premium",
            color_palette: ["#2563eb", "#1e293b", "#f8fafc"],
            layout_type: "modern-split",
            font_family: "Inter",
            hero_typography: "modern",
            hero_image_url: "",
            builder_prompt: ""
        };
    }, [preview]);

    const design = useMemo(() => {
        const palette = safePreview.color_palette || ["#2563eb", "#1e293b", "#f8fafc"];
        const layout = safePreview.layout_type || "modern-split";
        const font = safePreview.font_family || "Inter";
        return {
            primary: palette[0],
            secondary: palette[1] || palette[0],
            accent: palette[2] || "#f8fafc",
            layout,
            font
        };
    }, [safePreview]);

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-5xl p-0 h-[92vh] overflow-hidden bg-slate-950 border-white/10 shadow-2xl flex flex-col">
                {/* Fixed Header */}
                <DialogHeader className="p-4 md:p-6 bg-slate-900 border-b border-white/5 shrink-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tighter text-white uppercase italic">
                            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            Vibecoding <span className="text-blue-400">Elite Preview</span>
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Auditoria profunda e redesign estratégico do lead.
                        </DialogDescription>

                        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-white/5 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('analise')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap",
                                    activeTab === 'analise' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <Search className="w-3 h-3" /> Análise Digital
                            </button>
                            <button
                                onClick={() => setActiveTab('problemas')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap",
                                    activeTab === 'problemas' ? "bg-rose-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <AlertTriangle className="w-3 h-3" /> Problemas
                            </button>
                            <button
                                onClick={() => setActiveTab('comparacao')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap",
                                    activeTab === 'comparacao' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <RefreshCw className="w-3 h-3" /> Comparação
                            </button>
                            {business.website && (
                                <button
                                    onClick={() => setActiveTab('site_atual')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap",
                                        activeTab === 'site_atual' ? "bg-slate-700 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    <Globe className="w-3 h-3" /> Site Atual
                                </button>
                            )}
                            <button
                                onClick={() => setActiveTab('site_gerado')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap",
                                    activeTab === 'site_gerado' ? "bg-slate-700 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <Layout className="w-3 h-3" /> Site Gerado
                            </button>
                            <button
                                onClick={() => setActiveTab('codigo')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap",
                                    activeTab === 'codigo' ? "bg-slate-700 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <Quote className="w-3 h-3" /> Código HTML
                            </button>
                            <button
                                onClick={() => setActiveTab('prompt')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap",
                                    activeTab === 'prompt' ? "bg-slate-700 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <Code2 className="w-3 h-3" /> Prompt IA
                            </button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Top Score Bar */}
                <div className="bg-slate-900 border-b border-white/5 px-8 py-2 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Qualidade Atual:</span>
                        <div className={cn(
                            "px-3 py-1 rounded-full text-xs font-black",
                            diagnostics.score >= 70 ? "bg-emerald-500/10 text-emerald-400" :
                                diagnostics.score >= 50 ? "bg-amber-500/10 text-amber-400" :
                                    "bg-rose-500/10 text-rose-400"
                        )}>
                            {diagnostics.score}/100 - {
                                diagnostics.score >= 90 ? "Excelente" :
                                    diagnostics.score >= 70 ? "Bom" :
                                        diagnostics.score >= 50 ? "Mediano" :
                                            diagnostics.score >= 30 ? "Fraco" : "Muito Fraco"
                            }
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/50">
                    <AnimatePresence mode="wait">
                        {activeTab === 'site_gerado' || activeTab === 'site_atual' || activeTab === 'comparacao' ? (
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="h-full flex flex-col"
                            >
                                {activeTab === 'comparacao' ? (
                                    <div className="p-4 md:p-8 space-y-6 flex-1 flex flex-col">
                                        <div className="text-center space-y-1">
                                            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic">
                                                Comparação de Presença Digital
                                            </h2>
                                            <p className="text-slate-400 text-sm">
                                                Veja como um site moderno poderia representar melhor esta empresa.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase text-rose-400 tracking-widest">
                                                    Site Atual: {diagnostics.score || 0} / 100
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase text-emerald-400 tracking-widest">
                                                    Novo Design: {Math.max(90, (diagnostics.score || 0) + 40)} / 100
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                                            {/* Site Atual */}
                                            <div className="flex flex-col">
                                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <Globe className="w-3 h-3" /> Site Atual
                                                </h3>
                                                <div className="flex-1 rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden relative min-h-[500px]">
                                                    {business.website ? (
                                                        <iframe
                                                            src={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                                                            className="w-full h-full border-none"
                                                            title="Site Atual"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900">
                                                            <Globe className="w-12 h-12 text-slate-800 mb-4" />
                                                            <p className="text-sm text-slate-400 font-medium">
                                                                Este negócio ainda não possui um site profissional.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Novo Design */}
                                            <div className="flex flex-col">
                                                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <Sparkles className="w-3 h-3" /> Novo Site Gerado por IA
                                                </h3>
                                                <div className="flex-1 rounded-2xl border-2 border-emerald-500/20 bg-slate-900 overflow-hidden min-h-[500px] relative">
                                                    {htmlPreview ? (
                                                        <iframe
                                                            srcDoc={htmlPreview}
                                                            className="w-full h-full border-none"
                                                            sandbox="allow-scripts allow-same-origin"
                                                            title="Redesign Elite"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900 space-y-4">
                                                            <Sparkles className="w-12 h-12 text-emerald-500/20 mb-2" />
                                                            <p className="text-sm text-slate-400 font-medium">
                                                                O Design Visual ainda não foi gerado.
                                                            </p>
                                                            <Button
                                                                size="sm"
                                                                className="bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest text-[10px]"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // Dispara a regeneração para obter o HTML
                                                                    const btn = document.getElementById('btn-regenerar');
                                                                    if (btn) btn.click();
                                                                }}
                                                            >
                                                                Gerar Preview Agora
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : activeTab === 'site_atual' && business.website ? (
                                    <div className="m-4 md:m-8 relative flex-1 rounded-3xl border-4 border-slate-900 bg-white shadow-2xl overflow-hidden flex flex-col">
                                        <div className="h-10 bg-slate-100 border-b border-slate-200 px-6 flex items-center justify-between gap-4 shrink-0">
                                            <div className="flex gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                                            </div>
                                            <div className="flex-1 bg-white rounded-full px-4 py-1 text-[10px] text-slate-400 font-mono border border-slate-200 truncate">
                                                {business.website}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5"
                                                onClick={() => window.open(business.website?.startsWith('http') ? business.website : `https://${business.website}`, '_blank')}
                                            >
                                                <ExternalLink className="w-3 h-3" /> Abrir em Nova Aba
                                            </Button>
                                        </div>
                                        <div className="flex-1 relative">
                                            <iframe
                                                src={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                                                className="w-full h-full border-none"
                                                title="Site Atual"
                                            />
                                            {/* Fallback Warning Overlay (Visible if iframe fails to load or just as a hint) */}
                                            <div className="absolute bottom-4 right-4 max-w-[200px] bg-amber-50 border border-amber-200 p-2 rounded-xl shadow-lg pointer-events-none">
                                                <p className="text-[9px] text-amber-800 font-medium leading-tight">
                                                    ⚠️ Se o site não abrir, clique em "Abrir em Nova Aba". Alguns sites bloqueiam visualização interna.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : activeTab === 'site_gerado' && htmlPreview ? (
                                    <div className="m-4 md:m-8 relative flex-1 rounded-3xl border-4 border-slate-900 bg-white shadow-2xl overflow-hidden">
                                        <div className="h-10 bg-slate-100 border-b border-slate-200 px-6 flex items-center gap-4">
                                            <div className="flex gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                            </div>
                                            <div className="flex-1 bg-white rounded-full px-4 py-1 text-[10px] text-emerald-500 font-mono border border-slate-200 flex items-center gap-2">
                                                <Sparkles className="w-3 h-3" />
                                                redesign-elite-{business.name?.toLowerCase().replace(/\s+/g, '-')}.vercel.app
                                            </div>
                                        </div>
                                        <iframe
                                            srcDoc={htmlPreview}
                                            className="w-full h-full border-none"
                                            sandbox="allow-scripts allow-same-origin"
                                            title="Site Gerado Elite"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                                        <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center border border-white/10">
                                            <Globe className="w-10 h-10 text-slate-700" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tighter italic">Aguardando Redesign</h3>
                                        <p className="text-slate-500 max-w-sm text-sm">O código gerado aparecerá aqui após o processamento da IA.</p>
                                    </div>
                                )}
                            </motion.div>
                        ) : activeTab === 'analise' || activeTab === 'problemas' ? (
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="p-8 space-y-8"
                            >
                                {isAnalyzing ? (
                                    <div className="flex flex-col items-center justify-center py-20 space-y-6">
                                        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
                                        <div className="text-center">
                                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Realizando Auditoria de Elite</h3>
                                            <p className="text-slate-500 text-sm">Analisando design, copywriting e autoridade digital...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col md:flex-row gap-8 items-start">
                                        <div className="relative w-48 h-48 rounded-full border-8 border-slate-900 flex flex-col items-center justify-center bg-slate-900/50 shadow-2xl shrink-0">
                                            <span className="text-5xl font-black text-white">{diagnostics.score || 0}</span>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center px-4">Score do Site Atual</span>
                                            <div className="absolute inset-0 rounded-full border-8 border-emerald-500/20" style={{ clipPath: `inset(0 0 ${100 - (diagnostics.score || 0)}% 0)` }} />
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 gap-6 w-full">
                                            {activeTab === 'problemas' ? (
                                                <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 space-y-4">
                                                    <h5 className="font-black text-rose-400 uppercase text-xs tracking-widest flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4" /> Problemas Identificados
                                                    </h5>
                                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6">
                                                        {(diagnostics.problems || []).map((p: string, i: number) => (
                                                            <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0 mt-1" />
                                                                {p}
                                                            </li>
                                                        ))}
                                                        {(!diagnostics.problems?.length) && <li className="text-xs text-slate-500 italic">Nenhum problema crítico detectado.</li>}
                                                    </ul>
                                                </div>
                                            ) : (
                                                <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 space-y-4">
                                                    <h5 className="font-black text-emerald-400 uppercase text-xs tracking-widest flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4" /> Sugestões de Melhoria
                                                    </h5>
                                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6">
                                                        {(diagnostics.suggestions || []).map((s: string, i: number) => (
                                                            <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-1" />
                                                                {s}
                                                            </li>
                                                        ))}
                                                        {(!diagnostics.suggestions?.length) && <li className="text-xs text-slate-500 italic">Execute a auditoria para obter sugestões.</li>}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ) : activeTab === 'codigo' ? (
                            <motion.div
                                key="codigo"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-8 h-full flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xl font-black text-white uppercase italic">Código Fonte HTML</h4>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl bg-slate-800 border-white/5 text-white"
                                        onClick={() => {
                                            navigator.clipboard.writeText(htmlPreview || "");
                                            toast.success("Código copiado!");
                                        }}
                                    >
                                        <Copy className="w-4 h-4 mr-2" /> Copiar Código
                                    </Button>
                                </div>
                                <div className="flex-1 rounded-3xl border border-white/10 bg-slate-900 overflow-hidden min-h-[400px]">
                                    <textarea
                                        readOnly
                                        className="w-full h-full p-8 bg-transparent text-emerald-400/80 text-xs font-mono resize-none outline-none custom-scrollbar"
                                        value={htmlPreview || "Nenhum código gerado ainda."}
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="prompt"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-4 md:p-8 space-y-8"
                            >
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                                                <Code2 className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-white uppercase italic">Prompt para Vibecoder</h4>
                                                <p className="text-sm text-slate-500">Copie este prompt e envie para o seu Vibecoder favorito.</p>
                                            </div>
                                        </div>
                                        <Button
                                            className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-6 font-bold"
                                            onClick={() => {
                                                navigator.clipboard.writeText(vibePrompt || "");
                                                toast.success("Prompt para Vibecoder copiado!");
                                            }}
                                        >
                                            <Copy className="w-4 h-4 mr-2" /> Copiar Prompt
                                        </Button>
                                    </div>

                                    <div className="relative group overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.2)]">
                                        <textarea
                                            readOnly
                                            className="w-full p-10 bg-transparent text-emerald-400/90 text-sm font-mono whitespace-pre-wrap leading-relaxed min-h-[400px] outline-none border-none custom-scrollbar resize-none selection:bg-emerald-500/30"
                                            value={vibePrompt || "Gerando diretrizes estratégicas..."}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-6 rounded-3xl bg-blue-600/10 border border-blue-500/20 space-y-4 text-center">
                                        <h5 className="font-black text-blue-400 uppercase text-xs tracking-widest italic">Aiba de Elite</h5>
                                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-blue-500 h-full" style={{ width: '85%' }} />
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-emerald-600/10 border border-emerald-500/20 space-y-4">
                                        <h5 className="font-black text-emerald-400 uppercase text-xs tracking-widest italic text-center">Design Authority</h5>
                                        <div className="flex justify-center gap-1">
                                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-emerald-500 text-emerald-500" />)}
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-amber-600/10 border border-amber-500/20 space-y-4">
                                        <h5 className="font-black text-amber-400 uppercase text-xs tracking-widest italic text-center">Nicho Premium</h5>
                                        <div className="bg-slate-900/50 p-2 rounded-lg border border-white/5 text-center">
                                            <span className="text-[10px] text-slate-300 font-bold uppercase">{business.niche}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Fixed Footer */}
                <div className="p-6 bg-slate-900 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Configuração Estratégica</span>
                        <span className="text-xs text-slate-300 font-medium italic">Baseada no perfil real de {business.name}</span>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 md:flex-none text-slate-400 hover:text-white h-12 rounded-2xl px-6 font-bold"
                            disabled={isRegenerating}
                        >
                            Fechar
                        </Button>

                        <Button
                            id="btn-regenerar"
                            variant="secondary"
                            className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest h-12 rounded-2xl px-6 gap-2 border border-white/5 active:scale-95 transition-all"
                            onClick={async () => {
                                setIsRegenerating(true);
                                const toastId = toast.loading("Gerando Proposta de Elite...");
                                try {
                                    const styles = ['Luxo Black', 'Tech Modern', 'Futuristic Clean', 'Premium Gold'];
                                    const randomStyle = styles[Math.floor(Math.random() * styles.length)];

                                    // 1. Gera o JSON Rápido
                                    const result = await generateRemakePreview(business, randomStyle, selectedModel);

                                    // 2. Notifica o Frontend do JSON (Auditoria e Prompt)
                                    const intermediateBusiness = {
                                        ...business,
                                        site_preview: result.preview_data,
                                        site_preview_summary: result.summary,
                                        vibe_prompt: result.preview_data.builder_prompt,
                                        meta_data: {
                                            ...business.meta_data,
                                            site_preview: result.preview_data,
                                            site_preview_summary: result.summary,
                                            vibe_prompt: result.preview_data.builder_prompt,
                                        }
                                    };
                                    if (onRegenerate) onRegenerate(intermediateBusiness);
                                    toast.success("Blueprint Estratégico gerado!", { id: toastId });

                                    // 3. Gera o HTML em segundo plano (Pesado)
                                    toast.loading("Renderizando Design Visual (10-15s)...", { id: toastId });
                                    const htmlRes = await fetch('/api/generate-html', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            leadData: {
                                                ...business,
                                                services: result.preview_data.services,
                                                testimonials: result.preview_data.testimonials,
                                                colorPalette: result.preview_data.color_palette,
                                                font: result.preview_data.font_family,
                                                builder_prompt: result.preview_data.builder_prompt
                                            },
                                            model: 'gpt-5.3-codex'
                                        })
                                    });

                                    if (htmlRes.ok) {
                                        const htmlData = await htmlRes.json();
                                        const finalBusiness = {
                                            ...intermediateBusiness,
                                            generated_site_code: htmlData.html,
                                            html_preview: htmlData.html,
                                            meta_data: {
                                                ...intermediateBusiness.meta_data,
                                                generated_site_code: htmlData.html,
                                                html_preview: htmlData.html
                                            }
                                        };

                                        // Persiste o resultado final completo
                                        const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
                                        if (isUUID(business.id)) {
                                            await (supabase as any).from('leads').update({
                                                site_preview: result.preview_data,
                                                site_preview_summary: result.summary,
                                                vibe_prompt: result.preview_data.builder_prompt,
                                                generated_site_code: htmlData.html,
                                                meta_data: finalBusiness.meta_data
                                            }).eq('id', business.id);
                                        }

                                        if (onRegenerate) onRegenerate(finalBusiness);
                                        toast.success(`Design ${randomStyle} renderizado com sucesso!`, { id: toastId });
                                    }
                                } catch (err) {
                                    console.error("Erro no Regenerate:", err);
                                    toast.error("Erro ao regenerar proposta.");
                                } finally {
                                    setIsRegenerating(false);
                                }
                            }}
                            disabled={isRegenerating}
                        >
                            {isRegenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4" />}
                            Regenerar IA
                        </Button>

                        <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5 order-last md:order-none">
                            <button
                                onClick={() => setSelectedModel('gpt-5.3')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    selectedModel === 'gpt-5.3' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                <Brain className="w-3 h-3" /> GPT-5
                            </button>
                            <button
                                onClick={() => setSelectedModel('Llama-4-maverick')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    selectedModel === 'Llama-4-maverick' ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                <Cpu className="w-3 h-3" /> Llama-4
                            </button>
                        </div>

                        <Button
                            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest h-12 rounded-2xl px-8 gap-2 shadow-xl shadow-blue-600/30 active:scale-95 transition-all"
                            disabled={isRegenerating}
                        >
                            <Zap className="w-4 h-4 fill-current" /> Enviar Elite
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
