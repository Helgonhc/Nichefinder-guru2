import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Radar, Loader2, LogIn, ShieldCheck, Lock, ArrowRight, Activity, Terminal } from "lucide-react";
import { toast } from "sonner";
import { BibleCard } from "@/components/BibleCard";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                navigate("/");
            }
        });

        // Refined Neural Network Background (Lower opacity, more clinical)
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let particles: Particle[] = [];

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.size = Math.random() * 0.8 + 0.2;
                this.speedX = Math.random() * 0.2 - 0.1;
                this.speedY = Math.random() * 0.2 - 0.1;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x > canvas!.width) this.x = 0;
                else if (this.x < 0) this.x = canvas!.width;
                if (this.y > canvas!.height) this.y = 0;
                else if (this.y < 0) this.y = canvas!.height;
            }

            draw() {
                ctx!.fillStyle = "rgba(223, 255, 0, 0.05)";
                ctx!.beginPath();
                ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx!.fill();
            }
        }

        const init = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = [];
            for (let i = 0; i < 40; i++) {
                particles.push(new Particle());
            }
        };

        const connect = () => {
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    const dx = particles[a].x - particles[b].x;
                    const dy = particles[a].y - particles[b].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        const opacity = 1 - distance / 150;
                        ctx.strokeStyle = `rgba(223, 255, 0, ${opacity * 0.03})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }
            connect();
            requestAnimationFrame(animate);
        };

        init();
        animate();

        const handleResize = () => init();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            toast.success("Acesso autorizado. Bem-vindo à rede.");
            navigate("/");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Erro de autenticação.";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#050505] relative overflow-hidden flex flex-col md:flex-row selection:bg-primary/30">
            {/* 1. LAYERED BACKGROUND TACTICS */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 grain-texture opacity-[0.15] mix-blend-overlay" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(223,255,0,0.05)_0%,transparent_50%)]" />
                <div className="absolute inset-0 scan-line opacity-[0.05]" />
                <canvas ref={canvasRef} className="absolute inset-0 opacity-20" />

                {/* Massive Watermark Typography */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.01] flex flex-col items-center">
                    <h2 className="text-[30rem] font-display font-black leading-none tracking-tighter transform -rotate-12 translate-x-[-10%]">ELITE</h2>
                    <h2 className="text-[20rem] font-display font-black leading-none tracking-tighter transform rotate-3 translate-x-[15%] -translate-y-1/4">NEXUS</h2>
                </div>
            </div>

            {/* 2. TACTICAL SIDEBAR (LOGO & BRANDING) */}
            <div className="relative z-20 w-full md:w-[35%] flex flex-col justify-between p-8 md:p-12 md:h-screen border-b md:border-b-0 md:border-r border-white/5 bg-black/40 backdrop-blur-sm">
                <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/20 animate-pulse" />
                        <Radar className="w-6 h-6 text-primary relative z-10" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-display font-black text-white tracking-tighter uppercase italic leading-none">
                            Lead<span className="text-primary">Radar</span>
                        </h1>
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-primary/40 mt-1">Intelligence Ecosystem</p>
                    </div>
                </div>

                <div className="hidden md:block space-y-8 max-w-sm">
                    <div className="h-px w-24 bg-primary/40" />
                    <h2 className="text-5xl lg:text-7xl font-display font-black text-white leading-[0.85] tracking-tighter uppercase italic">
                        Domine a <br />
                        <span className="text-primary text-shadow-glow">Fronteira.</span>
                    </h2>
                    <p className="text-muted-foreground text-xs uppercase font-bold tracking-[0.2em] leading-relaxed opacity-60">
                        Prospecção cirúrgica movida por ética, tecnologia bruta e fé estratégica.
                    </p>

                    <div className="pt-12 transform -translate-x-4">
                        <BibleCard variant="minimal" className="border-none bg-transparent p-0 scale-125 origin-left opacity-80" />
                    </div>
                </div>

                <div className="flex gap-8 opacity-20">
                    <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[8px] font-black uppercase tracking-widest font-mono">Status: Secure</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[8px] font-black uppercase tracking-widest font-mono">v4.0.2_ELITE</span>
                    </div>
                </div>
            </div>

            {/* 3. CENTERED LOGIN COMMAND CENTER */}
            <div className="relative z-10 flex-1 flex items-center justify-center p-6 sm:p-12 md:p-24 overflow-y-auto">
                <div className="w-full max-w-md relative">
                    {/* Shadow/Glow decoration */}
                    <div className="absolute -inset-10 bg-primary/5 blur-[100px] rounded-full pointer-events-none animate-pulse" />

                    <div className="bg-[#0A0A0A] border-2 border-white/5 p-8 sm:p-12 relative overflow-hidden group">
                        {/* Industrial Corner Decors */}
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/30 m-[-1px] group-hover:border-primary transition-colors" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/30 m-[-1px] group-hover:border-primary transition-colors" />

                        <div className="space-y-10 relative z-10">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <ShieldCheck className="w-3 h-3 text-primary" />
                                    </div>
                                    <span className="text-[9px] font-black tracking-[0.4em] uppercase text-primary/40">Credential Validation</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-display font-black text-white uppercase tracking-tighter italic">Entrar na Rede</h1>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-6">
                                <div className="space-y-2 group">
                                    <label className="text-[9px] uppercase font-black tracking-[0.3em] text-primary/40 ml-0.5 group-focus-within:text-primary transition-colors">Neural Email</label>
                                    <div className="relative">
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="bg-black/40 border-white/10 h-14 rounded-none focus-visible:ring-0 focus:border-primary transition-all text-sm text-white placeholder:text-white/5 p-4 border-l-4 border-l-primary/20 focus:border-l-primary"
                                            placeholder="USER_ID@ELITE.GURU"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 group">
                                    <div className="flex justify-between items-center ml-0.5">
                                        <label className="text-[9px] uppercase font-black tracking-[0.3em] text-primary/40 group-focus-within:text-primary transition-colors">Access Key</label>
                                        <button type="button" className="text-[8px] uppercase font-black text-muted-foreground/30 hover:text-primary transition-colors tracking-widest">Forgot Pass?</button>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="bg-black/40 border-white/10 h-14 rounded-none focus-visible:ring-0 focus:border-primary transition-all text-sm text-white placeholder:text-white/5 p-4 border-l-4 border-l-primary/20 focus:border-l-primary"
                                            placeholder="••••••••••••"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-16 bg-primary hover:bg-[#e6ff00] text-black font-black text-[10px] sm:text-xs gap-4 rounded-none shadow-[0_10px_30px_rgba(223,255,0,0.2)] transition-all active:scale-[0.98] mt-4 tracking-[0.4em] group border-none"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            INITIALIZE ACCESS
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            <div className="pt-6 flex items-center justify-between border-t border-white/5 flex-wrap gap-4">
                                <p className="text-[8px] text-muted-foreground/20 font-black uppercase tracking-[0.4em]">
                                    LeadRadar Platform // Neural Nexus Node
                                </p>
                                <div className="flex gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/20 animate-pulse" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(223,255,0,0.5)]" />
                                </div>
                            </div>
                        </div>

                        {/* Side Branding Overlay (Invisible but affecting layout feel) */}
                        <div className="absolute top-[-20px] left-[-20px] text-white/[0.02] text-9xl font-black italic whitespace-nowrap pointer-events-none select-none">LOGIN_NODE</div>
                    </div>

                    {/* Mobile Only Bible Card - Positioned differently */}
                    <div className="md:hidden mt-12 flex justify-center">
                        <BibleCard variant="minimal" className="opacity-40 hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </div>

            {/* Industrial UI Frames */}
            <div className="fixed top-0 inset-x-0 h-1 md:h-1.5 bg-gradient-to-r from-primary via-white/20 to-primary z-50 opacity-40 shadow-[0_0_15px_rgba(223,255,0,0.3)]" />
            <div className="fixed bottom-0 inset-x-0 h-1 md:h-1.5 bg-gradient-to-r from-primary via-white/20 to-primary z-50 opacity-40 shadow-[0_0_15px_rgba(223,255,0,0.3)]" />
            <div className="fixed left-0 inset-y-0 w-1 md:w-1.5 bg-gradient-to-b from-primary via-white/20 to-primary z-50 opacity-10" />
            <div className="fixed right-0 inset-y-0 w-1 md:w-1.5 bg-gradient-to-b from-primary via-white/20 to-primary z-50 opacity-10" />
        </main>
    );
}
