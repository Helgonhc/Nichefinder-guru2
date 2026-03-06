import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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

async function renderHtmlToB64(htmlString: string, w: number, h: number): Promise<string> {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = w + "px";
  container.style.height = h + "px";
  container.style.overflow = "hidden";
  container.innerHTML = htmlString;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    });
    return canvas.toDataURL("image/jpeg", 0.9);
  } catch (err) {
    console.error("html2canvas error:", err);
    return "";
  } finally {
    document.body.removeChild(container);
  }
}

// ═══════════════════════════════════════════════════════════════════
// Layout (A4 = 210 × 297)
// ═══════════════════════════════════════════════════════════════════
const PW = 210, PH = 297, ML = 25, CW = PW - ML * 2;
const HDR_H = 28;
const FTR_H = 16;
const CT = HDR_H + 16; // content top con respiro

type RGB = [number, number, number];
const NAVY: RGB = [15, 15, 20]; // Onyx / Black Premium
const INDIGO: RGB = [212, 175, 55]; // Dourado Premium (Gold)
const IND_L: RGB = [234, 203, 110]; // Dourado Claro
const WHITE: RGB = [255, 255, 255], TXT: RGB = [63, 63, 70], TXT_D: RGB = [24, 24, 27];
const GRAY: RGB = [113, 113, 122], LGRAY: RGB = [161, 161, 170], BORDER: RGB = [228, 228, 231];
const GRN_BG: RGB = [253, 252, 245], GRN_BD: RGB = [212, 175, 55], GRN_T: RGB = [110, 85, 20];
const PUR_BG: RGB = [253, 252, 248]; // Fundo creme premium para destaques

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
function addLink(p: jsPDF, x: number, y: number, w: number, h: number, url: string) {
  try { p.link(x, y - h, w, h, { url }); } catch { /* ok */ }
}
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
// Meta & Layout Components
// ═══════════════════════════════════════════════════════════════════
interface Meta {
  logoB64: string; logoDims: { w: number; h: number };
  businessName: string; businessNiche: string; businessCity: string;
  sellerName: string; sellerEmail: string; sellerWebsite: string;
  propNum: string; dateStr: string; pn: number; tp: number;
}

const PITCH: RGB = [10, 10, 12]; // Fundo super escuro
const GOLD: RGB = [212, 175, 55]; // Dourado principal
const GOLD_L: RGB = [240, 210, 120]; // Dourado suave para textos
const DARK_SURFACE: RGB = [20, 20, 24]; // Cards escuros
const TEXT_LIGHT: RGB = [230, 230, 235];
const TEXT_MUTED: RGB = [150, 150, 160];
const BORDER_D: RGB = [40, 40, 45];

function drawHeaderDark(p: jsPDF, m: Meta) {
  bg(p, 0, 0, PW, HDR_H, PITCH);
  hline(p, 0, HDR_H, PW, BORDER_D, 0.5);
  let lx = ML;
  if (m.logoB64 && m.logoDims.w) {
    safeLogo(p, m.logoB64, ML, 6, 22, 14, m.logoDims);
    lx = ML + 26;
  }

  let bName = m.businessName.toUpperCase();
  if (bName.length > 25) bName = bName.substring(0, 25) + "...";

  txt(p, bName, lx, 13, 10, WHITE, true);
  txt(p, `PROJETO DE ENGENHARIA DIGITAL \u00b7 ${m.businessCity.toUpperCase()}`, lx, 18, 6, GOLD, true);

  const rx = PW - ML;
  txt(p, "PROPOSTA EXCLUSIVA", rx, 13, 8, WHITE, true, "right");
  txt(p, `${m.dateStr}`, rx, 18, 6, TEXT_MUTED, false, "right");
}

function drawFooterDark(p: jsPDF, m: Meta) {
  const fy = PH - FTR_H;
  bg(p, 0, fy, PW, FTR_H, PITCH);
  hline(p, 0, fy, PW, BORDER_D, 0.5);
  let lx = ML;
  if (m.logoB64 && m.logoDims.w) {
    safeLogo(p, m.logoB64, ML, fy + 4, 14, 6, m.logoDims);
    lx = ML + 18;
  }
  txt(p, "CONFIDENCIAL \u00b7 USO EXCLUSIVO", lx, fy + 8, 6, TEXT_MUTED, false);

  const cx = PW / 2;
  txt(p, m.sellerName.toUpperCase(), cx, fy + 8, 7, GOLD_L, true, "center");
  txt(p, `P\u00e1gina ${m.pn} de ${m.tp}`, PW - ML, fy + 8, 7, TEXT_MUTED, false, "right");
}

export async function generateSitePDF(business: BusinessData, customGoodHtml?: string): Promise<void> {
  const toastId = "pdf-site-dark";
  toast.loading("Forjando Proposta de Alto Nível...", { id: toastId });

  try {
    const profile = await fetchFreshProfile();
    const sellerName = profile?.full_name || "Especialista Digital";
    const sellerEmail = profile?.contact_email || "";
    const sellerWhatsapp = profile?.whatsapp || "";
    const sellerInsta = (profile?.instagram || "").replace(/^@/, "").replace(/[^a-zA-Z0-9._]/g, "");
    const sellerWebsite = profile?.website_site_url || profile?.website_url || "";
    const logoB64 = await urlToBase64(profile?.logo_site_url || profile?.logo_url || "");
    const logoDims = await loadImageDims(logoB64);

    const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const propNum = String(Date.now()).slice(-6);
    const TP = 7;

    const m: Meta = {
      logoB64, logoDims, businessName: business.name,
      businessNiche: business.niche, businessCity: business.city,
      sellerName, sellerEmail, sellerWebsite,
      propNum, dateStr, pn: 1, tp: TP,
    };

    const p = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

    // ==========================================
    // PAGE 1 — COVER (IMPACT)
    // ==========================================
    bg(p, 0, 0, PW, PH, PITCH);

    // Decorative Tech Grid
    St(p, BORDER_D); p.setLineWidth(0.1);
    for (let i = 10; i < PW; i += 15) p.line(i, 0, i, PH);
    for (let i = 10; i < PH; i += 15) p.line(0, i, PW, i);

    // Abstract geometric accents
    St(p, GOLD); p.setLineWidth(1.5);
    p.line(10, 30, 10, 60);
    p.line(PW - 10, PH - 60, PW - 10, PH - 30);

    if (logoB64 && logoDims.w) safeLogo(p, logoB64, ML, 40, 50, 25, logoDims);

    let cy = 130;
    txt(p, "PROJETO DE POSICIONAMENTO E DESTRUI\u00c7\u00c3O DA CONCORR\u00caNCIA", ML, cy, 8, GOLD, true); cy += 12;

    p.setFontSize(32); Tc(p, WHITE); p.setFont("helvetica", "bold");
    const nameLines = p.splitTextToSize(business.name.toUpperCase(), CW);
    nameLines.forEach((l: string, i: number) => p.text(l, ML, cy + i * lh(32, 1.25)));
    cy += nameLines.length * lh(32, 1.25) + 8;

    txt(p, "A ARTE DE CONVERTER CLIQUES EM CLIENTES LEAIS.", ML, cy, 14, TEXT_LIGHT, false);

    cy = PH - 40;
    hline(p, ML, cy, ML + 40, GOLD, 1.5); cy += 8;
    txt(p, "DESENVOLVIDO POR", ML, cy, 7, TEXT_MUTED, true); cy += 6;
    txt(p, sellerName.toUpperCase(), ML, cy, 12, WHITE, true); cy += 5;
    if (sellerWebsite) txt(p, sellerWebsite, ML, cy, 8, GOLD_L, false);

    // ==========================================
    // PAGE 2 — THE WAKE UP CALL
    // ==========================================
    p.addPage(); m.pn = 2; bg(p, 0, 0, PW, PH, PITCH); drawHeaderDark(p, m); drawFooterDark(p, m);
    let ly = CT + 10;

    txt(p, "01 // A VERDADE N\u00d4A E CRUA", ML, ly, 10, GOLD, true); ly += 14;
    p.setFontSize(26); Tc(p, WHITE); p.setFont("helvetica", "bold");
    ly += wrap(p, "O GOOGLE N\u00c3O PERDOA AMADORES.", ML, ly, CW, 26, WHITE, true, 1.2) + 8;

    ly += wrap(p, `Atualmente, quando um cliente em ${business.city} procura pelos servi\u00e7os da ${business.name}, qual \u00e9 a primeira impress\u00e3o que ele tem?`, ML, ly, CW - 20, 11, TEXT_LIGHT, false, 1.4) + 6;

    ly += wrap(p, "N\u00e3o ter um site de alta convers\u00e3o \u00e9 entregar dinheiro nas m\u00e3os da sua concorr\u00eancia todos os dias. O seu cliente sente desconfian\u00e7a quando encontra apenas um link de Instagram ou um site lento e desatualizado.", ML, ly, CW - 20, 10, TEXT_MUTED, false, 1.4) + 12;

    // Dark Card Score
    rr(p, ML, ly, CW, 50, 4, DARK_SURFACE, BORDER_D);
    circ(p, ML + 25, ly + 25, 18, PITCH);
    St(p, GOLD); p.setLineWidth(2); p.circle(ML + 25, ly + 25, 18, "S");
    txt(p, `${business.presenceScore ?? 0}%`, ML + 25, ly + 28, 18, WHITE, true, "center");

    txt(p, "SEU SCORE DE AUTORIDADE DIGITAL", ML + 55, ly + 18, 10, WHITE, true);
    txt(p, "Muito abaixo do padr\u00e3o exigido por consumidores premium.", ML + 55, ly + 24, 9, [239, 68, 68]);
    txt(p, "Isso afeta diretamente o valor percebido do seu neg\u00f3cio na internet.", ML + 55, ly + 32, 9, TEXT_MUTED);
    ly += 60;

    txt(p, "NOSSA MISS\u00c3O:", ML, ly, 12, GOLD, true); ly += 6;
    wrap(p, "Construir uma M\u00e1quina de Vendas disfar\u00e7ada de Site Institucional. Um ativo digital que trabalha 24h por dia vendendo a excel\u00eancia da sua marca enquanto voc\u00ea dorme.", ML, ly, CW, 14, WHITE, true, 1.25);

    // ==========================================
    // PAGE 3 — CONTRASTE VISUAL (REAL HTML HACK)
    // ==========================================
    toast.loading("Compilando Mockups HTML...", { id: toastId });
    const badHtml = `
      <div style="background: #ffffff; color: #000; font-family: 'Times New Roman', serif; padding: 20px; height: 100%; box-sizing: border-box; overflow: hidden; display: flex; flex-direction: column;">
        <div style="background: #0000ff; color: #fff; padding: 10px; text-align: left; font-size: 20px; display: flex; gap: 50px;">
           <span>INICIO</span><span>SOBRE NÓS</span><span>SERVICOS</span><span>CONTATO</span>
        </div>
        <div style="margin-top: 20px; display: flex; flex-direction: row; gap: 20px; flex: 1;">
          <div style="flex: 1.2; display: flex; flex-direction: column; justify-content: center;">
            <h1 style="color: red; font-size: 44px; text-align: left; margin-top: 10px;">A melhor solucao em ${business.niche} para vcs!</h1>
            <p style="font-size: 24px; text-align: justify; word-break: break-all; margin-top: 10px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim.</p>
            <button style="background: red; color: yellow; border: 8px solid green; padding: 20px; font-size: 28px; font-weight: bold; margin-top: 20px; cursor: pointer;">CLIQUE AQUI PARA FALAR CONCOSCO!!!</button>
          </div>
          <div style="flex: 0.8; height: 100%; background: #cccccc; display: flex; align-items: center; justify-content: center; border: 5px solid red; position: relative;">
            <span style="position: absolute; color: red; font-size: 150px; font-weight: bold; opacity: 0.5;">X</span>
            <span style="font-size: 40px;">Imagem Quebrada</span>
          </div>
        </div>
        <div style="margin-top: 20px; color: blue; text-decoration: underline; font-size: 28px; text-align: center;">www.siteruimebarato.com.br - Visto no Desktop</div>
      </div>
    `;

    const goodHtml = customGoodHtml || `
      <div style="background: #101012; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; padding: 40px 60px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; position: relative; border: 3px solid #D4AF37;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 50px;">
          <div style="font-weight: 900; font-size: 28px; letter-spacing: 3px; color: #D4AF37;">${business.name.toUpperCase().substring(0, 20)}</div>
          <div style="display: flex; gap: 40px; font-size: 18px; font-weight: 500; color: #A1A1AA;">
            <span style="color: #fff;">Premium</span><span>Metodologia</span><span>Resultados</span>
          </div>
        </div>
        
        <div style="display: flex; gap: 50px; flex: 1; align-items: center;">
          <div style="flex: 1.2;">
            <div style="color: #D4AF37; font-weight: bold; letter-spacing: 3px; font-size: 18px; margin-bottom: 20px;">ENGENHARIA DIGITAL PARA ${business.niche.toUpperCase()}</div>
            <h1 style="font-size: 64px; font-weight: 900; line-height: 1.05; margin: 0 0 30px 0; color: #fff;">
              O PADRÃO OURO DE<br/><span style="color: #D4AF37;">ALTA CONVERSÃO.</span>
            </h1>
            <p style="font-size: 22px; color: #A1A1AA; line-height: 1.6; margin: 0 0 50px 0;">A autoridade incontestável que o seu negócio precisa<br/>para dominar as buscas e atrair clientes de alto valor<br/>na região de ${business.city}.</p>
            
            <div style="display: flex; gap: 20px;">
              <div style="background: #25D366; color: #ffffff; padding: 20px 40px; border-radius: 8px; font-weight: bold; font-size: 22px; display: inline-flex; box-shadow: 0 15px 35px rgba(37, 211, 102, 0.25);">
                AGENDAR REUNIÃO VIP →
              </div>
            </div>
          </div>
          
          <div style="flex: 0.8; height: 100%; background: #18181B; border-radius: 20px; border: 2px solid #3F3F46; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">
             <div style="width: 250px; height: 250px; border-radius: 50%; background: radial-gradient(circle, rgba(212,175,55,0.4) 0%, rgba(20,20,24,0) 70%);"></div>
             <div style="position: absolute; font-size: 24px; font-weight: bold; color: #D4AF37; text-align: center;">DESIGN<br/>SENSORIAL</div>
          </div>
        </div>
      </div>
    `;

    const badB64 = await renderHtmlToB64(badHtml, 1280, 720);
    const goodB64 = await renderHtmlToB64(goodHtml, 1280, 720);

    p.addPage(); m.pn = 3; bg(p, 0, 0, PW, PH, PITCH); drawHeaderDark(p, m); drawFooterDark(p, m);
    let vy = CT + 5;
    txt(p, "02 // O CUSTO DO AMADORISMO VISUAL", ML, vy, 10, GOLD, true); vy += 14;
    p.setFontSize(22); Tc(p, WHITE); p.setFont("helvetica", "bold");
    vy += wrap(p, "A PRIMEIRA IMPRESSÃO DITA O VALOR DO SEU SERVIÇO.", ML, vy, CW, 22, WHITE, true, 1.2) + 10;

    const colW = (CW - 10) / 2; // ~85mm
    const h = 138; // Panel Height

    // Left Box: Amador (Monitor Real)
    const lxBox = ML;
    rr(p, lxBox, vy, colW, h, 4, DARK_SURFACE, BORDER_D);
    bg(p, lxBox, vy, colW, 8, [239, 68, 68]);
    txt(p, "SITE AMADOR (MERCADO COMUM)", lxBox + colW / 2, vy + 5.5, 7, WHITE, true, "center");

    const monitorW = colW - 14;
    const monitorH = monitorW * (9 / 16);
    const badMonX = lxBox + 7;
    const badMonY = vy + 18;

    // Draw Monitor iMac style
    rr(p, badMonX, badMonY, monitorW, monitorH + 5, 2, [30, 30, 35], BORDER_D); // Case
    bg(p, badMonX + 1, badMonY + 1, monitorW - 2, monitorH, PITCH); // Bezel
    // Stand
    bg(p, badMonX + monitorW / 2 - 8, badMonY + monitorH + 5, 16, 6, [50, 50, 55]);
    bg(p, badMonX + monitorW / 2 - 15, badMonY + monitorH + 11, 30, 2, [60, 60, 65]);

    if (badB64) {
      try { p.addImage(badB64, "JPEG", badMonX + 1, badMonY + 1, monitorW - 2, monitorH); } catch { /* ok */ }
    }

    let ltextY = badMonY + monitorH + 20;
    txt(p, "x Experi\u00eancia confusa no Desktop", lxBox + 5, ltextY, 8, TEXT_MUTED); ltextY += 6;
    txt(p, "x C\u00f3digo amador e sem velocidade", lxBox + 5, ltextY, 8, TEXT_MUTED); ltextY += 6;
    txt(p, "x Afasta decisores que compram B2B", lxBox + 5, ltextY, 8, TEXT_MUTED);

    // Right Box: Premium (Monitor Real)
    const rxBox = ML + colW + 10;
    rr(p, rxBox, vy, colW, h, 4, DARK_SURFACE, GOLD);
    bg(p, rxBox, vy, colW, 8, GOLD);
    txt(p, "NOSSA ENGENHARIA VIP", rxBox + colW / 2, vy + 5.5, 7, PITCH, true, "center");

    const goodMonX = rxBox + 7;
    const goodMonY = vy + 18;

    // Draw Premium Monitor
    rr(p, goodMonX, goodMonY, monitorW, monitorH + 5, 2, [40, 40, 45], GOLD); // Case
    bg(p, goodMonX + 1, goodMonY + 1, monitorW - 2, monitorH, PITCH); // Bezel
    // Stand
    bg(p, goodMonX + monitorW / 2 - 8, goodMonY + monitorH + 5, 16, 6, [70, 70, 75]);
    bg(p, goodMonX + monitorW / 2 - 15, goodMonY + monitorH + 11, 30, 2, [90, 90, 95]);

    if (goodB64) {
      try { p.addImage(goodB64, "JPEG", goodMonX + 1, goodMonY + 1, monitorW - 2, monitorH); } catch { /* ok */ }
    }

    let rtextY = goodMonY + monitorH + 20;
    txt(p, "\u2713 Visual Widescreen Imersivo", rxBox + 5, rtextY, 8, GOLD); rtextY += 6;
    txt(p, "\u2713 M\u00e1xima reten\u00e7\u00e3o corporativa", rxBox + 5, rtextY, 8, GOLD); rtextY += 6;
    txt(p, "\u2713 Posiciona voc\u00ea no Topo do Nicho", rxBox + 5, rtextY, 8, GOLD);

    vy += h + 15;
    txt(p, "O IMPACTO DO COMPUTADOR CORPORATIVO:", ML, vy, 11, GOLD, true); vy += 6;
    wrap(p, "Muitas decis\u00f5es B2B ou compras de alto valor s\u00e3o tomadas no Desktop do escrit\u00f3rio do seu cliente. Se o seu site esmaga a concorr\u00eancia nessa tela grande, a venda j\u00e1 est\u00e1 80% garantida antes dele pegar o telefone.", ML, vy, CW, 12, WHITE, false, 1.4);


    // ==========================================
    // PAGE 4 — THE SOLUTION (ENGINEERING)
    // ==========================================
    p.addPage(); m.pn = 4; bg(p, 0, 0, PW, PH, PITCH); drawHeaderDark(p, m); drawFooterDark(p, m);
    let sy = CT + 10;
    txt(p, "03 // ENGENHARIA DE CONVERS\u00c3O", ML, sy, 10, GOLD, true); sy += 14;
    p.setFontSize(22); Tc(p, WHITE);
    sy += wrap(p, "NÃO FAZEMOS 'SITINHOS'. CONSTRUIMOS POSICIONAMENTO IMPLACÁVEL.", ML, sy, CW, 22, WHITE, true, 1.3) + 12;

    const pillars = [
      { t: "Design Editorial de Luxo", d: "Criamos interfaces hipn\u00f3ticas baseadas na psicologia do seu nicho. O cliente sentir\u00e1 o peso e a qualidade do seu servi\u00e7o antes mesmo de te ligar." },
      { t: "Velocidade Extrema (LCP < 1.5s)", d: "C\u00f3digo limpo e infraestrutura de ponta. Seu site vai abrir mais r\u00e1pido que um estalar de dedos, matando a taxa de rejei\u00e7\u00e3o do Google." },
      { t: "SEO Local Sangrento", d: "Vamos injetar palavras-chave estrat\u00e9gicas no c\u00f3digo-fonte para que sua empresa domine as buscas na sua cidade." },
      { t: "Arquitetura Focada em Vendas", d: "Bot\u00f5es de a\u00e7\u00e3o estrat\u00e9gicos (CTAs), integra\u00e7\u00e3o fluida com WhatsApp e formul\u00e1rios que convertem curiosos em clientes pagantes." }
    ];

    pillars.forEach((pil, i) => {
      rr(p, ML, sy, CW, 30, 3, DARK_SURFACE, BORDER_D);
      bg(p, ML, sy, 4, 30, GOLD);
      txt(p, `0${i + 1}`, ML + 10, sy + 18, 18, BORDER_D, true); // Watermark number
      txt(p, pil.t.toUpperCase(), ML + 24, sy + 10, 11, WHITE, true);
      wrap(p, pil.d, ML + 24, sy + 16, CW - 30, 9, TEXT_MUTED, false, 1.4);
      sy += 36;
    });

    // ==========================================
    // PAGE 5 — INVESTMENT (THE TIERS)
    // ==========================================
    p.addPage(); m.pn = 5; bg(p, 0, 0, PW, PH, PITCH); drawHeaderDark(p, m); drawFooterDark(p, m);
    let dy = CT + 5;
    txt(p, "04 // ESCOLHA SEU ARSENAL", ML, dy, 10, GOLD, true); dy += 12;
    p.setFontSize(20); Tc(p, WHITE);
    dy += wrap(p, "SOLUÇÕES PROJETADAS PARA O SEU MOMENTO DE DOMINÂNCIA.", ML, dy, CW, 20, WHITE, true, 1.2) + 12;

    const cW = (CW - 12) / 3, cH = 130;
    const tiersD = [
      { n: "ESSENTIAL", pc: "Fundação Tática", c: [50, 50, 55] as RGB, f: ["One-Page Alta Conversão", "Design Responsivo UI/UX", "Segurança Criptografada", "Botão Mágico WhatsApp", "Fundação de SEO Local", "Hospedagem por 1 Ano"] },
      { n: "DOMINANCE", pc: "Máquina de Vendas", c: GOLD, f: ["Site Multi-Páginas Premium", "Animações Fluídas de Luxo", "Integração de Analytics", "Google Maps Local", "Copywriting Persuasivo", "Treinamento para Equipe"] },
      { n: "IMPERIUM", pc: "Monopólio Tecnológico", c: [200, 200, 205] as RGB, f: ["Arquitetura de E-Commerce", "Velocidade Extrema Vercel", "Painel de Gestão (CMS)", "Estrutura para Tráfego Pago", "Suporte Manutenção Mensal", "Atendimento via C-Level"] }
    ];

    tiersD.forEach((t, i) => {
      const cx = ML + i * (cW + 6), cy = dy, isPro = i === 1;
      rr(p, cx, cy, cW, cH, 5, isPro ? DARK_SURFACE : PITCH, isPro ? GOLD : BORDER_D);

      if (isPro) {
        bg(p, cx, cy, cW, 8, GOLD);
        txt(p, "ESCOLHA ABSOLUTA", cx + cW / 2, cy + 5.5, 7, PITCH, true, "center");
      }

      txt(p, t.n, cx + cW / 2, cy + 20, 10, t.c, true, "center");
      txt(p, t.pc.toUpperCase(), cx + cW / 2, cy + 26, 7, TEXT_MUTED, true, "center");
      hline(p, cx + 10, cy + 32, cx + cW - 10, BORDER_D, 0.5);

      let fy = cy + 42;
      t.f.forEach((feat) => {
        drawCheck(p, cx + 8, fy - 1.5, 2.5, t.c);
        fy += wrap(p, feat, cx + 14, fy, cW - 18, 7.5, TEXT_LIGHT, false, 1.4) + 3;
      });
    });

    // ==========================================
    // PAGE 6 — TECH TABLE
    // ==========================================
    p.addPage(); m.pn = 6; bg(p, 0, 0, PW, PH, PITCH); drawHeaderDark(p, m); drawFooterDark(p, m);
    let ty = CT + 5;
    txt(p, "05 // ESPECIFICAÇÕES TÁTICAS", ML, ty, 10, GOLD, true); ty += 12;
    p.setFontSize(20); Tc(p, WHITE);
    ty += wrap(p, "O QUE ESTÁ RODANDO POR DEBAIXO DO CAPÔ.", ML, ty, CW, 20, WHITE, true, 1.2) + 8;

    const tX = ML, c1 = 80, c23 = (CW - c1) / 3, thH = 12, trH = 9;
    bg(p, tX, ty, CW, thH, DARK_SURFACE);
    txt(p, "Recursos do Projeto", tX + 4, ty + 8, 8, GOLD_L, true);
    ["ESSENTIAL", "PRO", "IMPERIUM"].forEach((n, i) => txt(p, n, tX + c1 + c23 * (i + 0.5), ty + 8, 8, GOLD_L, true, "center"));
    ty += thH;

    const rowsD: [string, boolean, boolean, boolean][] = [
      ["Design Interface Premium", true, true, true],
      ["Otimização Mobile Absoluta", true, true, true],
      ["Segurança Criptografada SSL", true, true, true],
      ["Gatilhos Visuais de Conversão", true, true, true],
      ["Dashboard Analítico (Google)", false, true, true],
      ["Sistema de Gerenciamento (CMS)", false, true, true],
      ["Arquitetura IA SEO Avançada", false, true, true],
      ["Catálogo de Produtos Multi", false, false, true],
      ["Setup Comercial (Google/Face Ads)", false, false, true],
      ["Consultoria Dedicada", false, false, true]
    ];

    rowsD.forEach((r, ri) => {
      const ry = ty + ri * trH;
      if (ri % 2 === 0) bg(p, tX, ry, CW, trH, [15, 15, 18]);
      hline(p, tX, ry + trH, tX + CW, BORDER_D, 0.3);
      txt(p, r[0], tX + 4, ry + 6, 9, TEXT_LIGHT, true);
      [r[1], r[2], r[3]].forEach((ok, ci) => {
        if (ok) {
          const ccx = tX + c1 + c23 * (ci + 0.5);
          drawCheck(p, ccx, ry + 5, 3, GOLD);
        }
      });
    });

    // ==========================================
    // PAGE 7 — ACTION (CLOSING)
    // ==========================================
    p.addPage(); m.pn = 7; bg(p, 0, 0, PW, PH, PITCH); drawHeaderDark(p, m); drawFooterDark(p, m);
    let fY = CT + 15;

    txt(p, "06 // ASSUMA O CONTROLE", ML, fY, 12, GOLD, true); fY += 14;
    p.setFontSize(28); Tc(p, WHITE);
    fY += wrap(p, `SEU PRÓXIMO CLIENTE ESTÁ BUSCANDO NO GOOGLE AGORA MESMO.`, ML, fY, CW, 28, WHITE, true, 1.1) + 10;

    txt(p, "Quem ele vai encontrar? Voc\u00ea ou seu concorrente?", ML, fY, 14, GOLD_L, true); fY += 20;

    wrap(p, "A sua compet\u00eancia j\u00e1 \u00e9 comprovada. Nossa fun\u00e7\u00e3o \u00e9 pavimentar um tapete vermelho digital, blindado de autoridade, para que o seu cliente converta no primeiro impulso. N\u00e3o adie o seu pr\u00f3prio crescimento.", ML, fY, CW - 20, 12, TEXT_LIGHT, false, 1.3); fY += 28;

    rr(p, (PW - 90) / 2, fY, 90, 14, 2, GOLD);
    txt(p, "INICIAR PROJETO VIP AGORA", PW / 2, fY + 9, 11, PITCH, true, "center");
    if (sellerWhatsapp) addLink(p, (PW - 90) / 2, fY, 90, 14, `https://wa.me/${sellerWhatsapp.replace(/\D/g, "")}`);
    fY += 40;

    txt(p, "Com m\u00e1xima considera\u00e7\u00e3o e brutalidade comercial,", ML, fY, 10, TEXT_MUTED); fY += 8;
    txt(p, sellerName.toUpperCase(), ML, fY, 16, WHITE, true); fY += 6;
    txt(p, "ESPECIALISTA EM ENGENHARIA DIGITAL", ML, fY, 8, GOLD, true);

    const safeN = (business.name || "site").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 50);
    p.save(`Projeto_Vip_${safeN}_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("Design Editorial VIP Gerado!", { id: toastId });
  } catch (err: any) {
    console.error("PDF Site Err:", err);
    toast.error(`Erro fatal: ${err.message}`, { id: toastId });
  }
}

