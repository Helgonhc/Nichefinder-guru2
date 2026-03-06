
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use SERVICE_ROLE_KEY if available for autonomous operation (bypasses RLS), fallback to ANON_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const googleApiKey = process.env.VITE_GOOGLE_PLACES_API_KEY;
const serperApiKey = "6fa1237bfce1d3d220c28d3cada8fd261463732d";
const groqApiKey = process.env.VITE_GROQ_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Log de Diagnóstico Inicial
const botOwnerId = process.env.BOT_OWNER_ID;
const ROBOT_VERSION = "2.5.0-FIREWALL-BILLING";



// MAPA DE NICHOS (Sincronizado com types/business.ts)
const NICHES = [
    { value: 'terapias_holisticas', keyword: 'terapia holística reiki acupuntura aromaterapia' },
    { value: 'energia_solar', keyword: 'energia solar instalação fotovoltaica' },
    { value: 'estetica', keyword: 'clínica estética harmonização facial' },
    { value: 'dentista', keyword: 'consultório odontológico dentista' },
    { value: 'medico', keyword: 'clínica médica consultório' },
    { value: 'advocacia', keyword: 'escritório de advocacia advogado' },
    { value: 'arquitetura', keyword: 'escritório arquitetura design interiores' },
    { value: 'imobiliaria', keyword: 'imobiliária corretor imóveis' },
    { value: 'beach_tennis', keyword: 'quadra beach tennis futevôlei arena' },
    { value: 'academia', keyword: 'academia fitness crossfit' },
    { value: 'mecanica', keyword: 'oficina mecânica automotiva' },
    { value: 'concessionaria', keyword: 'concessionária veículos revenda carros' },
    { value: 'restaurante', keyword: 'restaurante gastronomia' },
    { value: 'sushi', keyword: 'restaurante japonês sushi delivery' },
    { value: 'pizzaria', keyword: 'pizzaria delivery' },
    { value: 'hamburgueria', keyword: 'hamburgueria artesanal' },
    { value: 'escola', keyword: 'escola particular colégio infantil' },
    { value: 'pet_shop', keyword: 'pet shop clínica veterinária' },
    { value: 'contabilidade', keyword: 'escritório contabilidade contador' },
    { value: 'salao_beleza', keyword: 'salão de beleza cabeleireiro' },
    { value: 'barbearia', keyword: 'barbearia moderna' },
    { value: 'farmacia', keyword: 'farmácia drogaria' },
    { value: 'telemetria', keyword: "condomínio edifício prédio shopping indústria clínica hospital moinho geradora" },
    { value: 'monitoramento_condominios', keyword: "condomínio edifício prédio shopping indústria clínica hospital moinho geradora" }
];


console.log(`\n\x1b[36m🤖 [ROBOT] Iniciando Monitoramento de Condomínios v${ROBOT_VERSION}...`);
console.log(`📡 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Owner ID: ${botOwnerId || '\x1b[31mAUSENTE (Favor configurar no .env)\x1b[36m'}`);
console.log(`------------------------------------------\x1b[0m\n`);

let robotConsole = [];
let browser = null;
let page = null;

async function logToSupabase(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    // Filtro Semântico de Nicho: Garante que os logs não contaminem a percepção do usuário sobre o que o robô está fazendo.
    let displayMessage = message;
    const isTelemetria = (process.env.VITE_DEFAULT_NICHE || '').includes('telemetria') ||
        robotConsole.some(l => l.includes('telemetria')) ||
        message.includes('telemetria') || message.includes('condomínio');

    if (isTelemetria) {
        displayMessage = displayMessage
            .replace(/Varredura/gi, 'Mapeamento Técnico')
            .replace(/Minerando nicho/gi, 'Mapeando Instalações do nicho')
            .replace(/Auditoria Profunda no site/gi, 'Dossiê Técnico da estrutura de')
            .replace(/Site Analisado/gi, 'Infraestrutura Mapeada')
            .replace(/pontos fracos/gi, 'riscos operacionais')
            .replace(/presença digital/gi, 'infraestrutura hídrica');
    }

    const logLine = `[${timestamp}] ${displayMessage}`;
    console.log(logLine);

    robotConsole.push(logLine);
    if (robotConsole.length > 15) robotConsole.shift();

    try {
        const botOwnerId = process.env.BOT_OWNER_ID;
        if (!botOwnerId) return;

        const { data: systemLeads } = await supabase
            .from('leads')
            .select('*')
            .eq('name', 'ROBOT_STATUS')
            .eq('user_id', botOwnerId)
            .order('created_at', { ascending: false })
            .limit(1);

        let systemLead = systemLeads?.[0];

        if (!systemLead) {
            // Se ainda não existir por user_id, tenta buscar qualquer um sem dono (migration) ou cria
            const { data: fallbackLeads } = await supabase.from('leads').select('*').eq('name', 'ROBOT_STATUS').is('user_id', null).limit(1);
            systemLead = fallbackLeads?.[0];

            if (!systemLead) {
                const { data: newLead, error: insErr } = await supabase
                    .from('leads')
                    .insert([{
                        name: 'ROBOT_STATUS',
                        user_id: botOwnerId,
                        status: 'new',
                        meta_data: { logs: [], last_ping: new Date().toISOString(), status: 'online' }
                    }])
                    .select();

                if (insErr) throw new Error(`Falha ao criar ROBOT_STATUS: ${insErr.message}`);
                systemLead = newLead?.[0];
            } else {
                await supabase.from('leads').update({ user_id: botOwnerId }).eq('id', systemLead.id);
            }
        }

        if (systemLead) {
            await supabase
                .from('leads')
                .update({
                    meta_data: {
                        ...(systemLead.meta_data || {}),
                        logs: robotConsole,
                        last_ping: new Date().toISOString(),
                        status: 'online'
                    }
                })
                .eq('id', systemLead.id);
        }
    } catch (err) {
        console.error('❌ Erro de Sincronização (Supabase):', err.message);
    }
}

async function generateAIContent(business, type, siteAuditData = null, stage = 'D0') {
    if (!groqApiKey) return null;
    const isHolistic = business.niche === 'terapias_holisticas' || business.niche?.toLowerCase().includes('reiki') || business.niche?.toLowerCase().includes('orgon');
    const isCourts = business.niche?.toLowerCase().includes('quadra') || business.niche?.toLowerCase().includes('beach') || business.niche?.toLowerCase().includes('fut');
    const isTelemetria = business.niche?.toLowerCase().includes('telemetria') || business.niche?.toLowerCase().includes('condomínio') || business.niche?.toLowerCase().includes('síndico') || business.niche?.toLowerCase().includes('reservatório');

    let systemPrompt = `Você é um Estrategista de Vendas Consultivas de Elite. Sua missão é criar mensagens de abordagem via WhatsApp que sejam impossíveis de ignorar. 
    Seu tom é profissional, direto e focado em gerar curiosidade através de diagnósticos técnicos reais (Ferida Aberta).
    Você nunca parece um robô, nunca usa clichês de vendas e sempre foca no impacto financeiro de uma presença digital mal estruturada.`;

    if (type === 'site_audit') {
        systemPrompt = `Dada a auditoria técnica de um site, identifique 3 pontos fracos e 1 ponto forte. 
        Dados Técnicos: ${JSON.stringify(siteAuditData)}.
        Se for uma QUADRA DE ESPORTES e não tiver sistema de agendamento detectado, mencione especificamente a falta de automação de horários.`;
    } else if (isHolistic) {
        systemPrompt = `Você é um Estrategista de Vendas Consultivas de Elite focado em Terapias e Tecnologia Orgonial. 
        Sua missão é oferecer a implementação de uma Caixa Orgônica (Acumulador Orgone) como um diferencial competitivo e de cura energética. 
        Seu tom é místico mas profissional, focando no impacto biológico real de Wilhelm Reich.`;
    } else if (isCourts) {
        const hasScheduling = siteAuditData?.bookingSystemDetected;
        const brand = "ReservaAí (https://reservaai.com.br/)";
        const hasInstagram = siteAuditData?.socialLinks?.instagram;

        if (stage === 'D0') {
            systemPrompt = `Você é um Estrategista de Vendas Consultivas de Elite focado em arenas esportivas. Seu objetivo é mostrar como o sistema '${brand}' elimina o caos operacional.
            ${hasScheduling ? `Eles já usam o sistema ${hasScheduling}, seu foco é o diagnóstico estratégico: mostre como o ReservaAí retém 30% mais jogadores recorrentes.` : `Eles ainda não têm sistema, foque na 'Ferida Aberta': o tempo perdido e a perda de dinheiro com agendamentos manuais pelo WhatsApp.`}
            Regra: Seja extremamente direto, persuasivo e foque na liberdade do dono da arena. Crie uma mensagem curta (Máx 2 parágrafos).`;
        } else if (stage === 'D2') {
            systemPrompt = `Estrategista focado em arenas. Follow-up focado em RECUPERAÇÃO DE TEMPO. Mostre como o ReservaAí devolve a liberdade do dono da arena, automatizando a parte chata da gestão. (Máx 2 linhas informais).`;
        } else if (stage === 'D5') {
            systemPrompt = `Estrategista focado em arenas. Foco em PROVA SOCIAL ESTRATÉGICA. Cite que arenas similares aumentaram o faturamento em 30% ao permitir agendamento 24h. Deixe a dúvida: "Faz sentido batermos um papo sobre isso?". (Máx 2 linhas).`;
        } else if (stage === 'D9') {
            systemPrompt = `Estrategista focado em arenas. ULTIMATE CALL. Despedida de elite, deixando a porta aberta para quando a escala do negócio for prioridade. (Máx 2 linhas, humano e educado).`;
        }
    } else if (isTelemetria) {
        let tipoEstabelecimento = "Condomínio Residencial";
        const n = (business.name || '').toLowerCase();
        if (n.includes('hospital') || n.includes('clínic')) tipoEstabelecimento = "Hospital / Clínica Médica";
        else if (n.includes('shopping') || n.includes('center')) tipoEstabelecimento = "Shopping Center";
        else if (n.includes('logístic') || n.includes('distribui') || n.includes('galpão')) tipoEstabelecimento = "Centro Logístico / Galpão";
        else if (n.includes('comercial') || n.includes('corporativo') || n.includes('empresarial')) tipoEstabelecimento = "Prédio Comercial / Corporativo";
        else if (n.includes('indústria') || n.includes('fábrica') || n.includes('moinho')) tipoEstabelecimento = "Indústria / Fábrica";

        const brand = "Eletricom Telemetria (https://telemetria-eletricom.me/)";
        if (stage === 'D0') {
            systemPrompt = `Você é um Estrategista de Vendas Consultivas de Elite focado em Operação e Infraestrutura. Seu objetivo é oferecer a solução '${brand}' para ${tipoEstabelecimento}.
            Foco na 'Ferida Aberta': O risco de desabastecimento crítico ou falha na reserva técnica de incêndio. 
            Regra: Tom extremamente profissional, focado em mitigação de riscos e tranquilidade do gestor. Crie uma mensagem curta (Máx 2 parágrafos).`;
        } else if (stage === 'D2') {
            systemPrompt = `Estrategista de Infraestrutura. Follow-up focado em MANUTENÇÃO PREVENTIVA. Questione se o ${tipoEstabelecimento} está pronto para uma falha hídrica crítica hoje. (Máx 2 linhas consultivas).`;
        } else if (stage === 'D5') {
            systemPrompt = `Estrategista de Infraestrutura. Foco em VALOR PATRIMONIAL. Mostre como a tecnologia da Eletricom valoriza o ${tipoEstabelecimento} e remove a falha humana da gestão. (Máx 2 linhas).`;
        } else if (stage === 'D9') {
            systemPrompt = `Estrategista de Infraestrutura. Despedida estratégica. Deixe seu contato para quando a segurança dos reservatórios do ${tipoEstabelecimento} virar uma pauta prioritária. (Máx 2 linhas).`;
        }
    }

    if (type === 'battle_plan') {
        systemPrompt = `Você é um Estrategista de Vendas Consultivas de Elite. Sua missão é criar um DOSSIÊ ESTRATÉGICO para o lead ${business.name}.
        Analise os dados técnicos e de redes sociais para encontrar a "Ferida Aberta" (a maior falha técnica ou de marketing). 
        Seja direto, estratégico e focado em como o cliente ganha mais dinheiro profissionalizando sua presença online.`;
    }

    let userPrompt = '';
    if (type === 'site_audit') {
        userPrompt = `Auditoria do site: ${JSON.stringify(siteAuditData)}. Empresa: ${business.name}. Gere os 3 pontos fracos e 1 forte de forma curta.`;
    } else if (type === 'battle_plan') {
        userPrompt = `DADOS: Empresa ${business.name}, Nicho ${business.niche}, Cidade ${business.city}. Auditoria: ${JSON.stringify(siteAuditData)}.
               Gere um dossiê curto e potente com:
               1. PONTO DE DOR MASTER (Qual o maior erro/perda de dinheiro deles hoje?)
               2. QUEBRA DE GELO (Uma frase curta no WhatsApp impossível de ser ignorada)
               3. ARGUMENTO DE AUTORIDADE (Como a LeadRadar resolve isso definitivamente)
               Foque em tom de consultoria e valor.`;
    } else if (type === 'offer_reason') {
        userPrompt = `Empresa: ${business.name}, Cidade: ${business.city}, Nicho: ${business.niche}. Auditoria: ${JSON.stringify(siteAuditData)}. 
           Com base nesses dados, gere UM ÚNICO ARGUMENTO DE VENDA FATAL (máximo 15 palavras). 
           Foque na dor de perder dinheiro ou clientes para a concorrência.`;
    } else {
        if (isCourts) {
            userPrompt = `Empresa: ${business.name}, Cidade: ${business.city}. Crie uma mensagem de WhatsApp informal e rápida (MÁXIMO 2 parágrafos). 
            Vá direto ao ponto e fale com um tom de 'Amigo para Amigo'. Mostre para eles que gerenciar clientes e reservas manualmente pelo WhatsApp é o que está sugando a energia deles.
            Apresente o sistema 'ReservaAí' como uma forma dos jogadores agendarem e pagarem 100% sozinhos pelo celular. NÃO fale sobre marketing, sites ou redes sociais.`;
        } else if (isHolistic) {
            userPrompt = `Empresa: ${business.name}, Cidade: ${business.city}. Estágio: ${stage}. Crie uma mensagem altamente refinada e humana para oferecer a Caixa Orgônica (Acumulador Orgone). Foque no impacto biológico e não pareça um robô de vendas.`;
        } else if (isTelemetria) {
            userPrompt = `Empresa: ${business.name}, Cidade: ${business.city}. Estágio: ${stage}. Crie uma abordagem consultiva sobre telemetria de reservatórios e segurança hídrica para síndicos. Fale sobre evitar a falta d'água e garantir o monitoramento 24h. (Máx 2 parágrafos).`;
        } else {
            const hasSite = !!business.website;
            const audit = siteAuditData || {};
            let technicalFlaw = "falta de um posicionamento digital claro";

            if (!hasSite) {
                technicalFlaw = "ausência de um website oficial, o que te deixa invisível em pesquisas locais no Google";
            } else if (audit.speedScore < 60) {
                technicalFlaw = `lentidão crítica no carregamento do seu site atual (desempenho: ${audit.speedScore}/100), o que faz você perder mais da metade dos visitantes mobile`;
            } else if (!audit.isSecure) {
                technicalFlaw = "falta de certificado de segurança (HTTPS), o que faz o Google marcar seu site como 'Não Seguro' e afasta clientes";
            }

            userPrompt = `Empresa: ${business.name}, Cidade: ${business.city}, Nicho: ${business.niche}. Estágio: ${stage}. 
            Sua missão: Crie uma abordagem WhatsApp de Elite seguindo a estrutura de 3 passos:
            1. GANCHO DIAGNÓSTICO (Quebra de gelo baseada na falha detectada).
            2. IMPACTO ESTRATÉGICO (Como essa falha está drenando dinheiro ou autoridade).
            3. CONVITE SIMPLES (CTA para mostrar a solução rápida).
            
            Ponto Central (Ferida Aberta): ${technicalFlaw}.
            
            Regras de Ouro:
            - MÁXIMO de 120 palavras totais.
            - Linguagem humana, direta, sem "Encontrei seu contato...".
            - Pareça um especialista que acabou de auditar o site deles manualmente.
            - O tom deve ser idêntico a um 'Plano de Batalha' resumido em uma mensagem.`;
        }
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqApiKey}` },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                temperature: 0.7
            })
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (err) {
        return null;
    }
}

function scoreLead(lead, audit = null) {
    let score = 0;
    const nicheLower = (lead.niche || '').toLowerCase();
    const isTelemetria = ['telemetria', 'condominio', 'shopping', 'logistico', 'hospital', 'industria', 'predio'].some(kw => nicheLower.includes(kw));

    if (isTelemetria) {
        score += 25; // Oportunidade base alta para visita técnica
        if (lead.total_ratings > 50) score += 15;
        if (lead.rating && lead.rating < 4.4) score += 10;
        if (!lead.phone) score += 5;
    } else {
        // Regras Presença Digital Tradicionais
        if (!lead.website) {
            score += 25;
        } else if (audit) {
            if (!audit.isSecure) score += 10;
            if (audit.performanceScore < 50) score += 10;
            if (audit.isResponsive === false) score += 10;
            if (!audit.seoBasics) score += 5;
            if (!audit.ctaClarity) score += 5;
        }

        if (lead.instagram || (audit?.socialLinks?.instagram)) score += 10;
        if (lead.facebook || (audit?.socialLinks?.facebook)) score += 5;
        if (lead.total_ratings > 50) score += 10;
        if (lead.rating && lead.rating < 4.4) score += 5;

        const premiumNiches = ['advocacia', 'clinica', 'medico', 'estetica', 'energia_solar', 'imobiliaria', 'arquitetura'];
        if (premiumNiches.some(n => nicheLower.includes(n))) {
            score += 15;
        }
    }

    if (lead.phone || lead.whatsapp) {
        score += 10;
    }

    // Teto de 100
    score = Math.min(score, 100);

    // Temperatura
    let temperature = 'Frio';
    if (score >= 70) temperature = 'Quente';
    else if (score >= 40) temperature = 'Morno';

    return { score, temperature };
}

async function auditWebsite(url, businessName) {
    if (!browser) return { error: 'Browser not active' };
    const page = await browser.newPage();
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    let auditData = {
        title: '', description: '', hasOgImage: false, isResponsive: false,
        textSnippet: '', bookingSystemDetected: null, socialLinks: {}, copyrightYear: undefined
    };

    let navigationFailed = false;

    try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        const resp = await page.goto(normalizedUrl, { waitUntil: 'networkidle2', timeout: 20000 });

        if (!resp || !resp.ok()) {
            navigationFailed = true;
        } else {
            auditData = await page.evaluate(() => {
                const text = document.body.innerText.toLowerCase();
                const html = document.documentElement.innerHTML.toLowerCase();

                // Footprints de Sistemas de Agendamento
                let bookingSystem = null;
                if (html.includes('playtomic.io')) bookingSystem = 'Playtomic';
                else if (html.includes('aircourt.com.br')) bookingSystem = 'Aircourt';
                else if (html.includes('agendadinho.com.br')) bookingSystem = 'Agendadinho';
                else if (html.includes('app.easymark.com.br')) bookingSystem = 'EasyMark';
                else if (text.includes('agendar') || text.includes('reservar horários') || text.includes('marcar quadra')) bookingSystem = 'Manual/Genérico';

                // Captação de Redes Sociais Robusta
                const socialLinks = {};
                const allLinks = Array.from(document.querySelectorAll('a[href]'));
                allLinks.forEach(a => {
                    const href = a.href.toLowerCase();
                    if (href.includes('sharer') || href.includes('share') || href.includes('intent/tweet') ||
                        href.includes('/p/') || href.includes('/reel/') || href.includes('/tv/') ||
                        href.includes('google.com/search')) return;

                    if (href.includes('instagram.com/') && !socialLinks.instagram) socialLinks.instagram = a.href;
                    if (href.includes('facebook.com/') && !socialLinks.facebook) socialLinks.facebook = a.href;
                    if (href.includes('linkedin.com/') && !socialLinks.linkedin) socialLinks.linkedin = a.href;
                    if (href.includes('youtube.com/') && !socialLinks.youtube) socialLinks.youtube = a.href;
                    if ((href.includes('wa.me/') || href.includes('whatsapp.com/')) && !socialLinks.whatsapp) socialLinks.whatsapp = a.href;
                });

                // Extração de Copyright Year
                const currentYear = new Date().getFullYear();
                const copyrightRegex = /(?:©|Copyright|Copywrite).{0,50}(20\d{2})/gi;
                let match;
                const years = [];
                while ((match = copyrightRegex.exec(document.documentElement.innerHTML)) !== null) {
                    const year = parseInt(match[1]);
                    if (year >= 2000 && year <= currentYear + 1) years.push(year);
                }
                const cYear = years.length > 0 ? Math.max(...years) : undefined;

                return {
                    title: document.title,
                    description: document.querySelector('meta[name="description"]')?.content || 'Sem descrição SEO',
                    hasOgImage: !!document.querySelector('meta[property="og:image"]'),
                    isResponsive: !!document.querySelector('meta[name="viewport"]'),
                    textSnippet: document.body.innerText.slice(0, 500).replace(/\s+/g, ' '),
                    bookingSystemDetected: bookingSystem,
                    socialLinks,
                    copyrightYear: cYear
                };
            });
        }
    } catch (err) {
        console.warn(`[Audit] Puppeteer falhou para ${normalizedUrl}:`, err.message);
        navigationFailed = true;
    }

    // --- CHAMADA PARA API DO GOOGLE PAGESPEED (FONTE DA VERDADE) ---
    let googleScores = { performanceScore: 0, seoScore: 0, accessibilityScore: 0, bestPracticesScore: 0, lcp: 'N/A', cls: 'N/A' };
    let pageSpeedSuccess = false;

    try {
        const psUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(normalizedUrl)}&category=PERFORMANCE&category=SEO&category=ACCESSIBILITY&category=BEST_PRACTICES&key=${googleApiKey}`;
        const psResp = await fetch(psUrl);
        if (psResp.ok) {
            const psData = await psResp.json();
            const lh = psData.lighthouseResult;
            googleScores = {
                performanceScore: Math.round((lh.categories.performance?.score || 0) * 100),
                seoScore: Math.round((lh.categories.seo?.score || 0) * 100),
                accessibilityScore: Math.round((lh.categories.accessibility?.score || 0) * 100),
                bestPracticesScore: Math.round((lh.categories['best-practices']?.score || 0) * 100),
                lcp: lh.audits['largest-contentful-paint']?.displayValue || "N/A",
                cls: lh.audits['cumulative-layout-shift']?.displayValue || "N/A"
            };
            if (googleScores.performanceScore > 0 || googleScores.seoScore > 0) {
                pageSpeedSuccess = true;
            }
        }
    } catch (psErr) {
        console.error(`[Audit] Erro PageSpeed para ${normalizedUrl}:`, psErr.message);
    }

    if (navigationFailed && !pageSpeedSuccess) {
        if (page) await page.close();
        return { error: 'Failed to reach site', isSecure: normalizedUrl.startsWith('https'), audited_at: new Date().toISOString() };
    }

    // --- EXTRAÇÃO DE TELEFONE ADICIONAL (apenas se navegou com sucesso) ---
    let sitePhones = [];
    if (!navigationFailed) {
        sitePhones = await page.evaluate(() => {
            const text = document.body.innerText;
            const patterns = [
                /(?:\+55\s?)?(?:\(?\d{2}\)?\s?)(?:9\d{4})[-\s\.]?\d{4}/g,
                /(?:\(?\d{2}\)?\s?)(?:9\d{4})[-\s\.]?\d{4}/g,
                /(?:\(?\d{2}\)?\s?)\d{4}[-\s\.]?\d{4}/g,
                /\d{2}\s?9\d{8}/g
            ];
            const found = new Set();
            patterns.forEach(p => {
                const matches = text.match(p);
                if (matches) matches.forEach(m => found.add(m));
            });
            return Array.from(found);
        });
    }

    if (page) await page.close();

    // Se encontramos um telefone no site e não tínhamos link de whatsapp, tentamos inferir
    if (sitePhones.length > 0 && !auditData.socialLinks.whatsapp) {
        auditData.socialLinks.whatsapp = `https://wa.me/55${sitePhones[0].replace(/\D/g, '')}`;
    }

    return {
        ...auditData,
        ...googleScores,
        sitePhones,
        isSecure: normalizedUrl.startsWith('https'),
        audited_at: new Date().toISOString(),
        isDown: navigationFailed && !pageSpeedSuccess,
        // Legado para compatibilidade com interface
        speedScore: googleScores.performanceScore,
        mobileFriendly: auditData.isResponsive,
        https: normalizedUrl.startsWith('https'),
        seoBasics: googleScores.seoScore > 50,
        ctaClarity: auditData.textSnippet.toLowerCase().includes('contato') || !!auditData.socialLinks.whatsapp
    };
}

async function searchLeads(nicheId, city) {
    if (!googleApiKey) return [];

    const nicheNormalized = (nicheId || '').toLowerCase().trim();

    let existingPlaceIds = new Set();

    try {
        const { data: existingLeads } = await supabase
            .from('leads')
            .select('meta_data')
            .eq('user_id', botOwnerId);

        if (existingLeads) {
            existingLeads.forEach(l => {
                if (l.meta_data?.google_place_id) {
                    existingPlaceIds.add(l.meta_data.google_place_id);
                }
            });
        }
    } catch (e) {
        console.error("Erro ao carregar leads existentes:", e.message);
    }

    // 🔥 TELEMETRIA SEMPRE BUSCA CONDOMÍNIOS
    let queriesToRun = [];

    if (
        nicheNormalized === 'telemetria' ||
        nicheNormalized === 'monitoramento_condominios' ||
        nicheNormalized.includes('condomínio')
    ) {
        queriesToRun = [
            `Condomínio Residencial em ${city}`,
            `Condomínio Logístico em ${city}`,
            `Edifício Comercial em ${city}`,
            `Prédio Corporativo em ${city}`,
            `Centro Logístico em ${city}`,
            `Complexo Industrial em ${city}`,
            `Shopping Center em ${city}`,
            `Supermercado e hipermercados em ${city}`,
            `Indústria e fábrica em ${city}`,
            `Administradora de Condomínios em ${city}`,
            `Conservadora Predial em ${city}`,
            `Síndico Profissional em ${city}`
        ];
    } else {
        const nicheObj = NICHES.find(n => n.value === nicheNormalized);
        const searchTerm = nicheObj ? nicheObj.keyword : nicheNormalized;
        queriesToRun = [`${searchTerm} em ${city}`];
    }

    let allResults = [];
    const sessionSeen = new Set();

    // 1. Blacklist Sincronizada com Radar
    const blacklistTerms = [
        'rastreamento', 'rastreador', 'veicular', 'frotas', 'satélite', ' k2 ', ' k2sat',
        'setera', 'utratech', 'tektra', 'monitoramento de veículos', 'segurança veicular',
        'gps', 'sat ', 'telemetria', 'gestão de frotas', 'brinks', 'prosegur',
        'vendas de veículos', 'oficina', 'telemetria móvel', 'fadiga veicular',
        'telemática', 'telematica', 'wifi', 'alarme', 'alarm', 'rastreio',
        'log contagem', 'log betim', ' log ', ' log', 'log '
    ];

    for (const q of queriesToRun) {
        const query = encodeURIComponent(q);
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${googleApiKey}&language=pt-BR`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            const results = data.results || [];

            for (const r of results) {
                if (sessionSeen.has(r.place_id)) continue;
                if (existingPlaceIds.has(r.place_id)) continue;

                const name = (r.name || '').toLowerCase();

                // 🔥 FILTRO POSITIVO (apenas para Telemetria/Condomínios)
                if (nicheNormalized === 'telemetria' || nicheNormalized === 'monitoramento_condominios' || nicheNormalized.includes('condomínio')) {
                    const isValidStructure =
                        name.includes('condom') || name.includes('residencial') || name.includes('edif') ||
                        name.includes('prédio') || name.includes('corporat') || name.includes('logístic') ||
                        name.includes('industrial') || name.includes('shopping') || name.includes('galp') ||
                        name.includes('distribui') || name.includes('hospital') || name.includes('clínica') ||
                        name.includes('clinica') || name.includes('complexo') || name.includes('centro') ||
                        name.includes('moinho') || name.includes('fábrica') || name.includes('fabrica') ||
                        name.includes('administradora') || name.includes('administra') || name.includes('conservadora') ||
                        name.includes('gestão') || name.includes('síndic') || name.includes('sindic') || name.includes('terceiriz');

                    if (!isValidStructure) continue;
                }

                // 🔥 BLACKLIST SINCRONIZADA
                const isBlacklisted = blacklistTerms.some(term => {
                    const t = term.toLowerCase().trim();
                    if (t.length <= 3) return name.includes(` ${t} `) || name.startsWith(`${t} `) || name.endsWith(` ${t}`);
                    return name.includes(t);
                });

                if (isBlacklisted) continue;

                sessionSeen.add(r.place_id);
                allResults.push(r);
            }
        } catch (e) {
            console.error(`Erro na query "${q}":`, e.message);
        }
    }

    const enriched = [];

    // Motor Gratuito Integrado Serper (Substitui API Google Details que cobra por Telefone)
    const extractPhone = (text) => {
        if (!text) return null;
        const patterns = [
            /(?:\+55\s?)?(?:\(?\d{2}\)?\s?)(?:9\d{4})[-\s\.]?\d{4}/g,
            /(?:\(?\d{2}\)?\s?)(?:9\d{4})[-\s\.]?\d{4}/g,
            /(?:\(?\d{2}\)?\s?)\d{4}[-\s\.]?\d{4}/g,
            /\d{2}\s?9\d{8}/g,
            /\d{2}\s?\d{8}/g,
            /\(?\d{2}\)?\s?9\d{8}/g,
            /\b\d{10,11}\b/g,
            /\d{2}-\d{4,5}-\d{4}/g
        ];
        for (const pattern of patterns) {
            const matches = text.match(pattern);
            if (matches && matches.length > 0) return matches[0];
        }
        return null;
    };

    const findDeepInfoViaSerper = async (businessName, businessCity) => {
        if (!serperApiKey) return { instagram: null, facebook: null, phone: null, website: null, totalRatings: 0, rating: 0 };
        try {
            console.log(`[Serper] Investigação Profunda (Radar Style): ${businessName} em ${businessCity}`);
            const info = { instagram: null, facebook: null, phone: null, website: null, totalRatings: 0, rating: 0 };

            // 1. Busca via Places (Mais preciso para dados comerciais)
            const placesRes = await fetch("https://google.serper.dev/places", {
                method: 'POST',
                headers: { "X-API-KEY": serperApiKey, "Content-Type": "application/json" },
                body: JSON.stringify({ q: `${businessName} ${businessCity}`, gl: "br", hl: "pt-br" })
            });
            const placesJson = await placesRes.json();

            if (placesJson?.places && placesJson.places.length > 0) {
                const place = placesJson.places[0];
                if (place.phoneNumber) info.phone = place.phoneNumber;
                if (place.website) info.website = place.website;
                if (place.rating) info.rating = place.rating;
                if (place.ratingCount) info.totalRatings = place.ratingCount;
                console.log(`[Serper] Dados de Places capturados para ${businessName}`);
            }

            // 2. Busca Geral para Redes Sociais e Fallback
            const generalRes = await fetch("https://google.serper.dev/search", {
                method: 'POST',
                headers: { "X-API-KEY": serperApiKey, "Content-Type": "application/json" },
                body: JSON.stringify({ q: `${businessName} ${businessCity} telefone site instagram`, gl: "br", hl: "pt-br" })
            });
            const generalJson = await generalRes.json();

            if (generalJson) {
                // Knowledge Graph Fallback
                if (generalJson.knowledgeGraph) {
                    const kg = generalJson.knowledgeGraph;
                    if (!info.website && kg.website) info.website = kg.website;
                    if (!info.phone && kg.phone) info.phone = kg.phone;
                    if (!info.phone) {
                        const kgPhone = extractPhone(JSON.stringify(kg));
                        if (kgPhone) info.phone = kgPhone;
                    }
                }

                // Organic Results (Socials focus)
                if (generalJson.organic) {
                    for (const result of generalJson.organic) {
                        const link = (result.link || '').toLowerCase();
                        const snippet = result.snippet || '';

                        if (!info.instagram && link.includes('instagram.com/')) info.instagram = result.link;
                        if (!info.facebook && link.includes('facebook.com/')) info.facebook = result.link;

                        if (!info.phone) {
                            const foundPhone = extractPhone(snippet) || extractPhone(result.title || '');
                            if (foundPhone) info.phone = foundPhone;
                        }

                        if (!info.website && !link.includes('instagram') && !link.includes('facebook') && !link.includes('linkedin')) {
                            const aggregators = ['tripadvisor', 'reclameaqui', 'guiamais', 'solutudo', 'mapa.com', 'listamais', 'yelp'];
                            if (!aggregators.some(a => link.includes(a))) {
                                info.website = result.link;
                            }
                        }
                    }
                }
            }

            // 3. Busca Direcionada de Redes Sociais (se faltar)
            if (!info.instagram || !info.facebook) {
                const socialRes = await fetch("https://google.serper.dev/search", {
                    method: 'POST',
                    headers: { "X-API-KEY": serperApiKey, "Content-Type": "application/json" },
                    body: JSON.stringify({ q: `"${businessName}" ${businessCity} instagram facebook`, gl: "br", hl: "pt-br" })
                });
                const socialJson = await socialRes.json();
                if (socialJson?.organic) {
                    for (const result of socialJson.organic) {
                        const link = (result.link || '').toLowerCase();
                        if (!info.instagram && link.includes('instagram.com/')) info.instagram = result.link;
                        if (!info.facebook && link.includes('facebook.com/')) info.facebook = result.link;
                    }
                }
            }

            return info;
        } catch (error) {
            console.error("Erro no Extrator Serper (Radar Style):", error.message);
            return { instagram: null, facebook: null, phone: null, website: null, totalRatings: 0, rating: 0 };
        }
    };

    for (const place of allResults) {
        try {
            // Nova Lógica Hacker de Extração Orgânica! Custo Mensal: Quase zero.
            const deepInfo = await findDeepInfoViaSerper(place.name, city);

            // Funde os dados do Autocomplete Places (Gratuito) com os Detalhes do Serper (Gratuito/Barato)
            const phoneFinal = deepInfo.phone;
            const websiteFinal = deepInfo.website;
            const ratingFinal = deepInfo.rating || place.rating;
            const totalRatingsFinal = deepInfo.totalRatings || 0;
            const instaFinal = deepInfo.instagram;
            const faceFinal = deepInfo.facebook;

            enriched.push({
                name: place.name,
                address: place.formatted_address,
                city: city,
                niche: nicheNormalized,
                rating: ratingFinal,
                totalRatings: totalRatingsFinal,
                phone: phoneFinal,
                website: websiteFinal,
                instagram: instaFinal,
                facebook: faceFinal,
                place_id: place.place_id,
                status: 'new',
                meta_data: {
                    source: 'auto_scan_serper_bypassed',
                    captured_at: new Date().toISOString(),
                    google_place_id: place.place_id,
                    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`,
                    instagram: instaFinal,
                    facebook: faceFinal
                }
            });

        } catch (e) {
            console.error(`Erro ao enriquecer ${place.name}:`, e.message);
        }
    }

    return enriched;
}



function isInsideWindow(startStr, endStr) {
    if (!startStr || !endStr) return true;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;
    if (startTime <= endTime) return currentTime >= startTime && currentTime <= endTime;
    return currentTime >= startTime || currentTime <= endTime;
}

async function runBot() {
    const botOwnerId = process.env.BOT_OWNER_ID;
    if (!botOwnerId) {
        console.error('⛔ ERRO CRÍTICO: BOT_OWNER_ID não configurado no .env! O robô não iniciará sem blindagem.');
        process.exit(1);
    }
    console.log(`🔒 Blindagem Ativa: Operando exclusivamente para user_id = ${botOwnerId}`);

    await logToSupabase('🚀 Robô de WhatsApp Online (Aguardando Comando)...');

    // ❤️ HEARTBEAT: Atualiza last_ping a cada 10s para que o frontend detecte offline rapidamente
    const heartbeatInterval = setInterval(async () => {
        try {
            const { data: hbLeads } = await supabase.from('leads').select('id,meta_data').eq('name', 'ROBOT_STATUS').eq('user_id', botOwnerId).limit(1);
            const hbLead = hbLeads?.[0];
            if (hbLead) {
                await supabase.from('leads').update({
                    meta_data: { ...hbLead.meta_data, last_ping: new Date().toISOString(), status: 'online' }
                }).eq('id', hbLead.id);
            }
        } catch (e) { /* silencioso */ }
    }, 10000);

    // Garantir que o heartbeat para quando o processo encerra
    process.on('exit', () => clearInterval(heartbeatInterval));

    try {
        const { data: startupStatuses } = await supabase.from('leads').select('*').eq('name', 'ROBOT_STATUS').eq('user_id', botOwnerId).order('created_at', { ascending: false }).limit(1);
        const startupStatus = startupStatuses?.[0];
        if (startupStatus) {
            const metaToReset = { ...startupStatus.meta_data, connected: false };
            delete metaToReset.requestShutdown;
            delete metaToReset.paused;

            await supabase.from('leads').update({
                meta_data: metaToReset
            }).eq('id', startupStatus.id);
            await logToSupabase('🧹 Estado do robô limpo no startup (Ignorando flags residuais).');
        }
    } catch (e) {
        console.error('Erro ao resetar estado de conexão no startup:', e.message);
    }

    let lastScanTime = 0; // Initialize to 0 to allow immediate scan on startup
    let lastLogTime = 0; // Separate timer for status logs

    const startupTime = new Date();
    await logToSupabase(`🕒 Hora do Servidor (Node): ${startupTime.toLocaleTimeString('pt-BR')} | Fuso: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    await logToSupabase(`📅 Data do Servidor: ${startupTime.toLocaleDateString('pt-BR')}`);

    // 🔥 INSTANT KILL SWITCH: WebSocket de Encerramento Rápido via Supabase Realtime
    supabase.channel('robot-instant-kill')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads', filter: `name=eq.ROBOT_STATUS` }, async (payload) => {
            if (payload.new && payload.new.user_id === botOwnerId) {
                const configRealtime = payload.new.meta_data || {};
                if (configRealtime.requestShutdown) {
                    console.log('\n🛑 [REALTIME] Comando de ENCERRAMENTO recebido pelo WebApp! Interrompendo tudo Imediatamente...\n');
                    await logToSupabase('🛑 Recebido comando de ENCERRAR (Modo Instantâneo). Desligando robô abruptamente...');

                    // Cleanup e Exit instantâneo
                    const metaForExit = { ...configRealtime };
                    delete metaForExit.requestShutdown;
                    await supabase.from('leads').update({ meta_data: metaForExit }).eq('id', payload.new.id);

                    if (browser) await browser.close();
                    process.exit(0);
                }
            }
        })
        .subscribe();

    while (true) {
        try {
            const { data: statusLeads } = await supabase.from('leads').select('*').eq('name', 'ROBOT_STATUS').eq('user_id', botOwnerId).order('created_at', { ascending: false }).limit(1);
            const statusLead = statusLeads?.[0];
            const config = statusLead?.meta_data || {};
            const scheduler = config.scheduler || { captureStart: '22:00', captureEnd: '06:00', sendStart: '09:00', sendEnd: '18:00' };
            const selectedNiches = config.selectedNiches || [];
            const now = Date.now();

            // --- REMOTE CONTROL: STOP ---
            if (config.requestShutdown) {
                await logToSupabase('🛑 Recebido comando de ENCERRAR. Desligando robô...');
                // Reset flag before exiting
                const metaForExit = { ...config };
                delete metaForExit.requestShutdown;
                await supabase.from('leads').update({ meta_data: metaForExit }).eq('id', statusLead.id);

                if (browser) await browser.close();
                process.exit(0);
            }

            // --- REMOTE CONTROL: PAUSE ---
            if (config.paused) {
                if (now - lastLogTime > 1800000) {
                    await logToSupabase('⏸️ Robô em PAUSA (Aguardando Retomada via Interface).');
                    lastLogTime = now;
                }
                await logToSupabase('💓 Monitorando (PAUSADO)...', 'ping');
                await new Promise(r => setTimeout(r, 5000)); // Mais rápido para ler os comandos
                continue;
            }

            await logToSupabase('💓 Monitorando...', 'ping');

            const isWithinWindowGeneral = isInsideWindow(scheduler.captureStart, scheduler.captureEnd);
            const isAutomatedScanDue = scheduler.active && scheduler.autoAnalyze && isWithinWindowGeneral && (now - lastScanTime > (24 * 60 * 60 * 1000) / scheduler.scansPerDay);
            const pendingActions = scheduler.forceCapture || scheduler.forceSend || isAutomatedScanDue;

            // O navegador abre via botão "Conectar" OU se o usuário permitiu abertura automática de fundo para varreduras
            const autoOpenAllowed = scheduler.autoOpenBrowser === true && pendingActions;
            const needsBrowser = config.connected === true || autoOpenAllowed;

            if (needsBrowser && !browser) {
                await logToSupabase('🌐 Abrindo Navegador e acessando WhatsApp...');
                browser = await puppeteer.launch({
                    headless: false,
                    userDataDir: './wa_session',
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
                });
                page = await browser.newPage();
                await page.goto('https://web.whatsapp.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
                await logToSupabase('✅ Navegador pronto. Aguardando conexão...');
            }

            // Só fechamos se explícito no frontend E o navegador existir
            else if (!needsBrowser && browser) {
                await logToSupabase('💤 Desconectando: Fechando navegador a pedido do usuário.');
                await browser.close();
                browser = null;
                page = null;
            }

            // --- 0. VARREDURA (SCAN) ---
            const citiesToScan = scheduler.city?.split(',').map(c => c.trim()).filter(c => c) || [];
            if (scheduler.scansPerDay > 0 && citiesToScan.length > 0 && selectedNiches.length > 0) {
                const intervalMs = (24 * 60 * 60 * 1000) / scheduler.scansPerDay;

                // Master Switch Logic: Only run if active OR forced manually
                const isWithinWindow = isInsideWindow(scheduler.captureStart, scheduler.captureEnd);
                const isAutomatedScanDue = scheduler.active && scheduler.autoAnalyze && isWithinWindow && (now - lastScanTime > intervalMs);
                const shouldScan = scheduler.forceCapture || isAutomatedScanDue;

                if (scheduler.forceCapture) {
                    await logToSupabase(`⚡ Gatilho Manual Detectado! Iniciando mineração imediata...`);
                    // Reseta o gatilho no Supabase para não repetir eternamente
                    const newMeta = { ...config, scheduler: { ...scheduler, forceCapture: false } };
                    await supabase.from('leads').update({ meta_data: newMeta }).eq('name', 'ROBOT_STATUS');
                }

                if (!shouldScan) {
                    // Log only every 30 mins to avoid spam
                    if (now - lastLogTime > 1800000) {
                        if (!scheduler.active) {
                            await logToSupabase(`⏸️ Modo Autônomo Desativado. Aguardando comando manual.`);
                        } else if (!isWithinWindow) {
                            await logToSupabase(`💤 Janela de Mineração Fechada (${scheduler.captureStart}-${scheduler.captureEnd}).`);
                        } else if (now - lastScanTime <= intervalMs) {
                            const remainingMins = Math.round((intervalMs - (now - lastScanTime)) / 60000);

                        }
                        lastLogTime = now;
                    }
                } else {
                    const nichesToScan = selectedNiches;

                    await logToSupabase(`🔍 Iniciando Varredura Multi-Alvo para ${citiesToScan.length} cidades e ${nichesToScan.length} nichos...`);

                    for (const city of citiesToScan) {
                        await logToSupabase(`📍 Varrendo Cidade: ${city}...`);
                        for (const niche of nichesToScan) {
                            // RE-CHECK PAUSE INSIDE NESTED LOOP
                            const { data: currentStatus } = await supabase.from('leads').select('meta_data').eq('name', 'ROBOT_STATUS').eq('user_id', botOwnerId).maybeSingle();
                            if (currentStatus?.meta_data?.paused) {
                                await logToSupabase('⏸️ Pausando varredura de nichos (comando recebido)...');
                                break;
                            }

                            await logToSupabase(`🔎 Minerando nicho: ${niche} em ${city}...`);
                            const newLeads = await searchLeads(niche, city);

                            if (newLeads.length > 0) {
                                await logToSupabase(`👀 Encontrei ${newLeads.length} leads em potencial.`);
                            }

                            let importedCount = 0;
                            for (const lead of newLeads) {
                                // FILTRO FINAL PRE-SAVE: Igual ao Radar — bloqueia rastreadoras antes de salvar
                                const leadNameLower = (lead.name || '').toLowerCase();
                                const saveBlockTerms = [
                                    'rastreamento', 'rastreador', 'veicular', 'frotas',
                                    'telemetria', 'telemática', 'telematica',
                                    'setera', 'utratech', 'tektra', 'solusat', 'totem sat',
                                    'gestão de frotas', 'monitoramento de veículos'
                                ];
                                const shouldBlock = saveBlockTerms.some(t => leadNameLower.includes(t.toLowerCase()));
                                if (shouldBlock) {
                                    await logToSupabase(`� Ignorado (nicho errado): ${lead.name}`);
                                    continue;
                                }

                                // 1. CHECK PLACE ID (Most reliable)
                                if (lead.place_id) {
                                    const { data: idExists } = await supabase.from('leads')
                                        .select('id')
                                        .eq('user_id', botOwnerId)
                                        .filter('meta_data->google_place_id', 'eq', lead.place_id)
                                        .limit(1);
                                    if (idExists && idExists.length > 0) continue;
                                }

                                // 2. CHECK PHONE (Secondary)
                                const phoneClean = lead.phone?.replace(/\D/g, '');
                                if (phoneClean && phoneClean.length > 8) {
                                    const { data: phoneExists } = await supabase.from('leads')
                                        .select('id')
                                        .eq('phone', lead.phone)
                                        .eq('user_id', botOwnerId)
                                        .limit(1);
                                    if (phoneExists && phoneExists.length > 0) continue;
                                }

                                // 3. FALLBACK: NAME + CITY
                                const { data: nameExists } = await supabase.from('leads')
                                    .select('id')
                                    .eq('name', lead.name)
                                    .eq('city', lead.city)
                                    .eq('user_id', botOwnerId)
                                    .limit(1);
                                if (nameExists && nameExists.length > 0) continue;

                                // BARREIRA FINAL — antes de qualquer insert no banco
                                const _nm = (lead.name || '').toLowerCase();
                                const _bad = ['rastreamento', 'rastreador', 'veicular', 'frotas', 'telemetria', 'telemática', 'telematica', 'solusat', 'totem sat', 'setera', 'utratech', 'gestão de frotas'];
                                if (_bad.some(t => _nm.includes(t))) {
                                    await logToSupabase(`🚫 Bloqueado (nicho errado): ${lead.name}`);
                                    continue;
                                }

                                // Calcular Score Inicial
                                const initialScore = scoreLead({ ...lead, total_ratings: lead.totalRatings });

                                // Let Supabase generate a proper UUID for the 'id' field
                                const { data: savedLead, error: insertError } = await supabase.from('leads').insert([{
                                    name: lead.name,
                                    niche: lead.niche,
                                    city: lead.city,
                                    address: lead.address,
                                    rating: lead.rating,
                                    total_ratings: lead.totalRatings,
                                    presence_score: lead.presenceScore,
                                    phone: lead.phone,
                                    website: lead.website,
                                    user_id: botOwnerId,
                                    status: 'new',
                                    automation_status: schedulerConfig.autoSend ? 'queued' : 'idle',
                                    last_scan_at: new Date().toISOString(),
                                    meta_data: {
                                        ...lead.meta_data,
                                        google_place_id: lead.place_id,
                                        totalRatings: lead.totalRatings,
                                        lead_score: initialScore.score,
                                        temperature: initialScore.temperature,
                                        has_website: !!lead.website
                                    }
                                }]).select().single();

                                if (insertError) {
                                    console.error(`❌ Erro ao inserir lead ${lead.name}:`, insertError.message);
                                    continue;
                                }

                                await logToSupabase(`💾 Lead Salvo: ${lead.name}`);
                                importedCount++;

                                // DEEP AUDIT: If lead has website, audit it!
                                if (lead.website) {
                                    await logToSupabase(`🌐 Iniciando Auditoria Profunda no site de: ${lead.name}...`);
                                    const auditResult = await auditWebsite(lead.website, lead.name);

                                    if (!auditResult.error) {
                                        await logToSupabase(`✨ Site Analisado! Gerando pontos fracos com IA...`);
                                        const aiAudit = await generateAIContent(lead, 'site_audit', auditResult);

                                        // Recalcular Score com dados da Auditoria
                                        const deepAuditScore = scoreLead(lead, auditResult);

                                        // GERAÇÃO DE "OFERTA FATAL" PARA LEADS QUENTES
                                        let offerReason = null;
                                        if (deepAuditScore.temperature === 'Quente') {
                                            await logToSupabase(`🔥 Lead QUENTE detectado (${lead.name}). Gerando motivo da oferta...`);
                                            offerReason = await generateAIContent(lead, 'offer_reason', auditResult);
                                        }

                                        // Se o lead não tinha telefone, mas encontramos um no site ou no link de whatsapp
                                        let updatedPhone = lead.phone;
                                        if (!updatedPhone && auditResult.sitePhones && auditResult.sitePhones.length > 0) {
                                            updatedPhone = auditResult.sitePhones[0];
                                            await logToSupabase(`📞 Telefone extraído do site para: ${lead.name} -> ${updatedPhone}`);
                                        }

                                        await supabase.from('leads').update({
                                            phone: updatedPhone,
                                            motivo_oferta: offerReason,
                                            meta_data: {
                                                ...lead.meta_data,
                                                google_place_id: lead.place_id,
                                                totalRatings: lead.totalRatings,
                                                last_site_analysis: aiAudit || 'Análise visual pendente.',
                                                technical_audit: auditResult,
                                                lead_score: deepAuditScore.score,
                                                temperature: deepAuditScore.temperature,
                                                has_website: true,
                                                insta_active: !!auditResult.socialLinks?.instagram,
                                                socialLinks: auditResult.socialLinks,
                                                motivoPrincipalDaOferta: offerReason,
                                                site_phones: auditResult.sitePhones
                                            }
                                        }).eq('id', savedLead.id);
                                    } else {
                                        await logToSupabase(`⚠️ Não consegui acessar o site formalmente: ${auditResult.error}`);
                                    }
                                }

                                if (scheduler.autoAnalyze && savedLead) {
                                    const marketing = await generateAIContent(savedLead, 'script');
                                    if (marketing) {
                                        await logToSupabase(`🧠 IA Gerou Script para: ${lead.name}`);
                                        const { data: currentLead } = await supabase.from('leads').select('meta_data').eq('id', savedLead.id).single();
                                        await supabase.from('leads').update({
                                            automation_status: scheduler.autoSend ? 'queued' : 'ready_for_dispatch',
                                            meta_data: {
                                                ...(currentLead?.meta_data || {}),
                                                last_generated_script: marketing,
                                                automation_status: scheduler.autoSend ? 'queued' : 'ready_for_dispatch',
                                                scheduled_at: scheduler.autoSend ? new Date(Date.now() + 2000).toISOString() : null
                                            }
                                        }).eq('id', savedLead.id);
                                    }
                                }
                                // Small delay to simulate "work" and prevent flood
                                await new Promise(r => setTimeout(r, 500));
                            }
                            if (importedCount > 0) {
                                await logToSupabase(`✅ Nicho ${niche}: ${importedCount} novos leads na base.`);
                            }
                        } // Niche Loop Close
                        await new Promise(r => setTimeout(r, 5000)); // Cool down between cities
                    } // City Loop Close
                    lastScanTime = now;
                }
            }

            // --- MASTER: PROCESSAMENTO DE TESTES MANUAIS ---
            // Verifica se há leads de teste aguardando script real (Test Lab)
            let manualQuery = supabase.from('leads')
                .select('*')
                .eq('meta_data->>source', 'manual_test')
                .eq('meta_data->>last_generated_script', 'Script de Teste Aguardando Geração...')
                .eq('user_id', botOwnerId);

            const { data: manualTestLeads } = await manualQuery.limit(1);

            if (manualTestLeads && manualTestLeads.length > 0) {
                const testLead = manualTestLeads[0];
                await logToSupabase(`🧪 Processando Lead de Teste: ${testLead.name}...`);

                // Gera o script REAL usando a IA (com a lógica de nicho atualizada)
                const realScript = await generateAIContent(testLead, 'script');

                if (realScript) {
                    await supabase.from('leads').update({
                        meta_data: {
                            ...testLead.meta_data,
                            last_generated_script: realScript,
                            automation_status: 'queued', // Confirma na fila
                            scheduled_at: new Date().toISOString() // Pronto para envio
                        }
                    }).eq('id', testLead.id);
                    await logToSupabase(`🧠 Script de Teste Gerado com Sucesso!`);
                } else {
                    await logToSupabase(`❌ Falha ao gerar script de teste.`);
                }
            }

            // --- 1. FEEDBACK LOOP (SCAN RESPONSES) ---
            // Only scan if browser is active and we have leads to check
            if (page && browser) {
                const { data: contactedLeads } = await supabase.from('leads')
                    .select('*')
                    .eq('user_id', botOwnerId)
                    .eq('status', 'contacted')
                    .eq('meta_data->>automation_status', 'waiting_next_step')
                    .limit(5); // Check 5 at a time to not bloat the loop

                if (contactedLeads && contactedLeads.length > 0) {
                    await logToSupabase(`👂 Escaneando respostas para ${contactedLeads.length} leads...`);
                    for (const lead of contactedLeads) {
                        const phone = lead.phone?.replace(/\D/g, '');
                        if (!phone) continue;

                        try {
                            await page.goto(`https://web.whatsapp.com/send?phone=${phone}`, { waitUntil: 'networkidle2', timeout: 30000 });
                            await new Promise(r => setTimeout(r, 5000)); // Wait for messages to load

                            const hasReply = await page.evaluate(() => {
                                // Find all message containers
                                const messages = document.querySelectorAll('.message-in');
                                if (messages.length === 0) return false;

                                // Get the last message to see if it's incoming
                                const allMessages = document.querySelectorAll('[class*="message-"]');
                                const lastMessage = allMessages[allMessages.length - 1];
                                return lastMessage && lastMessage.classList.contains('message-in');
                            });

                            if (hasReply) {
                                await logToSupabase(`🎉 Resposta detectada de: ${lead.name}! Pausando automação.`);

                                const interactionLog = {
                                    date: new Date().toISOString(),
                                    stage: 'REPLY_DETECTED',
                                    message: 'O cliente respondeu no WhatsApp.',
                                    result: 'interested'
                                };

                                await supabase.from('leads').update({
                                    status: 'interested',
                                    conversion_result: 'reuniao',
                                    automation_status: 'stopped_by_user',
                                    meta_data: {
                                        ...lead.meta_data,
                                        automation_status: 'stopped_by_user',
                                        reply_detected: true,
                                        lastInteractionDate: new Date().toISOString(),
                                        automation_logs: [...(lead.meta_data.automation_logs || []), interactionLog]
                                    }
                                }).eq('id', lead.id);
                            }
                        } catch (err) {
                            console.error(`Erro ao escanear resposta de ${lead.name}:`, err.message);
                        }
                    }
                }
            }

            // --- 2. DISPARO (SEND) ---
            const shouldSend = config.connected && (scheduler.autoSend || scheduler.forceSend) && (isInsideWindow(scheduler.sendStart, scheduler.sendEnd) || scheduler.forceSend) && typeof browser !== 'undefined';

            if (shouldSend) {
                if (scheduler.forceSend) {
                    await logToSupabase(`⚡ Gatilho Manual de Abordagem! Iniciando disparos imediatos...`);
                    const newMeta = { ...config, scheduler: { ...scheduler, forceSend: false } };
                    await supabase.from('leads').update({ meta_data: newMeta }).eq('name', 'ROBOT_STATUS');
                }

                // Cascata: Transforma 'ready_for_dispatch' em 'queued' (Somente se autoSend estiver ligado ou forçado)
                if (scheduler.autoSend || scheduler.forceSend) {
                    const { data: readyLeads } = await supabase.from('leads')
                        .select('id, meta_data')
                        .or(`automation_status.eq.ready_for_dispatch,meta_data->>automation_status.eq.ready_for_dispatch`)
                        .eq('user_id', botOwnerId)
                        .order('created_at', { ascending: true })
                        .limit(10);

                    if (readyLeads && readyLeads.length > 0) {
                        for (const rl of readyLeads) {
                            await supabase.from('leads').update({
                                automation_status: 'queued',
                                meta_data: { ...rl.meta_data, automation_status: 'queued', scheduled_at: new Date().toISOString() }
                            }).eq('id', rl.id);
                        }
                    }

                    // --- CADENCE MACHINE ---
                    const { data: followups } = await supabase.from('leads')
                        .select('*')
                        .eq('user_id', botOwnerId)
                        .eq('status', 'contacted')
                        .or(`automation_status.eq.idle,automation_status.is.null`)
                        .lte('meta_data->>scheduled_at', new Date().toISOString());

                    if (followups && followups.length > 0) {
                        for (const f of followups) {
                            await supabase.from('leads').update({
                                automation_status: 'queued',
                                meta_data: { ...f.meta_data, automation_status: 'queued' }
                            }).eq('id', f.id);
                        }
                    }

                    const { data: leads } = await supabase.from('leads')
                        .select('*')
                        .or(`automation_status.eq.queued,meta_data->>automation_status.eq.queued`)
                        .eq('user_id', botOwnerId)
                        .lte('meta_data->>scheduled_at', new Date().toISOString());

                    if (leads && leads.length > 0 && page) {
                        for (const lead of leads) {
                            if (statusLead?.meta_data?.paused) {
                                await logToSupabase('⏸️ Pausando envios (comando recebido)...');
                                break;
                            }

                            if (['interested', 'closed', 'refused'].includes(lead.status)) {
                                await logToSupabase(`⏹️ Pulando ${lead.name} - Status atual: ${lead.status}`);
                                await supabase.from('leads').update({
                                    automation_status: 'stopped_by_user',
                                    meta_data: { ...lead.meta_data, automation_status: 'stopped_by_user' }
                                }).eq('id', lead.id);
                                continue;
                            }

                            const phone = lead.phone?.replace(/\D/g, '');
                            const cadenceStage = lead.cadence_stage || lead.meta_data.cadenceStage || 'D0';
                            let message = lead.meta_data.last_generated_script;

                            if (cadenceStage !== 'D0') {
                                await logToSupabase(`🧠 Gerando nova mensagem IA para estágio: ${cadenceStage}...`);
                                const freshMessage = await generateAIContent(lead, 'script', lead.meta_data.technical_audit, cadenceStage);
                                if (freshMessage) message = freshMessage;
                            }

                            const logs = lead.meta_data?.automation_logs || [];
                            const alreadySent = logs.find(l => l.stage === cadenceStage && l.result === 'sent');

                            if (alreadySent) {
                                await logToSupabase(`⏩ Pulo de Segurança: Estágio ${cadenceStage} já enviado para ${lead.name}.`);
                                const nextStage = cadenceStage === 'D0' ? 'D2' : cadenceStage === 'D2' ? 'D5' : cadenceStage === 'D5' ? 'D9' : 'FINISH';
                                await supabase.from('leads').update({
                                    cadence_stage: nextStage,
                                    automation_status: nextStage === 'FINISH' ? 'completed' : 'idle'
                                }).eq('id', lead.id);
                                continue;
                            }

                            if (phone && message) {
                                await logToSupabase(`📧 [Cadence ${cadenceStage}] Preparando envio para: ${lead.name}`);
                                await supabase.from('leads').update({ automation_status: 'sending' }).eq('id', lead.id);

                                try {
                                    await page.goto(`https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, { waitUntil: 'networkidle2' });
                                    await new Promise(r => setTimeout(r, 6000));

                                    // --- VALIDAÇÃO DE TELEFONE (FIXO/INVÁLIDO) ---
                                    const invalidPhoneDetected = await page.evaluate(() => {
                                        const modal = document.querySelector('[data-animate-modal-popup="true"]') ||
                                            document.querySelector('[data-testid="popup-contents"]');
                                        if (modal) {
                                            const txt = modal.innerText.toLowerCase();
                                            // Checa as mensagens padrões do WhatsApp Web para número inválido
                                            if (txt.includes('inválid') || txt.includes('invalid') || txt.includes('não existe')) {
                                                const okBtn = modal.querySelector('button');
                                                if (okBtn) okBtn.click(); // Clica em OK para sumir o modal
                                                return true;
                                            }
                                        }
                                        return false;
                                    });

                                    if (invalidPhoneDetected) {
                                        await supabase.from('leads').update({
                                            status: 'refused',
                                            automation_status: 'stopped_by_user',
                                            meta_data: {
                                                ...lead.meta_data,
                                                automation_status: 'stopped_by_user',
                                                refusal_reason: 'telefone_invalido',
                                                automation_logs: [...(lead.meta_data.automation_logs || []), {
                                                    date: new Date().toISOString(),
                                                    stage: cadenceStage,
                                                    message: '❌ Telefone inválido (Fixo/Sem WhatsApp). Automação interrompida.',
                                                    result: 'failed'
                                                }]
                                            }
                                        }).eq('id', lead.id);

                                        throw new Error('NÚMERO INVÁLIDO (Telefone Fixo ou Sem WhatsApp)');
                                    }
                                    // --- FIM VALIDAÇÃO ---

                                    const sendSelectors = ['span[data-icon="send"]', 'button[aria-label="Enviar"]', 'button[aria-label="Send"]', '[data-testid="send"]'];
                                    let sent = false;
                                    for (const selector of sendSelectors) {
                                        try {
                                            const btn = await page.waitForSelector(selector, { timeout: 3000 });
                                            if (btn) {
                                                await btn.click();
                                                sent = true;
                                                break;
                                            }
                                        } catch (e) { }
                                    }

                                    if (!sent) {
                                        await page.keyboard.press('Enter');
                                        sent = true;
                                    }

                                    const nextStage = cadenceStage === 'D0' ? 'D2' : cadenceStage === 'D2' ? 'D5' : cadenceStage === 'D5' ? 'D9' : 'FINISH';
                                    const delayDays = cadenceStage === 'D0' ? 2 : cadenceStage === 'D2' ? 3 : cadenceStage === 'D5' ? 4 : 0;
                                    const nextDate = new Date();
                                    nextDate.setDate(nextDate.getDate() + delayDays);

                                    const interactionLog = {
                                        date: new Date().toISOString(),
                                        stage: cadenceStage,
                                        message: message.substring(0, 60) + '...',
                                        result: 'sent'
                                    };

                                    await supabase.from('leads').update({
                                        status: 'contacted',
                                        cadence_stage: nextStage,
                                        automation_status: nextStage === 'FINISH' ? 'completed' : 'idle',
                                        meta_data: {
                                            ...lead.meta_data,
                                            automation_status: nextStage === 'FINISH' ? 'completed' : 'idle',
                                            cadenceStage: nextStage,
                                            lastInteractionDate: new Date().toISOString(),
                                            scheduled_at: nextStage === 'FINISH' ? null : nextDate.toISOString(),
                                            automation_logs: [...(lead.meta_data.automation_logs || []), interactionLog]
                                        }
                                    }).eq('id', lead.id);

                                    await logToSupabase(`✅ [${cadenceStage}] Sucesso: ${lead.name}. Próximo: ${nextStage === 'FINISH' ? 'Funil Finalizado' : nextDate.toLocaleDateString()}`);
                                } catch (e) {
                                    await logToSupabase(`❌ [${cadenceStage}] Falha: ${lead.name} - ${e.message}`);
                                }
                                await new Promise(r => setTimeout(r, 3000));
                            }
                        }
                    } else if (leads && leads.length > 0 && !page) {
                        await logToSupabase('⚠️ Há leads para enviar, mas o navegador não está conectado.');
                    }
                }
            }
        } catch (err) {
            await logToSupabase(`❌ Erro no loop: ${err.message}`);
        }
        await new Promise(r => setTimeout(r, 3000));
    }
}

runBot().catch(e => console.error(e));

// Graceful Shutdown
async function shutdown() {
    console.log('\n🛑 Desconectando Robô...');
    try {
        const botOwnerId = process.env.BOT_OWNER_ID;
        const { data: statusLeads } = await supabase.from('leads').select('*').eq('name', 'ROBOT_STATUS').eq('user_id', botOwnerId).order('created_at', { ascending: false }).limit(1);
        const statusLead = statusLeads?.[0];
        if (statusLead) {
            await supabase.from('leads').update({
                meta_data: {
                    ...statusLead.meta_data,
                    status: 'offline',
                    last_ping: new Date().toISOString()
                }
            }).eq('id', statusLead.id);
        }
    } catch (e) {
        console.error('Erro ao desconectar:', e.message);
    }
    if (browser) await browser.close();
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
