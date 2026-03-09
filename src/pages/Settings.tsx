import { useState, useEffect } from "react";
import {
    Settings as SettingsIcon,
    User,
    Key,
    Save,
    Loader2,
    CheckCircle2,
    Mail,
    Globe,
    Zap,
    Image as ImageIcon,
    Upload,
    Trash2,
    Phone,
    Instagram,
    ShieldCheck,
    ArrowRight,
    Activity,
    Terminal,
    Lock,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function Settings() {
    const { user, profile: authProfile, loading: authLoading, refreshProfile } = useAuth();
    const [saving, setSaving] = useState(false);
    const [fullName, setFullName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [instagram, setInstagram] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [logoSiteUrl, setLogoSiteUrl] = useState("");
    const [websiteSiteUrl, setWebsiteSiteUrl] = useState("");
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (authProfile) {
            setFullName(authProfile.full_name || "");
            setContactEmail(authProfile.contact_email || "");
            setWebsiteUrl(authProfile.website_url || "");
            setWhatsapp(authProfile.whatsapp || "");
            setInstagram(authProfile.instagram || "");
            setLogoUrl(authProfile.logo_url || "");
            setLogoSiteUrl(authProfile.logo_site_url || "");
            setWebsiteSiteUrl(authProfile.website_site_url || "");
        }
    }, [authProfile]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            if (user) {
                const { error } = await (supabase as any)
                    .from('profiles')
                    .update({
                        full_name: fullName,
                        contact_email: contactEmail || null,
                        website_url: websiteUrl || null,
                        whatsapp: whatsapp || null,
                        instagram: instagram || null,
                        logo_url: logoUrl || null,
                        logo_site_url: logoSiteUrl || null,
                        website_site_url: websiteSiteUrl || null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', user.id);

                if (error) throw error;
                toast.success("Perfil atualizado com sucesso!");
                await refreshProfile();
            }
        } catch (error: any) {
            toast.error("Erro ao atualizar o perfil.");
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const fileExt = file.name.split('.').pop();
            // Path formato: {user_id}/logo.{ext} — obrigatório para RLS policy do storage
            const fileName = `${user.id}/logo.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('branding')
                .upload(fileName, file, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('branding').getPublicUrl(fileName);
            setLogoUrl(publicUrl);
            toast.success("Logo carregada com sucesso!");
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('[Settings] Erro no upload da logo:', msg);
            toast.error("Erro no upload. Verifique o bucket 'branding'.");
        } finally {
            setUploading(false);
        }
    };

    const handleLogoSiteUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const fileExt = file.name.split('.').pop();
            // Path formato: {user_id}/logo-site.{ext} — obrigatório para RLS policy do storage
            const fileName = `${user.id}/logo-site.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('branding')
                .upload(fileName, file, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('branding').getPublicUrl(fileName);
            setLogoSiteUrl(publicUrl);
            toast.success("Logo do site configurada!");
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('[Settings] Erro no upload da logo do site:', msg);
            toast.error("Erro no upload da logo do site.");
        } finally {
            setUploading(false);
        }
    };

    const removeLogo = () => { setLogoUrl(""); toast.info("Logo removida. Salve para confirmar."); };
    const removeLogoSite = () => { setLogoSiteUrl(""); toast.info("Logo do site removida. Salve para confirmar."); };

    if (authLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-slate-50">
            <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-3xl">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                            <SettingsIcon className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configurações</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">Perfil &amp; Ajustes</h1>
                    <p className="text-sm text-slate-500 mt-1">Gerencie suas informações pessoais, branding e integrações.</p>
                </div>

                <div className="space-y-6">
                    {/* Profile Section */}
                    <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                                    <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-bold text-slate-800">Identidade do Operador</CardTitle>
                                    <CardDescription className="text-xs text-slate-500 mt-0.5">Informações de contato e presença digital</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <form onSubmit={handleUpdateProfile}>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {/* Full Name */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="name" className="text-xs font-semibold text-slate-600">Nome Completo</Label>
                                        <Input
                                            id="name"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Seu nome"
                                            className="h-10 text-sm bg-white border-slate-200 rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500 text-slate-800 placeholder:text-slate-400"
                                        />
                                    </div>
                                    {/* Login Email (readonly) */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600">Email de Login</Label>
                                        <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 cursor-not-allowed">
                                            <Lock className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate">{authProfile?.email}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Email */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="contactEmail" className="text-xs font-semibold text-slate-600">Email de Contato (Propostas)</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <Input
                                            id="contactEmail"
                                            type="email"
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                            placeholder="contato@exemplo.com"
                                            className="h-10 pl-9 text-sm bg-white border-slate-200 rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500 text-slate-800 placeholder:text-slate-400"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400">Usado em scripts e propostas geradas pela IA.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {/* Personal Website */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="websiteUrl" className="text-xs font-semibold text-slate-600">Site Pessoal</Label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                            <Input
                                                id="websiteUrl"
                                                type="url"
                                                value={websiteUrl}
                                                onChange={(e) => setWebsiteUrl(e.target.value)}
                                                placeholder="https://seusite.com.br"
                                                className="h-10 pl-9 text-sm bg-white border-slate-200 rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500 text-slate-800 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                    {/* Website Proposal URL */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="websiteSiteUrl" className="text-xs font-semibold text-slate-600">URL do Serviço (Proposta de Site)</Label>
                                        <div className="relative">
                                            <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                            <Input
                                                id="websiteSiteUrl"
                                                type="url"
                                                value={websiteSiteUrl}
                                                onChange={(e) => setWebsiteSiteUrl(e.target.value)}
                                                placeholder="https://servicos.exemplo.com"
                                                className="h-10 pl-9 text-sm bg-white border-slate-200 rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500 text-slate-800 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {/* WhatsApp */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="whatsapp" className="text-xs font-semibold text-slate-600">WhatsApp</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                            <Input
                                                id="whatsapp"
                                                value={whatsapp}
                                                onChange={(e) => setWhatsapp(e.target.value)}
                                                placeholder="11999999999"
                                                className="h-10 pl-9 text-sm bg-white border-slate-200 rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500 text-slate-800 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                    {/* Instagram */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="instagram" className="text-xs font-semibold text-slate-600">Instagram</Label>
                                        <div className="relative">
                                            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                            <Input
                                                id="instagram"
                                                value={instagram}
                                                onChange={(e) => setInstagram(e.target.value)}
                                                placeholder="@seuperfil"
                                                className="h-10 pl-9 text-sm bg-white border-slate-200 rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500 text-slate-800 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Logo Upload */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                                    {/* Main Logo */}
                                    <div className="space-y-3">
                                        <Label className="text-xs font-semibold text-slate-600">Logo Principal (PDFs e Scripts)</Label>
                                        <div className="aspect-video w-full border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center relative overflow-hidden group bg-slate-50 hover:border-blue-300 transition-colors">
                                            {logoUrl ? (
                                                <>
                                                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-4" />
                                                    <button
                                                        type="button"
                                                        onClick={removeLogo}
                                                        className="absolute inset-0 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 text-xs font-semibold text-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Remover
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                    <ImageIcon className="w-8 h-8 opacity-40" />
                                                    <span className="text-xs">Nenhuma logo</span>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" id="logo-main" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-full h-9 text-xs border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all rounded-lg"
                                            onClick={() => document.getElementById('logo-main')?.click()}
                                            disabled={uploading}
                                        >
                                            <Upload className="w-3.5 h-3.5 mr-2" />
                                            {uploading ? "Enviando..." : "Carregar Logo"}
                                        </Button>
                                    </div>

                                    {/* Site Logo */}
                                    <div className="space-y-3">
                                        <Label className="text-xs font-semibold text-slate-600">Logo do Site (Proposta)</Label>
                                        <div className="aspect-video w-full border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center relative overflow-hidden group bg-slate-50 hover:border-blue-300 transition-colors">
                                            {logoSiteUrl ? (
                                                <>
                                                    <img src={logoSiteUrl} alt="Logo site" className="w-full h-full object-contain p-4" />
                                                    <button
                                                        type="button"
                                                        onClick={removeLogoSite}
                                                        className="absolute inset-0 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 text-xs font-semibold text-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Remover
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                    <ImageIcon className="w-8 h-8 opacity-40" />
                                                    <span className="text-xs">Nenhuma logo</span>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" id="logo-site" className="hidden" accept="image/*" onChange={handleLogoSiteUpload} />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-full h-9 text-xs border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all rounded-lg"
                                            onClick={() => document.getElementById('logo-site')?.click()}
                                            disabled={uploading}
                                        >
                                            <Upload className="w-3.5 h-3.5 mr-2" />
                                            {uploading ? "Enviando..." : "Carregar Logo do Site"}
                                        </Button>
                                    </div>
                                </div>

                                {/* Role Badge */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-600 mb-1">Nível de Acesso</p>
                                        <p className="text-xs text-slate-400">
                                            {authProfile?.role === 'super_admin' ? 'Acesso total ao sistema.' :
                                                authProfile?.role === 'admin' ? 'Acesso administrativo de gestão.' : 'Operador padrão.'}
                                        </p>
                                    </div>
                                    <Badge
                                        className={cn(
                                            "text-xs h-7 px-3 rounded-lg font-semibold border-none",
                                            authProfile?.role === 'super_admin' ? "bg-blue-600 text-white" :
                                                authProfile?.role === 'admin' ? "bg-slate-200 text-slate-700" : "bg-slate-100 text-slate-500"
                                        )}
                                    >
                                        <ShieldCheck className="w-3 h-3 mr-1.5" />
                                        {authProfile?.role === 'super_admin' ? 'Super Admin' :
                                            authProfile?.role === 'admin' ? 'Admin' : 'Usuário'}
                                    </Badge>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50/50 border-t border-slate-100 px-6 py-4 flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="h-9 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-all gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {saving ? "Salvando..." : "Salvar Alterações"}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>

                    {/* API Keys Section */}
                    <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100">
                                    <Key className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-bold text-slate-800">Chaves &amp; Integrações</CardTitle>
                                    <CardDescription className="text-xs text-slate-500 mt-0.5">Protocolos de comunicação com APIs externas</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            {/* Google API */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                        <Globe className="w-4.5 h-4.5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-800">Google Places API</h4>
                                        <p className="text-xs text-slate-500">Motor de escaneamento geográfico</p>
                                    </div>
                                </div>
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs rounded-lg font-semibold">
                                    <Activity className="w-3 h-3 mr-1" />
                                    Ativo
                                </Badge>
                            </div>

                            {/* Piramyd AI */}
                            <div className="rounded-xl border border-slate-100 overflow-hidden">
                                <div className="flex items-center justify-between p-4 bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                            <Zap className="w-4.5 h-4.5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-800">Piramyd AI (IA de Scripts)</h4>
                                            <p className="text-xs text-slate-500">Modelos Llama 4 & GPT-5.3 (Elite)</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs rounded-lg font-semibold">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Piramyd Pro
                                    </Badge>
                                </div>
                                <div className="px-4 pb-4 pt-3 space-y-3 border-t border-slate-100">
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        A chave da Piramyd Cloud precisa estar configurada no arquivo .env para garantir a geração de scripts e propostas de alta performance.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all rounded-lg gap-1.5"
                                        onClick={() => window.open('https://piramyd.cloud/', '_blank')}
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        Gerar token na Piramyd Cloud
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Info Footer */}
                    <div className="flex items-center justify-between px-1 text-xs text-slate-400">
                        <span>LeadRadar Engine v4.0.2</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Sistema Operacional</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
