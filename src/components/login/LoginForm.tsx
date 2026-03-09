import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginFormProps {
    onLogin: (email: string, pass: string) => Promise<void>;
    loading: boolean;
}

export const LoginForm = ({ onLogin, loading }: LoginFormProps) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onLogin(email, password);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "circOut" }}
            className="w-full max-w-md"
        >
            <div className="relative group p-8 md:p-12 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden transition-all duration-500 hover:border-white/10 hover:bg-slate-900/60">
                {/* 1. Subtle Glow Background */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    <div className="space-y-6">
                        {/* Email Field */}
                        <div className="space-y-2 group/input">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 group-focus-within/input:text-primary transition-colors">
                                Neural Identifier
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-primary transition-colors">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="usuario@leadradar.com.br"
                                    required
                                    className="h-14 pl-12 bg-slate-950/50 border-white/5 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/50 text-sm text-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2 group/input">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-focus-within/input:text-primary transition-colors">
                                    Acess Key
                                </label>
                                <button type="button" className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-primary transition-colors">
                                    Reset?
                                </button>
                            </div>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-primary transition-colors">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="h-14 pl-12 pr-12 bg-slate-950/50 border-white/5 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/50 text-sm text-white transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-16 bg-white hover:bg-white/90 text-black font-black uppercase tracking-[0.3em] rounded-2xl text-[10px] shadow-xl group/btn active:scale-95 transition-all"
                    >
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div
                                    key="loader"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                >
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="text"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-3"
                                >
                                    Initialize Core
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Button>
                </form>

                <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/20 animate-pulse" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-600">
                            Secure Authentication Node
                        </span>
                    </div>
                    <span className="text-[8px] font-mono text-slate-700">v4.2.0_LR</span>
                </div>
            </div>
        </motion.div>
    );
};
