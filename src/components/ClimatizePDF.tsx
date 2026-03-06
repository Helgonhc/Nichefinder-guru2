import jsPDF from 'jspdf';
import { toast } from "sonner";
import { BusinessData } from "@/types/business";

interface ClimatizePDFProps {
    doc: jsPDF;
    business: BusinessData;
    sellerName: string;
    sellerEmail: string;
    sellerWhatsapp: string;
    sellerInstagram: string;
    sellerWebsite: string;
    logoBase64?: string;
}

const COLORS = {
    primary: [12, 15, 20] as [number, number, number],   // #0c0f14 (Background Deep)
    secondary: [148, 163, 184] as [number, number, number], // #94a3b8 (Secondary Text)
    accent: [14, 165, 233] as [number, number, number],    // #0ea5e9 (Accent)
    emerald: [16, 185, 129] as [number, number, number],   // #10b981
    violet: [139, 92, 246] as [number, number, number],     // #8b5cf6
    white: [255, 255, 255] as [number, number, number],
    slate800: [30, 41, 59] as [number, number, number],
};

const ASSETS = {
    dashboard: "https://telemetria-eletricom.me/dashboard-preview.png",
    logo: "https://telemetria-eletricom.me/favicon.ico"
};

async function safeImgV6(doc: jsPDF, url: string, x: number, y: number, w: number, h: number, opacity = 1): Promise<void> {
    if (!url) return;
    return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(), 5000);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            clearTimeout(timeout);
            try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    ctx.drawImage(img, 0, 0);
                    const base64 = canvas.toDataURL("image/png");
                    if (opacity < 1) doc.setGState(new (doc as any).GState({ opacity }));
                    doc.addImage(base64, "PNG", x, y, w, h, undefined, "FAST");
                    if (opacity < 1) doc.setGState(new (doc as any).GState({ opacity: 1 }));
                }
            } catch (imgErr) {
                console.warn('[ClimatizePDF] Falha ao carregar imagem:', imgErr);
            }
            resolve();
        };
        img.onerror = () => resolve();
        img.src = `${url}?v=${Date.now()}`;
    });
}

export async function generateClimatizePDF({
    doc,
    business,
    sellerName,
    sellerEmail,
    sellerWhatsapp,
    sellerInstagram,
    sellerWebsite,
    logoBase64
}: ClimatizePDFProps): Promise<void> {
    const toastId = "pdf-climatize-v8";
    toast.loading("Otimização Energética v8 Mirror...", { id: toastId });
    console.log("🚀 Iniciando Climatização v8 Mirror");

    const PAGE_W = 210;
    const PAGE_H = 297;
    const CENTER_X = 105;
    const MARGIN = 15;
    const CONTENT_W = PAGE_W - (MARGIN * 2);

    const bNameClean = (business.name || "NEGÓCIO").split('-')[0].trim();
    let cy = 0;

    const txt = (doc: jsPDF, t: string, x: number, y: number, size = 10, color = COLORS.secondary, font = "helvetica", style = "normal", align: "left" | "center" | "right" = "left") => {
        doc.setFont(font, style);
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(t, x, y, { align });
    };

    const wrap = (doc: jsPDF, t: string, x: number, y: number, w: number, size = 10, leading = 5, color = COLORS.secondary) => {
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);
        const lines = doc.splitTextToSize(t, w);
        doc.text(lines, x, y);
        return lines.length * leading;
    };

    const drawHeader = (page: number) => {
        doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.rect(0, 0, PAGE_W, 10, "F");
        txt(doc, "ELETRICOM — GESTÃO TÉRMICA INDUSTRIAL", MARGIN, 6.5, 6, COLORS.accent, "helvetica", "bold");
        txt(doc, `V8 INDUSTRIAL | PÁGINA ${page} DE 5`, PAGE_W - MARGIN, 6.5, 6, COLORS.secondary, "helvetica", "normal", "right");
    };

    try {
        // --- PÁGINA 1: CAPA v8 MIRROR ---
        doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.rect(0, 0, PAGE_W, PAGE_H, "F");

        await safeImgV6(doc, ASSETS.dashboard, 100, 30, 100, 80, 0.4);

        if (logoBase64) {
            try { doc.addImage(logoBase64, 'PNG', MARGIN, 15, 30, 10); } catch { }
        }

        cy = 70;
        doc.setFillColor(COLORS.violet[0], COLORS.violet[1], COLORS.violet[2], 0.2);
        doc.roundedRect(MARGIN, cy, 60, 8, 4, 4, "F");
        txt(doc, "⚡ CASE DE SUCESSO: VAREJO", MARGIN + 4, cy + 5.5, 8, COLORS.violet, "helvetica", "bold");

        cy += 25;
        txt(doc, "AUTOMAÇÃO INTELIGENTE", MARGIN, cy, 28, COLORS.white, "helvetica", "bold");
        cy += 16;
        txt(doc, "DE CLIMATIZADORES", MARGIN, cy, 28, COLORS.accent, "helvetica", "bold");

        cy += 20;
        const p1 = "Otimização térmica baseada em algoritmos preditivos. Redução direta de até 30% no consumo de energia de sistemas de climatização industrial e varejista.";
        cy += wrap(doc, p1, MARGIN, cy, 140, 11, 7, COLORS.secondary);

        cy = 220;
        doc.setFillColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2], 0.4);
        doc.roundedRect(MARGIN, cy, CONTENT_W, 40, 4, 4, "F");
        txt(doc, "ESTUDO DE PAYBACK v8Mirror ELABORADO PARA:", MARGIN + 10, cy + 12, 8, COLORS.accent, "helvetica", "bold");
        txt(doc, bNameClean.toUpperCase(), MARGIN + 10, cy + 28, 24, COLORS.white, "helvetica", "bold");

        // --- PÁGINA 2: SEGMENTOS (LITERAL) ---
        doc.addPage();
        drawHeader(2);

        cy = 35;
        txt(doc, "SEGMENTOS DE ATUAÇÃO E ROI", MARGIN, cy, 18, COLORS.primary, "helvetica", "bold");

        const segments = [
            { t: "Condomínios Logísticos", d: "Galpões e centros de distribuição com múltiplos reservatórios e climatização." },
            { t: "Shopping Centers", d: "Complexos comerciais com alta demanda hídrica e climatização de grandes áreas." },
            { t: "Redes de Varejo", d: "Lojas e filiais com automação de climatizadores e controle centralizado." },
            { t: "Edifícios Comerciais", d: "Prédios corporativos com sistemas de climatização por andares e eficiência." }
        ];

        cy += 15;
        segments.forEach(s => {
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(MARGIN, cy, CONTENT_W, 20, 2, 2, "F");
            txt(doc, s.t.toUpperCase(), MARGIN + 6, cy + 8, 9, COLORS.accent, "helvetica", "bold");
            txt(doc, s.d, MARGIN + 6, cy + 14, 10, [50, 50, 50]);
            cy += 24;
        });

        // --- PÁGINA 3: ELETRI-FLOW ---
        doc.addPage();
        drawHeader(3); cy = 35;
        txt(doc, "TECNOLOGIA ELETRI-FLOW", MARGIN, cy, 18, COLORS.primary, "helvetica", "bold");
        cy += 12;
        const p2 = "O sistema monitora as condições ambientais continuamente e aciona os climatizadores apenas quando necessário, eliminando desperdício e reduzindo custos operacionais. Atendemos Redes de Varejo, Shopping Centers e Indústria.";
        cy += wrap(doc, p2, MARGIN, cy, CONTENT_W, 11, 7, [50, 50, 50]);

        await safeImgV6(doc, ASSETS.dashboard, MARGIN, cy + 10, CONTENT_W, 100, 1);

        // --- PÁGINA 4: ROI ---
        doc.addPage();
        drawHeader(4); cy = 35;
        txt(doc, "PAYBACK E RETORNO INDUSTRIAL", MARGIN, cy, 18, COLORS.primary, "helvetica", "bold");

        const stats = [
            { l: "REDUÇÃO DE ENERGIA", v: "Até 30%", d: "Otimização de compressores e motores de ventilação." },
            { l: "VIDA ÚTIL EQUIPAMENTOS", v: "+25%", d: "Redução de estresse mecânico por ciclos excessivos." },
            { l: "ESTABILIDADE TÉRMICA", v: "100%", d: "Garantia de temperatura constante para estoques." }
        ];

        cy += 15;
        stats.forEach(s => {
            doc.setFillColor(245, 248, 252);
            doc.roundedRect(MARGIN, cy, CONTENT_W, 25, 3, 3, "F");
            txt(doc, s.l, MARGIN + 8, cy + 10, 9, COLORS.accent, "helvetica", "bold");
            txt(doc, s.v, PAGE_W - MARGIN - 8, cy + 12, 18, COLORS.primary, "helvetica", "bold", "right");
            txt(doc, s.d, MARGIN + 8, cy + 18, 9, [100, 100, 100]);
            cy += 30;
        });

        // --- PÁGINA 5: CTA ---
        doc.addPage();
        drawHeader(5);
        doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.rect(0, 0, PAGE_W, PAGE_H, "F");

        cy = 100;
        txt(doc, "VAMOS OTIMIZAR SUA OPERAÇÃO?", CENTER_X, cy, 22, COLORS.white, "helvetica", "bold", "center");
        txt(doc, sellerName, CENTER_X, 220, 18, COLORS.white, "helvetica", "bold", "center");
        txt(doc, `${sellerWhatsapp} | ${sellerEmail}`, CENTER_X, 235, 12, COLORS.secondary, "helvetica", "bold", "center");

        doc.save(`DOSSIE_CLIMATIZACAO_v8_INDUSTRIAL_${bNameClean.toUpperCase()}.pdf`);
        toast.success("Climatização v8 Mirror Gerada!", { id: toastId });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[ClimatizePDF] Erro ao gerar PDF:', message);
        toast.error(`Erro ao gerar PDF: ${message}`);
    }
}
