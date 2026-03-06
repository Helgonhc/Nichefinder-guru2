import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    Search,
    Brain,
    Shield,
    Globe,
    Zap,
    Users,
    MessageSquare,
    Target,
    BarChart3,
    CheckCircle2,
    Lock,
    Smartphone,
    Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#030712] text-white selection:bg-primary/30 selection:text-white">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[150px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
            </div>

            {/* Navigation */}
            <nav className="relative z-50 flex items-center justify-between px-8 py-6 container mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.5)]">
                        <Target className="w-6 h-6 text-background font-bold" />
                    </div>
                    <span className="text-xl font-display font-black tracking-tighter uppercase italic">LeadRadar<span className="text-primary italic">Guru</span></span>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Funcionalidades</a>
                    <a href="#leads" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Oportunidades</a>
                    <a href="#automation" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Automação</a>
                    <Button
                        variant="ghost"
                        className="text-white hover:bg-white/5"
                        onClick={() => navigate("/login")}
                    >
                        Entrar
                    </Button>
                    <Button
                        className="bg-primary hover:bg-primary/90 text-background font-bold px-6 rounded-full"
                        onClick={() => navigate("/login")}
                    >
                        Começar Agora
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 container mx-auto px-6 text-center z-10">
                <div className="animate-fade-in-up">
                    <Badge variant="outline" className="mb-6 px-4 py-1.5 border-primary/30 bg-primary/5 text-primary text-[10px] uppercase font-black tracking-[0.2em] animate-pulse">
                        A Próxima Geração de Prospecção B2B
                    </Badge>
                    <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter mb-8 leading-[0.9]">
                        NÃO VENDA MAIS.<br />
                        <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-[length:200%_auto] animate-gradient-flow bg-clip-text text-transparent italic">
                            FECHE NEGÓCIOS.
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed">
                        O LeadRadar Guru encontra leads qualificados, audita sites instantaneamente e cria scripts humanizados que o seu cliente <span className="text-white font-bold italic">não consegue ignorar</span>.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Button
                            size="lg"
                            className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-background text-lg font-black shadow-[0_0_30px_rgba(var(--primary),0.3)] group"
                            onClick={() => navigate("/login")}
                        >
                            Ver Ferramentas em Ação
                            <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-16 px-10 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white text-lg font-bold backdrop-blur-md"
                        >
                            Explorar Demonstração
                        </Button>
                    </div>
                </div>

                {/* Dashboard Preview Placeholder (Until generated shots) */}
                <div className="mt-24 relative p-4 rounded-[2.5rem] border border-white/5 bg-white/5 backdrop-blur-sm animate-fade-in-up delay-300">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-[2.5rem] pointer-events-none" />
                    <div className="aspect-video w-full rounded-[2rem] bg-[#0a0a0c] border border-white/10 shadow-2xl flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80')] opacity-10 grayscale mix-blend-overlay group-hover:scale-110 transition-transform duration-1000" />
                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-ring">
                                <Zap className="w-10 h-10 text-primary" />
                            </div>
                            <span className="text-primary font-mono text-sm tracking-widest uppercase">Visualização de Painel em Tempo Real</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Feed */}
            <section className="py-24 relative z-10" id="features">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                        <div className="max-w-xl">
                            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                                Ferramentas que Transformam <span className="text-primary italic">Fracasso</span> em <span className="text-success italic">Faturamento</span>.
                            </h2>
                            <p className="text-muted-foreground">O Guru não é apenas um CRM. É um arsenal completo de guerra digital para quem vende sites, SEO e consultoria.</p>
                        </div>
                        <Badge variant="outline" className="border-white/10 px-4 py-2 uppercase font-mono text-[10px]">v2.4.0 Engine</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Globe,
                                title: "Deep Audit Engine",
                                desc: "Audite o site do seu lead em 5 segundos. Detectamos falta de SSL, falhas de SEO e responsividade para você usar como munição de venda.",
                                color: "primary"
                            },
                            {
                                icon: Brain,
                                title: "Humanized AI Brain",
                                desc: "Chega de falar como robô. Nossa IA cria scripts de WhatsApp cordiais que citam o nome do dono e detalhes reais do negócio.",
                                color: "purple-400"
                            },
                            {
                                icon: Bot,
                                title: "Autonomous Robot",
                                desc: "Um robô que roda 24h por dia no seu computador ou VPS, enviando mensagens e capturando leads enquanto você dorme.",
                                color: "success"
                            }
                        ].map((feature, i) => (
                            <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-md p-8 hover:bg-white/10 transition-all duration-300 group rounded-3xl overflow-hidden relative">
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-${feature.color}/5 rounded-full blur-3xl -mr-16 -mt-16`} />
                                <div className={`mb-6 p-4 bg-${feature.color}/10 rounded-2xl w-fit group-hover:scale-110 transition-transform`}>
                                    <feature.icon className={`w-8 h-8 text-${feature.color}`} />
                                </div>
                                <h3 className="text-2xl font-black mb-4 group-hover:text-primary transition-colors">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed text-sm">{feature.desc}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Call to Action Footer */}
            <section className="py-32 relative z-10">
                <div className="container mx-auto px-6">
                    <div className="p-12 md:p-24 rounded-[3.5rem] bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 relative overflow-hidden text-center">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/60-lines.png')] opacity-10 pointer-events-none" />
                        <h2 className="text-5xl md:text-7xl font-black mb-10 tracking-tighter uppercase italic leading-[0.9]">
                            Pare de caçar.<br />
                            <span className="text-primary">Domine o Mercado.</span>
                        </h2>
                        <Button
                            size="lg"
                            className="h-20 px-16 rounded-3xl bg-primary hover:bg-primary/90 text-background text-2xl font-black shadow-[0_0_50px_rgba(var(--primary),0.5)] group animate-pulse"
                            onClick={() => navigate("/login")}
                        >
                            EU QUERO O GURU AGORA
                            <Zap className="ml-4 w-8 h-8 fill-background text-background" />
                        </Button>
                        <p className="mt-8 text-muted-foreground text-sm uppercase font-mono tracking-widest">Acesso Instantâneo. Sem Cartão de Crédito.</p>
                    </div>
                </div>
            </section>

            <footer className="py-12 border-t border-white/5 text-center text-muted-foreground text-sm relative z-50">
                <p>&copy; 2026 LeadRadar Guru. Build with ❤️ for Winners.</p>
            </footer>
        </div>
    );
}
