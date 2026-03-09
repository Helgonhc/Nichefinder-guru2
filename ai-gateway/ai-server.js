import "dotenv/config";
import express from "express";
import cors from "cors";

/**
 * 🤖 AI GATEWAY SERVER - PIRAMYD ELITE EDITION
 * Provedor Único: Piramyd (api.piramyd.cloud)
 * Porta: 3002
 */

const app = express();
const PORT = process.env.AI_GATEWAY_PORT || 3002;

const PIRAMYD_API_KEY = process.env.PIRAMYD_API_KEY;

if (!PIRAMYD_API_KEY) {
    throw new Error("PIRAMYD_API_KEY não configurada.");
}

const PIRAMYD_MODELS = [
    "Llama-4-maverick",
    "gpt-5.3-codex",
    "claude-sonnet-4.5",
    "gpt-5.3",
    "Kimi-k2-thinking",
    "Glm-5",
    "Gpt-oss-120b",
    "Minimax-m2.1",
    "Glm-4.7",
    "Phi-4-mini-flash-reasoning",
    "Sonar-Pro",
    "Nemotron-3-nano",
];

const MAX_RETRIES = 2;

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function extractJsonFromContent(text = "") {
    if (!text) return "";
    let cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1');
    return cleaned.trim();
}

async function callPiramyd(model, apiKey, systemMessage, userPrompt, maxTokens = 6000) {
    const messages = [];
    if (systemMessage) messages.push({ role: "system", content: systemMessage });
    messages.push({ role: "user", content: userPrompt });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout total

    try {
        console.log(`[AI GATEWAY] Chamando Piramyd (${model}) - MaxTokens: ${maxTokens}...`);
        const res = await fetch("https://api.piramyd.cloud/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            signal: controller.signal,
            body: JSON.stringify({
                model,
                messages,
                temperature: 0.35,
                top_p: 0.9,
                presence_penalty: 0.2,
                frequency_penalty: 0.2,
                max_tokens: maxTokens
            }),
        });

        clearTimeout(timeout);

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error?.message || "Erro na API da Piramyd");
        }

        return await res.json();
    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') throw new Error("TIMEOUT: Piramyd demorou demais para responder.");
        throw err;
    }
}

app.use(cors({ origin: "*", methods: ["POST", "OPTIONS"], allowedHeaders: ["Content-Type"] }));
app.use(express.json({ limit: "20mb" }));

// ── Rota Blueprints (JSON) ──────────────────────────────────────────────────
app.post("/generate-preview", async (req, res) => {
    const { systemMessage, userPrompt, model: requestedModel, maxTokens } = req.body;
    if (!userPrompt) return res.status(400).json({ error: "userPrompt é obrigatório." });

    console.log({
        event: "generate_preview",
        timestamp: new Date().toISOString()
    });

    const modelsToTry = [...PIRAMYD_MODELS];
    if (requestedModel && requestedModel !== "Llama-4-maverick") {
        const index = modelsToTry.indexOf(requestedModel);
        if (index > -1) modelsToTry.splice(index, 1);
        modelsToTry.unshift(requestedModel);
    }

    for (const model of modelsToTry) {
        console.log(`[AI GATEWAY] Tentando Piramyd: ${model}`);
        let attempts = 0;
        while (attempts < MAX_RETRIES) {
            attempts++;
            try {
                const data = await callPiramyd(model, PIRAMYD_API_KEY, systemMessage, userPrompt, maxTokens);
                const raw = data.choices?.[0]?.message?.content;
                if (raw && raw.trim().length > 10) {
                    let content = extractJsonFromContent(raw);
                    if (content.length > 200000) {
                        content = content.slice(0, 200000);
                    }
                    console.log({
                        event: "generate_preview_success",
                        model,
                        provider: "piramyd"
                    });
                    return res.json({ content, model, provider: "piramyd" });
                }
            } catch (err) {
                console.error(`[AI Gateway] Model ${model} failed:`, err.message);
                if (attempts < MAX_RETRIES) await sleep(2000);
            }
        }
    }
    res.status(503).json({ error: "Todos os modelos Piramyd falharam." });
});

// ── Rota Site Real (HTML) ──────────────────────────────────────────────────
app.post("/generate-html", async (req, res) => {
    const { leadData, model: requestedModel } = req.body;
    if (!leadData) return res.status(400).json({ error: "leadData é obrigatório." });

    const layout = leadData.layout_type || "modern-business";
    let designDirection = "";

    if (layout === "healthcare-clean") {
        designDirection = `Estilo visual: limpo, higiênico e acolhedor\nPaleta recomendada: branco puro, azuis suaves, verdes calmos\nTipografia: sans-serif humanista altamente legível\nAtmosfera: confiança, cuidado, tecnologia e saúde\nLayout: hero claro, espaços em branco abundantes, seções organizadas em blocos suaves`;
    }
    else if (layout === "authority-premium") {
        designDirection = `Estilo visual: institucional premium, luxuoso e sóbrio\nPaleta recomendada: navy (azul marinho profundo), charcoal (carvão), dourado ou cobre sutil\nTipografia: serifas elegantes em títulos combinadas com sans-serif modernas\nAtmosfera: alta autoridade, prestígio, confiança, exclusividade\nLayout: hero forte e imponente, seções simétricas luxuosas, grid de serviços estruturado`;
    }
    else if (layout === "food-visual") {
        designDirection = `Estilo visual: apetitoso, vibrante e fotográfico\nPaleta recomendada: tons quentes (vermelhos, laranjas, amarelos quentes), fundo escuro premium ou branco limpo\nTipografia: fontes display ousadas ou rústicas para títulos\nAtmosfera: desejo, sabor, energia, experiência gastronômica\nLayout: focado fortemente em imagens grandes (fotografia e texturas), seções dinâmicas de menu/produtos`;
    }
    else if (layout === "fitness-energy") {
        designDirection = `Estilo visual: alta energia, intenso e dinâmico\nPaleta recomendada: preto absoluto, cinzas escuros, cores de destaque neon (amarelo, verde, vermelho)\nTipografia: sans-serif grossas, itálicas ou geométricas de alto impacto\nAtmosfera: superação, força, movimento, agressivo (no bom sentido)\nLayout: fotografias em preto e branco com overlays, blocos em diagonal ou assimétricos, forte uso de contraste`;
    }
    else if (layout === "high-ticket") {
        designDirection = `Estilo visual: tecnológico, de alto valor agregado e grandioso\nPaleta recomendada: azuis profundos, preto, prateado, branco e detalhes em cores tecnológicas\nTipografia: sans-serif geométrica minimalista, tracking espaçado\nAtmosfera: progresso, investimento, alto valor, inteligência\nLayout: linhas precisas, gráficos ou imagens conceituais, storytelling visual focado em resultados de longo prazo`;
    }
    else if (layout === "service-local") {
        designDirection = `Estilo visual: prático, direto e confiável\nPaleta recomendada: cores trabalhadoras (azul royal, laranja industrial, amarelo, preto)\nTipografia: robusta e ultra legível, focada em leitura rápida\nAtmosfera: agilidade, trabalho duro, proximidade, resolução de problemas\nLayout: chamadas para ação (telefone/whatsapp) imediatas e em destaque, prova social forte, listagem clara de serviços`;
    }
    else {
        designDirection = `Estilo visual: moderno premium corporativo\nPaleta recomendada: dark blue (azul escuro elegante), charcoal (grafite) e branco\nTipografia: sans-serif limpa e contemporânea\nAtmosfera: profissionalismo corporativo, confiabilidade clara, eficiência\nLayout: hero impactante com bordas sutis, seções com bastante respiro (padding amplo), design elegante focado em conversão B2B/B2C direta`;
    }

    const siteStructure = `
Arquitetura obrigatória da página:

1. HERO
   * headline forte
   * subheadline clara
   * botão CTA principal
   * background visual moderno

2. SEÇÃO PROBLEMA
   * explicar o problema do cliente
   * conectar emocionalmente

3. SEÇÃO SOLUÇÃO
   * mostrar como a empresa resolve o problema

4. SEÇÃO SERVIÇOS
   * grid moderno com cards

5. SEÇÃO BENEFÍCIOS
   * diferenciais da empresa

6. PROVA SOCIAL
   * depoimentos ou indicadores de confiança

7. AUTORIDADE
   * experiência ou especialização

8. CTA FINAL
   * chamada forte para ação

9. CONTATO
   * formulário simples

10. FOOTER
`;

    const systemMsg = `
Você é um DIRETOR CRIATIVO DE AGÊNCIA DIGITAL PREMIUM, DESIGNER UI/UX SÊNIOR e FRONT-END DEVELOPER ESPECIALISTA EM LANDING PAGES DE ALTO IMPACTO.

Sua missão é gerar um HTML COMPLETO, visualmente impressionante e altamente profissional para ser exibido no módulo Elite Preview.

Este site será mostrado ao empresário como uma prévia de como o site dele poderia ser muito melhor.

PORTANTO:
- o resultado NÃO pode parecer template genérico
- o resultado NÃO pode parecer site simples de IA
- o resultado DEVE parecer projeto feito por uma agência premium

==================================================
DIREÇÃO VISUAL OBRIGATÓRIA
==================================================

Inspirar-se em referências visuais de alto nível como:

- Webflow
- Framer
- Awwwards
- Dribbble

Aplicar obrigatoriamente no design:

- hero section visualmente forte
- gradientes modernos
- profundidade visual
- containers bem espaçados
- tipografia moderna e marcante
- contraste forte e elegante
- cards com aparência premium
- sombras suaves
- seções bem separadas
- layout sofisticado
- micro interações visuais leves
- aparência de site caro

==================================================
HERO OBRIGATÓRIO
==================================================

A primeira seção precisa causar impacto imediato.

Ela deve conter:

- headline forte e persuasiva
- subheadline clara
- CTA principal destacado
- fundo visual elegante
- sensação premium logo na primeira dobra

Ao olhar o hero, o visitante deve entender rapidamente:

- o que a empresa faz
- por que ela é confiável
- por que o site parece superior ao atual

==================================================
PERSONALIZAÇÃO POR NICHO
==================================================

Adapte o estilo ao nicho do negócio.

Exemplos:

ADVOCACIA:
- visual elegante
- cores escuras
- detalhes dourados
- tipografia séria
- sensação de autoridade

CLÍNICA:
- visual limpo
- cores suaves
- sensação de confiança e cuidado

TECNOLOGIA:
- gradientes modernos
- visual mais ousado
- sensação de inovação

==================================================
DIREÇÃO CRIATIVA
================

${designDirection}

==================================================
ARQUITETURA DA PÁGINA
=====================

${siteStructure}

==================================================
ESTRUTURA OBRIGATÓRIA
==================================================

O site deve conter:

1. Hero
2. Problema do cliente
3. Solução oferecida
4. Serviços
5. Benefícios
6. Prova social
7. Autoridade
8. CTA final
9. Contato
10. Rodapé

==================================================
COPYWRITING
==================================================

Os textos devem parecer escritos por um copywriter profissional.

Evitar frases genéricas como:

- Bem-vindo ao nosso site
- Somos uma empresa de qualidade
- Trabalhamos com excelência

Os textos devem parecer específicos para a empresa.

==================================================
REQUISITOS TÉCNICOS
==================================================

- Retornar APENAS HTML completo
- Iniciar com <!DOCTYPE html>
- Usar Tailwind CSS via CDN
- Usar Google Fonts
- Layout totalmente responsivo
- Use container max-width 1200px ou 1280px para evitar layout esticado.
- Hero com tipografia robusta (acima de 56px no desktop).
- Adicionar pelo menos uma seção com background gradient moderno.
- Use pelo menos uma seção com layout alternado (imagem esquerda, texto direita).
- Use modern spacing (py-24 sections), rounded-xl cards and subtle shadows.
- Código pronto para renderizar em iframe usando srcDoc

==================================================
IMPORTANTE
==================================================

Retornar SOMENTE o HTML.
Não escrever explicações.
Não usar markdown.
Iniciar diretamente com <!DOCTYPE html>.
`;

    const userMsg = `Generate a complete HTML website using TailwindCSS.

Business information:
Name: ${leadData.name || 'Empresa Local'}
Niche: ${leadData.niche || 'Negócio Local'}
City: ${leadData.city || 'Sua Cidade'}
Description: ${leadData.description || 'Uma empresa consolidada no mercado.'}

Services:
${leadData.services ? leadData.services.join('\\n') : 'Nossos Serviços'}

Testimonials:
${leadData.testimonials ? leadData.testimonials.join('\\n') : 'Ótimos serviços e atendimento!'}

Marketing Copy:
Headline: ${leadData.headline || 'Impacto Digital'}
Subheadline: ${leadData.subheadline || 'Apresente seus serviços de forma elegante'}
Benefits: ${leadData.benefits ? leadData.benefits.join('\\n') : 'Vantagem 1\\nVantagem 2\\nVantagem 3'}

Design system:
Primary colors: ${leadData.colorPalette?.join(', ') || 'dark blue, charcoal e gold'}
Font: ${leadData.font || 'Inter'}
Detected Layout Style: ${leadData.layout_type || 'modern-business'}

Creative direction from marketing blueprint:
${leadData.builder_prompt || ""}

Technical diagnostics of current site:
${leadData.diagnostics ? JSON.stringify(leadData.diagnostics, null, 2) : 'Ainda sem site otimizado'}

Instructions:

Create a professional website redesign specifically for this business.

The design must:
- match the niche
- look premium
- be conversion focused
- include hero section
- services section
- testimonials
- call to action
- contact section

SECTION DATA RULES:
Services section MUST display the services listed below.
Testimonials section MUST display the testimonials provided.
Benefits section MUST use the provided benefits.

CRITICAL RULE:
The website MUST use the real business information provided.
You MUST explicitly include:
- the company name
- the city
- the services provided

Do NOT invent fictional company names.
If the company name is "${leadData.name}", the hero section must clearly display that name.

OUTPUT:
Return ONLY valid HTML.`;

    console.log(`\n[AI GATEWAY] Request HTML → ${leadData.name}`);

    const modelsToTry = ["Llama-4-maverick", ...PIRAMYD_MODELS];

    if (requestedModel && PIRAMYD_MODELS.includes(requestedModel)) {
        const index = modelsToTry.indexOf(requestedModel);
        if (index > -1) modelsToTry.splice(index, 1);
        modelsToTry.unshift(requestedModel);
    }

    for (const model of modelsToTry) {
        try {
            const data = await callPiramyd(model, PIRAMYD_API_KEY, systemMsg, userMsg);
            if (data.choices?.[0]?.message?.content) {
                let html = data.choices[0].message.content.trim();
                html = html.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim();

                if (html.length > 150000) {
                    html = html.slice(0, 150000);
                }

                if (!html.startsWith("<!DOCTYPE html>")) {
                    console.warn("Resposta não iniciou com HTML válido.");
                }

                console.log({
                    event: "generate_html_success",
                    lead: leadData.name,
                    model
                });
                return res.json({ html, model });
            }
        } catch (err) {
            console.error(`[AI GATEWAY] Erro HTML em ${model}: ${err.message}`);
        }
    }
    res.status(503).json({ error: "Falha ao gerar HTML Elite." });
});

app.get("/health", (_, res) => res.json({ status: "online", motor: "Piramyd Elite Only" }));

// ── Rota Scrap Site (Resolvendo CORS local) ─────────────────────────────────
app.get("/scrap-site", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "URL é obrigatória." });

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            }
        });
        clearTimeout(timeoutId);
        const html = await response.text();
        res.send(html);
    } catch (error) {
        res.status(500).json({ error: "Falha no scrap local", message: error.message });
    }
});

// ── Rota Análise Técnica (PageSpeed local) ──────────────────────────────────
app.get("/analyze-site", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "URL é obrigatória." });

    const GOOGLE_KEY = process.env.VITE_GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;

    try {
        const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=PERFORMANCE&category=SEO&category=ACCESSIBILITY&category=BEST_PRACTICES&key=${GOOGLE_KEY}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Falha na análise local", message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🤖 AI GATEWAY ONLINE (PIRAMYD ONLY) | PORT: ${PORT}`);
    console.log(`======================================================\n`);
    console.log(`Motor Primário: Piramyd (${PIRAMYD_MODELS.length} modelos disponíveis)`);
    console.log(`Rotas de API emuladas: /generate-preview, /generate-html, /scrap-site, /analyze-site`);
});

process.on("uncaughtException", err => console.error("[CRITICAL] Uncaught:", err));
process.on("unhandledRejection", r => console.error("[CRITICAL] Rejection:", r));
