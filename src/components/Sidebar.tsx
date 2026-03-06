
import { NavLink } from "./NavLink";
import { Radar, Users, LayoutDashboard, Settings, Menu, X, LogOut, User, BookOpen, TrendingUp, ChevronLeft, ChevronRight, Zap, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getRandomVerse, BibleVerse } from "@/lib/bibleVerses";
import { BibleCard } from "./BibleCard";
import { useAuth } from "@/contexts/AuthContext";

export function Sidebar() {
    const { user, profile, loading: authLoading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        // Persist collapsed state
        const saved = localStorage.getItem("sidebar_collapsed");
        return saved === "true";
    });

    const userRoleLabel = profile?.role === 'super_admin' ? 'Super Admin' :
        profile?.role === 'admin' ? 'Administrador' : 'Usuário Padrão';

    const navigate = useNavigate();

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebar_collapsed", String(newState));
    };

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            toast.success("Sessão encerrada.");
            navigate("/login");
        } catch (error: any) {
            toast.error("Erro ao sair.");
        }
    };

    const navItems = [
        { icon: Radar, label: "Radar", to: "/radar" },
        { icon: Users, label: "Meus Leads", to: "/leads" },
        { icon: Zap, label: "Conversão 🔥", to: "/conversion" },
        { icon: TrendingUp, label: "Finanças", to: "/finance" },
        { icon: LayoutDashboard, label: "Automações", to: "/automation" },
        { icon: Activity, label: "War Room", to: "/war-room" },
        { icon: BookOpen, label: "Tutorial", to: "/tutorial" },
        { icon: Settings, label: "Ajustes", to: "/settings" },
    ];

    return (
        <>
            {/* Mobile Toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-3 left-4 z-[60] lg:hidden text-foreground"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[50] lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-[55] bg-sidebar border-r border-sidebar-border transform transition-all duration-500 ease-in-out lg:translate-x-0 lg:static lg:relative lg:block flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full",
                isCollapsed ? "w-20" : "w-64"
            )} style={{ boxShadow: '10px 0 30px rgba(0,0,0,0.02)' }}>
                <div className="flex flex-col h-full py-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {/* Header / Logo */}
                    <div className={cn("flex items-center gap-3 mb-8 px-6 transition-all relative overflow-visible", isCollapsed ? "justify-center px-0" : "")}>
                        <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                            <Radar className="w-5 h-5 text-primary-foreground" />
                        </div>
                        {!isCollapsed && (
                            <span className="font-display font-bold text-xl tracking-tight animate-fade-in flex-1">LeadRadar</span>
                        )}
                    </div>

                    <nav className="flex-1 space-y-2 px-3">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.label}
                                to={item.to}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 relative group",
                                    isCollapsed ? "justify-center" : ""
                                )}
                                activeClassName="bg-blue-50 text-blue-700 border border-blue-100 shadow-sm"
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                {!isCollapsed && <span>{item.label}</span>}

                                {/* Tooltip for collapsed mode */}
                                {isCollapsed && (
                                    <div className="absolute left-full ml-4 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                        {item.label}
                                    </div>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="mt-auto space-y-4 pt-6 border-t border-border/50 px-3 flex flex-col">
                        {/* Digital Bible: Minimal Sidebar Version */}
                        <div className={cn(isCollapsed ? "hidden" : "block")}>
                            <BibleCard variant="minimal" className="mb-2" />
                        </div>

                        {user?.email && (
                            <div className={cn("flex items-center gap-3 mb-2 px-2", isCollapsed ? "justify-center" : "")}>
                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                </div>
                                {!isCollapsed && (
                                    <div className="flex-1 min-w-0 animate-fade-in">
                                        <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                                        <p className="text-[10px] text-primary font-black uppercase tracking-widest opacity-80 truncate">
                                            {userRoleLabel || "Carregando..."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            className={cn("w-full justify-start gap-3 mt-2 text-slate-500 font-bold hover:text-destructive hover:bg-destructive/10", isCollapsed ? "justify-center px-0" : "px-4")}
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4 shrink-0" />
                            {!isCollapsed && <span>Sair</span>}
                        </Button>


                        <div className={cn("bg-slate-100/80 border border-slate-200 rounded-xl p-3 flex items-center gap-3", isCollapsed ? "justify-center" : "")}>
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shadow-sm shadow-blue-200" />
                            {!isCollapsed && <span className="text-[10px] uppercase tracking-widest font-black text-slate-600">Fluxo Ativado</span>}
                        </div>
                    </div>
                </div>

                {/* Top Toggle Arrow - Desktop Only */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-7 w-7 text-slate-400 hover:text-slate-900 hover:bg-slate-100 absolute hidden lg:flex items-center justify-center z-[60] transition-all duration-300",
                        isCollapsed
                            ? "-right-3.5 top-10 bg-white border border-slate-200 rounded-full shadow-md"
                            : "right-2 top-8 rounded-lg"
                    )}
                    onClick={toggleCollapse}
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
            </aside>
        </>
    );
}
