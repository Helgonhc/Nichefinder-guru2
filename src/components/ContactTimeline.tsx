import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
    Phone, MessageSquare, Mail, FileText, Users, CheckCircle,
    XCircle, Edit3, Plus, Loader2, Clock, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ContactEventType =
    | "ligacao" | "whatsapp" | "email" | "proposta"
    | "reuniao" | "fechamento" | "sem_resposta" | "anotacao";

export type ContactResult = "positivo" | "neutro" | "negativo" | "pendente";

export interface ContactEvent {
    id: string;
    lead_id: string;
    user_id: string;
    event_type: ContactEventType;
    notes?: string;
    result: ContactResult;
    created_at: string;
}

const EVENT_CONFIG: Record<ContactEventType, { label: string; icon: React.ElementType; color: string }> = {
    ligacao: { label: "Ligação", icon: Phone, color: "text-blue-600 bg-blue-50 border-blue-200" },
    whatsapp: { label: "WhatsApp", icon: MessageSquare, color: "text-green-600 bg-green-50 border-green-200" },
    email: { label: "E-mail", icon: Mail, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
    proposta: { label: "Proposta PDF", icon: FileText, color: "text-amber-600 bg-amber-50 border-amber-200" },
    reuniao: { label: "Reunião", icon: Users, color: "text-violet-600 bg-violet-50 border-violet-200" },
    fechamento: { label: "Fechamento 🎉", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    sem_resposta: { label: "Sem Resposta", icon: XCircle, color: "text-slate-500 bg-slate-50 border-slate-200" },
    anotacao: { label: "Anotação", icon: Edit3, color: "text-slate-600 bg-white border-slate-200" },
};

const RESULT_CONFIG: Record<ContactResult, { label: string; color: string }> = {
    positivo: { label: "Positivo", color: "text-emerald-600 bg-emerald-50" },
    neutro: { label: "Neutro", color: "text-slate-500 bg-slate-50" },
    negativo: { label: "Negativo", color: "text-red-500 bg-red-50" },
    pendente: { label: "Pendente", color: "text-amber-600 bg-amber-50" },
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

interface ContactTimelineProps {
    leadId: string;
    userId: string;
}

export function ContactTimeline({ leadId, userId }: ContactTimelineProps) {
    const [events, setEvents] = useState<ContactEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [expanded, setExpanded] = useState(false);

    // Form state
    const [selectedType, setSelectedType] = useState<ContactEventType>("whatsapp");
    const [selectedResult, setSelectedResult] = useState<ContactResult>("neutro");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from("contact_history")
                .select("*")
                .eq("lead_id", leadId)
                .order("created_at", { ascending: false })
                .limit(20);

            if (error) throw error;
            setEvents(data ?? []);
        } catch (err) {
            console.error("[ContactTimeline] Erro ao buscar histórico:", err);
        } finally {
            setLoading(false);
        }
    }, [leadId]);

    useEffect(() => {
        if (expanded) fetchEvents();
    }, [expanded, fetchEvents]);

    const handleAdd = async () => {
        setSaving(true);
        try {
            const { error } = await (supabase as any)
                .from("contact_history")
                .insert({
                    lead_id: leadId,
                    user_id: userId,
                    event_type: selectedType,
                    result: selectedResult,
                    notes: notes.trim() || null,
                });

            if (error) throw error;

            toast.success("Contato registrado!");
            setNotes("");
            setAdding(false);
            await fetchEvents();
        } catch (err) {
            console.error("[ContactTimeline] Erro ao inserir evento:", err);
            toast.error("Erro ao registrar contato.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        await (supabase as any).from("contact_history").delete().eq("id", id);
        setEvents((prev) => prev.filter((e) => e.id !== id));
        toast.info("Registro removido.");
    };

    return (
        <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">
                        Histórico de Contatos
                    </span>
                    {events.length > 0 && (
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {events.length}
                        </span>
                    )}
                </div>
                {expanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
                    {/* Add button */}
                    <div className="pt-3 flex justify-end">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAdding((v) => !v)}
                            className="text-xs h-7 gap-1"
                        >
                            <Plus className="w-3 h-3" />
                            {adding ? "Cancelar" : "Registrar Contato"}
                        </Button>
                    </div>

                    {/* Add form */}
                    {adding && (
                        <div className="bg-slate-50 rounded-xl p-3 space-y-3 border border-slate-200">
                            {/* Tipo */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                    Tipo
                                </label>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {(Object.keys(EVENT_CONFIG) as ContactEventType[]).map((type) => {
                                        const cfg = EVENT_CONFIG[type];
                                        const Icon = cfg.icon;
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => setSelectedType(type)}
                                                className={cn(
                                                    "flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all",
                                                    selectedType === type
                                                        ? cfg.color + " ring-1 ring-offset-1"
                                                        : "border-slate-200 text-slate-500 bg-white hover:bg-slate-100"
                                                )}
                                            >
                                                <Icon className="w-3 h-3" />
                                                {cfg.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Resultado */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                    Resultado
                                </label>
                                <div className="flex gap-1.5 mt-1">
                                    {(Object.keys(RESULT_CONFIG) as ContactResult[]).map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setSelectedResult(r)}
                                            className={cn(
                                                "px-2 py-1 rounded-lg text-[10px] font-semibold transition-all",
                                                selectedResult === r
                                                    ? RESULT_CONFIG[r].color + " ring-1"
                                                    : "bg-white text-slate-400 border border-slate-200 hover:bg-slate-50"
                                            )}
                                        >
                                            {RESULT_CONFIG[r].label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notas */}
                            <textarea
                                placeholder="Observações (opcional)..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 resize-none outline-none focus:ring-1 focus:ring-blue-400"
                            />

                            <Button
                                size="sm"
                                onClick={handleAdd}
                                disabled={saving}
                                className="w-full h-8 text-xs"
                            >
                                {saving ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    "Salvar"
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Timeline */}
                    {loading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        </div>
                    ) : events.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-4">
                            Nenhum contato registrado ainda.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {events.map((ev) => {
                                const cfg = EVENT_CONFIG[ev.event_type];
                                const Icon = cfg.icon;
                                const result = RESULT_CONFIG[ev.result];
                                return (
                                    <div
                                        key={ev.id}
                                        className={cn(
                                            "flex gap-3 items-start p-2.5 rounded-xl border",
                                            cfg.color
                                        )}
                                    >
                                        <div className="mt-0.5 shrink-0">
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-bold">{cfg.label}</span>
                                                <span
                                                    className={cn(
                                                        "text-[9px] font-semibold px-1.5 py-0.5 rounded-full",
                                                        result.color
                                                    )}
                                                >
                                                    {result.label}
                                                </span>
                                            </div>
                                            {ev.notes && (
                                                <p className="text-[10px] mt-0.5 opacity-80 leading-tight">
                                                    {ev.notes}
                                                </p>
                                            )}
                                            <p className="text-[9px] mt-1 opacity-60">
                                                {formatDate(ev.created_at)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(ev.id)}
                                            className="opacity-30 hover:opacity-80 transition-opacity shrink-0"
                                            title="Remover"
                                        >
                                            <XCircle className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
