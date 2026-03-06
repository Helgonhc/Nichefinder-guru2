import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { BusinessData } from "@/types/business";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════
async function fetchFreshProfile(): Promise<any> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await (supabase as any)
      .from("profiles").select("*").eq("id", user.id).maybeSingle();
    return data || null;
  } catch { return null; }
}

async function urlToBase64(url: string): Promise<string> {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  // Image + Canvas (funciona com Supabase Storage)
  try {
    const b64 = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          c.width = img.naturalWidth || img.width;
          c.height = img.naturalHeight || img.height;
          const ctx = c.getContext("2d");
          if (!ctx) { reject("no ctx"); return; }
          ctx.drawImage(img, 0, 0);
          resolve(c.toDataURL("image/png"));
        } catch (e) { reject(e); }
      };
      img.onerror = () => reject("err");
      img.src = url;
    });
    if (b64 && b64.length > 100) return b64;
  } catch { /* fallback */ }
  // Fetch + Blob
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise<string>((r) => {
      const rd = new FileReader();
      rd.onloadend = () => r(rd.result as string);
      rd.onerror = () => r("");
      rd.readAsDataURL(blob);
    });
  } catch { return ""; }
}

async function loadImageDims(b64: string): Promise<{ w: number; h: number }> {
  if (!b64) return { w: 0, h: 0 };
  return new Promise((r) => {
    const img = new Image();
    img.onload = () => r({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => r({ w: 0, h: 0 });
    img.src = b64;
  });
}

function fitBox(ow: number, oh: number, mw: number, mh: number) {
  if (!ow || !oh) return { w: 0, h: 0 };
  let w = ow, h = oh;
  if (w > mw) { h *= mw / w; w = mw; }
  if (h > mh) { w *= mh / h; h = mh; }
  return { w, h };
}
function imgFmt(b64: string): "PNG" | "JPEG" { return b64.indexOf("image/png") !== -1 ? "PNG" : "JPEG"; }

// ═══════════════════════════════════════════════════════════════════
// Layout  (A4 = 210 × 297)
// ═══════════════════════════════════════════════════════════════════
const PW = 210, PH = 297, ML = 25, CW = PW - ML * 2;
const HDR_H = 28;   // header completo
const FTR_H = 16;   // footer completo
const CT = HDR_H + 16;   // content top (amplo respiro do header)
const CB = PH - FTR_H - 2; // content bottom

type RGB = [number, number, number];
const NAVY: RGB = [10, 17, 40], INDIGO: RGB = [99, 102, 241], IND_L: RGB = [129, 140, 248];
const WHITE: RGB = [255, 255, 255], TXT: RGB = [44, 54, 57], TXT_D: RGB = [15, 23, 42];
const GRAY: RGB = [100, 116, 139], LGRAY: RGB = [148, 163, 184], BORDER: RGB = [226, 232, 240];
const GRN_BG: RGB = [240, 253, 244], GRN_BD: RGB = [134, 239, 172], GRN_T: RGB = [6, 95, 70];
const PUR_BG: RGB = [238, 242, 255];

const lh = (pt: number, m = 1.5) => pt * 0.352778 * m;

// ═══════════════════════════════════════════════════════════════════
// Draw helpers
// ═══════════════════════════════════════════════════════════════════
const Fl = (p: jsPDF, c: RGB) => p.setFillColor(...c);
const St = (p: jsPDF, c: RGB) => p.setDrawColor(...c);
const Tc = (p: jsPDF, c: RGB) => p.setTextColor(...c);

function bg(p: jsPDF, x: number, y: number, w: number, h: number, c: RGB) { Fl(p, c); p.rect(x, y, w, h, "F"); }
function rr(p: jsPDF, x: number, y: number, w: number, h: number, r: number, fc: RGB, bc?: RGB) {
  Fl(p, fc);
  if (bc) { St(p, bc); p.setLineWidth(0.4); p.roundedRect(x, y, w, h, r, r, "FD"); }
  else p.roundedRect(x, y, w, h, r, r, "F");
}
function pill(p: jsPDF, text: string, cx: number, cy: number, sz: number, tc: RGB, bc: RGB) {
  p.setFontSize(sz); p.setFont("helvetica", "bold");
  const tw = p.getTextWidth(text), pw = tw + 14, ph = sz * 0.35 + 5;
  St(p, bc); p.setLineWidth(0.5);
  p.roundedRect(cx - pw / 2, cy - ph / 2, pw, ph, ph / 2, ph / 2, "S");
  Tc(p, tc); p.text(text, cx, cy + sz * 0.12, { align: "center" });
}
function txt(p: jsPDF, s: string, x: number, y: number, sz = 10, c: RGB = TXT, bold = false, al: "left" | "center" | "right" = "left") {
  p.setFontSize(sz); Tc(p, c); p.setFont("helvetica", bold ? "bold" : "normal");
  p.text(s, x, y, { align: al });
}
function wrap(p: jsPDF, s: string, x: number, y: number, mw: number, sz = 10, c: RGB = TXT, bold = false, mul = 1.5): number {
  p.setFontSize(sz); Tc(p, c); p.setFont("helvetica", bold ? "bold" : "normal");
  const lines: string[] = p.splitTextToSize(s, mw);
  const sp = lh(sz, mul);
  lines.forEach((l, i) => p.text(l, x, y + i * sp));
  return lines.length * sp;
}
function hline(p: jsPDF, x1: number, y: number, x2: number, c: RGB, w = 0.5) { St(p, c); p.setLineWidth(w); p.line(x1, y, x2, y); }
function circ(p: jsPDF, cx: number, cy: number, r: number, c: RGB) { Fl(p, c); p.circle(cx, cy, r, "F"); }
function drawCheck(p: jsPDF, cx: number, cy: number, sz: number, c: RGB) {
  St(p, c); p.setLineWidth(sz * 0.22);
  p.line(cx - sz * 0.45, cy - sz * 0.05, cx - sz * 0.1, cy + sz * 0.4);
  p.line(cx - sz * 0.1, cy + sz * 0.4, cx + sz * 0.45, cy - sz * 0.35);
}
function drawMedal(p: jsPDF, cx: number, cy: number, r: number, fc: RGB, label: string) {
  St(p, fc); p.setLineWidth(1.2); p.circle(cx, cy, r + 1.5, "S");
  circ(p, cx, cy, r, fc);
  txt(p, label, cx, cy + 3, 16, WHITE, true, "center");
}
function safeLogo(p: jsPDF, b64: string, x: number, y: number, mw: number, mh: number, dims: { w: number; h: number }) {
  if (!b64 || !dims.w) return;
  const f = fitBox(dims.w, dims.h, mw, mh);
  try { p.addImage(b64, imgFmt(b64), x, y, f.w, f.h); } catch { /* ok */ }
}

/** Adiciona link clicável numa área retangular */
function addLink(p: jsPDF, x: number, y: number, w: number, h: number, url: string) {
  try { p.link(x, y - h, w, h, { url }); } catch { /* ok */ }
}

/** Escreve texto e cria link clicável sobre ele */
function linkedTxt(p: jsPDF, s: string, x: number, y: number, sz: number, c: RGB, bold: boolean, url: string, al: "left" | "center" | "right" = "left") {
  txt(p, s, x, y, sz, c, bold, al);
  p.setFontSize(sz); p.setFont("helvetica", bold ? "bold" : "normal");
  const tw = p.getTextWidth(s);
  const th = sz * 0.352778;
  let lx = x;
  if (al === "center") lx = x - tw / 2;
  else if (al === "right") lx = x - tw;
  addLink(p, lx, y, tw, th, url);
}

// ═══════════════════════════════════════════════════════════════════
// HEADER & FOOTER profissionais
// ═══════════════════════════════════════════════════════════════════
interface Meta {
  logoB64: string; logoDims: { w: number; h: number };
  businessName: string; businessNiche: string; businessCity: string;
  sellerName: string; sellerEmail: string; sellerWebsite: string;
  propNum: string; dateStr: string; pn: number; tp: number;
}

function drawHeader(p: jsPDF, m: Meta) {
  // Barra accent navy completa
  bg(p, 0, 0, PW, HDR_H, NAVY);
  // Accent line top
  bg(p, 0, 0, PW, 2.5, INDIGO);
  // Accent line bottom
  bg(p, 0, HDR_H - 2, PW, 2, INDIGO);

  // ─── LADO ESQUERDO: Logo + Info do Cliente ───
  let lx = ML;
  if (m.logoB64 && m.logoDims.w) {
    safeLogo(p, m.logoB64, ML, 5, 24, 16, m.logoDims);
    lx = ML + 28;
  }
  txt(p, m.businessName, lx, 10, 11, WHITE, true);
  txt(p, `${m.businessNiche}  \u00b7  ${m.businessCity}`, lx, 15.5, 7, LGRAY, false);

  // "Proposta Comercial" tag
  const tagX = lx;
  rr(p, tagX, 18, 42, 5, 2.5, INDIGO);
  txt(p, "PROPOSTA COMERCIAL", tagX + 2.5, 21.5, 5.5, WHITE, true);

  // ─── LADO DIREITO: ReservaAI + nº + data ───
  const rx = PW - ML;
  txt(p, "ReservaAI", rx, 9, 10, WHITE, true, "right");
  if (m.sellerWebsite) {
    linkedTxt(p, m.sellerWebsite, rx, 14, 7, IND_L, false, m.sellerWebsite.startsWith("http") ? m.sellerWebsite : `https://${m.sellerWebsite}`, "right");
  }
  txt(p, `N\u00ba ${m.propNum}  |  ${m.dateStr}`, rx, 19, 7, LGRAY, false, "right");
  txt(p, `P\u00e1g. ${m.pn}/${m.tp}`, rx, 23.5, 6, LGRAY, false, "right");
}

function drawFooter(p: jsPDF, m: Meta) {
  const fy = PH - FTR_H;
  // Background navy + accent top
  bg(p, 0, fy, PW, FTR_H, NAVY);
  bg(p, 0, fy, PW, 2, INDIGO);

  // Logo esquerda
  let lx = ML;
  if (m.logoB64 && m.logoDims.w) {
    safeLogo(p, m.logoB64, ML, fy + 5, 18, 8, m.logoDims);
    lx = ML + 22;
  }

  // Marca + nome
  txt(p, m.businessName, lx, fy + 7, 8, WHITE, true);
  txt(p, "Powered by ReservaAI", lx, fy + 11.5, 6, IND_L, true);

  // Centro: seller info
  const cx = PW / 2;
  if (m.sellerName && m.sellerName !== "Equipe ReservaAI") {
    txt(p, m.sellerName, cx, fy + 7, 7, WHITE, true, "center");
    if (m.sellerEmail) txt(p, m.sellerEmail, cx, fy + 11.5, 6, LGRAY, false, "center");
  }

  // Direita: data + página
  txt(p, m.dateStr, PW - ML, fy + 7, 7, LGRAY, false, "right");
  txt(p, `P\u00e1gina ${m.pn} de ${m.tp}`, PW - ML, fy + 11.5, 6, LGRAY, false, "right");
}

// ═══════════════════════════════════════════════════════════════════
// GERADOR — 100% jsPDF, links clicáveis
// ═══════════════════════════════════════════════════════════════════
export async function generateSandCourtSystemPDF(business: BusinessData): Promise<void> {
  const toastId = "pdf-sand-system";
  toast.loading("Gerando PDF profissional\u2026", { id: toastId });

  try {
    const profile = await fetchFreshProfile();
    const sellerName = profile?.full_name || "Equipe ReservaAI";
    const sellerEmail = profile?.contact_email || "";
    const sellerWhatsapp = profile?.whatsapp || "";
    const sellerInsta = (profile?.instagram || "").replace(/^@/, "").replace(/[^a-zA-Z0-9._]/g, "");
    const sellerWebsite = profile?.website_url || "";
    const logoB64 = await urlToBase64(profile?.logo_url || "");
    const logoDims = await loadImageDims(logoB64);

    const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const propNum = String(Date.now()).slice(-6);
    const TP = 6;

    const m: Meta = {
      logoB64, logoDims, businessName: business.name,
      businessNiche: business.niche, businessCity: business.city,
      sellerName, sellerEmail, sellerWebsite,
      propNum, dateStr, pn: 1, tp: TP,
    };

    const p = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

    // ═════════════════════════════════════════════════════════════
    // PÁGINA 1 — CAPA
    // ═════════════════════════════════════════════════════════════
    m.pn = 1;
    bg(p, 0, 0, PW, PH, NAVY);

    // Decorative lines
    St(p, INDIGO); p.setLineWidth(0.6);
    p.line(30, 55, 30, PH - 35); p.line(32, 60, 32, PH - 40);
    p.line(PW - 30, 55, PW - 30, PH - 35); p.line(PW - 32, 60, PW - 32, PH - 40);

    // Logo
    if (logoB64 && logoDims.w) {
      const fit = fitBox(logoDims.w, logoDims.h, 50, 25);
      safeLogo(p, logoB64, (PW - fit.w) / 2, 68, 50, 25, logoDims);
    }

    const tagY = logoB64 ? 105 : 92;
    pill(p, "SISTEMA DE GEST\u00c3O E AGENDAMENTO", PW / 2, tagY, 9, INDIGO, INDIGO);

    let ny = tagY + 18;
    p.setFontSize(34); p.setFont("helvetica", "bold");
    const nameLines: string[] = p.splitTextToSize(business.name.toUpperCase(), CW);
    Tc(p, WHITE);
    nameLines.forEach((l, i) => p.text(l, PW / 2, ny + i * lh(34, 1.15), { align: "center" }));
    ny += nameLines.length * lh(34, 1.15) + 6;

    txt(p, "Sistema de Gest\u00e3o e Agendamento para sua Arena", PW / 2, ny, 13, IND_L, false, "center");
    ny += 16;

    // Powered box — clicável
    const pwTxt = "Oferecido por ReservaAI";
    p.setFontSize(9); p.setFont("helvetica", "bold");
    const pwW = p.getTextWidth(pwTxt) + 16;
    rr(p, (PW - pwW) / 2, ny - 4, pwW, 10, 4, [20, 27, 55], INDIGO);
    txt(p, pwTxt, PW / 2, ny + 2.5, 9, WHITE, true, "center");
    addLink(p, (PW - pwW) / 2, ny - 4, pwW, 10, "https://reservaai.com.br");

    ny += 14;
    linkedTxt(p, "www.reservaai.com.br", PW / 2, ny, 10, [56, 189, 248], true, "https://reservaai.com.br", "center");

    // Seller info
    const divY = 220;
    hline(p, (PW - 100) / 2, divY, (PW + 100) / 2, [51, 65, 85], 0.3);
    txt(p, "PREPARADO POR", PW / 2, divY + 12, 8, LGRAY, true, "center");
    txt(p, sellerName, PW / 2, divY + 22, 18, WHITE, true, "center");
    if (sellerWebsite) {
      linkedTxt(p, sellerWebsite, PW / 2, divY + 30, 11, [56, 189, 248], true,
        sellerWebsite.startsWith("http") ? sellerWebsite : `https://${sellerWebsite}`, "center");
    }

    // Cover footer
    const cfY = PH - 18;
    hline(p, 0, cfY, PW, INDIGO, 1.5);
    if (logoB64 && logoDims.w) safeLogo(p, logoB64, ML, cfY + 3, 18, 8, logoDims);
    const cfX = (logoB64 && logoDims.w) ? ML + 22 : ML;
    txt(p, `${business.name}  |  ReservaAI`, cfX, cfY + 9, 7, LGRAY, true);
    txt(p, `Proposta N\u00ba ${propNum}  |  ${dateStr}`, PW - ML, cfY + 9, 7, LGRAY, false, "right");

    // ═════════════════════════════════════════════════════════════
    // PÁGINA 2 — CARTA + SCORE
    // ═════════════════════════════════════════════════════════════
    p.addPage(); m.pn = 2;
    drawHeader(p, m); drawFooter(p, m);

    let ly = CT;
    txt(p, "DESTINAT\u00c1RIO", ML, ly, 8, LGRAY, true); ly += 7;
    txt(p, business.name, ML, ly, 18, TXT_D, true); ly += 8;
    ly += wrap(p, `${business.niche}  \u00b7  ${business.city}${business.address ? "  \u00b7  " + business.address : ""}`, ML, ly, CW, 10, GRAY) + 4;
    hline(p, ML, ly, PW - ML, BORDER); ly += 10;

    txt(p, `Prezado(a) gestor(a) da ${business.name},`, ML, ly, 12, TXT_D, true); ly += 10;
    ly += wrap(p, `\u00c9 com grande satisfa\u00e7\u00e3o que apresentamos esta Proposta Comercial Estrat\u00e9gica, elaborada exclusivamente para ${business.name}, visando a inova\u00e7\u00e3o tecnol\u00f3gica da sua arena atrav\u00e9s do Sistema de Gest\u00e3o ReservaAI.`, ML, ly, CW, 10, TXT) + 5;
    ly += wrap(p, `No din\u00e2mico mercado de Arenas e Complexos Esportivos, a agilidade no processo de reserva \u00e9 o principal diferencial para garantir que sua quadra nunca fique ociosa.`, ML, ly, CW, 10, TXT) + 5;
    ly += wrap(p, "O ReservaAI \u00e9 a solu\u00e7\u00e3o mais completa do mercado para quem busca automatizar o atendimento, acabar com a confus\u00e3o na agenda e profissionalizar a cobran\u00e7a de alunos e mensalistas.", ML, ly, CW, 10, TXT) + 8;

    // Score Strip
    hline(p, ML, ly, PW - ML, INDIGO, 1.5); ly += 6;
    circ(p, ML + 14, ly + 10, 12, INDIGO);
    txt(p, "100%", ML + 14, ly + 12, 14, WHITE, true, "center");
    txt(p, "Match de Efici\u00eancia", ML + 32, ly + 6, 14, TXT_D, true);
    txt(p, "POTENCIAL DE AUTOMA\u00c7\u00c3O IDENTIFICADO", ML + 32, ly + 13, 7, INDIGO, true);
    const kpis = [{ v: "Sim", l: "WhatsApp" }, { v: "Sim", l: "PIX" }, { v: "24/7", l: "Dispon\u00edvel" }, { v: String(business.rating || "\u2014"), l: "Nota Google" }];
    const kS = ML + 100, kW = (CW - 100) / 4;
    kpis.forEach((k, i) => {
      const kx = kS + i * kW + kW / 2;
      txt(p, k.v, kx, ly + 6, 13, TXT_D, true, "center");
      txt(p, k.l.toUpperCase(), kx, ly + 13, 7, GRAY, true, "center");
      if (i < 3) { St(p, BORDER); p.setLineWidth(0.3); p.line(kS + (i + 1) * kW, ly, kS + (i + 1) * kW, ly + 20); }
    });

    // ═════════════════════════════════════════════════════════════
    // PÁGINA 3 — AUDITORIA
    // ═════════════════════════════════════════════════════════════
    p.addPage(); m.pn = 3;
    drawHeader(p, m); drawFooter(p, m);

    let ay = CT;
    txt(p, "01. DIAGN\u00d3STICO DA ARENA", ML, ay, 12, INDIGO, true); ay += 3;
    hline(p, ML, ay, ML + 70, INDIGO, 1.5); ay += 8;
    wrap(p, "Analisamos os principais pontos de contato do seu atleta e identificamos as oportunidades de melhoria tecnológica:", ML, ay, CW, 10, GRAY); ay += 14;

    const audits = [
      { l: "Agendamento Online", d: "Reserva imediata pelo WhatsApp sem interven\u00e7\u00e3o humana", ic: "W", cc: [37, 211, 102] as RGB },
      { l: "Pagamentos Seguros", d: "Confirma\u00e7\u00e3o instant\u00e2nea de PIX e Cart\u00e3o de Cr\u00e9dito", ic: "$", cc: [59, 130, 246] as RGB },
      { l: "Planos e Mensalistas", d: "Controle de mensalidades com faturamento autom\u00e1tico", ic: "M", cc: [168, 85, 247] as RGB },
      { l: "Gest\u00e3o de Alunos", d: "N\u00edveis de jogo, frequ\u00eancia e turmas profissionalizadas", ic: "A", cc: [245, 158, 11] as RGB },
      { l: "Financeiro em Tempo Real", d: "Dashboard completo de entradas, sa\u00eddas e inadimpl\u00eancia", ic: "D", cc: [20, 184, 166] as RGB },
      { l: "Marketing e Reten\u00e7\u00e3o", d: "Lembretes e promo\u00e7\u00f5es enviadas automaticamente", ic: "N", cc: [239, 68, 68] as RGB },
    ];
    const acW = (CW - 12) / 2;
    const acH = 40;
    audits.forEach((a, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const ix = ML + col * (acW + 12), iy = ay + row * (acH + 10);
      // Card background
      rr(p, ix, iy, acW, acH, 6, WHITE, BORDER);
      // Header color stripe
      bg(p, ix, iy, 4, acH, a.cc);
      // Icon Circle
      circ(p, ix + 16, iy + acH / 2, 9, a.cc);
      txt(p, a.ic, ix + 16, iy + acH / 2 + 3, 13, WHITE, true, "center");
      // Text content
      txt(p, a.l, ix + 30, iy + 14, 11, TXT_D, true);
      wrap(p, a.d, ix + 30, iy + 21, acW - 36, 8.5, GRAY);
      // Badge STATUS: OK
      p.setFontSize(6.5); p.setFont("helvetica", "bold");
      rr(p, ix + acW - 20, iy + 5, 16, 6, 3, GRN_BG, GRN_BD);
      txt(p, "PRONTO", ix + acW - 12, iy + 9.5, 6.5, GRN_T, true, "center");
    });

    // ═════════════════════════════════════════════════════════════
    // PÁGINA 4 — DESAFIO + PLANOS
    // ═════════════════════════════════════════════════════════════
    p.addPage(); m.pn = 4;
    drawHeader(p, m); drawFooter(p, m);

    let dy = CT;
    txt(p, "02. O DESAFIO DA SUA ARENA", ML, dy, 12, INDIGO, true); dy += 3;
    hline(p, ML, dy, ML + 72, INDIGO, 1.5); dy += 12;

    const pbY = dy;
    rr(p, ML, pbY, CW, 72, 6, PUR_BG);
    bg(p, ML, pbY, 3, 72, INDIGO);
    let pby = pbY + 10;
    txt(p, "Por que a gest\u00e3o manual trava o crescimento?", ML + 10, pby, 13, TXT_D, true); pby += 8;
    pby += wrap(p, `A gest\u00e3o manual de arenas e quadras gera perda de receita. A ${business.name} pode estar deixando de faturar por n\u00e3o oferecer uma reserva imediata e segura.`, ML + 10, pby, CW - 16, 9, TXT) + 3;
    pby += wrap(p, "O ReservaAI centraliza todas as opera\u00e7\u00f5es. O atleta reserva por conta pr\u00f3pria no WhatsApp e o sistema cuida do resto.", ML + 10, pby, CW - 16, 9, TXT) + 5;
    ["Elimina\u00e7\u00e3o da espera por resposta manual", "Gest\u00e3o profissional de alunos e hor\u00e1rios", "Visibilidade total do faturamento", "Facilidade para o atleta reservar"].forEach((b) => {
      drawCheck(p, ML + 14, pby - 1.5, 2.5, INDIGO);
      pby += wrap(p, b, ML + 20, pby, CW - 26, 9, TXT_D, true) + 1.5;
    });

    // Especificações Técnicas
    dy = pbY + 80;
    txt(p, "03. CONFIGURAÇÕES TÉCNICAS SUGERIDAS", ML, dy, 12, INDIGO, true); dy += 3;
    hline(p, ML, dy, ML + 92, INDIGO, 1.5); dy += 10;

    const cW = (CW - 12) / 3, cH = 90;
    const tiers = [
      { n: "ESSENCIAL", s: "Automação Base", pr: "TRILHA 01", c: [245, 158, 11] as RGB, f: ["Agendamento pelo WhatsApp", "Info de valor de aula", "1 Usuário Admin", "Notificação por e-mail", "Até 1 Quadra"] },
      { n: "AVANÇADO", s: "Gestão Operacional", pr: "TRILHA 02", c: [148, 163, 184] as RGB, f: ["Até 4 quadras", "Receber sinal da reserva", "PIX automático", "Acesso de funcionário", "Dashboard Financeiro"] },
      { n: "MASTER", s: "Controle 360", pr: "TRILHA 03", c: [250, 204, 21] as RGB, f: ["Quadras Ilimitadas", "Cartão de Crédito", "Day Use completo", "Gestão de Aluno", "Múltiplos Admins"] },
    ];
    tiers.forEach((t, i) => {
      const cx = ML + i * (cW + 6), cy = dy, isPro = i === 1;
      if (isPro) { rr(p, cx, cy, cW, cH, 7, WHITE, INDIGO); rr(p, cx + cW / 2 - 18, cy - 4, 36, 8, 4, INDIGO); txt(p, "ALTA PERFORMANCE", cx + cW / 2, cy + 1, 6, WHITE, true, "center"); }
      else rr(p, cx, cy, cW, cH, 7, WHITE, BORDER);
      drawMedal(p, cx + cW / 2, cy + 14, 7, t.c, t.n[0]);
      txt(p, t.n, cx + cW / 2, cy + 30, 11, TXT_D, true, "center");
      txt(p, t.s.toUpperCase(), cx + cW / 2, cy + 35, 6, LGRAY, true, "center");
      txt(p, t.pr, cx + cW / 2, cy + 46, 16, INDIGO, true, "center");
      hline(p, cx + 6, cy + 50, cx + cW - 6, BORDER, 0.3);
      let fy = cy + 55;
      t.f.forEach((feat) => { drawCheck(p, cx + 7, fy - 1.5, 2.2, INDIGO); fy += wrap(p, feat, cx + 13, fy, cW - 16, 7.5, TXT) + 1; });
    });

    // ═════════════════════════════════════════════════════════════
    // PÁGINA 5 — TABELA
    // ═════════════════════════════════════════════════════════════
    p.addPage(); m.pn = 5;
    drawHeader(p, m); drawFooter(p, m);

    let ty = CT;
    txt(p, "04. TABELA COMPARATIVA DE RECURSOS", ML, ty, 12, INDIGO, true); ty += 3;
    hline(p, ML, ty, ML + 90, INDIGO, 1.5); ty += 10;

    const tX = ML, c1 = 75, c23 = (CW - c1) / 3, thH = 14, trH = 9;
    bg(p, tX, ty, CW, thH, NAVY);
    txt(p, "Funcionalidades", tX + 4, ty + 9, 8, WHITE, true);
    ["ESSENCIAL", "AVANÇADO", "MASTER"].forEach((n, i) => {
      txt(p, n, tX + c1 + c23 * (i + 0.5), ty + 7.5, 8, WHITE, true, "center");
    });
    ty += thH;

    const rows: [string, boolean, boolean, boolean][] = [
      ["Agendamento pelo WhatsApp", true, true, true],
      ["Info de valores das aulas", true, true, true],
      ["Notifica\u00e7\u00e3o por e-mail", true, true, true],
      ["1 Usu\u00e1rio Administrativo", true, false, false],
      ["At\u00e9 1 quadra vinculada", true, false, false],
      ["Receber sinal via PIX", false, true, true],
      ["Acesso de funcion\u00e1rio", false, true, true],
      ["Dashboard financeiro", false, true, true],
      ["At\u00e9 4 quadras", false, true, false],
      ["2 Usu\u00e1rios Admin", false, true, false],
      ["Cart\u00e3o de cr\u00e9dito", false, false, true],
      ["Day Use completo", false, false, true],
      ["Gest\u00e3o de Aluno", false, false, true],
      ["Quadras ilimitadas", false, false, true],
      ["10 Usu\u00e1rios Admin", false, false, true],
      ["Suporte Premium 24/7", false, false, true],
    ];
    rows.forEach((r, ri) => {
      const ry = ty + ri * trH;
      if (ri % 2 === 0) bg(p, tX, ry, CW, trH, [249, 250, 251]);
      hline(p, tX, ry + trH, tX + CW, [241, 245, 249], 0.2);
      txt(p, r[0], tX + 4, ry + 6, 8, TXT, true);
      [r[1], r[2], r[3]].forEach((ok, ci) => {
        if (ok) { const ccx = tX + c1 + c23 * (ci + 0.5); circ(p, ccx, ry + 4.5, 3, INDIGO); drawCheck(p, ccx, ry + 4.5, 2, WHITE); }
      });
    });
    hline(p, tX, ty + rows.length * trH, tX + CW, BORDER, 0.5);
    [c1, c1 + c23, c1 + c23 * 2].forEach((x) => { St(p, BORDER); p.setLineWidth(0.2); p.line(tX + x, ty - thH, tX + x, ty + rows.length * trH); });

    // ═════════════════════════════════════════════════════════════
    // PÁGINA 6 — CTA + FECHAMENTO
    // ═════════════════════════════════════════════════════════════
    p.addPage(); m.pn = 6;
    drawHeader(p, m); drawFooter(p, m);

    let cy2 = CT;
    txt(p, "05. COMECE AGORA", ML, cy2, 12, INDIGO, true); cy2 += 3;
    hline(p, ML, cy2, ML + 50, INDIGO, 1.5); cy2 += 12;

    // CTA Box
    rr(p, ML, cy2, CW, 55, 8, WHITE, INDIGO);
    circ(p, PW / 2, cy2 + 12, 6, INDIGO);
    St(p, WHITE); p.setLineWidth(0.8);
    p.line(PW / 2, cy2 + 8, PW / 2, cy2 + 16);
    p.line(PW / 2 - 3, cy2 + 11, PW / 2, cy2 + 8);
    p.line(PW / 2 + 3, cy2 + 11, PW / 2, cy2 + 8);
    txt(p, "Pronto para profissionalizar sua Arena?", PW / 2, cy2 + 25, 14, TXT_D, true, "center");
    wrap(p, "Entre em contato para configurarmos a telemetria e o controle da sua arena em tempo real.", ML + 15, cy2 + 33, CW - 30, 10, GRAY, false, 1.4);
    // Botão clicável
    rr(p, (PW - 60) / 2, cy2 + 44, 60, 10, 5, INDIGO);
    txt(p, "SISTEMA ATIVO", PW / 2, cy2 + 51, 9, WHITE, true, "center");

    // Closing
    cy2 += 70;
    cy2 += wrap(p, `Ficamos \u00e0 disposi\u00e7\u00e3o para quaisquer esclarecimentos. Acreditamos que o Sistema ReservaAI \u00e9 o diferencial que ${business.name} precisa para se consolidar como refer\u00eancia.`, ML, cy2, CW, 10, TXT) + 8;
    txt(p, "Atenciosamente,", ML, cy2, 11, TXT); cy2 += 16;

    // Signature
    hline(p, ML, cy2, ML + 80, INDIGO, 1); cy2 += 8;
    txt(p, sellerName, ML, cy2, 18, TXT_D, true); cy2 += 7;
    txt(p, "ESPECIALISTA EM GEST\u00c3O DE ARENAS", ML, cy2, 8, INDIGO, true); cy2 += 12;

    // Contatos clicáveis
    if (sellerWhatsapp) {
      const waUrl = `https://wa.me/${sellerWhatsapp.replace(/\D/g, "")}`;
      circ(p, ML + 5, cy2 - 1.5, 4, [37, 211, 102]);
      txt(p, "W", ML + 5, cy2, 8, WHITE, true, "center");
      linkedTxt(p, `WhatsApp: ${sellerWhatsapp}`, ML + 14, cy2, 10, TXT, true, waUrl);
      cy2 += 10;
    }
    if (sellerInsta) {
      circ(p, ML + 5, cy2 - 1.5, 4, [225, 48, 108]);
      txt(p, "I", ML + 5, cy2, 8, WHITE, true, "center");
      linkedTxt(p, `Instagram: @${sellerInsta}`, ML + 14, cy2, 10, TXT, true, `https://instagram.com/${sellerInsta}`);
      cy2 += 10;
    }
    if (sellerEmail) {
      circ(p, ML + 5, cy2 - 1.5, 4, INDIGO);
      txt(p, "@", ML + 5, cy2, 8, WHITE, true, "center");
      linkedTxt(p, sellerEmail, ML + 14, cy2, 10, TXT, true, `mailto:${sellerEmail}`);
      cy2 += 10;
    }
    if (sellerWebsite) {
      circ(p, ML + 5, cy2 - 1.5, 4, NAVY);
      txt(p, "W", ML + 5, cy2, 8, WHITE, true, "center");
      linkedTxt(p, sellerWebsite, ML + 14, cy2, 10, TXT, true, sellerWebsite.startsWith("http") ? sellerWebsite : `https://${sellerWebsite}`);
      cy2 += 10;
    }

    // Save
    const safeName = (business.name || "doc").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 60);
    p.save(`Proposta_Sistema_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("PDF profissional gerado com sucesso!", { id: toastId });
  } catch (err: any) {
    console.error("Erro PDF:", err);
    toast.error(`Erro ao gerar PDF: ${err?.message || "Erro desconhecido"}`, { id: toastId });
  }
}