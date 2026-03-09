import { Radar, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export const LoginBrand = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="flex flex-col items-center gap-6 mb-12 text-center"
        >
            <div className="relative group">
                {/* 1. Sophisticated Logo Core */}
                <div
                    className="w-16 h-16 bg-slate-900 border border-white/10 flex items-center justify-center relative overflow-hidden shadow-2xl transition-all duration-500 group-hover:border-primary/50"
                >
                    <div className="absolute inset-0 bg-primary/5 filter blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <Radar className="w-8 h-8 text-white relative z-10 transition-colors group-hover:text-primary" />
                </div>

                {/* 2. Floating Status Indicator */}
                <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-slate-950 border border-white/5 shadow-xl">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                </div>
            </div>

            <div className="space-y-2">
                <h1 className="text-4xl font-display font-black text-white tracking-tighter uppercase italic leading-none pointer-events-none">
                    Lead<span className="text-primary text-shadow-glow">Radar</span>
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 opacity-60">
                    SaaS de Prospecção Inteligente B2B
                </p>
            </div>
        </motion.div>
    );
};
