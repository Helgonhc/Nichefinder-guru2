import {
    Radar,
    Users,
    Zap,
    FileText,
    Target,
    MessageSquare,
    Play,
    CheckCircle,
    ArrowRight,
    Search,
    Brain,
    Shield,
    Smartphone,
    MapPin,
    BookOpen,
    Globe,
    RefreshCw,
    Monitor,
    Send,
    Clock,
    AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Tutorial() {
    return (
        <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
            {/* Background Decor - More Vibrant Orbs */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-success/10 rounded-full blur-[120px] -ml-64 -mb-64 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

            <main className="flex-1 container mx-auto px-6 py-12 max-w-5xl relative z-10">
                <div className="mb-16 text-center animate-fade-in">
                    <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm self-center shadow-[0_0_15px_rgba(var(--primary),0.1)]">
                        <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
                        <span className="text-primary text-[10px] font-bold uppercase tracking-[0.2em]">Sua Jornada de Elite</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight mb-6 bg-gradient-to-r from-white via-primary to-blue-400 bg-clip-text text-transparent flex items-center justify-center gap-4">
                        <BookOpen className="w-12 h-12 text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                        Mastering the Guru
                    </h1>

                    <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
                        Bem-vindo ao centro de comando. Aqui você aprenderá a dominar as ferramentas que estão <span className="text-primary font-bold">revolucionando</span> a prospecção B2B.
                    </p>
                </div>

                <div className="space-y-24">
                    {/* Step 1: Radar */}
                    <section className="animate-fade-in-up">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-lg border border-primary/20">
                                <Search className="w-7 h-7 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-primary/60 bg-clip-text text-transparent">1. Radar: A Bússola do Sucesso</h2>
                                <p className="text-xs text-primary/60 font-mono mt-1">MODULE_DATA_ACQUISITION</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <p className="text-muted-foreground text-lg leading-relaxed">
                                    O Radar é a porta de entrada. Ele não apenas busca nomes; ele <span className="text-white border-b border-primary/50">filtra oportunidades reais</span> em tempo real.
                                </p>
                                <div className="space-y-4">
                                    {[
                                        { t: "Filtros de Alta Conversão", d: "Encontre exatamente o nicho que você busca em qualquer cidade." },
                                        { t: "Gaps Digitais Automáticos", d: "O sistema aponta na hora quem não tem site ou quem está vulnerável." },
                                        { t: "Modo Guru", d: "Use nichos específicos como 'Terapias' para ativar o motor de Orgone." }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                                            <div className="mt-1"><CheckCircle className="w-5 h-5 text-success drop-shadow-[0_0_5px_rgba(0,255,100,0.5)]" /></div>
                                            <div>
                                                <p className="font-bold text-foreground group-hover:text-primary transition-colors">{item.t}</p>
                                                <p className="text-sm text-muted-foreground leading-relaxed">{item.d}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <Card className="relative bg-card/60 border-primary/20 backdrop-blur-xl p-8 overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                                    <div className="space-y-6 relative z-10">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                                <div className="w-3 h-3 rounded-full bg-green-400" />
                                            </div>
                                            <Badge variant="outline" className="font-mono text-[10px] text-primary">LIVE_SEARCH</Badge>
                                        </div>
                                        <div className="space-y-4 font-mono text-[11px]">
                                            <div className="flex justify-between items-center text-primary/80">
                                                <span>{">"} Searching "Dentistas" in Sorocaba...</span>
                                                <span className="animate-pulse">●</span>
                                            </div>
                                            <div className="p-4 rounded-xl bg-black/40 border border-white/5 shadow-inner">
                                                <p className="text-white mb-2">🏆 Clínica Sorriso Real</p>
                                                <div className="flex gap-2">
                                                    <Badge className="bg-danger/20 text-danger border-none text-[9px]">SEM SITE</Badge>
                                                    <Badge className="bg-warning/20 text-warning border-none text-[9px]">SEO FRACO</Badge>
                                                </div>
                                            </div>
                                            <p className="text-muted-foreground italic">Dica: Sites sem SSL (cadeado) são fechamentos de 80% de chance!</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </section>

                    {/* New Highlight: Superpowers Section */}
                    <section className="animate-fade-in-up" style={{ animationDelay: "150ms" }}>
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent italic">O Robô de $1 Milhão</h2>
                            <p className="text-primary text-sm font-bold tracking-[0.3em] uppercase">Intelligence Suite 2.0</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: Globe,
                                    title: "Deep Website Audit",
                                    desc: "Nosso robô atua como um consultor técnico. Ele entra no site, analisa o design e entrega os erros prontos para você apresentar.",
                                    gradient: "from-blue-500/20 to-primary/20",
                                    border: "border-primary/30",
                                    glow: "shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]"
                                },
                                {
                                    icon: Target,
                                    title: "ReservaAI Engine",
                                    desc: "Exclusivo para Quadras. Detecta sistemas concorrentes ou agendamento manual, criando um pitch de urgência irresistível.",
                                    gradient: "from-success/20 to-emerald-500/20",
                                    border: "border-success/30",
                                    glow: "shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]"
                                },
                                {
                                    icon: Brain,
                                    title: "Humanized Brain",
                                    desc: "Nada de scripts frios. A IA gera mensagens com o SEU nome e detalhes da CIDADE do lead. Parece que você escreveu em 5 minutos.",
                                    gradient: "from-warning/20 to-orange-500/20",
                                    border: "border-warning/30",
                                    glow: "shadow-[0_0_30px_-10px_rgba(245,158,11,0.3)]"
                                }
                            ].map((item, i) => (
                                <div key={i} className={`relative group p-0.5 rounded-[2rem] overflow-hidden transition-all duration-500 hover:scale-[1.02] ${item.glow}`}>
                                    <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-50 group-hover:opacity-100 transition-opacity`} />
                                    <Card className={`relative h-full bg-card/90 border-none backdrop-blur-2xl rounded-[1.95rem] p-8 flex flex-col items-center text-center`}>
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6 shadow-xl border ${item.border}`}>
                                            <item.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-xl font-black mb-3 text-white tracking-tight">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Activation Visual */}
                    <section className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                        <Card className="p-8 md:p-12 overflow-hidden border-primary/20 bg-primary/5 backdrop-blur-sm relative rounded-[3rem]">
                            <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                            <div className="absolute bottom-0 right-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-success/50 to-transparent" />

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                                <div className="space-y-8">
                                    <div>
                                        <Badge className="bg-primary/20 text-primary border-none mb-4">SETUP EM 60 SEGUNDOS</Badge>
                                        <h2 className="text-4xl font-bold text-white mb-6 leading-tight">Como dar <span className="text-primary italic">Vida</span> ao seu Consultor Automático</h2>
                                    </div>
                                    <div className="space-y-6">
                                        {[
                                            { s: "01", t: "O Coração do Motor", d: "Abra o terminal na pasta `standalone-bot`. É lá que a mágica acontece." },
                                            { s: "02", t: "Combustível de Dados", d: "Execute `node wa-bot.js`. O robô vai aquecer os motores e conectar ao seu banco." },
                                            { s: "03", t: "Conexão de Vendas", d: "Escaneie o QR Code do WhatsApp. Uma vez feito, ele nunca mais esquece." }
                                        ].map((step, i) => (
                                            <div key={i} className="flex gap-6 items-start group">
                                                <span className="text-4xl font-black text-white/10 group-hover:text-primary transition-colors duration-500">{step.s}</span>
                                                <div>
                                                    <p className="font-bold text-white text-lg">{step.t}</p>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">{step.d}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute -inset-8 bg-primary/20 rounded-full blur-[80px] opacity-20 animate-pulse" />
                                    <div className="relative bg-[#0a0a0c] rounded-3xl border border-white/10 overflow-hidden shadow-2xl scale-105">
                                        {/* Header do Terminal */}
                                        <div className="bg-[#1a1a1e] px-4 py-3 flex items-center justify-between border-b border-white/5">
                                            <div className="flex gap-2">
                                                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                                                <Shield className="w-3 h-3" /> system_status: encrypted
                                            </div>
                                        </div>
                                        {/* Conteúdo do Terminal */}
                                        <div className="p-8 font-mono text-[11px] h-[320px] relative overflow-hidden group/term">
                                            {/* Scan line efeito */}
                                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-primary/5 to-transparent h-1/2 w-full animate-scan" style={{ top: '-100%' }} />

                                            <div className="space-y-4">
                                                <p className="text-muted-foreground animate-shimmer"># LeadRadar Guru Engine - v2.4.0</p>
                                                <div className="flex gap-2">
                                                    <span className="text-success">$</span>
                                                    <span className="text-white">node wa-bot.js</span>
                                                </div>
                                                <div className="pt-4 space-y-2">
                                                    <p className="text-primary flex items-center gap-2">
                                                        <RefreshCw className="w-3 h-3 animate-spin" /> Conectando ao Banco de Dados Supabase...
                                                    </p>
                                                    <p className="text-success">✅ Conexão Estabelecida com UserID: hhc_992</p>
                                                    <p className="text-white mt-4 border-l-2 border-primary pl-4">🚀 [ENGINE] Robô ONLINE e em modo Standby.</p>
                                                    <div className="mt-6 flex flex-col gap-1">
                                                        <p className="text-blue-400">✨ [AUDIT] Visitando: barbearia_imperial.com.br</p>
                                                        <p className="text-muted-foreground pl-4">└ SSL Certificate: VALID (Exp: 2026)</p>
                                                        <p className="text-muted-foreground pl-4">└ Page Speed: 92/100</p>
                                                        <p className="text-muted-foreground pl-4">└ AI Insight: "Sugira integração com agendamento direto"</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </section>

                    {/* Pro Tips with Glow */}
                    <section className="animate-fade-in-up" style={{ animationDelay: "450ms" }}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center pt-8 border-t border-white/5">
                            {[
                                { t: "Seja Real", d: "Personalize cada abertura. A confiança é vendida nos primeiros 10 segundos." },
                                { t: "Análise é Ouro", d: "Não venda o site. Venda o problema que o site dele causa agora." },
                                { t: "Consistência", d: "O robô não cansa. Deixe-o rodar enquanto você foca no fechamento." }
                            ].map((tip, i) => (
                                <div key={i} className="space-y-2 group">
                                    <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-all">
                                        <Badge className="p-0 bg-transparent text-primary text-lg">{i + 1}</Badge>
                                    </div>
                                    <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{tip.t}</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed px-4">{tip.d}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="mt-32 pt-16 border-t border-border/50 text-center relative">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                    <p className="text-muted-foreground text-sm mb-8 tracking-[0.2em] uppercase">Tudo configurado? A sorte favorece os ousados.</p>
                    <Button
                        size="lg"
                        onClick={() => window.location.href = '/'}
                        className="h-16 px-12 rounded-2xl bg-gradient-to-r from-primary via-blue-500 to-primary bg-[length:200%_auto] hover:bg-right transition-all duration-500 shadow-2xl shadow-primary/40 text-lg font-black group"
                    >
                        Decolar para o Radar
                        <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </Button>
                </div>
            </main>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
