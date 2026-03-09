import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoginBackground } from "@/components/login/LoginBackground";
import { LoginBrand } from "@/components/login/LoginBrand";
import { LoginForm } from "@/components/login/LoginForm";
import { BibleCard } from "@/components/BibleCard";
import { motion } from "framer-motion";

export default function Login() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                navigate("/");
            }
        });
    }, [navigate]);

    const handleLogin = async (email: string, pass: string) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password: pass,
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
        <main className="min-h-screen bg-[#020202] relative flex flex-col items-center justify-center p-6 md:p-12 selection:bg-primary/30 overflow-hidden">
            {/* 1. Specialized Premium Background */}
            <LoginBackground />

            {/* 2. Main Login Container (Shell) */}
            <div className="relative z-10 w-full max-w-lg flex flex-col items-center">

                {/* Branding Section */}
                <LoginBrand />

                {/* Form Section */}
                <LoginForm onLogin={handleLogin} loading={loading} />

                {/* Optional Footer Elements */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ delay: 1, duration: 1.5 }}
                    className="mt-12 flex flex-col items-center gap-6"
                >
                    <div className="h-px w-12 bg-white/10" />

                    {/* Minimal Bible Card for Trust/Spirituality */}
                    <div className="scale-90 opacity-40 hover:opacity-100 transition-opacity duration-500">
                        <BibleCard variant="minimal" className="border-none bg-transparent p-0" />
                    </div>

                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-700">
                        Secure Gateway // LeadRadar Ecosystem
                    </p>
                </motion.div>
            </div>

            {/* Subtle Industrial Framing */}
            <div className="fixed top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-50 pointer-events-none" />
            <div className="fixed bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-50 pointer-events-none" />
        </main>
    );
}
