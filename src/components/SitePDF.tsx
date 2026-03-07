import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { toast } from "sonner";
import { BusinessData } from "@/types/business";
import { supabase } from "@/integrations/supabase/client";

// ═══════════════════════════════════════════════════════════════════
// Helpers Reutilizados
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

// ═══════════════════════════════════════════════════════════════════
// UI components 
// ═══════════════════════════════════════════════════════════════════
interface PdfTemplateProps {
  business: BusinessData;
  m: {
    logoB64: string;
    sellerName: string;
    sellerWebsite: string;
    sellerWhatsapp: string;
    dateStr: string;
  };
  badHtml: string;
  goodHtml: string;
}

const SitePDFTemplate: React.FC<PdfTemplateProps> = ({ business, m, badHtml, goodHtml }) => {

  // Header e Footer Genéricos
  const Header = ({ title }: { title: string }) => (
    <div className="w-full h-12 flex justify-between items-center border-b border-[#28282d] px-10 pt-4 absolute top-0 left-0 bg-[#0a0a0c] z-20">
      <div className="flex items-center gap-4">
        {m.logoB64 && <img src={m.logoB64} alt="Logo" className="h-6" />}
        <div>
          <div className="text-white font-bold text-[11px] tracking-widest">{business.name.toUpperCase()}</div>
          <div className="text-[#D4AF37] font-semibold text-[8px] tracking-widest leading-none">PROJETO DE ENGENHARIA DIGITAL • {business.city.toUpperCase()}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-white font-bold text-[9px] tracking-widest">PROPOSTA EXCLUSIVA</div>
        <div className="text-[#9696a0] font-medium text-[8px] tracking-wider">{m.dateStr}</div>
      </div>
    </div>
  );

  const Footer = ({ page }: { page: number }) => (
    <div className="w-full h-10 flex justify-between items-center border-t border-[#28282d] px-10 pb-4 pt-2 absolute bottom-0 left-0 bg-[#0a0a0c] z-20">
      <div className="flex items-center gap-4">
        {m.logoB64 && <img src={m.logoB64} alt="Logo" className="h-4 grayscale opacity-60" />}
        <div className="text-[#9696a0] font-medium text-[8px] tracking-widest">CONFIDENCIAL • USO EXCLUSIVO</div>
      </div>
      <div className="text-[#d4af37] font-bold text-[9px] tracking-widest text-center absolute left-1/2 -translate-x-1/2">
        {m.sellerName.toUpperCase()}
      </div>
      <div className="text-[#9696a0] font-medium text-[9px] tracking-wider">
        Página {page} de 7
      </div>
    </div>
  );

  const safeUrl = (url: string) => {
    try {
      return `https://${url.replace(/^https?:\/\//, '')}`;
    } catch { return url; }
  };

  return (
    <div className="font-sans antialiased text-white bg-[#0a0a0c] leading-relaxed">

      {/* Posições relativas de páginas para A4: w-full h-[296.8mm] */}

      {/* ------------------------ PÁGINA 1: CAPA ------------------------ */}
      <div className="pdf-page bg-[#0a0a0c] relative flex flex-col justify-center px-16 overflow-hidden">
        {/* Tech Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: "linear-gradient(#28282d 1px, transparent 1px), linear-gradient(90deg, #28282d 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        {/* Dourado Accents */}
        <div className="absolute left-6 top-16 w-[3px] h-32 bg-[#D4AF37]" />
        <div className="absolute right-6 bottom-16 w-[3px] h-32 bg-[#D4AF37]" />

        {m.logoB64 && <img src={m.logoB64} className="h-12 w-auto object-contain mb-32 z-10" alt="Logo" />}

        <div className="z-10 mt-10">
          <h3 className="text-[#D4AF37] font-bold text-xs tracking-[0.2em] mb-4">PROJETO DE POSICIONAMENTO E DESTRUIÇÃO DA CONCORRÊNCIA</h3>
          <h1 className="text-[54px] font-black text-white leading-[1.1] tracking-tight max-w-[700px] uppercase mb-8">
            {business.name}
          </h1>
          <p className="text-xl text-[#e6e6eb] font-medium tracking-wide">
            A ARTE DE CONVERTER CLIQUES EM CLIENTES LEAIS.
          </p>
        </div>

        <div className="absolute bottom-16 left-16 z-10">
          <div className="w-16 h-1 bg-[#D4AF37] mb-4" />
          <p className="text-[#9696a0] font-bold text-[10px] tracking-[0.2em] mb-1">DESENVOLVIDO POR</p>
          <p className="text-white font-bold text-lg tracking-wider mb-1">{m.sellerName.toUpperCase()}</p>
          {m.sellerWebsite && <p className="text-[#F0D278] font-medium text-sm">{m.sellerWebsite}</p>}
        </div>
      </div>

      {/* ------------------------ PÁGINA 2: A VERDADE CRUA ------------------------ */}
      <div className="pdf-page bg-[#0a0a0c] relative px-16 py-20 flex flex-col">
        <Header title="" />
        <div className="z-10 mt-12 flex-1">
          <p className="text-[#D4AF37] font-bold text-[13px] tracking-[0.2em] mb-4">01 // A VERDADE NUA E CRUA</p>
          <h2 className="text-4xl font-black text-white tracking-tight mb-8">O GOOGLE NÃO PERDOA AMADORES.</h2>

          <p className="text-[17px] text-[#e6e6eb] font-medium leading-relaxed mb-6 max-w-[650px]">
            Atualmente, quando um cliente em <span className="text-white">{business.city}</span> procura pelos serviços da <span className="text-white font-bold">{business.name}</span>, qual é a primeira impressão que ele tem?
          </p>
          <p className="text-[15px] text-[#9696a0] font-medium leading-relaxed mb-12 max-w-[650px]">
            Não ter um site de alta conversão é entregar dinheiro nas mãos da sua concorrência todos os dias. O seu cliente sente desconfiança quando encontra apenas um link de Instagram ou um site lento e desatualizado.
          </p>

          {/* Score Card */}
          <div className="bg-[#141418] border border-[#28282d] rounded-2xl p-8 mb-16 flex items-center gap-8 shadow-xl max-w-[700px]">
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37] opacity-20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37] border-t-transparent" style={{ transform: `rotate(${(business.presenceScore || 0) * 3.6}deg)` }}></div>
              <span className="text-3xl font-black text-white">{business.presenceScore ?? 0}%</span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-white tracking-widest mb-1 uppercase">SEU SCORE DE AUTORIDADE DIGITAL</h4>
              <p className="text-rose-500 font-medium text-sm mb-2">Muito abaixo do padrão exigido por consumidores premium.</p>
              <p className="text-[#9696a0] text-xs">Isso afeta diretamente o valor percebido do seu negócio na internet.</p>
            </div>
          </div>

          <p className="text-[#D4AF37] font-bold text-[15px] tracking-[0.2em] mb-4 uppercase">NOSSA MISSÃO:</p>
          <p className="text-xl text-white font-medium leading-relaxed max-w-[700px]">
            Construir uma Máquina de Vendas disfarçada de Site Institucional. Um ativo digital que trabalha 24h por dia vendendo a excelência da sua marca enquanto você dorme.
          </p>
        </div>
        <Footer page={2} />
      </div>

      {/* ------------------------ PÁGINA 3: O CUSTO DO AMADORISMO (MOCKUPS HTML) ------------------------ */}
      <div className="pdf-page bg-[#0a0a0c] relative px-10 py-20 flex flex-col">
        <Header title="" />
        <div className="z-10 mt-6 flex-1 flex flex-col">
          <p className="text-[#D4AF37] font-bold text-[12px] tracking-[0.2em] mb-3 ml-6">02 // O CUSTO DO AMADORISMO VISUAL</p>
          <h2 className="text-[32px] font-black text-white tracking-tight leading-[1.1] mb-6 ml-6 max-w-[700px]">
            A PRIMEIRA IMPRESSÃO DITA O VALOR DO SEU SERVIÇO.
          </h2>

          {/* COMPARAÇÃO DE SITES */}
          <div className="flex gap-6 mt-4 flex-1">

            {/* THE BAD SITE */}
            <div className="flex-1 bg-[#141418] border border-[#28282d] rounded-xl flex flex-col overflow-hidden relative shadow-[0_10px_40px_rgba(239,68,68,0.05)]">
              <div className="bg-rose-500 py-2 text-center text-[10px] font-black tracking-widest text-white uppercase z-10 shadow-md">
                SITE AMADOR (MERCADO COMUM)
              </div>
              <div className="flex-1 p-6 flex flex-col items-center">
                {/* Monitor frame */}
                <div className="w-full bg-[#1e1e23] border border-[#28282d] rounded-lg p-[8px] pb-4 flex flex-col items-center shadow-xl">
                  <div className="w-full aspect-[16/9] bg-white overflow-hidden relative" dangerouslySetInnerHTML={{ __html: badHtml }} />
                  <div className="w-16 h-4 bg-[#323237] mt-[-2px] z-0"></div>
                  <div className="w-32 h-2 bg-[#3c3c41] rounded-b-md z-0"></div>
                </div>
                <div className="w-full mt-6 pl-4">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-sm text-[#9696a0] font-medium"><span className="text-rose-500 font-bold mt-[2px]">x</span> Experiência confusa no Desktop</li>
                    <li className="flex items-start gap-2 text-sm text-[#9696a0] font-medium"><span className="text-rose-500 font-bold mt-[2px]">x</span> Código amador e sem velocidade</li>
                    <li className="flex items-start gap-2 text-sm text-[#9696a0] font-medium"><span className="text-rose-500 font-bold mt-[2px]">x</span> Afasta decisores que compram B2B</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* THE GOOD SITE */}
            <div className="flex-1 bg-[#141418] border border-[#D4AF37] rounded-xl flex flex-col overflow-hidden relative shadow-[0_10px_50px_rgba(212,175,55,0.08)]">
              <div className="bg-[#D4AF37] py-2 text-center text-[10px] font-black tracking-widest text-[#0a0a0c] uppercase z-10 shadow-md">
                NOSSA ENGENHARIA VIP
              </div>
              <div className="flex-1 p-6 flex flex-col items-center">
                {/* Monitor frame */}
                <div className="w-full bg-[#28282d] border border-[#D4AF37] rounded-lg p-[8px] pb-4 flex flex-col items-center shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
                  <div className="w-[1280px] h-[720px] bg-[#0a0a0c] overflow-hidden relative" style={{ transform: 'scale(0.25)', transformOrigin: 'top left', marginBottom: '-540px' }} dangerouslySetInnerHTML={{ __html: goodHtml }} />
                  <div className="w-16 h-4 bg-[#46464b] mt-[-2px] z-0"></div>
                  <div className="w-32 h-2 bg-[#5a5a5f] rounded-b-md z-0"></div>
                </div>
                <div className="w-full mt-6 pl-4">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-sm text-[#D4AF37] font-bold"><span>✓</span> Visual Widescreen Imersivo</li>
                    <li className="flex items-start gap-2 text-sm text-[#D4AF37] font-bold"><span>✓</span> Máxima retenção corporativa</li>
                    <li className="flex items-start gap-2 text-sm text-[#D4AF37] font-bold"><span>✓</span> Posiciona você no Topo do Nicho</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-8 ml-6">
            <p className="text-[#D4AF37] font-bold text-[13px] tracking-[0.15em] mb-2 uppercase">O IMPACTO DO COMPUTADOR CORPORATIVO:</p>
            <p className="text-[14px] text-white font-medium max-w-[700px] leading-relaxed">
              Muitas decisões B2B ou compras de alto valor são tomadas no Desktop do escritório do seu cliente. Se o seu site esmaga a concorrência nessa tela grande, a venda já está 80% garantida antes dele pegar o telefone.
            </p>
          </div>

        </div>
        <Footer page={3} />
      </div>

      {/* ------------------------ PÁGINA 4: ENGENHARIA ------------------------ */}
      <div className="pdf-page bg-[#0a0a0c] relative px-16 py-20 flex flex-col">
        <Header title="" />
        <div className="z-10 mt-12 flex-1 relative">
          <p className="text-[#D4AF37] font-bold text-[13px] tracking-[0.2em] mb-4">03 // ENGENHARIA DE CONVERSÃO</p>
          <h2 className="text-[34px] font-black text-white tracking-tight leading-[1.1] mb-12 max-w-[750px] uppercase">
            NÃO FAZEMOS 'SITINHOS'. CONSTRUIMOS POSICIONAMENTO IMPLACÁVEL.
          </h2>

          <div className="space-y-6">
            {[
              { t: "Design Editorial de Luxo", d: "Criamos interfaces hipnóticas baseadas na psicologia do seu nicho. O cliente sentirá o peso e a qualidade do seu serviço antes mesmo de te ligar." },
              { t: "Velocidade Extrema (LCP < 1.5s)", d: "Código limpo e infraestrutura de ponta. Seu site vai abrir mais rápido que um estalar de dedos, matando a taxa de rejeição do Google." },
              { t: "SEO Local Sangrento", d: "Vamos injetar palavras-chave estratégicas no código-fonte para que sua empresa domine as buscas na sua cidade." },
              { t: "Arquitetura Focada em Vendas", d: "Botões de ação estratégicos (CTAs), integração fluida com WhatsApp e formulários que convertem curiosos em clientes pagantes." }
            ].map((pil, idx) => (
              <div key={idx} className="bg-[#141418] border border-[#28282d] rounded-xl flex items-center shadow-lg relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-[#D4AF37]"></div>
                <div className="w-20 flex justify-center items-center shrink-0">
                  <span className="text-4xl font-black text-[#28282d]">0{idx + 1}</span>
                </div>
                <div className="py-7 pr-8 flex-1">
                  <h4 className="text-[16px] font-bold text-white tracking-wide uppercase mb-2">{pil.t}</h4>
                  <p className="text-[13px] text-[#9696a0] font-medium leading-relaxed">{pil.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer page={4} />
      </div>

      {/* ------------------------ PÁGINA 5: PLANOS ------------------------ */}
      <div className="pdf-page bg-[#0a0a0c] relative px-12 py-20 flex flex-col">
        <Header title="" />
        <div className="z-10 mt-8 flex-1">
          <p className="text-[#D4AF37] font-bold text-[12px] tracking-[0.2em] mb-3 ml-4">04 // ESCOLHA SEU ARSENAL</p>
          <h2 className="text-[28px] font-black text-white tracking-tight leading-[1.1] mb-10 ml-4 max-w-[700px] uppercase">
            SOLUÇÕES PROJETADAS PARA O SEU MOMENTO DE DOMINÂNCIA.
          </h2>

          <div className="flex gap-4 items-stretch h-[550px]">
            {[
              {
                n: "ESSENTIAL", pc: "Fundação Tática", isPro: false, bgc: 'bg-[#0a0a0c]', brd: 'border-[#28282d]', tx: 'text-[#9696a0]', tk: 'text-[#9696a0]',
                f: ["One-Page Alta Conversão", "Design Responsivo UI/UX", "Segurança Criptografada", "Botão Mágico WhatsApp", "Fundação de SEO Local", "Hospedagem por 1 Ano"]
              },
              {
                n: "DOMINANCE", pc: "Máquina de Vendas", isPro: true, bgc: 'bg-[#141418]', brd: 'border-[#D4AF37]', tx: 'text-white', tk: 'text-[#D4AF37]',
                f: ["Site Multi-Páginas Premium", "Animações Fluídas de Luxo", "Integração de Analytics", "Google Maps Local", "Copywriting Persuasivo", "Treinamento para Equipe"]
              },
              {
                n: "IMPERIUM", pc: "Monopólio Tecnológico", isPro: false, bgc: 'bg-[#0a0a0c]', brd: 'border-[#28282d]', tx: 'text-[#e6e6eb]', tk: 'text-[#e6e6eb]',
                f: ["Arquitetura de E-Commerce", "Velocidade Extrema Vercel", "Painel de Gestão (CMS)", "Estrutura para Tráfego Pago", "Suporte Manutenção Mensal", "Atendimento via C-Level"]
              }
            ].map((t, i) => (
              <div key={i} className={`flex-1 rounded-2xl flex flex-col items-center border ${t.bgc} ${t.brd} relative ${t.isPro ? 'shadow-[0_20px_50px_rgba(212,175,55,0.08)] -mt-4 mb-4' : 'shadow-lg my-4'}`}>
                {t.isPro && (
                  <div className="w-full bg-[#D4AF37] rounded-t-xl py-[6px] text-center text-[9px] font-black uppercase tracking-widest text-[#0a0a0c]">
                    ESCOLHA ABSOLUTA
                  </div>
                )}
                <div className="p-8 w-full flex flex-col items-center border-b border-[#28282d]">
                  <h3 className={`text-xl font-black uppercase tracking-widest text-center ${t.isPro ? 'text-[#D4AF37]' : 'text-white'}`}>{t.n}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#9696a0] mt-1 text-center">{t.pc}</span>
                </div>
                <div className="p-6 pt-8 w-full flex-1">
                  <ul className="space-y-5">
                    {t.f.map((feat, fi) => (
                      <li key={fi} className="flex items-start gap-3">
                        <svg className={`w-4 h-4 mt-[2px] ${t.tk}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={`text-[12px] font-medium leading-[1.3] ${t.isPro ? 'text-white' : 'text-[#9696a0]'}`}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer page={5} />
      </div>

      {/* ------------------------ PÁGINA 6: TABELA TÉCNICA ------------------------ */}
      <div className="pdf-page bg-[#0a0a0c] relative px-16 py-20 flex flex-col">
        <Header title="" />
        <div className="z-10 mt-12 flex-1">
          <p className="text-[#D4AF37] font-bold text-[13px] tracking-[0.2em] mb-4">05 // ESPECIFICAÇÕES TÁTICAS</p>
          <h2 className="text-[30px] font-black text-white tracking-tight leading-[1.1] mb-12 max-w-[700px] uppercase">
            O QUE ESTÁ RODANDO POR DEBAIXO DO CAPÔ.
          </h2>

          <div className="w-full border border-[#28282d] rounded-xl overflow-hidden bg-[#141418]">
            <div className="grid grid-cols-4 border-b border-[#28282d] bg-[#1e1e23] py-4">
              <div className="col-span-1 border-r border-[#28282d] px-6 flex items-center">
                <span className="text-[#F0D278] font-bold text-xs uppercase tracking-widest">Recursos do Projeto</span>
              </div>
              <div className="col-span-1 border-r border-[#28282d] px-4 flex justify-center items-center">
                <span className="text-[#F0D278] font-bold text-xs uppercase tracking-widest text-center">ESSENTIAL</span>
              </div>
              <div className="col-span-1 border-r border-[#28282d] px-4 flex justify-center items-center">
                <span className="text-[#F0D278] font-bold text-xs uppercase tracking-widest text-center">DOMINANCE</span>
              </div>
              <div className="col-span-1 px-4 flex justify-center items-center">
                <span className="text-[#F0D278] font-bold text-xs uppercase tracking-widest text-center">IMPERIUM</span>
              </div>
            </div>

            {[
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
            ].map((row, ri) => (
              <div key={ri} className={`grid grid-cols-4 border-b border-[#28282d] py-3 ${ri % 2 === 0 ? 'bg-[#141418]' : 'bg-[#0a0a0c]'}`}>
                <div className="col-span-1 border-r border-[#28282d] px-6 flex items-center">
                  <span className="text-white text-[11px] font-medium tracking-wide uppercase">{row[0]}</span>
                </div>
                <div className="col-span-1 border-r border-[#28282d] px-4 flex justify-center items-center">
                  {row[1] && <svg className="w-5 h-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="col-span-1 border-r border-[#28282d] px-4 flex justify-center items-center">
                  {row[2] && <svg className="w-5 h-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="col-span-1 px-4 flex justify-center items-center">
                  {row[3] && <svg className="w-5 h-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer page={6} />
      </div>

      {/* ------------------------ PÁGINA 7: CTA ------------------------ */}
      <div className="pdf-page bg-[#0a0a0c] relative px-16 py-32 flex flex-col justify-center">
        <Header title="" />

        {/* Tech Grid Background (Faint) */}
        <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: "radial-gradient(circle at center, #D4AF37 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="z-10 w-full flex flex-col flex-1 mt-10">
          <p className="text-[#D4AF37] font-bold text-[14px] tracking-[0.2em] mb-4">06 // ASSUMA O CONTROLE</p>
          <h2 className="text-[44px] font-black text-white tracking-tight leading-[1.05] mb-8 max-w-[700px] uppercase">
            SEU PRÓXIMO CLIENTE ESTÁ BUSCANDO NO GOOGLE AGORA MESMO.
          </h2>

          <p className="text-2xl text-[#D4AF37] font-bold tracking-wide mb-12">Quem ele vai encontrar? Você ou seu concorrente?</p>

          <p className="text-[17px] text-[#e6e6eb] font-medium leading-relaxed mb-16 max-w-[650px]">
            A sua competência já é comprovada. Nossa função é pavimentar um tapete vermelho digital, blindado de autoridade, para que o seu cliente converta no primeiro impulso. Não adie o seu próprio crescimento.
          </p>

          <div className="w-full flex justify-center mb-24">
            <a href={m.sellerWhatsapp ? `https://wa.me/55${m.sellerWhatsapp.replace(/\D/g, "")}` : "#"}
              className="bg-transparent border border-[#D4AF37] rounded-none py-4 px-12 uppercase tracking-widest text-[#D4AF37] font-black hover:bg-[#D4AF37] hover:text-[#0a0a0c] transition-colors inline-block text-center no-underline border-2">
              INICIAR PROJETO VIP AGORA
            </a>
          </div>

          <div className="mt-auto pl-4 border-l-2 border-[#28282d]">
            <p className="text-[#9696a0] font-medium text-xs mb-2 uppercase tracking-wider">Com máxima consideração e brutalidade comercial,</p>
            <p className="text-white font-black text-2xl tracking-widest mb-1 uppercase">{m.sellerName}</p>
            <p className="text-[#D4AF37] font-bold text-[10px] tracking-[0.2em] uppercase">ESPECIALISTA EM ENGENHARIA DIGITAL</p>
          </div>
        </div>
        <Footer page={7} />
      </div>

    </div>
  );
};

// -------------------------------------------------------------------------------------------------
// ENGINE ENTRY-POINT
// -------------------------------------------------------------------------------------------------
export async function generateSitePDF(business: BusinessData, customGoodHtml?: string): Promise<void> {
  const toastId = "pdf-puppeteer-b2b";
  toast.loading("Comunicando com Servidor Puppeteer Local...", { id: toastId });

  try {
    const profile = await fetchFreshProfile();
    const sellerName = profile?.full_name || "Especialista Digital";
    const sellerEmail = profile?.contact_email || "";
    const sellerWhatsapp = profile?.whatsapp || "";
    const sellerWebsite = profile?.website_site_url || profile?.website_url || "";
    const logoB64 = await urlToBase64(profile?.logo_site_url || profile?.logo_url || "");

    const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

    const m = {
      logoB64, sellerName, sellerWebsite, sellerWhatsapp, dateStr
    };

    const badHtml = `
            <div style="background: #ffffff; color: #000; font-family: 'Times New Roman', serif; padding: 20px; height: 100%; box-sizing: border-box; overflow: hidden; display: flex; flex-direction: column;">
                <div style="background: #0000ff; color: #fff; padding: 10px; text-align: left; font-size: 20px; display: flex; gap: 50px;">
                   <span>INICIO</span><span>SOBRE NÓS</span><span>SERVICOS</span><span>CONTATO</span>
                </div>
                <div style="margin-top: 20px; display: flex; flex-direction: row; gap: 20px; flex: 1;">
                   <div style="flex: 1.2; display: flex; flex-direction: column; justify-content: center;">
                     <h1 style="color: red; font-size: 44px; text-align: left; margin-top: 10px; margin-bottom: 20px;">A melhor solucao em ${business.niche} para vcs!</h1>
                     <p style="font-size: 24px; text-align: justify; word-break: break-all; margin-top: 10px;">A ${business.name} é a melhor opção de ${business.niche} em ${business.city}. Venham conferir!!</p>
                     <p style="background: red; color: yellow; border: 8px solid green; padding: 20px; font-size: 28px; font-weight: bold; margin-top: 50px; text-align: center;">CLIQUE AQUI PARA FALAR CONCOSCO!!!</p>
                   </div>
                   <div style="flex: 0.8; height: 100%; background: #cccccc; display: flex; align-items: center; justify-content: center; border: 5px solid red; position: relative;">
                     <span style="position: absolute; color: red; font-size: 150px; font-weight: bold; opacity: 0.5;">X</span>
                     <span style="font-size: 40px; color: black;">Imagem Quebrada</span>
                   </div>
                </div>
            </div>
        `;

    const goodHtml = customGoodHtml || `
            <div style="background: #0a0a0c; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; padding: 50px 70px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; position: relative; border: 4px solid #D4AF37;">
                <!-- Grid Bg -->
                <div style="position: absolute; inset: 0; background-image: linear-gradient(#1e1e23 2px, transparent 2px), linear-gradient(90deg, #1e1e23 2px, transparent 2px); background-size: 60px 60px; opacity: 0.3; pointer-events: none;"></div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 60px; z-index: 10;">
                   <div style="font-weight: 900; font-size: 38px; letter-spacing: 4px; color: #D4AF37;">${business.name.toUpperCase().substring(0, 20)}</div>
                   <div style="display: flex; gap: 50px; font-size: 20px; font-weight: 600; color: #9696a0;">
                     <span style="color: #fff;">Premium</span><span>Metodologia</span><span>Resultados</span>
                   </div>
                </div>
                
                <div style="display: flex; gap: 60px; flex: 1; align-items: center; z-index: 10;">
                   <div style="flex: 1.2;">
                     <div style="color: #D4AF37; font-weight: 800; letter-spacing: 4px; font-size: 22px; margin-bottom: 25px;">ENGENHARIA DIGITAL PARA ${business.niche.toUpperCase()}</div>
                     <h1 style="font-size: 85px; font-weight: 900; line-height: 1.05; margin: 0 0 35px 0; color: #fff;">
                       O PADRÃO OURO DE<br/><span style="color: #D4AF37;">ALTA CONVERSÃO.</span>
                     </h1>
                     <p style="font-size: 26px; color: #e6e6eb; line-height: 1.6; margin: 0 0 60px 0; max-width: 90%;">A autoridade incontestável que o seu negócio precisa para dominar as buscas e atrair clientes de alto valor na região de ${business.city}.</p>
                     
                     <div style="display: flex; gap: 20px;">
                       <div style="background: transparent; border: 3px solid #D4AF37; color: #D4AF37; padding: 25px 50px; font-weight: 900; font-size: 24px; letter-spacing: 2px;">
                         AGENDAR REUNIÃO VIP
                       </div>
                     </div>
                   </div>
                   
                   <div style="flex: 0.8; height: 100%; background: #141418; border-radius: 30px; border: 2px solid #28282d; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 20px 50px rgba(212,175,55,0.1);">
                      <div style="width: 350px; height: 350px; border-radius: 50%; background: radial-gradient(circle, rgba(212,175,55,0.15) 0%, rgba(10,10,12,0) 70%);"></div>
                      <div style="position: absolute; font-size: 34px; font-weight: 900; color: #D4AF37; text-align: center; letter-spacing: 4px;">DESIGN<br/><span style="color: #fff;">SENSORIAL</span></div>
                   </div>
                </div>
            </div>
        `;

    // 1. Gera o HTML cru do React
    const reactHtmlString = renderToStaticMarkup(<SitePDFTemplate business={business} m={m} badHtml={badHtml} goodHtml={goodHtml} />);

    // 2. Constrói o Envelope HTML
    const fullHtmlPayload = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="https://cdn.tailwindcss.com"></script>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
                <style>
                    body { 
                        font-family: 'Inter', sans-serif; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact;
                        margin: 0;
                        padding: 0;
                        background: #0a0a0c;
                    }
                    @page { margin: 0; size: A4 portrait; }
                    .pdf-page {
                        width: 210mm;
                        height: 296.8mm;
                        overflow: hidden;
                        page-break-after: always;
                        position: relative;
                        box-sizing: border-box;
                    }
                    .pdf-page:last-child {
                        page-break-after: auto;
                    }
                    svg { display: block; }
                </style>
            </head>
            <body>
                ${reactHtmlString}
            </body>
            </html>
        `;

    // 3. Dispara POST na API Node.js Local
    const response = await fetch("http://localhost:3001/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html: fullHtmlPayload })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.details || errData.error || "Erro desconhecido na API do Puppeteer");
    }

    // 4. Converte o Binário Recebido e Força o Download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeFileName = (business.name || "CLIENTE").replace(/\s+/g, '_').toUpperCase();
    a.download = `Projeto_Vip_${safeFileName}_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    a.remove();

    toast.success("Design Editorial VIP Gerado via Arquitetura Headless!", { id: toastId });

  } catch (err: any) {
    console.error("Puppeteer Rendering Flight Crash:", err);
    if (err.message === "Failed to fetch") {
      toast.error("O Servidor Puppeteer não respondeu. Execute 'node server/pdf-engine.js' no terminal da pasta raiz e tente novamente.", { id: toastId, duration: 9000 });
    } else {
      toast.error(`Falha no motor: ${err.message}`, { id: toastId });
    }
  }
}
