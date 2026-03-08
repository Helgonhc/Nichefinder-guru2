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
    Eye,
    MapPin,
    Phone,
    ExternalLink,
    Instagram,
    Facebook,
    MessageCircle,
    Youtube
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { generateRemakePreview } from "@/lib/remakePreviewEngine";
import { supabase } from "@/integrations/supabase/client";

interface SiteRemakePreviewProps {
    business: BusinessData;
    open: boolean;
    onClose: () => void;
    onRegenerate?: (newBusiness: BusinessData) => void;
}

export function SiteRemakePreview({ business, open, onClose, onRegenerate }: SiteRemakePreviewProps) {
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'preview' | 'site' | 'prompt'>('preview');
    const preview = business.site_preview as any;
    const htmlPreview = (business as any).html_preview as string | undefined;
    const stats = business.audit as any;

    // Configurações Dinâmicas de Estilo
    const design = useMemo(() => {
        const palette = preview?.color_palette || ["#2563eb", "#1e293b", "#f8fafc"];
        const layout = preview?.layout_type || "modern-split";
        const font = preview?.font_family || "Inter";
        return {
            primary: palette[0],
            secondary: palette[1] || palette[0],
            accent: palette[2] || "#f8fafc",
            layout,
            font
        };
    }, [preview]);

    if (!preview) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-4xl p-0 h-[92vh] overflow-hidden bg-slate-950 border-white/10 shadow-2xl flex flex-col">
                {/* Fixed Header */}
                <DialogHeader className="p-4 md:p-6 bg-slate-900 border-b border-white/5 shrink-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tighter text-white uppercase italic">
                            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            Site <span className="text-blue-400">Elite Preview</span>
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Visualização antecipada da proposta de site gerada por inteligência artificial para este lead.
                        </DialogDescription>

                        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-white/5">
                            <button
                                onClick={() => setActiveTab('preview')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                                    activeTab === 'preview' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <Eye className="w-3.5 h-3.5" /> Visual
                            </button>
                            {htmlPreview && (
                                <button
                                    onClick={() => setActiveTab('site')}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                                        activeTab === 'site' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    <Globe className="w-3.5 h-3.5" /> Site
                                </button>
                            )}
                            <button
                                onClick={() => setActiveTab('prompt')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                                    activeTab === 'prompt' ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <Code2 className="w-3.5 h-3.5" /> Prompt IA
                            </button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/50">
                    <AnimatePresence mode="wait">
                        {activeTab === 'site' && htmlPreview ? (
                            <motion.div
                                key="site"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="h-full"
                            >
                                {/* Browser mockup com iframe */}
                                <div className="m-4 md:m-8 relative rounded-3xl border-4 border-slate-900 bg-white shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
                                    <div className="h-12 bg-slate-100 border-b border-slate-200 px-6 flex items-center gap-4">
                                        <div className="flex gap-2">
                                            <div className="w-3.5 h-3.5 rounded-full bg-rose-400 shadow-inner" />
                                            <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-inner" />
                                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-inner" />
                                        </div>
                                        <div className="flex-1 bg-white rounded-full px-4 py-1.5 text-xs text-slate-400 font-mono border border-slate-200 flex items-center gap-2">
                                            <Globe className="w-3 h-3 text-emerald-500" />
                                            novo-site-{business.name?.toLowerCase().replace(/\s+/g, '-') || 'preview'}.vercel.app
                                        </div>
                                    </div>
                                    <iframe
                                        srcDoc={htmlPreview}
                                        className="w-full border-0"
                                        style={{ height: 'calc(100% - 48px)' }}
                                        sandbox="allow-scripts allow-same-origin"
                                        title={`Preview do site de ${business.name}`}
                                    />
                                </div>
                            </motion.div>
                        ) : activeTab === 'preview' ? (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="p-0"
                            >
                                {/* Mockup Browser Window */}
                                <div className="m-4 md:m-8 relative rounded-3xl border-4 border-slate-900 bg-white shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden">
                                    {/* Browser Bar */}
                                    <div className="h-12 bg-slate-100 border-b border-slate-200 px-6 flex items-center gap-4">
                                        <div className="flex gap-2">
                                            <div className="w-3.5 h-3.5 rounded-full bg-rose-400 shadow-inner" />
                                            <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-inner" />
                                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-inner" />
                                        </div>
                                        <div className="flex-1 max-w-md h-7 bg-white rounded-lg border border-slate-200 flex items-center px-4 gap-2 shadow-sm">
                                            <Globe className="w-3 h-3 text-slate-400" />
                                            <span className="text-[10px] text-slate-500 truncate font-mono tracking-tight">https://www.{(business.name || 'elite').toLowerCase().replace(/\s+/g, '')}.com.br</span>
                                        </div>
                                    </div>

                                    {/* Simulated Content */}
                                    <div className="bg-white min-h-[700px] flex flex-col font-sans">
                                        {/* HERO SECTION DYNAMICS */}
                                        <div className={cn(
                                            "flex flex-col lg:flex-row min-h-[550px]",
                                            design.layout === 'experimental-asymmetry' && "lg:flex-row-reverse",
                                            design.layout === 'typographic-brutalism' && "text-center !flex-col"
                                        )}>
                                            <div className={cn(
                                                "flex-1 p-8 md:p-16 flex flex-col justify-center gap-8",
                                                design.layout === 'typographic-brutalism' && "items-center"
                                            )}>
                                                <motion.div
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200"
                                                >
                                                    <MapPin className="w-3.5 h-3.5" /> Referência em {business.city}
                                                </motion.div>
                                                <motion.h1
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.3 }}
                                                    className={cn(
                                                        "text-4xl md:text-7xl font-black text-slate-900 leading-[0.9] tracking-tighter",
                                                        preview.hero_typography === 'brutalism' && "uppercase italic scale-y-110",
                                                        preview.hero_typography === 'elegant' && "font-serif tracking-normal leading-tight"
                                                    )}
                                                    style={{ fontFamily: design.font }}
                                                >
                                                    {preview.headline}
                                                </motion.h1>
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.4 }}
                                                    className="text-xl text-slate-600 font-medium leading-relaxed max-w-xl"
                                                >
                                                    {preview.subheadline}
                                                </motion.p>

                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.5 }}
                                                    className="flex flex-wrap gap-4 mt-2"
                                                >
                                                    <Button
                                                        className="px-10 h-16 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
                                                        style={{ backgroundColor: design.primary, boxShadow: `0 20px 40px ${design.primary}33` }}
                                                    >
                                                        {preview.cta_text} <ArrowRight className="ml-2 w-6 h-6" />
                                                    </Button>

                                                    {stats?.performanceScore && (
                                                        <div className="flex items-center gap-5 px-8 h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl">
                                                            <div className="flex flex-col">
                                                                <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">SEO</div>
                                                                <div className="font-extrabold text-slate-900">{stats.seoScore}%</div>
                                                            </div>
                                                            <div className="w-[1px] h-6 bg-slate-200" />
                                                            <div className="flex flex-col">
                                                                <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Velocidade</div>
                                                                <div className="font-extrabold text-slate-900">{stats.performanceScore}%</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            </div>

                                            {design.layout !== 'typographic-brutalism' && (
                                                <motion.div
                                                    initial={{ opacity: 0, filter: 'blur(10px)' }}
                                                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                                                    transition={{ delay: 0.6 }}
                                                    className="flex-1 relative min-h-[400px] lg:min-h-auto overflow-hidden bg-slate-100"
                                                >
                                                    <img
                                                        src={preview.hero_image_url && !preview.hero_image_url.includes('source.unsplash.com')
                                                            ? preview.hero_image_url
                                                            : `https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=1200&sig=${business.id}`}
                                                        alt="Hero"
                                                        className="absolute inset-0 w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700 opacity-20"
                                                    />
                                                    <div
                                                        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
                                                        style={{
                                                            backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200&q=80&keywords=${encodeURIComponent(preview.hero_image_keyword || business.niche)}')`,
                                                            filter: 'contrast(1.1) brightness(0.9)'
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent hidden lg:block" />
                                                    <div className="absolute inset-0 bg-gradient-to-b from-white via-white/20 to-transparent block lg:hidden" />

                                                    {/* Floating Trust Card */}
                                                    <div className="absolute bottom-8 right-8 p-6 bg-white/90 backdrop-blur-xl rounded-2xl border border-white shadow-2xl max-w-[200px]">
                                                        <div className="flex items-center gap-1.5 text-amber-500 mb-2">
                                                            <Star className="w-4 h-4 fill-current" />
                                                            <Star className="w-4 h-4 fill-current" />
                                                            <Star className="w-4 h-4 fill-current" />
                                                            <Star className="w-4 h-4 fill-current" />
                                                            <Star className="w-4 h-4 fill-current" />
                                                        </div>
                                                        <p className="text-[11px] font-bold text-slate-900 leading-tight">
                                                            "Simplesmente o melhor atendimento de {business.city}."
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* SERVICES SECTION REAL - EXTRAORDINARY CARDS */}
                                        <div className="p-16 bg-slate-50 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-20" />
                                            <div className="flex items-center justify-between mb-16 relative z-10">
                                                <div>
                                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter" style={{ fontFamily: design.font }}>Elite Performance</h2>
                                                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2">Soluções Sob Medida</p>
                                                </div>
                                                <div className="w-32 h-1 bg-slate-900 rounded-full" style={{ backgroundColor: design.primary }} />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                                                {(preview.service_details && preview.service_details.length > 0 ? preview.service_details : (business.services?.slice(0, 6) || preview.services).map((s: string) => ({ title: s, description: `Excelência técnica e atendimento especializado focado em ${business.niche}.` }))).map((service: any, i: number) => (
                                                    <motion.div
                                                        key={service.title + i}
                                                        whileHover={{ y: -10, scale: 1.02 }}
                                                        className="group p-10 bg-white/70 backdrop-blur-xl rounded-[40px] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all"
                                                    >
                                                        <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm group-hover:rotate-12">
                                                            <Zap className="w-8 h-8" style={{ color: design.primary }} />
                                                        </div>
                                                        <h3 className="text-2xl font-black text-slate-900 mb-4 leading-tight">{service.title}</h3>
                                                        <p className="text-sm text-slate-500 font-medium leading-relaxed opacity-100 transition-opacity duration-500">
                                                            {service.description}
                                                        </p>
                                                        <div className="h-1.5 w-12 bg-slate-100 rounded-full mt-6 group-hover:w-full transition-all duration-700" style={{ backgroundColor: design.primary }} />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* SOCIAL PROOF SECTION REAL (REVIEWS) */}
                                        {business.reviews && business.reviews.length > 0 && (
                                            <div className="p-16 bg-white">
                                                <div className="text-center mb-16">
                                                    <h2 className="text-3xl font-black text-slate-900">Depoimentos Reais</h2>
                                                    <div className="flex items-center justify-center gap-1 text-amber-500 mt-2 mb-4">
                                                        <Star className="w-5 h-5 fill-current" />
                                                        <Star className="w-5 h-5 fill-current" />
                                                        <Star className="w-5 h-5 fill-current" />
                                                        <Star className="w-5 h-5 fill-current" />
                                                        <Star className="w-5 h-5 fill-current" />
                                                        <span className="ml-2 text-slate-900 font-black">{business.rating}</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    {business.reviews.slice(0, 6).map((rev, i) => (
                                                        <div key={i} className="p-10 rounded-[40px] bg-slate-50 border border-slate-100 flex flex-col gap-6 relative">
                                                            <Quote className="absolute top-8 right-8 w-12 h-12 text-slate-200/50" />
                                                            <p className="text-lg text-slate-700 font-medium italic leading-relaxed z-10">
                                                                "{rev.text}"
                                                            </p>
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-white shadow-sm" />
                                                                <div>
                                                                    <p className="font-extrabold text-slate-900">{rev.user}</p>
                                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Avaliação no Google</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Footer / Contact Bar */}
                                        <div className="px-16 py-12 bg-slate-900 text-white">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                                                <div className="space-y-4">
                                                    <div className="text-2xl font-black uppercase italic tracking-tighter">
                                                        {business.name.split(' ')[0]}<span style={{ color: design.primary }}>.</span>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <MapPin className="w-4 h-4" />
                                                            <span className="text-xs font-bold">{business.address}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <Phone className="w-4 h-4" />
                                                            <span className="text-xs font-bold">{business.whatsapp || business.phone}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col md:items-end gap-6">
                                                    <div className="flex gap-4">
                                                        {business.instagram && (
                                                            <a href={`https://instagram.com/${business.instagram}`} target="_blank" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                                                                <Instagram className="w-6 h-6" />
                                                            </a>
                                                        )}
                                                        {business.facebook && (
                                                            <a href={business.facebook} target="_blank" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                                                                <Facebook className="w-6 h-6" />
                                                            </a>
                                                        )}
                                                        <a href={`https://wa.me/${(business.whatsapp || business.phone || '').replace(/\D/g, '')}`} target="_blank" className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 hover:bg-emerald-500/20 transition-colors">
                                                            <MessageCircle className="w-6 h-6" />
                                                        </a>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">
                                                        Direitos Reservados © {new Date().getFullYear()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Strategic Insights */}
                                <div className="m-4 md:m-8 p-12 rounded-[50px] bg-white border border-slate-200 flex flex-col md:flex-row gap-10 items-center shadow-2xl relative overflow-hidden group">
                                    <div
                                        className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[100px] group-hover:bg-blue-500/20 transition-all duration-1000"
                                    />
                                    <div className="w-24 h-24 rounded-[35px] bg-slate-950 text-white flex items-center justify-center shrink-0 shadow-2xl relative z-10">
                                        <Sparkles className="w-12 h-12 text-blue-400" />
                                    </div>
                                    <div className="z-10 text-center md:text-left">
                                        <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-3 flex flex-col md:flex-row items-center gap-3">
                                            Estratégia de Conversão <span className="px-3 py-1 bg-blue-500 text-white text-[10px] rounded-full italic font-black">Elite Edition</span>
                                        </h4>
                                        <p className="text-lg text-slate-600 leading-relaxed italic border-l-8 border-blue-500 pl-8 my-6 py-2 font-medium" style={{ borderColor: design.primary }}>
                                            {business.site_preview_summary}
                                        </p>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                            <span className="text-[10px] font-black uppercase px-4 py-2 bg-slate-100 rounded-2xl text-slate-600 border border-slate-200">Layout: {design.layout}</span>
                                            <span className="text-[10px] font-black uppercase px-4 py-2 bg-slate-100 rounded-2xl text-slate-600 border border-slate-200">Style: {preview.design_style}</span>
                                            <span className="text-[10px] font-black uppercase px-4 py-2 bg-blue-500/10 rounded-2xl text-blue-600 border border-blue-200">Nicho: {business.niche}</span>
                                        </div>
                                    </div>
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
                                                <h4 className="text-xl font-black text-white uppercase italic">Builder Prompt IA</h4>
                                                <p className="text-sm text-slate-500">Briefing técnico exaustivo para Vibecoder, Bolt ou Cursor.</p>
                                            </div>
                                        </div>
                                        <Button
                                            className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-6 font-bold"
                                            onClick={() => {
                                                navigator.clipboard.writeText(preview.builder_prompt || "");
                                                toast.success("Prompt técnico copiado!");
                                            }}
                                        >
                                            <Copy className="w-4 h-4 mr-2" /> Copiar Briefing
                                        </Button>
                                    </div>

                                    <div className="relative group overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.2)]">
                                        <div className="absolute top-0 right-0 p-6 flex gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-75" />
                                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-150" />
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                                        <pre className="p-10 text-emerald-400/90 text-sm font-mono whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto custom-scrollbar selection:bg-emerald-500/30">
                                            {typeof preview.builder_prompt === 'string'
                                                ? preview.builder_prompt
                                                : JSON.stringify(preview.builder_prompt, null, 2) || "Configurando diretrizes de elite..."}
                                        </pre>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-6 rounded-3xl bg-blue-600/10 border border-blue-500/20 space-y-4">
                                        <h5 className="font-black text-blue-400 uppercase text-xs tracking-widest">Stack de Elite</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {['Next.js 15', 'Tailwind CSS', 'Framer Motion', 'Lucide Icons'].map(s => (
                                                <span key={s} className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black tracking-tight">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-emerald-600/10 border border-emerald-500/20 space-y-4">
                                        <h5 className="font-black text-emerald-400 uppercase text-xs tracking-widest">Paleta de Marca</h5>
                                        <div className="flex gap-4">
                                            {(preview.color_palette || ['#2563eb', '#1e293b']).map((c: string) => (
                                                <div key={c} className="flex flex-col items-center gap-2">
                                                    <div className="w-10 h-10 rounded-xl border border-white/5 shadow-2xl" style={{ backgroundColor: c }} />
                                                    <span className="text-[9px] font-mono text-slate-500">{c}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-amber-600/10 border border-amber-500/20 space-y-4">
                                        <h5 className="font-black text-amber-400 uppercase text-xs tracking-widest">Ativo Visual</h5>
                                        <div className="flex flex-col gap-2">
                                            <div className="text-[10px] text-slate-400 italic mb-1">Imagem herói sugerida:</div>
                                            <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-white/5">
                                                <ExternalLink className="w-3 h-3 text-amber-500" />
                                                <span className="text-[10px] text-slate-300 truncate font-mono">Unsplash Quality Assets</span>
                                            </div>
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
                            variant="secondary"
                            className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest h-12 rounded-2xl px-6 gap-2 border border-white/5 active:scale-95 transition-all"
                            onClick={async () => {
                                setIsRegenerating(true);
                                const toastId = toast.loading("Gerando Proposta de Elite...");
                                try {
                                    const styles = ['Luxo Black', 'Tech Modern', 'Futuristic Clean', 'Premium Gold'];
                                    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
                                    const result = await generateRemakePreview(business, randomStyle);

                                    const updatedBusiness = {
                                        ...business,
                                        site_preview: result.preview_data,
                                        site_preview_summary: result.summary,
                                        meta_data: {
                                            ...(business as any).meta_data,
                                            site_preview: result.preview_data,
                                            site_preview_summary: result.summary
                                        }
                                    };

                                    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

                                    if (isUUID(business.id)) {
                                        await (supabase as any).from('leads').update({
                                            site_preview: result.preview_data,
                                            site_preview_summary: result.summary,
                                            meta_data: updatedBusiness.meta_data
                                        }).eq('id', business.id);
                                    }

                                    if (onRegenerate) onRegenerate(updatedBusiness);
                                    toast.success(`Design ${randomStyle} aplicado com sucesso!`, { id: toastId });
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
