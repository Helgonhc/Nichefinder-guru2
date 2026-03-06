import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { BusinessData } from "@/types/business";

// -------------------------------------------------------------------------------------------------
// HARMONIA & CURA - VIBRANT VITALITY v18 (OPERAÇÃO VIDA)
// -------------------------------------------------------------------------------------------------
const COLORS = {
  primary: [44, 70, 53] as [number, number, number],   // Deep Forest Sage
  secondary: [248, 245, 240] as [number, number, number], // Paper White
  accent: [197, 160, 101] as [number, number, number],  // Bronze Gold
  sky: [116, 144, 226] as [number, number, number],    // Sky Blue
  text: [28, 32, 29] as [number, number, number],      // Near Black
  gray: [140, 145, 142] as [number, number, number],   // Medium Gray
  white: [255, 255, 255] as [number, number, number],
  border: [215, 210, 200] as [number, number, number],
  highlight: [238, 232, 220] as [number, number, number], // Rodapé Golden Mist
};

const ASSETS = {
  reich: "https://terapiasalternativas.social.br/assets/wilhelm_reich-BqubYluL.png",
  caixas: "https://terapiasalternativas.social.br/assets/caixas_orgonicas-DNW6Ev5N.jpg",
  detail: "https://terapiasalternativas.social.br/assets/orgone_detail-Dlh2hXhs.png"
};

// -------------------------------------------------------------------------------------------------
// GEOMETRIC & DECORATIVE HELPERS
// -------------------------------------------------------------------------------------------------
function cleanCity(city: string): string {
  if (!city) return "SUA CIDADE";
  return city.split(',')[0].trim().toUpperCase();
}

function cleanName(name: string): string {
  if (!name) return "NEGÓCIO";
  return name.split('-')[0].split('|')[0].trim();
}

function drawAtomicSystem(doc: jsPDF, x: number, y: number, scale = 1) {
  const radius = 25 * scale;
  doc.setLineWidth(0.2 * scale);
  doc.setDrawColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  doc.ellipse(x, y, radius, radius * 0.4, "S");
  doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  doc.setLineDashPattern([2, 2], 0);
  doc.ellipse(x, y, radius * 0.4, radius, "S");
  doc.setLineDashPattern([], 0);
  doc.setFillColor(COLORS.sky[0], COLORS.sky[1], COLORS.sky[2]);
  doc.circle(x + radius, y, 1.2 * scale, "F");
  doc.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  doc.circle(x, y - radius, 1.2 * scale, "F");
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.circle(x, y, 2 * scale, "F");
}

function drawEnergyPulse(doc: jsPDF, x: number, y: number, radius: number) {
  doc.setLineWidth(0.1);
  doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  doc.setLineDashPattern([1, 2], 0);
  doc.circle(x, y, radius, "S");
  doc.setDrawColor(COLORS.sky[0], COLORS.sky[1], COLORS.sky[2]);
  doc.circle(x, y, radius + 5, "S");
  doc.setLineDashPattern([], 0);
}

function drawParticleField(doc: jsPDF, x: number, y: number, w: number, h: number) {
  for (let i = 0; i < 15; i++) {
    const px = x + Math.random() * w;
    const py = y + Math.random() * h;
    const size = 0.2 + Math.random() * 0.6;
    const color = Math.random() > 0.5 ? COLORS.accent : COLORS.sky;
    doc.setFillColor(color[0], color[1], color[2]);
    doc.circle(px, py, size, "F");
  }
}

async function safeImg(doc: jsPDF, url: string, x: number, y: number, w: number, h: number, rounded = false): Promise<void> {
  if (!url) return;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const ratio = img.naturalWidth / img.naturalHeight;
          const targetW = h * ratio;
          const finalW = targetW > w ? w : targetW;
          const finalH = finalW / ratio;
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);
          const base64 = canvas.toDataURL("image/png");
          if (rounded) {
            doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
            doc.setLineWidth(0.5);
            doc.roundedRect(x + (w - finalW) / 2 - 1, y + (h - finalH) / 2 - 1, finalW + 2, finalH + 2, 1, 1, "S");
          }
          doc.addImage(base64, "PNG", x + (w - finalW) / 2, y + (h - finalH) / 2, finalW, finalH, undefined, "FAST");
        }
      } catch (e) { console.warn("Img fail", e); }
      resolve();
    };
    img.onerror = () => resolve();
    img.src = url;
  });
}

// -------------------------------------------------------------------------------------------------
// PRECISION TEXT UTILITIES (v17+ Formula Integrated)
// -------------------------------------------------------------------------------------------------
async function fetchFreshProfile(): Promise<any> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await (supabase as any).from("profiles").select("*").eq("id", user.id).maybeSingle();
    return data || null;
  } catch { return null; }
}

function txt(doc: jsPDF, text: any, x: number, y: number, size = 9, color = COLORS.text, font = "helvetica", style = "normal", align: "left" | "center" | "right" = "left", spacing = 0, maxW = 0) {
  doc.setFont(font, style);
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
  const content = String(text);
  let curSize = size;
  if (maxW > 0) {
    let curW = (doc.getStringUnitWidth(content) * curSize / doc.internal.scaleFactor) + (spacing * (content.length - 1));
    while (curW > maxW && curSize > 5) {
      curSize -= 0.5;
      doc.setFontSize(curSize);
      curW = (doc.getStringUnitWidth(content) * curSize / doc.internal.scaleFactor) + (spacing * (content.length - 1));
    }
  }
  const unitWidth = (doc.getStringUnitWidth(content) * curSize) / doc.internal.scaleFactor;
  const spacingWidth = spacing * (content.length - 1);
  const realWidth = unitWidth + spacingWidth;
  let finalX = x;
  if (align === "center") finalX = x - realWidth / 2;
  else if (align === "right") finalX = x - realWidth;
  doc.setCharSpace(spacing);
  doc.text(content, finalX, y);
  doc.setCharSpace(0);
}

function wrap(doc: jsPDF, text: any, x: number, y: number, maxW: number, lineHeight: number, size = 9, color = COLORS.text, font = "helvetica", style = "normal", align: "left" | "center" = "left"): number {
  doc.setFont(font, style);
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
  const lines = doc.splitTextToSize(String(text), maxW);
  lines.forEach((line: string, i: number) => {
    const unitW = (doc.getStringUnitWidth(line) * size) / doc.internal.scaleFactor;
    let lx = x;
    if (align === "center") lx = x - (unitW / 2);
    doc.text(line, lx, y + (i * lineHeight));
  });
  return lines.length * lineHeight;
}

function hline(doc: jsPDF, x: number, y: number, w: number, color = COLORS.border, thickness = 0.1) {
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(thickness);
  doc.line(x, y, x + w, y);
}

// -------------------------------------------------------------------------------------------------
// MAIN GENERATOR (v18 - OPERAÇÃO VIDA)
// -------------------------------------------------------------------------------------------------
export async function generateHolisticPDF(business: BusinessData): Promise<void> {
  const toastId = "pdf-orgone-v18";
  toast.loading("Infundindo Vitalidade v18...", { id: toastId });

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PAGE_W = 210;
  const PAGE_H = 297;
  const CENTER_X = 105;
  const MARGIN = 30;
  const CONTENT_W = PAGE_W - (MARGIN * 2);

  const profile = await fetchFreshProfile();
  const bNameClean = cleanName(business.name);
  const bCityClean = cleanCity(business.city);
  const sellerName = profile?.full_name || "Especialista";
  const sellerWhatsapp = profile?.whatsapp || "";
  const sellerInstagram = (profile?.instagram || "").replace(/^@/, "").replace(/[^a-zA-Z0-9._]/g, "");
  const sellerEmail = profile?.email || "";
  const logoUrl = profile?.logo_url || "";

  let cy = 0;

  const drawHeader = (page: number) => {
    drawParticleField(doc, MARGIN, 5, CONTENT_W, 15);
    hline(doc, MARGIN, 20, CONTENT_W, COLORS.accent, 0.4);
    txt(doc, "MANUAL DE IMPLEMENTAÇÃO ORGONIAL", MARGIN + 10, 17, 7, COLORS.primary, "helvetica", "bold", "left", 0.2);
    drawAtomicSystem(doc, MARGIN + 4, 16, 0.22);
    txt(doc, `${page}/6`, PAGE_W - MARGIN, 17, 7, COLORS.gray, "helvetica", "normal", "right");
  };

  const drawFooter = () => {
    const footerY = 268;
    const footerH = 20;

    // fundo com margem lateral visual
    doc.setFillColor(COLORS.highlight[0], COLORS.highlight[1], COLORS.highlight[2]);
    doc.roundedRect(MARGIN - 5, footerY, CONTENT_W + 10, footerH, 2, 2, "F");

    // linha superior elegante
    hline(doc, MARGIN, footerY, CONTENT_W, COLORS.accent, 0.3);

    // texto central com respiro
    txt(
      doc,
      `© 2026 ${sellerName.toUpperCase()} ✦ terapiasalternativas.social.br`,
      CENTER_X,
      footerY + 12,
      7.2,
      COLORS.primary,
      "helvetica",
      "bold",
      "center",
      0,
      CONTENT_W
    );

    // link clicável
    doc.link(CENTER_X - 55, footerY + 7, 110, 10, {
      url: "https://terapiasalternativas.social.br",
    });
  };

  try {
    // =============================================================================================
    // PAGE 1: COVER (VIBRANT)
    // =============================================================================================
    doc.setFillColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
    doc.rect(0, 0, PAGE_W, PAGE_H, "F");

    // Background Energy Rings
    drawEnergyPulse(doc, CENTER_X, 85, 35);
    drawEnergyPulse(doc, CENTER_X, 85, 45);
    drawAtomicSystem(doc, CENTER_X, 85, 1.8);

    if (logoUrl) await safeImg(doc, logoUrl, CENTER_X - 25, 60, 50, 40);

    cy = 175;
    txt(doc, "PROTOCOLOS DE ALTA PERFORMANCE", CENTER_X, cy - 25, 11, COLORS.gray, "helvetica", "normal", "center", 0.8, CONTENT_W);

    txt(doc, "ENCONTRE SEU", CENTER_X, cy - 10, 26, COLORS.primary, "helvetica", "bold", "center", 0.2, CONTENT_W);
    txt(doc, "EQUILÍBRIO NATURAL", CENTER_X, cy + 4, 26, COLORS.accent, "helvetica", "bold", "center", 0.2, CONTENT_W);

    hline(doc, CENTER_X - 25, cy + 12, 50, COLORS.accent, 0.8);

    txt(doc, bNameClean.toUpperCase(), CENTER_X, cy + 35, 16, COLORS.text, "helvetica", "bold", "center", 0.4, CONTENT_W);
    txt(doc, bCityClean, CENTER_X, cy + 44, 10, COLORS.gray, "helvetica", "normal", "center", 0.6, CONTENT_W);

    txt(doc, "UMA JORNADA GUIADA PELA CIÊNCIA E PELA HARMONIA", CENTER_X, 255, 8.5, COLORS.gray, "helvetica", "normal", "center", 0.4, CONTENT_W);
    txt(doc, sellerName.toUpperCase(), CENTER_X, 265, 14, COLORS.primary, "helvetica", "bold", "center", 0.2, CONTENT_W);

    // =============================================================================================
    // PAGE 2: HISTORY (VIBRANT)
    // =============================================================================================
    doc.addPage();
    drawHeader(2);
    cy = 45;
    txt(doc, "A JORNADA CIENTÍFICA", MARGIN, cy, 7.5, COLORS.accent, "helvetica", "bold", "left", 0.5);
    cy += 10;
    txt(doc, "Wilhelm Reich e a Energia Orgone.", MARGIN, cy, 19, COLORS.primary, "helvetica", "bold", "left", 0.1);
    cy += 18;

    const IMG2_W = 65, IMG2_H = 60, GUTTER = 10;
    const TXT2_W = CONTENT_W - IMG2_W - GUTTER;
    const imgStartY = cy;
    await safeImg(doc, ASSETS.reich, PAGE_W - MARGIN - IMG2_W, cy, IMG2_W, IMG2_H, true);

    const s1 = "O psicanalista e psiquiatra Wilhelm Reich nasceu em 1897 na Galícia. Desde cedo, seu contato com a natureza despertou um interesse profundo pelos fenômenos vitais, uma curiosidade que o guiaria por toda a sua carreira científica.";
    let textCy2 = cy;
    textCy2 += wrap(doc, s1, MARGIN, textCy2, TXT2_W, 6.5, 10.5, COLORS.text);
    textCy2 += 10;

    const s2 = "Sua jornada foi marcada por uma busca incessante pela compreensão da energia que anima a vida, desafiando as fronteiras entre a biologia, a psiquiatria e a física.";
    textCy2 += wrap(doc, s2, MARGIN, textCy2, TXT2_W, 6.5, 10.5, COLORS.text);
    cy = Math.max(imgStartY + IMG2_H, textCy2) + 15;

    // Callout Box
    doc.setFillColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
    doc.roundedRect(MARGIN, cy, CONTENT_W, 40, 2, 2, "F");
    doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, cy, CONTENT_W, 40, 2, 2, "S");

    let boxCy = cy + 10;
    txt(doc, "A FORMAÇÃO MÉDICA E O LEGADO", MARGIN + 8, boxCy, 9, COLORS.accent, "helvetica", "bold");
    boxCy += 8;
    const s3 = "Aluno excepcional na Universidade de Viena, Reich foi um dos membros mais brilhantes do círculo de Sigmund Freud. Ele propôs trazer o movimento corporal de volta para a terapia, transformando a prática clínica moderna.";
    wrap(doc, s3, MARGIN + 8, boxCy, CONTENT_W - 16, 6, 10, COLORS.text);

    drawFooter();

    // =============================================================================================
    // PAGE 3: SCIENCE (VIBRANT)
    // =============================================================================================
    doc.addPage();
    drawHeader(3);
    cy = 45;
    txt(doc, "TECNOLOGIA CLÍNICA", MARGIN, cy, 7.5, COLORS.accent, "helvetica", "bold", "left", 0.5);
    cy += 10;
    txt(doc, "O Acumulador de 1940.", MARGIN, cy, 19, COLORS.primary, "helvetica", "bold", "left", 0.1);
    cy += 18;

    const IMG3_W = 85, IMG3_H = 55;
    const img3StartY = cy;
    await safeImg(doc, ASSETS.caixas, MARGIN, cy, IMG3_W, IMG3_H, true);

    const s4 = "Em 1940, Reich desenvolveu o Acumulador de Energia Orgone. O dispositivo foi projetado para capturar e concentrar a energia vital da atmosfera, permitindo que o corpo humano absorvesse essa força de cura intensificada.";
    const s5 = "A estrutura consiste em camadas alternadas de materiais orgânicos (que atraem a energia) e metálicos (que a irradiam), criando um campo de revitalização profunda.";

    let textCy3 = cy;
    textCy3 += wrap(doc, s4, MARGIN + IMG3_W + GUTTER, textCy3, CONTENT_W - IMG3_W - GUTTER, 6.5, 10.5, COLORS.text);
    textCy3 += 8;
    textCy3 += wrap(doc, s5, MARGIN + IMG3_W + GUTTER, textCy3, CONTENT_W - IMG3_W - GUTTER, 6.5, 10.5, COLORS.text);

    cy = Math.max(img3StartY + IMG3_H, textCy3) + 20;
    hline(doc, MARGIN, cy, CONTENT_W, COLORS.accent, 0.4);
    cy += 15;

    const techItems = [
      { h: "CAMADA ORGÂNICA", p: "Funciona como uma esponja para a energia vital ambiental presente no ar.", c: COLORS.primary },
      { h: "CAMADA METÁLICA", p: "Reflete e irradia a energia para o centro da caixa onde o indivíduo permanece.", c: COLORS.accent },
      { h: "FLUXO BIOLÓGICO", p: "O corpo absorve a carga energética, restaurando o equilíbrio entre mente e espírito.", c: COLORS.sky }
    ];

    techItems.forEach((item, idx) => {
      doc.setFillColor(item.c[0], item.c[1], item.c[2]);
      doc.circle(MARGIN + 5, cy - 2, 1.5, "F");
      txt(doc, item.h, MARGIN + 12, cy, 9, item.c, "helvetica", "bold", "left", 0.5);
      cy += 8;
      cy += wrap(doc, item.p, MARGIN + 12, cy, CONTENT_W - 12, 5.5, 10, COLORS.text);
      cy += 10;
    });

    drawFooter();

    // =============================================================================================
    // PAGE 4: RESULTS (VIBRANT)
    // =============================================================================================
    doc.addPage();
    drawHeader(4);
    cy = 45;
    txt(doc, "MANUTENÇÃO VITAL", MARGIN, cy, 7.5, COLORS.accent, "helvetica", "bold", "left", 0.5);
    cy += 10;
    txt(doc, "A Resposta do Organismo.", MARGIN, cy, 19, COLORS.primary, "helvetica", "bold", "left", 0.1);
    cy += 18;

    doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.roundedRect(MARGIN, cy, CONTENT_W, 115, 3, 3, "F");

    drawParticleField(doc, MARGIN, cy, CONTENT_W, 115);

    cy += 15;
    txt(doc, "BENEFÍCIOS COMPROVADOS", CENTER_X, cy, 12, COLORS.accent, "helvetica", "bold", "center", 0.8);
    cy += 5;
    hline(doc, CENTER_X - 25, cy, 50, COLORS.white, 0.5);
    cy += 15;

    const bullets = [
      "Fortalecimento imediato do sistema imunológico biofísico.",
      "Redução drástica dos níveis de cortisol e estresse crônico.",
      "Alívio de tensões nas couraças musculares (Anéis de Reich).",
      "Rejuvenescimento celular e revitalização biológica integral.",
      "Equilíbrio emocional e clareza mental profunda pós-sessão.",
      "Diferencial de autoridade e inovação para sua clínica."
    ];
    bullets.forEach(b => {
      doc.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.circle(MARGIN + 15, cy - 1.5, 1.2, "F");
      txt(doc, b, MARGIN + 22, cy, 11.5, COLORS.white, "helvetica", "normal");
      cy += 13;
    });
    drawFooter();

    // =============================================================================================
    // PAGE 5: OFFER (VIBRANT)
    // =============================================================================================
    doc.addPage();
    drawHeader(5);
    cy = 45;
    txt(doc, "IMPLEMENTAÇÃO", MARGIN, cy, 7.5, COLORS.accent, "helvetica", "bold", "left", 0.5);
    cy += 10;
    txt(doc, "A Linha Harmonia & Cura.", MARGIN, cy, 19, COLORS.primary, "helvetica", "bold", "left", 0.1);
    cy += 18;

    const IMG5_W = 80, IMG5_H = 50;
    const img5StartY = cy;
    await safeImg(doc, ASSETS.caixas, PAGE_W - MARGIN - IMG5_W, cy, IMG5_W, IMG5_H, true);

    const TXT5_W = CONTENT_W - IMG5_W - GUTTER;
    txt(doc, "O MODELO DE EXCELÊNCIA", MARGIN, cy, 12, COLORS.accent, "helvetica", "bold");
    cy += 12;
    txt(doc, "CAIXA ORGÔNICA PLENITUDE", MARGIN, cy, 15, COLORS.primary, "helvetica", "bold", "left", 0, TXT5_W);
    cy += 8;
    txt(doc, "(Edição Especial 10 Camadas)", MARGIN, cy, 10, COLORS.gray, "helvetica", "italic", "left");
    cy += 15;

    const boxW = 65, boxH = 16;
    const boxX = MARGIN + (TXT5_W / 2);
    // Sombra do badge
    doc.setFillColor(200, 200, 200);
    doc.roundedRect(boxX - (boxW / 2) + 1, cy + 1, boxW, boxH, 1, 1, "F");

    doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.roundedRect(boxX - (boxW / 2), cy, boxW, boxH, 1, 1, "F");
    txt(doc, "ESPECIFICAÇÃO: MASTER v18", boxX, cy + 10.5, 12, COLORS.white, "helvetica", "bold", "center", 0.4);

    cy = Math.max(cy + 30, img5StartY + IMG5_H + 20);

    txt(doc, "CONDIÇÕES DE IMPLEMENTAÇÃO", MARGIN, cy, 10, COLORS.accent, "helvetica", "bold", "left", 0.5);
    cy += 12;
    const terms = [
      "• Protocolo de Montagem: Fidelidade absoluta ao design Reichiano (1940)",
      "• Entrega das Camadas: Estruturação orgânica e metálica certificada",
      "• Conteúdo Técnico: Inclui Manual de Práticas e Mentoria Vital",
      "• Acompanhamento: Suporte para calibração energética da caixa"
    ];
    terms.forEach(t => {
      txt(doc, t, MARGIN, cy, 11, COLORS.text, "helvetica", "normal");
      cy += 10;
    });
    drawFooter();

    // =============================================================================================
    // PAGE 6: CLOSING (VIBRANT)
    // =============================================================================================
    doc.addPage();
    drawHeader(6);
    cy = 45;
    txt(doc, "PRÓXIMO PASSO", MARGIN, cy, 7.5, COLORS.accent, "helvetica", "bold", "left", 0.5);
    cy += 10;
    txt(doc, "O Futuro da sua Clínica.", MARGIN, cy, 19, COLORS.primary, "helvetica", "bold", "left", 0.1);
    cy += 30;

    const quote = "\"A vida é energia, e a harmonia é o fluxo livre dessa energia em nós.\"";
    const closingText = `${quote}\n\nEstamos prontos para transformar a ${bNameClean} em uma referência absoluta em tecnologia orgonial em ${bCityClean}.\n\nVamos manifestar esse equilíbrio amanhã?`;

    txt(doc, "MANIFESTO DE TRANSFORMAÇÃO", CENTER_X, cy - 10, 8, COLORS.accent, "helvetica", "bold", "center", 1.2);
    cy += wrap(doc, closingText, CENTER_X, cy, CONTENT_W, 9, 13, COLORS.primary, "helvetica", "italic", "center");

    cy += 30;
    if (sellerWhatsapp) {
      const waUrl = `https://wa.me/${sellerWhatsapp.replace(/\D/g, "")}?text=Olá!%20Gostaria%20de%20confirmar%20meu%20agendamento%20para%20a%20Caixa%20Orgônica.`;
      const btnW = 100, btnH = 18;
      const btnX = CENTER_X;
      doc.setFillColor(37, 211, 102);
      doc.roundedRect(btnX - (btnW / 2), cy, btnW, btnH, 2, 2, "F");
      txt(doc, "SOLICITAR TELEMETRIA", btnX, cy + 11.5, 10, COLORS.white, "helvetica", "bold", "center");
      doc.link(btnX - (btnW / 2), cy, btnW, btnH, { url: waUrl });
      cy += 35;
    }

    const footBlockY = Math.max(cy, 222);
    txt(doc, sellerName.toUpperCase(), CENTER_X, footBlockY, 18, COLORS.primary, "helvetica", "bold", "center", 0.5, CONTENT_W);
    txt(doc, "Consultor de Vendas", CENTER_X, footBlockY + 10, 8.5, COLORS.accent, "helvetica", "bold", "center", 0.6, CONTENT_W);
    hline(doc, CENTER_X - 25, footBlockY + 15, 50, COLORS.accent, 0.8);

    let cy_end = footBlockY + 30;
    const contactStyle = { size: 11, font: "helvetica", style: "bold" as any, color: COLORS.text };

    if (sellerWhatsapp) {
      txt(doc, `WhatsApp: ${sellerWhatsapp}`, CENTER_X, cy_end, contactStyle.size, contactStyle.color, contactStyle.font, "bold", "center", 0, CONTENT_W);
      doc.link(CENTER_X - 40, cy_end - 5, 80, 8, { url: `https://wa.me/${sellerWhatsapp.replace(/\D/g, "")}` });
      cy_end += 10;
    }
    if (sellerInstagram) {
      txt(doc, `Instagram: @${sellerInstagram}`, CENTER_X, cy_end, contactStyle.size, contactStyle.color, contactStyle.font, "bold", "center", 0, CONTENT_W);
      doc.link(CENTER_X - 40, cy_end - 5, 80, 8, { url: `https://instagram.com/${sellerInstagram}` });
      cy_end += 10;
    }
    if (sellerEmail) {
      txt(doc, `Email: ${sellerEmail}`, CENTER_X, cy_end, contactStyle.size, contactStyle.color, contactStyle.font, "bold", "center", 0, CONTENT_W);
      doc.link(CENTER_X - 50, cy_end - 5, 100, 8, { url: `mailto:${sellerEmail}` });
      cy_end += 10;
    }
    txt(doc, "SITE OFICIAL: Terapiasalternativas.social.br", CENTER_X, cy_end, contactStyle.size, COLORS.primary, contactStyle.font, "bold", "center", 0.5, CONTENT_W);
    doc.link(CENTER_X - 50, cy_end - 5, 100, 8, { url: "https://terapiasalternativas.social.br" });

    drawFooter();

    // =============================================================================================
    // SAVE
    // =============================================================================================
    const fileName = `Manual_Orgone_v18_Vitalidade_${bNameClean.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
    doc.save(fileName);
    toast.success("Manual Orgone v18 (Vitalidade & Arte) Gerado!", { id: toastId });

  } catch (err: any) {
    console.error("PDF Life Error:", err);
    toast.error(`Erro: ${err.message}`, { id: toastId });
  }
}
