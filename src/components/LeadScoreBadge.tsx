import { memo } from "react";
import { scoreLead } from "@/lib/conversionEngine";
import { BusinessData } from "@/types/business";
import { Flame, Thermometer, Snowflake, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadScoreBadgeProps {
    lead: BusinessData;
    showReason?: boolean;
    size?: "sm" | "md" | "lg";
}

const config = {
    quente: {
        label: "🔥 HOT",
        icon: Flame,
        bg: "bg-red-50 border-red-200",
        text: "text-red-700",
        iconColor: "text-red-500",
        bar: "bg-red-500",
        pulse: "animate-pulse",
    },
    morno: {
        label: "🌡️ WARM",
        icon: Thermometer,
        bg: "bg-amber-50 border-amber-200",
        text: "text-amber-700",
        iconColor: "text-amber-500",
        bar: "bg-amber-400",
        pulse: "",
    },
    frio: {
        label: "❄️ COLD",
        icon: Snowflake,
        bg: "bg-sky-50 border-sky-200",
        text: "text-sky-700",
        iconColor: "text-sky-400",
        bar: "bg-sky-400",
        pulse: "",
    },
};

export const LeadScoreBadge = memo(function LeadScoreBadge({
    lead,
    showReason = false,
    size = "md",
}: LeadScoreBadgeProps) {
    const { score, temperature, reason } = scoreLead(lead);
    const cfg = config[temperature];
    const Icon = cfg.icon;

    if (size === "sm") {
        return (
            <span
                title={`Score: ${score}/100 — ${reason}`}
                className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold",
                    cfg.bg,
                    cfg.text
                )}
            >
                <Icon className={cn("w-3 h-3", cfg.iconColor, cfg.pulse)} />
                {score}
            </span>
        );
    }

    return (
        <div className={cn("rounded-xl border p-3 space-y-2", cfg.bg)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", cfg.iconColor, cfg.pulse)} />
                    <span className={cn("text-xs font-bold tracking-wide", cfg.text)}>
                        {cfg.label}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <TrendingUp className={cn("w-3 h-3", cfg.iconColor)} />
                    <span className={cn("text-sm font-black", cfg.text)}>{score}</span>
                    <span className="text-xs text-slate-400">/100</span>
                </div>
            </div>

            {/* Score bar */}
            <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all duration-500", cfg.bar)}
                    style={{ width: `${score}%` }}
                />
            </div>

            {/* Reason */}
            {showReason && reason && (
                <p className={cn("text-[10px] leading-tight", cfg.text)}>
                    💡 {reason}
                </p>
            )}
        </div>
    );
});
