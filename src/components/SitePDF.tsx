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
        Página {page} de 8
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
      <div className="pdf-page bg-[#050507] relative flex flex-col justify-center px-24 overflow-hidden border-[15px] border-[#0a0a0c]">
        {/* Decorative Gradients */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-600/10 rounded-full blur-[120px]" />

        {/* Tech Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]" style={{ backgroundImage: "linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        {/* Dourado Accents */}
        <div className="absolute left-10 top-24 w-[2px] h-48 bg-gradient-to-b from-[#D4AF37] to-transparent" />
        <div className="absolute right-10 bottom-24 w-[2px] h-48 bg-gradient-to-t from-[#D4AF37] to-transparent" />

        <div className="z-10 flex flex-col items-start">
          {m.logoB64 ? (
            <img src={m.logoB64} className="h-16 w-auto object-contain mb-16" alt="Logo" />
          ) : (
            <div className="h-16 flex items-center gap-3 mb-16">
              <div className="w-10 h-10 bg-[#D4AF37] rounded-lg"></div>
              <span className="text-2xl font-black tracking-tighter text-white">LEADRADAR</span>
            </div>
          )}

          <div className="space-y-6">
            <h3 className="text-[#D4AF37] font-bold text-sm tracking-[0.4em] uppercase border-b border-[#D4AF37]/30 pb-2 inline-block">
              {business.niche.includes('dentista') || business.niche.includes('odontologia') ? 'DOXOSIÊ ESTRATÉGICO DE SAÚDE BUCAL' :
                business.niche.includes('advogado') || business.niche.includes('juridico') ? 'DOSSIÊ DE AUTORIDADE JURÍDICA' :
                  business.niche.includes('beach') || business.niche.includes('areia') ? 'PROJETO DE DOMINAÇÃO DA AREIA' :
                    business.niche.toLowerCase().includes('sistema') || business.niche.toLowerCase().includes('software') || business.niche.toLowerCase().includes('tecnologia') ? 'DOSSIÊ DE ENGENHARIA E ESCALA SAAS' :
                      'DOSSIÊ ESTRATÉGICO B2B'}
            </h3>
            <h1 className="text-[68px] font-black text-white leading-[1] tracking-tighter max-w-[750px] uppercase">
              PLANO DE <span className="text-[#D4AF37]">DOMINAÇÃO</span> {business.niche.toUpperCase()}
            </h1>
            <div className="w-32 h-[4px] bg-[#D4AF37]" />
            <h2 className="text-3xl font-light text-slate-400 tracking-tight">
              PROPOSTA EXCLUSIVA PARA: <span className="text-white font-black">{business.name.toUpperCase()}</span>
            </h2>
          </div>
        </div>

        <div className="absolute bottom-24 left-24 z-10 flex items-center gap-12">
          <div>
            <p className="text-[#9696a0] font-bold text-[10px] tracking-[0.3em] mb-2 uppercase">ARQUITETO DE SOLUÇÕES</p>
            <p className="text-white font-black text-2xl tracking-wider">{m.sellerName.toUpperCase()}</p>
          </div>
          <div className="h-12 w-[1px] bg-slate-800" />
          <div>
            <p className="text-[#9696a0] font-bold text-[10px] tracking-[0.3em] mb-2 uppercase">DATA DE EMISSÃO</p>
            <p className="text-white font-medium text-lg">{m.dateStr}</p>
          </div>
        </div>
      </div>

      {/* ------------------------ PÁGINA 2: A VERDADE CRUA ------------------------ */}
      <div className="pdf-page bg-[#0a0a0c] relative px-16 py-20 flex flex-col">
        <Header title="" />
        <div className="z-10 mt-12 flex-1">
          <p className="text-[#D4AF37] font-bold text-[13px] tracking-[0.2em] mb-4">01 // A VERDADE NUA E CRUA</p>
          <h2 className="text-4xl font-black text-white tracking-tight mb-8">
            {business.niche.includes('dentista') ? 'PACIENTES NÃO BUSCAM PREÇO, BUSCAM CONFIANÇA.' :
              business.niche.includes('advogado') ? 'CLIENTES NÃO BUSCAM LEIS, BUSCAM VITÓRIAS.' :
                business.niche.includes('beach') ? 'JOGADORES NÃO BUSCAM AREIA, BUSCAM EXPERIÊNCIA.' :
                  business.niche.toLowerCase().includes('sistema') || business.niche.toLowerCase().includes('software') ? 'EMPRESAS NÃO BUSCAM CÓDIGO, BUSCAM RESULTADOS.' :
                    'O GOOGLE NÃO PERDOA AMADORES.'}
          </h2>

          <p className="text-[17px] text-[#e6e6eb] font-medium leading-relaxed mb-6 max-w-[650px]">
            {business.niche.includes('dentista') ? `Atualmente, quando um paciente em ${business.city} procura por especialistas em ${business.niche}, qual é a imagem que a ${business.name} transmite?` :
              business.niche.includes('advogado') ? `Atualmente, quando um cliente precisa de auxílio jurídico em ${business.city}, como ele percebe a autoridade da ${business.name}?` :
                business.niche.toLowerCase().includes('sistema') || business.niche.toLowerCase().includes('software') ? `No mercado de tecnologia de ${business.city}, a ${business.name} é vista como uma solução de elite ou apenas mais um utilitário?` :
                  `Atualmente, quando um cliente em ${business.city} procura pelos serviços da ${business.name}, qual é a primeira impressão que ele tem?`}
          </p>
          <p className="text-[15px] text-[#9696a0] font-medium leading-relaxed mb-12 max-w-[650px]">
            {business.niche.includes('dentista') ? 'Ter um site lento ou inexistente é como ter um consultório sem placa. O paciente premium desiste antes mesmo de agendar a primeira avaliação.' :
              business.niche.includes('advogado') ? 'A falta de um portal de autoridade faz com que sua banca pareça pequena diante dos concorrentes que já dominam o digital.' :
                business.niche.toLowerCase().includes('sistema') ? 'Para uma empresa de software, um site amador é um atestado de incompetência técnica. O seu cliente espera perfeição digital antes de assinar o contrato.' :
                  'Não ter um site de alta conversão é entregar dinheiro nas mãos da sua concorrência todos os dias. O seu cliente sente desconfiança e busca o próximo da lista.'}
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
          <div className="flex gap-10 mt-6 flex-1">

            {/* THE BAD SITE */}
            <div className="flex-1 flex flex-col">
              <div className="bg-rose-600/10 border border-rose-600/20 py-3 px-6 rounded-t-2xl flex justify-between items-center">
                <span className="text-rose-500 text-[11px] font-black tracking-widest uppercase">CENÁRIO ATUAL</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-rose-600"></div>
                  <div className="w-2 h-2 rounded-full bg-rose-600/30"></div>
                </div>
              </div>
              <div className="flex-1 bg-[#141418] border-x border-b border-slate-800 rounded-b-2xl p-8 flex flex-col shadow-2xl">
                <div className="w-full bg-[#1e1e23] border border-slate-700 rounded-xl p-2 pb-6 flex flex-col items-center">
                  <div className="w-full aspect-[16/10] bg-white overflow-hidden relative rounded-lg border border-slate-700" dangerouslySetInnerHTML={{ __html: badHtml }} />
                </div>
                <div className="w-full mt-10 space-y-4">
                  <div className="h-[1px] bg-gradient-to-r from-rose-600/50 to-transparent" />
                  <p className="text-rose-400 font-bold text-[10px] tracking-widest uppercase">FALHAS DE IDENTIDADE</p>
                  <ul className="space-y-4">
                    {[
                      "Layout 'esmagado' em telas grandes",
                      "Cores que não transmitem autoridade",
                      "Dificuldade de leitura e navegação"
                    ].map((txt, ii) => (
                      <li key={ii} className="flex items-center gap-3 text-[13px] text-slate-500 font-medium">
                        <div className="w-4 h-4 rounded-full bg-rose-600/10 flex items-center justify-center text-rose-500">✕</div>
                        {txt}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* THE GOOD SITE */}
            <div className="flex-1 flex flex-col">
              <div className="bg-amber-600/10 border border-amber-600/20 py-3 px-6 rounded-t-2xl flex justify-between items-center">
                <span className="text-amber-500 text-[11px] font-black tracking-widest uppercase">ENGENHARIA GURU</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                </div>
              </div>
              <div className="flex-1 bg-[#1a1a20] border-x border-b border-amber-900/30 rounded-b-2xl p-8 flex flex-col shadow-[0_30px_60px_-15px_rgba(212,175,55,0.15)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />

                <div className="w-full bg-[#282830] border border-amber-500/30 rounded-xl p-2 pb-6 flex flex-col items-center shadow-2xl z-10">
                  <div className="w-[1280px] h-[800px] bg-[#050507] overflow-hidden relative rounded-lg" style={{ transform: 'scale(0.24)', transformOrigin: 'top left', marginBottom: '-608px' }} dangerouslySetInnerHTML={{ __html: goodHtml }} />
                </div>

                <div className="w-full mt-10 space-y-4 z-10">
                  <div className="h-[1px] bg-gradient-to-r from-amber-500/50 to-transparent" />
                  <p className="text-amber-400 font-bold text-[10px] tracking-widest uppercase">ELEMENTOS DE ALTA CONVERSÃO</p>
                  <ul className="space-y-4">
                    {[
                      "Visual Imersivo Full-Width",
                      "Design de Elite (Efeito Apple/Vercel)",
                      "Foco absoluto em conversão B2B"
                    ].map((txt, ii) => (
                      <li key={ii} className="flex items-center gap-3 text-[13px] text-slate-300 font-bold">
                        <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">✓</div>
                        {txt}
                      </li>
                    ))}
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

      {/* ------------------------ PÁGINA 4: A NOVA VISÃO (SITE PREVIEW) ------------------------ */}
      <div className="pdf-page bg-[#0a0a0c] relative px-16 py-20 flex flex-col">
        <Header title="" />
        <div className="z-10 mt-12 flex-1 relative">
          <p className="text-[#D4AF37] font-bold text-[13px] tracking-[0.3em] mb-4 uppercase">03 // COMO SEU SITE PODERIA FICAR</p>
          <h2 className="text-[44px] font-black text-white tracking-tighter leading-[1] mb-8 max-w-[750px] uppercase">
            Sua Nova <span className="text-[#D4AF37]">Identidade de Poder.</span>
          </h2>

          <div className="bg-[#141418] border border-amber-500/20 rounded-2xl p-8 mb-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl" />

            <div className="mb-8">
              <span className="text-amber-500 font-black text-[10px] tracking-[0.2em] uppercase mb-2 block">HEADLINE SUGERIDA</span>
              <h3 className="text-3xl font-black text-white leading-tight">
                {business.site_preview?.headline || `Domine o Mercado de ${business.niche} em ${business.city}`}
              </h3>
            </div>

            <div className="mb-10">
              <span className="text-amber-500 font-black text-[10px] tracking-[0.2em] uppercase mb-2 block">SUB-HEADLINE ESTRATÉGICA</span>
              <p className="text-xl text-slate-300 font-medium">
                {business.site_preview?.subheadline || "Posicionamento premium focado em atrair e converter os melhores clientes da sua região."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="text-amber-500 font-black text-[10px] tracking-[0.2em] uppercase mb-4 block">BENEFÍCIOS DE ELITE</span>
                <ul className="space-y-3">
                  {(business.site_preview?.benefits || ["Autoridade Instantânea", "Design de Luxo", "Conversão 3x Maior"]).map((b, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-400 font-bold">
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 text-[10px]">✓</div>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-amber-500 font-black text-[10px] tracking-[0.2em] uppercase mb-4 block">SERVIÇOS EM DESTAQUE</span>
                <ul className="space-y-3">
                  {(business.site_preview?.services || ["Plano de Dominação", "Consultoria VIP"]).map((s, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-400 font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-[#1a1a20] border border-slate-800 rounded-2xl p-6">
              <span className="text-[#6366f1] font-black text-[10px] tracking-[0.2em] uppercase mb-3 block">RESUMO DA TRANSFORMAÇÃO</span>
              <p className="text-slate-300 text-sm leading-relaxed italic">
                "{business.site_preview_summary || "Esta nova estrutura remove todas as fricções que impedem seu cliente de tomar uma decisão hoje, elevando o valor percebido do seu serviço ao nível máximo de autoridade."}"
              </p>
            </div>
          </div>
        </div>
        <Footer page={4} />
      </div>

      {/* ------------------------ PÁGINA 5: ENGENHARIA ------------------------ */}
      <div className="pdf-page bg-[#050507] relative px-16 py-20 flex flex-col border-[15px] border-[#0a0a0c]">
        <Header title="" />
        <div className="z-10 mt-12 flex-1 relative">
          <p className="text-[#D4AF37] font-bold text-[13px] tracking-[0.3em] mb-4 uppercase">
            {business.niche.includes('dentista') ? 'BIOSSEGURANÇA DIGITAL' :
              business.niche.includes('advogado') ? 'PROTOCOLOS DE AUTORIDADE' :
                business.niche.toLowerCase().includes('sistema') ? 'STACK DE PERFORMANCE SaaS' :
                  '04 // ENGENHARIA DE ALTA PRECISÃO'}
          </p>
          <h2 className="text-[44px] font-black text-white tracking-tighter leading-[1] mb-12 max-w-[750px] uppercase">
            {business.niche.includes('dentista') ? 'SISTEMAS DESENHADOS PARA ATRAIR' :
              business.niche.includes('advogado') ? 'SISTEMAS PARA BLINDAR SUA' :
                business.niche.toLowerCase().includes('sistema') ? 'INFRAESTRUTURA PARA ESCALAR' :
                  'SISTEMAS DESENHADOS PARA'} <span className="text-[#D4AF37]">{business.niche.includes('dentista') ? 'PACIENTES PREMIUM.' : business.niche.includes('advogado') ? 'REPUTAÇÃO.' : business.niche.toLowerCase().includes('sistema') ? 'SEU FATURAMENTO.' : 'CONVERSÃO IMPLACÁVEL.'}</span>
          </h2>

          <div className="grid grid-cols-2 gap-6">
            {[
              {
                t: business.niche.includes('dentista') ? "Design Asséptico e Premium" : business.niche.includes('advogado') ? "Design Sóbrio e Imponente" : "Design Sensorial",
                d: business.niche.includes('dentista') ? "Interfaces que transmitem a higiene e a excelência técnica do seu consultório." :
                  business.niche.includes('advogado') ? "Layouts que projetam o peso jurídico e a seriedade da sua banca de advocacia." :
                    "Interfaces hipnóticas baseadas na psicologia do seu nicho. O cliente sente a qualidade antes mesmo do primeiro contato."
              },
              {
                t: "Velocidade de Elite",
                d: "Código limpo e infraestrutura redundante. Carregamento instantâneo para que o cliente não desista do contato."
              },
              {
                t: business.niche.includes('dentista') ? "Agendamento Fluído" : "Foco em Conversão",
                d: business.niche.includes('dentista') ? "Caminhos otimizados para que o paciente saia da busca e caia direto no seu WhatsApp." :
                  "CTAs estratégicos e integração fluida, transformando tráfego em faturamento real."
              },
              {
                t: "Dominação de " + business.city,
                d: "Arquitetura de SEO local focada em colocar sua empresa no topo das pesquisas geolocalizadas."
              }
            ].map((pil, idx) => (
              <div key={idx} className="bg-[#141418] border border-slate-800 rounded-2xl p-8 shadow-xl relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#D4AF37]"></div>
                <span className="text-5xl font-black text-slate-800 absolute -right-4 -bottom-4 opacity-50">{idx + 1}</span>
                <h4 className="text-[18px] font-black text-white tracking-wide uppercase mb-3">{pil.t}</h4>
                <p className="text-[14px] text-slate-400 font-medium leading-relaxed z-10 relative">{pil.d}</p>
              </div>
            ))}
          </div>
        </div>
        <Footer page={5} />
      </div>

      {/* ------------------------ PÁGINA 6: PLANOS ------------------------ */}
      <div className="pdf-page bg-[#050507] relative px-12 py-20 flex flex-col border-[15px] border-[#0a0a0c]">
        <Header title="" />
        <div className="z-10 mt-8 flex-1">
          <p className="text-[#D4AF37] font-bold text-[12px] tracking-[0.3em] mb-3 ml-4 uppercase">
            {business.niche.includes('dentista') ? 'INVESTIMENTO EM SAÚDE DIGITAL' :
              business.niche.includes('advogado') ? 'HONORÁRIOS DE EXPANSÃO' :
                business.niche.toLowerCase().includes('sistema') ? 'INVESTIMENTO EM CRESCIMENTO' :
                  '05 // ARSENAL DE COMBATE'}
          </p>
          <h2 className="text-[32px] font-black text-white tracking-tight leading-[1] mb-12 ml-4 max-w-[700px] uppercase">
            {business.niche.includes('dentista') ? 'PLANOS PARA UM CONSULTÓRIO DE ALTA PERFORMANCE.' :
              business.niche.includes('advogado') ? 'PLANOS PARA UMA BANCA DE ADVOCACIA DOMINANTE.' :
                business.niche.toLowerCase().includes('sistema') ? 'MODELOS DE ESCALA PARA EMPRESAS DE TECNOLOGIA.' :
                  'INVESTIMENTOS CALCULADOS PARA RETORNO MÁXIMO.'}
          </h2>

          <div className="flex gap-4 items-stretch h-[550px]">
            {[
              {
                n: business.niche.includes('dentista') ? "CLINIC" : business.niche.includes('advogado') ? "LEGAL" : business.niche.toLowerCase().includes('sistema') ? "START" : "ESSENTIAL",
                pc: "Presença Vital", isPro: false, bgc: 'bg-[#0a0a0c]', brd: 'border-slate-800', tx: 'text-slate-400', tk: 'text-slate-600',
                f: ["Single-Page Imersiva", "Design Responsivo Elite", "Segurança Blindada SSL", "Integração WhatsApp", "Fundação de SEO Local", "Hospedagem Gerenciada"]
              },
              {
                n: business.niche.includes('dentista') ? "PREMIUM" : business.niche.includes('advogado') ? "AUTHORITY" : business.niche.toLowerCase().includes('sistema') ? "GROWTH" : "DOMINANCE",
                pc: "Máquina de Atração", isPro: true, bgc: 'bg-[#141418]', brd: 'border-amber-500/50', tx: 'text-white', tk: 'text-[#D4AF37]',
                f: ["Multi-Page de Luxo", "Animações High-End", "Analytics Avançado", "Google Maps Expert", "Copywriting de Elite", "Selo de Autoridade"]
              },
              {
                n: business.niche.toLowerCase().includes('sistema') ? "ENTERPRISE" : "IMPERIUM", pc: "Monopólio Digital", isPro: false, bgc: 'bg-[#0a0a0c]', brd: 'border-slate-800', tx: 'text-slate-300', tk: 'text-slate-500',
                f: ["Ecossistema Full Stack", "Infra de Alta Escala", "Gestão de Conteúdo", "Ads Ready Architecture", "Support VIP 24/7", "Consultoria de Escala"]
              }
            ].map((t, i) => (
              <div key={i} className={`flex-1 rounded-3xl flex flex-col items-center border ${t.bgc} ${t.brd} relative ${t.isPro ? 'shadow-[0_40px_80px_-20px_rgba(212,175,55,0.2)] -mt-6 mb-6' : 'shadow-xl my-4'}`}>
                {t.isPro && (
                  <div className="w-full bg-[#D4AF37] rounded-t-[22px] py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-[#000]">
                    RECOMENDAÇÃO GURU
                  </div>
                )}
                <div className="p-10 w-full flex flex-col items-center border-b border-slate-800/50">
                  <h3 className={`text-2xl font-black uppercase tracking-tighter text-center ${t.isPro ? 'text-[#D4AF37]' : 'text-white'}`}>{t.n}</h3>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-2 text-center">{t.pc}</span>
                </div>
                <div className="p-8 w-full flex-1">
                  <ul className="space-y-6">
                    {t.f.map((feat, fi) => (
                      <li key={fi} className="flex items-start gap-4">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${t.isPro ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-500'}`}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <span className={`text-[13px] font-semibold leading-tight ${t.isPro ? 'text-white' : 'text-slate-400'}`}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer page={6} />
      </div>

      {/* ------------------------ PÁGINA 7: TABELA TÉCNICA ------------------------ */}
      <div className="pdf-page bg-[#050507] relative px-16 py-20 flex flex-col border-[15px] border-[#0a0a0c]">
        <Header title="" />
        <div className="z-10 mt-12 flex-1">
          <p className="text-[#D4AF37] font-bold text-[13px] tracking-[0.3em] mb-4 uppercase">06 // ESPECIFICAÇÕES DE ENGENHARIA</p>
          <h2 className="text-[34px] font-black text-white tracking-tighter leading-[1.1] mb-12 max-w-[700px] uppercase">
            COMPARAÇÃO DE <span className="text-[#D4AF37]">CAPACIDADES TÉCNICAS.</span>
          </h2>

          <div className="w-full border border-slate-800 rounded-3xl overflow-hidden bg-[#0a0a0c] shadow-2xl">
            <div className="grid grid-cols-4 border-b border-slate-800 bg-[#141418] py-5">
              <div className="col-span-1 border-r border-slate-800 px-8 flex items-center">
                <span className="text-slate-500 font-black text-[10px] uppercase tracking-widest">FUNCIONALIDADES</span>
              </div>
              <div className="col-span-1 border-r border-slate-800 px-4 flex justify-center items-center">
                <span className="text-white font-black text-[10px] uppercase tracking-widest">ESSENTIAL</span>
              </div>
              <div className="col-span-1 border-r border-slate-800 px-4 flex justify-center items-center">
                <span className="text-[#D4AF37] font-black text-[10px] uppercase tracking-widest underline decoration-2 underline-offset-8">DOMINANCE</span>
              </div>
              <div className="col-span-1 px-4 flex justify-center items-center">
                <span className="text-white font-black text-[10px] uppercase tracking-widest">IMPERIUM</span>
              </div>
            </div>

            {[
              ["Design Interface High-End", true, true, true],
              ["Otimização Mobile Absoluta", true, true, true],
              ["Segurança Criptografada SSL", true, true, true],
              ["Gatilhos Visuais de Conversão", true, true, true],
              ["Dashboard de Métricas (Google)", false, true, true],
              ["Painel de Gestão (CMS)", false, true, true],
              ["Arquitetura de Dados SEO", false, true, true],
              ["Catálogo Multi-Produtos", false, false, true],
              ["Setup de Tráfego Pago", false, false, true],
              ["Suporte C-Level Prioritário", false, false, true]
            ].map((row, ri) => (
              <div key={ri} className={`grid grid-cols-4 border-b border-slate-800/50 py-4 ${ri % 2 === 0 ? 'bg-[#0a0a0c]' : 'bg-[#050507]'}`}>
                <div className="col-span-1 border-r border-slate-800/50 px-8 flex items-center">
                  <span className="text-slate-300 text-[12px] font-bold tracking-tight">{row[0]}</span>
                </div>
                <div className="col-span-1 border-r border-slate-800/50 px-4 flex justify-center items-center">
                  {row[1] ? <div className="w-2 h-2 rounded-full bg-slate-700"></div> : <span className="text-slate-800 text-[10px]">✕</span>}
                </div>
                <div className="col-span-1 border-r border-slate-800/50 px-4 flex justify-center items-center">
                  {row[2] && <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div>}
                </div>
                <div className="col-span-1 px-4 flex justify-center items-center">
                  {row[3] && <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-white"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div>}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-amber-500/5 border border-amber-500/10 p-6 rounded-2xl">
            <p className="text-amber-500/70 text-[11px] font-medium leading-relaxed italic text-center">
              * Todas as soluções incluem infraestrutura de nuvem de baixa latência e backups automáticos semanais.
            </p>
          </div>
        </div>
        <Footer page={7} />
      </div>

      {/* ------------------------ PÁGINA 8: CTA ------------------------ */}
      <div className="pdf-page bg-[#0a0a0c] relative px-24 py-32 flex flex-col justify-center border-[15px] border-[#0a0a0c] overflow-hidden">
        <Header title="" />

        {/* Big Decorative Number BG */}
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 text-[500px] font-black text-slate-900 leading-none pointer-events-none opacity-20">07</div>

        <div className="z-10 w-full flex flex-col flex-1 mt-10">
          <p className="text-[#D4AF37] font-bold text-[14px] tracking-[0.4em] mb-6 uppercase">07 // ASSUMA A LIDERANÇA</p>
          <h2 className="text-[52px] font-black text-white tracking-tighter leading-[1] mb-8 max-w-[700px] uppercase">
            {business.niche.includes('dentista') ? 'SEU PRÓXIMO PACIENTE ESTÁ' :
              business.niche.includes('advogado') ? 'SEU PRÓXIMO CLIENTE ESTÁ' :
                'SEU PRÓXIMO GRANDE CLIENTE ESTÁ'} BUSCANDO <span className="text-[#D4AF37]">AGORA.</span>
          </h2>

          <p className="text-2xl text-slate-400 font-medium tracking-tight mb-16 max-w-[600px]">
            {business.niche.includes('dentista') ? 'Quem ele vai encontrar? Seu consultório ou a clínica vizinha?' :
              business.niche.includes('advogado') ? 'Qual banca ele vai contratar? A sua ou a que aparece primeiro?' :
                'Quem ele vai encontrar? Sua autoridade ou um concorrente amador?'}
          </p>

          <p className="text-[18px] text-[#e6e6eb] font-medium leading-relaxed mb-20 max-w-[650px] border-l-4 border-amber-500 pl-8">
            A excelência da <span className="text-white font-black">{business.name}</span> merece um palco digital à altura. Não estamos oferecendo um site, estamos oferecendo um <span className="text-white font-black">Ativo de Autoridade Implacável</span>.
          </p>

          <div className="w-full mb-24">
            <a href={m.sellerWhatsapp ? `https://wa.me/55${m.sellerWhatsapp.replace(/\D/g, "")}` : "#"}
              className="bg-[#D4AF37] rounded-none py-6 px-16 uppercase tracking-[0.3em] text-[#000] font-black hover:bg-white transition-all inline-block text-center no-underline shadow-[0_20px_40px_rgba(212,175,55,0.3)] text-lg">
              INICIAR PROJETO {business.niche.includes('dentista') ? 'CLINIC' : business.niche.includes('advogado') ? 'LEGAL' : 'VIP'}
            </a>
          </div>

          <div className="mt-auto flex items-end justify-between">
            <div className="pl-6 border-l-2 border-slate-800">
              <p className="text-slate-500 font-bold text-[10px] mb-2 uppercase tracking-[0.2em]">CONSIDERAÇÃO FINAL</p>
              <p className="text-white font-black text-3xl tracking-widest mb-1 uppercase">{m.sellerName}</p>
              <p className="text-[#D4AF37] font-black text-[11px] tracking-[0.3em] uppercase">HEAD DE ESTRATÉGIA DIGITAL</p>
            </div>

            <div className="text-right">
              <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">LeadRadar • Protocolo de Elite</p>
            </div>
          </div>
        </div>
        <Footer page={8} />
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
            <div style="background: #050507; color: #ffffff; font-family: 'Inter', sans-serif; padding: 0; min-height: 100vh; display: flex; flex-direction: column; position: relative;">
                <div style="position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, #1e1e2d 0%, #050507 100%); z-index: 1;"></div>
                
                <!-- Navbar -->
                <nav style="display: flex; justify-content: space-between; align-items: center; padding: 40px 80px; z-index: 10; border-bottom: 1px solid rgba(255,255,255,0.05);">
                   <div style="font-weight: 900; font-size: 28px; letter-spacing: -1px; color: #fff;">
                      <span style="color: #D4AF37;">${business.name.toUpperCase().substring(0, 1)}</span>${business.name.toUpperCase().substring(1, 15)}
                   </div>
                   <div style="display: flex; gap: 40px; font-size: 14px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 2px;">
                      <span style="color: #D4AF37; border-bottom: 2px solid #D4AF37;">Início</span><span>Estratégia</span><span>Diferencial</span><span>Contato</span>
                   </div>
                </nav>
                
                <!-- Hero Section -->
                <main style="flex: 1; display: flex; align-items: center; padding: 0 80px; z-index: 10;">
                   <div style="max-width: 800px;">
                      <div style="display: flex; items-center; gap: 15px; margin-bottom: 30px;">
                         <div style="width: 40px; h: 1px; background: #D4AF37;"></div>
                         <span style="color: #D4AF37; font-weight: 800; letter-spacing: 4px; font-size: 14px; text-transform: uppercase;">REFERÊNCIA EM ${business.niche.toUpperCase()}</span>
                      </div>
                      
                      <h1 style="font-size: 100px; font-weight: 900; line-height: 0.9; margin: 0 0 40px 0; color: #fff; letter-spacing: -4px;">
                        DOMINE A<br/><span style="color: #D4AF37;">ERADIGITAL.</span>
                      </h1>
                      
                      <p style="font-size: 22px; color: #aaa; line-height: 1.5; margin: 0 0 50px 0; max-width: 650px; font-weight: 400;">
                        Projetamos o posicionamento de elite para a <span style="color: #fff; font-weight: 700;">${business.name}</span> em <span style="color: #fff; font-weight: 700;">${business.city}</span> através de engenharia digital de alta precisão.
                      </p>
                      
                      <div style="display: flex; gap: 20px;">
                        <div style="background: #D4AF37; color: #000; padding: 22px 45px; font-weight: 900; font-size: 16px; letter-spacing: 1px; border-radius: 4px; text-transform: uppercase;">
                          Agendar Especialista
                        </div>
                        <div style="background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 22px 45px; font-weight: 700; font-size: 16px; border-radius: 4px; text-transform: uppercase;">
                          Ver Portfólio
                        </div>
                      </div>
                   </div>
                </main>
                
                <!-- Floating Card -->
                <div style="position: absolute; bottom: 80px; right: 80px; background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; z-index: 10; width: 300px;">
                   <div style="font-size: 40px; font-weight: 900; color: #D4AF37; margin-bottom: 5px;">99.9%</div>
                   <div style="color: #888; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Satisfação de Clientes Corporativos</div>
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

    // 3. Dispara POST na API (Híbrido Local/Vercel)
    const apiUrl = "/api/generate-pdf";

    const response = await fetch(apiUrl, {
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
