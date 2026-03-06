import { useState } from "react";
import { BusinessData } from "@/types/business";
import { generateContent } from "@/lib/aiService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, FileText, Layout } from "lucide-react";
import { generateSitePDF } from "./SitePDF";
import { useToast } from "@/components/ui/use-toast";

interface SitePDFGeneratorModalProps {
    business: BusinessData | null;
    open: boolean;
    onClose: () => void;
}

export function SitePDFGeneratorModal({ business, open, onClose }: SitePDFGeneratorModalProps) {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!business) return;
        setLoading(true);

        try {
            toast({
                title: "Iniciando Engenharia Digital",
                description: "A I.A. está projetando o mockup do site agora...",
            });

            // Generate HTML via AI
            const response = await generateContent(business, 'website_html', "Você", prompt);
            const generatedHtml = response.content || "";

            toast({
                title: "Mockup Projetado!",
                description: "Agora estamos forjando o PDF final...",
            });

            // Generate PDF with the custom HTML
            await generateSitePDF(business, generatedHtml);

            onClose();
        } catch (error: any) {
            console.error("Error generating customized PDF:", error);
            toast({
                title: "Falha na Geração",
                description: error.message || "Ocorreu um erro ao gerar o site via I.A.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[500px] border-primary/20 bg-slate-950 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold italic tracking-tight">
                        <Layout className="w-6 h-6 text-primary" />
                        GERADOR DE <span className="text-primary italic">SITE REAL</span>
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Descreva como você imagina o site ideal para este lead. A I.A. vai criar o design real e injetar no mockup do PDF.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Briefing do Design (Opcional)</label>
                        <Textarea
                            placeholder="Ex: Um site ultra-luxuoso em tons de preto e dourado, com foco em depoimentos e autoridade..."
                            className="min-h-[120px] bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:border-primary/50"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-300 italic">
                            A I.A. irá gerar o código HTML e CSS nativo, simulando um site profissional funcional para impactar o cliente no mockup Desktop.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={loading} className="text-slate-400 hover:text-white">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 text-black font-bold gap-2 px-6"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                PROJETANDO...
                            </>
                        ) : (
                            <>
                                <FileText className="w-4 h-4" />
                                GERAR PROPOSTA VIP
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
