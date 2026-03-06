import { useMemo } from "react";
import { BusinessData } from "@/types/business";
import { AlertTriangle, Clock, Flame, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineAlertsProps {
    leads: BusinessData[];
    onDismiss?: () => void;
}

interface Alert {
    type: "stuck" | "hot_ignored" | "no_contact" | "closing" | "followup_today";
    message: string;
    count: number;
    icon: React.ElementType;
    color: string;
    leads: BusinessData[];
}

const STUCK_DAYS = 5;   // leads sem interação há mais de X dias
const MS_PER_DAY = 86_400_000;

export function PipelineAlerts({ leads, onDismiss }: PipelineAlertsProps) {
    const alerts = useMemo((): Alert[] => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const result: Alert[] = [];

        // 0. Follow-ups agendados para HOJE ou atrasados
        const todayFollowups = leads.filter((l) => {
            const nextDate = (l as any).meta_data?.next_follow_up;
            if (!nextDate) return false;
            const d = new Date(nextDate);
            d.setHours(0, 0, 0, 0);
            return d.getTime() <= now.getTime();
        });
        if (todayFollowups.length > 0) {
            result.push({
                type: "followup_today",
                message: `${todayFollowups.length} lead${todayFollowups.length > 1 ? "s" : ""} com follow-up agendado para hoje 📅`,
                count: todayFollowups.length,
                icon: Clock,
                color: "border-blue-300 bg-blue-50 text-blue-700 font-black",
                leads: todayFollowups,
            });
        }

        // 1. Leads HOT ainda como "new" (não contatados)
        const hotNew = leads.filter(
            (l) => (l.score ?? 0) >= 70 && l.status === "new"
        );
        if (hotNew.length > 0) {
            result.push({
                type: "hot_ignored",
                message: `${hotNew.length} lead${hotNew.length > 1 ? "s" : ""} HOT 🔥 ainda não contatado${hotNew.length > 1 ? "s" : ""}`,
                count: hotNew.length,
                icon: Flame,
                color: "border-red-300 bg-red-50 text-red-700",
                leads: hotNew,
            });
        }

        // 2. Leads parados: status "contacted" ou "interested" sem atualização há +X dias
        const stuckLeads = leads.filter((l) => {
            if (!["contacted", "interested"].includes(l.status ?? "")) return false;
            const lastUpdate = l.lastInteractionDate
                ? new Date(l.lastInteractionDate).getTime()
                : l.lastScanAt
                    ? new Date(l.lastScanAt).getTime()
                    : 0;
            if (!lastUpdate) return false;
            return (now.getTime() - lastUpdate) / MS_PER_DAY > STUCK_DAYS;
        });
        if (stuckLeads.length > 0) {
            result.push({
                type: "stuck",
                message: `${stuckLeads.length} lead${stuckLeads.length > 1 ? "s" : ""} parado${stuckLeads.length > 1 ? "s" : ""} há +${STUCK_DAYS} dias`,
                count: stuckLeads.length,
                icon: Clock,
                color: "border-amber-300 bg-amber-50 text-amber-700",
                leads: stuckLeads,
            });
        }

        // 3. Leads "interested" prontos para fechar
        const readyToClose = leads.filter((l) => l.status === "interested");
        if (readyToClose.length > 0) {
            result.push({
                type: "closing",
                message: `${readyToClose.length} lead${readyToClose.length > 1 ? "s" : ""} interessado${readyToClose.length > 1 ? "s" : ""} prontos para proposta`,
                count: readyToClose.length,
                icon: TrendingUp,
                color: "border-emerald-300 bg-emerald-50 text-emerald-700",
                leads: readyToClose,
            });
        }

        return result;
    }, [leads]);

    if (alerts.length === 0) return null;

    return (
        <div className="mb-6 space-y-2">
            <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Alertas do Pipeline
                </span>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="ml-auto text-slate-300 hover:text-slate-500 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {alerts.map((alert) => {
                    const Icon = alert.icon;
                    return (
                        <div
                            key={alert.type}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl border font-medium",
                                alert.color
                            )}
                        >
                            <div className="shrink-0">
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold leading-tight">{alert.message}</p>
                                <p className="text-[9px] opacity-70 mt-0.5 leading-tight">
                                    {alert.type === "followup_today" && "Cumpra o combinado e feche a venda"}
                                    {alert.type === "hot_ignored" && "Aborde enquanto há oportunidade"}
                                    {alert.type === "stuck" && "Faça follow-up ou atualize o status"}
                                    {alert.type === "closing" && "Envie a proposta PDF agora"}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
