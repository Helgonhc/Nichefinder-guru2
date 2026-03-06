import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Plus, Tag, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// Paleta de cores para tags
const TAG_COLORS = [
    { bg: "bg-red-100 border-red-300 text-red-700", dot: "bg-red-500", label: "Vermelho" },
    { bg: "bg-orange-100 border-orange-300 text-orange-700", dot: "bg-orange-500", label: "Laranja" },
    { bg: "bg-amber-100 border-amber-300 text-amber-700", dot: "bg-amber-500", label: "Âmbar" },
    { bg: "bg-emerald-100 border-emerald-300 text-emerald-700", dot: "bg-emerald-500", label: "Verde" },
    { bg: "bg-blue-100 border-blue-300 text-blue-700", dot: "bg-blue-500", label: "Azul" },
    { bg: "bg-violet-100 border-violet-300 text-violet-700", dot: "bg-violet-500", label: "Violeta" },
    { bg: "bg-slate-100 border-slate-300 text-slate-600", dot: "bg-slate-400", label: "Cinza" },
];

// Tags rápidas pré-definidas para um clique
const QUICK_TAGS = [
    { label: "🔑 Alta Prioridade", colorIdx: 0 },
    { label: "📞 Ligar Hoje", colorIdx: 1 },
    { label: "💰 Alto Ticket", colorIdx: 3 },
    { label: "🤝 Parceiro", colorIdx: 4 },
    { label: "⏳ Aguardando", colorIdx: 6 },
    { label: "🚫 Não Perturbar", colorIdx: 6 },
];

export interface LeadTag {
    label: string;
    colorIdx: number;
}

interface LeadTagsProps {
    leadId: string;
    initialTags?: LeadTag[];
    initialFollowUp?: string; // ISO Date String
    /** Callback chamado após salvar as tags ou follow-up no banco */
    onTagsChange?: (tags: LeadTag[], nextFollowUp?: string) => void;
}

export function LeadTags({ leadId, initialTags = [], initialFollowUp, onTagsChange }: LeadTagsProps) {
    const [tags, setTags] = useState<LeadTag[]>(initialTags);
    const [followUp, setFollowUp] = useState<string | undefined>(initialFollowUp);
    const [adding, setAdding] = useState(false);
    const [editingFollowUp, setEditingFollowUp] = useState(false);
    const [newLabel, setNewLabel] = useState("");
    const [newColor, setNewColor] = useState(0);
    const [saving, setSaving] = useState(false);

    const saveData = useCallback(async (nextTags: LeadTag[], nextFollowUp?: string) => {
        setSaving(true);
        try {
            // Lê o meta_data atual para preservar outros campos
            const { data } = await (supabase as any)
                .from("leads")
                .select("meta_data")
                .eq("id", leadId)
                .single();

            const currentMeta = data?.meta_data ?? {};
            const updatedMeta = {
                ...currentMeta,
                tags: nextTags,
                next_follow_up: nextFollowUp !== undefined ? nextFollowUp : currentMeta.next_follow_up
            };

            await (supabase as any)
                .from("leads")
                .update({ meta_data: updatedMeta })
                .eq("id", leadId);

            onTagsChange?.(nextTags, updatedMeta.next_follow_up);
        } catch (err) {
            console.error("[LeadTags] Erro ao salvar dados:", err);
            toast.error("Erro ao salvar informações.");
        } finally {
            setSaving(false);
        }
    }, [leadId, onTagsChange]);

    const saveTags = (next: LeadTag[]) => saveData(next, followUp);
    const saveFollowUp = (date: string | undefined) => {
        setFollowUp(date);
        saveData(tags, date);
    };

    const addTag = async (label: string, colorIdx: number) => {
        if (!label.trim()) return;
        const exists = tags.some((t) => t.label.toLowerCase() === label.toLowerCase());
        if (exists) { toast.info("Tag já existe."); return; }
        const next = [...tags, { label: label.trim(), colorIdx }];
        setTags(next);
        setNewLabel("");
        setAdding(false);
        await saveTags(next);
        toast.success("Tag adicionada!");
    };

    const removeTag = async (label: string) => {
        const next = tags.filter((t) => t.label !== label);
        setTags(next);
        await saveTags(next);
    };

    return (
        <div className="space-y-2">
            {/* Tags existentes */}
            <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                {tags.map((tag) => {
                    const color = TAG_COLORS[tag.colorIdx] ?? TAG_COLORS[6];
                    return (
                        <span
                            key={tag.label}
                            className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold",
                                color.bg
                            )}
                        >
                            {tag.label}
                            <button
                                onClick={() => removeTag(tag.label)}
                                disabled={saving}
                                className="hover:opacity-70 transition-opacity ml-0.5"
                            >
                                <X className="w-2.5 h-2.5" />
                            </button>
                        </span>
                    );
                })}

                {/* Botão para adicionar Tag */}
                {!adding && (
                    <button
                        onClick={() => setAdding(true)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-slate-300 text-[10px] text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                    >
                        <Plus className="w-2.5 h-2.5" />
                        Tag
                    </button>
                )}

                {/* Seletor de Follow-up */}
                <div className="flex items-center gap-1.5 ml-auto">
                    {followUp && !editingFollowUp ? (
                        <div
                            onClick={() => setEditingFollowUp(true)}
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-700 cursor-pointer hover:bg-amber-100"
                        >
                            <Clock className="w-2.5 h-2.5" />
                            Prev: {new Date(followUp).toLocaleDateString()}
                            <button
                                onClick={(e) => { e.stopPropagation(); saveFollowUp(undefined); }}
                                className="hover:text-red-500 ml-0.5"
                            >
                                <X className="w-2 h-2" />
                            </button>
                        </div>
                    ) : editingFollowUp ? (
                        <div className="flex items-center gap-1">
                            <input
                                type="date"
                                autoFocus
                                className="text-[9px] px-1.5 py-0.5 rounded border border-slate-200 outline-none focus:ring-1 focus:ring-blue-400"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        saveFollowUp(e.target.value);
                                        setEditingFollowUp(false);
                                    }
                                }}
                                onBlur={() => setEditingFollowUp(false)}
                            />
                        </div>
                    ) : (
                        <button
                            onClick={() => setEditingFollowUp(true)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-amber-300 text-[10px] text-amber-500 hover:border-amber-400 hover:bg-amber-50 transition-colors"
                            title="Agendar Próximo Contato"
                        >
                            <Calendar className="w-2.5 h-2.5" />
                            Follow-up
                        </button>
                    )}
                </div>
            </div>

            {/* Formulário de nova tag */}
            {adding && (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2">
                    {/* Tags rápidas */}
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Atalhos
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {QUICK_TAGS.map((qt) => (
                                <button
                                    key={qt.label}
                                    onClick={() => addTag(qt.label, qt.colorIdx)}
                                    className={cn(
                                        "px-2 py-0.5 rounded-full border text-[9px] font-semibold transition-all hover:scale-105",
                                        TAG_COLORS[qt.colorIdx].bg
                                    )}
                                >
                                    {qt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input customizado */}
                    <div className="flex gap-1.5">
                        <input
                            autoFocus
                            placeholder="Nova tag..."
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") addTag(newLabel, newColor);
                                if (e.key === "Escape") setAdding(false);
                            }}
                            maxLength={30}
                            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white outline-none focus:ring-1 focus:ring-blue-400"
                        />

                        {/* Seletor de cor */}
                        <div className="flex items-center gap-1">
                            {TAG_COLORS.map((c, i) => (
                                <button
                                    key={i}
                                    title={c.label}
                                    onClick={() => setNewColor(i)}
                                    className={cn(
                                        "w-4 h-4 rounded-full transition-all",
                                        c.dot,
                                        newColor === i ? "ring-2 ring-offset-1 ring-blue-400 scale-125" : "hover:scale-110"
                                    )}
                                />
                            ))}
                        </div>

                        <button
                            onClick={() => addTag(newLabel, newColor)}
                            disabled={!newLabel.trim() || saving}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 disabled:opacity-40 transition-colors"
                        >
                            +
                        </button>
                        <button
                            onClick={() => { setAdding(false); setNewLabel(""); }}
                            className="px-2 py-1.5 rounded-lg border border-slate-200 text-[10px] text-slate-400 hover:bg-slate-100"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/** Badge de tag inline — para uso em listas/tabelas */
export function TagBadge({ tag }: { tag: LeadTag }) {
    const color = TAG_COLORS[tag.colorIdx] ?? TAG_COLORS[6];
    return (
        <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-semibold", color.bg)}>
            <Tag className="w-2 h-2 shrink-0" />
            {tag.label}
        </span>
    );
}
