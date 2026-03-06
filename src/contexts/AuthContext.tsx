
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    profile: any | null;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await (supabase as any)
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (data) setProfile(data);
        } catch (err) {
            console.error("Error fetching profile in AuthContext:", err);
        }
    };

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id);
    };

    useEffect(() => {
        let mounted = true;
        let timeoutId: any = null;

        console.log("Nexus Auth: Monitorando frequências táticas...");

        // Safety Timeout: Impede o loop infinito se o Supabase não responder
        timeoutId = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Nexus Auth: Timeout de segurança atingido. Liberando Nexus...");
                setLoading(false);
            }
        }, 5000);

        // O onAuthStateChange do Supabase v2 envia o estado atual imediatamente na subscrição
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`Nexus Auth Event: [${event}] (Session: ${!!session})`);

            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);

                // Libera o carregamento principal assim que temos a sessão/user
                // O perfil pode carregar em segundo plano
                setLoading(false);

                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }

                if (session?.user) {
                    fetchProfile(session.user.id).catch(e => {
                        console.error("AuthContext: Profile fetch failed", e);
                    });
                } else {
                    setProfile(null);
                }
            }
        });

        return () => {
            mounted = false;
            if (timeoutId) clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, session, loading, profile, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
