import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { toast } from "sonner";
import { BusinessData } from "@/types/business";
import { Droplet, Activity, BellRing, PieChart, Building2, KeySquare, TrendingDown } from "lucide-react";

/**
 * 🦅 DOSSIÊ V34 - PUPPETEER ENGINE ARCHITECTURE
 * Renderiza o layout B2B estritamente usando Tailwind e envia para o servidor Node.js
 * local onde o Puppeteer (Headless Chrome) gera um PDF A4 bit-perfect.
 */

interface TelemetriaPDFProps {
    business: BusinessData;
    sellerName: string;
    sellerWhatsapp: string;
    base64Cco?: string;
    base64Dash?: string;
    base64Log?: string;
}

const TelemetriaTemplate: React.FC<TelemetriaPDFProps> = ({ business, sellerName, sellerWhatsapp, base64Cco, base64Dash, base64Log }) => {
    return (
        <div className="font-sans antialiased text-slate-800 bg-white leading-relaxed">

            {/* ========================================================= */}
            {/* PÁGINA 1: CAPA MCKINSEY STYLE (IMPACTO DA DOR)            */}
            {/* ========================================================= */}
            <div className="pdf-page bg-white relative flex flex-col justify-between overflow-hidden">
                {/* Header */}
                <div className="w-full flex items-center justify-between px-16 pt-16 z-10">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">ELETRICOM</h1>
                        <p className="text-[10px] font-bold tracking-widest text-[#0ea5e9] uppercase">Diagnóstico Preliminar de Infraestrutura</p>
                    </div>
                </div>

                {/* Slogan Central (Dor) */}
                <div className="flex flex-col items-center flex-1 pt-24 px-16 text-center z-10">
                    <span className="text-rose-600 font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                        O Custo Invisível da Infraestrutura Cega
                    </span>
                    <h2 className="text-6xl font-black text-slate-900 leading-tight tracking-tight max-w-[650px] mx-auto">
                        Você confia no que não pode medir?
                    </h2>
                    <p className="mt-8 text-xl text-slate-600 max-w-[600px] mx-auto font-medium">
                        Milhares de reais são perdidos mensalmente em condomínios e indústrias devido a vazamentos silenciosos e desabastecimentos inesperados. A gestão reativa não é mais aceitável no cenário corporativo atual.
                    </p>

                    {/* IMAGEM DO DASHBOARD 3D (RESTAURADA E APRIMORADA) */}
                    <div className="mt-14 w-[600px] h-[337px] rounded-2xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200 mx-auto relative bg-slate-100 flex items-center justify-center">
                        <img
                            src="https://telemetria-eletricom.me/dashboard-preview.png"
                            alt="Dashboard Telemetria Eletricom"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Target Block Footer */}
                <div className="w-full h-40 bg-slate-50 flex flex-col items-center justify-center border-t border-slate-200 z-10">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Auditoria Direcionada Exclusivamente A:</p>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                        {business.name || "ORGANIZAÇÃO PROSPECT"}
                    </h3>
                </div>
            </div>

            {/* ========================================================= */}
            {/* PÁGINA 2: A ARMADURA TÉCNICA (SOLUÇÃO B2B)                */}
            {/* ========================================================= */}
            <div className="pdf-page bg-[#f8fafc] flex flex-col px-16 py-16">

                <h1 className="text-2xl font-black text-slate-900 tracking-tighter mb-1">ELETRICOM</h1>
                <p className="text-[10px] font-bold tracking-widest text-[#0ea5e9] uppercase mb-16">Engenharia de Soluções</p>

                <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">O Fim do Achismo.</h2>
                <h2 className="text-4xl font-black text-[#0ea5e9] tracking-tight leading-none mb-6">A Era do Domínio Hídrico.</h2>

                <p className="text-lg text-slate-600 mb-12 max-w-[650px] font-medium leading-relaxed">
                    Nossa tecnologia centraliza e automatiza todos os dados críticos. Da coleta à decisão:
                </p>

                {/* Grid Premium (Sem Emojis, Estritamente B2B e Iconografia SVG) */}
                <div className="grid grid-cols-2 gap-8 w-full max-w-[700px] mx-auto">
                    {[
                        { icon: <Droplet className="text-[#0ea5e9] w-6 h-6" />, title: "Monitoramento de Nível", desc: "Níveis em tempo real de reservatórios de consumo, reserva e incêndio com sensores submersíveis IP68." },
                        { icon: <Activity className="text-indigo-500 w-6 h-6" />, title: "Gestão de Consumo", desc: "Acompanhamento preciso do perfil de consumo hídrico, identificando desperdícios silenciosos e desvios de padrão." },
                        { icon: <BellRing className="text-rose-500 w-6 h-6" />, title: "Alertas Tecnológicos", desc: "Notificações instantâneas via WhatsApp quando níveis atingem patamares críticos. Fim absoluto das surpresas." },
                        { icon: <PieChart className="text-emerald-500 w-6 h-6" />, title: "Dashboards Executivos", desc: "Visões interativas, gráficos de histórico e relatórios PDF detalhados para prestação de contas da operação civil." },
                        { icon: <Building2 className="text-purple-500 w-6 h-6" />, title: "Gestão Hierárquica", desc: "Controle de acesso granular por organização com permissões rigorosas (Supervisores vs Operadores locatários)." },
                        { icon: <KeySquare className="text-amber-500 w-6 h-6" />, title: "Hardware de Defesa", desc: "Sensores 4-20mA com imunidade técnica a ruído eletromagnético e proteção absoluta contra picos de tensão." }
                    ].map((item, idx) => (
                        <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 flex flex-col">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                                {item.icon}
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h4>
                            <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ========================================================= */}
            {/* PÁGINA 3: AUDITORIA VISUAL DO CCO E HISTÓRICO             */}
            {/* ========================================================= */}
            <div className="pdf-page bg-slate-900 flex flex-col px-16 py-16 text-white overflow-hidden relative">
                {/* Micro Tech Background */}
                <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%239C92AC\\' fill-opacity=\\'1\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>

                <div className="relative z-10 w-full flex-1 flex flex-col">
                    <h1 className="text-2xl font-black text-white tracking-tighter mb-1">ELETRICOM</h1>
                    <p className="text-[10px] font-bold tracking-widest text-[#0ea5e9] uppercase mb-10 opacity-80">Interface de Alta Gerência</p>

                    <div className="space-y-2 mb-8">
                        <h2 className="text-4xl font-black text-white tracking-tight">O Poder da Previsibilidade.</h2>
                        <p className="text-lg text-slate-400 font-medium max-w-[650px]">
                            Abandone planilhas mortas. Seu Centro de Controle Mestre atualizado em milésimos de segundo. Operação com transparência vítrea.
                        </p>
                    </div>

                    {/* Mosaico de Tecnologias */}
                    <div className="flex flex-col gap-6 flex-1 justify-center">

                        {/* Imagem Principal CCO */}
                        <div className="w-full bg-slate-800 rounded-2xl border border-slate-700 p-3 relative shadow-lg">
                            <span className="absolute -top-3 left-6 bg-[#0ea5e9] text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-sky-400 z-20 shadow-md">
                                Visão Central CCO
                            </span>
                            {base64Cco ? (
                                <img src={base64Cco} className="w-full h-[320px] object-contain object-center rounded-xl border border-slate-700/50 bg-slate-900/60 p-1" alt="CCO Visão Geral" />
                            ) : (
                                <div className="w-full h-[320px] bg-slate-900 rounded-xl flex items-center justify-center text-slate-700 text-sm font-bold">CARREGANDO...</div>
                            )}
                        </div>

                        {/* Duas colunas inferiores */}
                        <div className="grid grid-cols-2 gap-6 h-[260px]">
                            <div className="w-full h-full bg-slate-800 rounded-2xl border border-slate-700 p-3 relative shadow-lg">
                                <span className="absolute -top-3 left-6 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-400 z-20 shadow-md">
                                    Métricas Globais
                                </span>
                                {base64Dash && (
                                    <img src={base64Dash} className="w-full h-full object-contain object-center rounded-xl border border-slate-700/50 relative z-10 bg-slate-900/60 p-1" alt="Dashboard Métricas" />
                                )}
                            </div>

                            <div className="w-full h-full bg-slate-800 rounded-2xl border border-slate-700 p-3 relative shadow-lg">
                                <span className="absolute -top-3 left-6 bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-rose-400 z-20 shadow-md">
                                    Análise Histórica de Fluxo
                                </span>
                                {base64Log && (
                                    <img src={base64Log} className="w-full h-full object-contain object-center rounded-xl border border-slate-700/50 relative z-10 bg-slate-900/60 p-1" alt="Gráfico de Histórico Log" />
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* PÁGINA 4: IMPLANTAÇÃO E FECHAMENTO COMERCIAL              */}
            {/* ========================================================= */}
            <div className="pdf-page bg-slate-900 flex flex-col px-16 py-16 text-white overflow-hidden">
                <h1 className="text-2xl font-black text-white tracking-tighter mb-1">ELETRICOM</h1>
                <p className="text-[10px] font-bold tracking-widest text-[#0ea5e9] uppercase mb-16 opacity-80">Implantação & Contato</p>

                <div className="text-center space-y-2 mb-16">
                    <h2 className="text-4xl font-black text-white tracking-tight">Simples de implementar.</h2>
                    <p className="text-xl text-slate-400">Poderoso de operar. Sem quebrar paredes.</p>
                </div>

                {/* Timeline Visual B2B */}
                <div className="flex-1 max-w-[600px] mx-auto w-full relative pl-8 mb-10">
                    {/* Linha Oculta */}
                    <div className="absolute left-[39px] top-6 bottom-[40px] w-0.5 bg-slate-800" />

                    {[
                        { step: "01", title: "Instalação Cirúrgica", desc: "Instalação de sensores industriais com configuração remota, sem interromper sua operação ou fluxo de água atual." },
                        { step: "02", title: "Configuração do CCO", desc: "Cadastro da unidade, definição técnica das métricas de alerta e montagem do seu Dashboard Personalizado de alta gerência." },
                        { step: "03", title: "Atuação Preditiva", desc: "Lançamento do fluxo de telemetria. Alertas ativos diretos no WhatsApp da equipe predial. Fim das perdas irreparáveis." }
                    ].map((st, i) => (
                        <div key={i} className="relative mb-12 flex gap-8">
                            <div className="w-10 h-10 rounded-full bg-[#0ea5e9] flex items-center justify-center text-white font-black text-sm relative z-10 shadow-[0_0_20px_rgba(14,165,233,0.3)] shrink-0 border border-sky-400/30">
                                {st.step}
                            </div>
                            <div className="pt-1">
                                <h4 className="text-xl font-bold text-white mb-2 tracking-tight">{st.title}</h4>
                                <p className="text-sm text-slate-400 leading-relaxed">{st.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* THE MASTER CTA - DADOS DO VENDEDOR DINÂMICOS (PUPPETEER INJETADOS) */}
                <div className="w-full bg-slate-800 rounded-3xl p-10 border border-slate-700 flex flex-col items-center justify-center pb-12 relative z-10">
                    <span className="text-[#0ea5e9] font-black uppercase tracking-[0.2em] text-xs mb-6">Auditoria Técnica Exclusiva</span>
                    <h3 className="text-xl text-slate-300 font-medium mb-6">Agende sua avaliação diretamente com:</h3>

                    <a
                        href={`https://wa.me/55${(sellerWhatsapp || "").replace(/\D/g, '')}`}
                        className="text-5xl font-black text-white tracking-tight mb-6 no-underline block"
                        style={{ position: "relative", zIndex: 50 }}
                    >
                        {sellerWhatsapp || "WHATSAPP PENDENTE"}
                    </a>

                    <div className="text-base text-slate-400 font-medium tracking-wide flex flex-col items-center gap-2">
                        <span>{sellerName || "Diretor Comercial"} | Grupo Eletricom</span>
                        <a
                            href="https://telemetria-eletricom.me"
                            className="text-[#0ea5e9] underline underline-offset-4 decoration-[#0ea5e9]/50 font-semibold tracking-widest uppercase text-sm mt-3 block"
                            style={{ position: "relative", zIndex: 50 }}
                        >
                            telemetria-eletricom.me
                        </a>
                    </div>
                </div>
            </div>

        </div>
    );
};

// -------------------------------------------------------------------------------------------------
// ENGINE ENTRY-POINT
// -------------------------------------------------------------------------------------------------
export async function generateTelemetriaPDF(props: TelemetriaPDFProps): Promise<void> {
    const toastId = "pdf-puppeteer";
    toast.loading("Comunicando com Servidor Puppeteer Local...", { id: toastId });

    try {
        // Conversão Silenciosa das Mídias Locais para Base64 (Evitar travamento CORS do Puppeteer)
        const localToBase64 = async (path: string) => {
            try {
                const response = await fetch(window.location.origin + path);
                const blob = await response.blob();
                return await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                console.error("Falha ao injetar imagem:", path);
                return "";
            }
        };

        const [b64Cco, b64Dash, b64Log] = await Promise.all([
            localToBase64("/eletricom_cco.png"),
            localToBase64("/eletricom_dash.png"),
            localToBase64("/eletricom_log1.png")
        ]);

        props.base64Cco = b64Cco;
        props.base64Dash = b64Dash;
        props.base64Log = b64Log;

        // 1. Gera o HTML cru do React
        const reactHtmlString = renderToStaticMarkup(<TelemetriaTemplate {...props} />);

        // 2. Constrói o Envelope HTML Perfeito para Impressão com Folhas de Estilos
        const fullHtmlPayload = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="https://cdn.tailwindcss.com"></script>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700;900&display=swap" rel="stylesheet">
                <style>
                    /* Reset & Print Core Settings */
                    body { 
                        font-family: 'Inter', sans-serif; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact;
                        margin: 0;
                        padding: 0;
                        background: white;
                    }
                    /* Container sizes to assure perfect A4 Print Box Model */
                    @page { margin: 0; size: A4 portrait; }
                    .pdf-page {
                        width: 210mm;
                        height: 296.8mm; /* Math fit for Chrome/Puppeteer borderless */
                        overflow: hidden;
                        page-break-after: always;
                        position: relative;
                        box-sizing: border-box;
                    }
                    .pdf-page:last-child {
                        page-break-after: auto;
                    }
                    svg {
                        display: block; /* Garante que os svgs do Lucide não quebrem inline */
                    }
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
        const safeFileName = (props.business.name || "CLIENTE").replace(/\s+/g, '_').toUpperCase();
        a.download = `Documento_Mckinsey_Eletricom_${safeFileName}.pdf`;
        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(url);
        a.remove();

        toast.success("Design Premium B2B gerado com sucesso via Puppeteer Chrome Engine.", { id: toastId });

    } catch (err) {
        console.error("Puppeteer Rendering Flight Crash:", err);
        // Fallback info text if the server isn't running
        if (err.message === "Failed to fetch") {
            toast.error("O Servidor Puppeteer não respondeu. Verifique se o terminal está rodando o servidor.", { id: toastId, duration: 8000 });
        } else {
            toast.error(`Falha no motor: ${err.message}`, { id: toastId });
        }
    }
}
