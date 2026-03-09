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
import generatePremiumTemplate from '../src/templates/premium-business-template.js';

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

    const systemMsg = `Você é um COPYWRITER E ESTRATEGISTA DE MARKETING DE ELITE.

Sua missão é gerar APENAS O CONTEÚDO (em formato JSON) para uma página de conversão premium. Este conteúdo será inserido em um template pré-pronto de alta conversão.

DIREÇÃO DA COPY (Atmosfera):
${designDirection}

==================================================
REQUISITOS TÉCNICOS OBRIGATÓRIOS
==================================================
- Retorne APENAS um objeto JSON válido
- NÃO retorne marcadores de markdown como \`\`\`json
- A estrutura do JSON DEVE ser exatamente a seguinte:

{
  "headline": "Chamada principal forte (impactante)",
  "subheadline": "Subtítulo atraente explicando o valor",
  "problem": "Descrição empática da dor do cliente",
  "solution": "Apresentação da solução definitiva",
  "services": [
    { "title": "Serviço 1", "description": "Breve desc" },
    { "title": "Serviço 2", "description": "Breve desc" },
    { "title": "Serviço 3", "description": "Breve desc" }
  ],
  "benefits": ["Diferencial 1", "Diferencial 2", "Diferencial 3", "Diferencial 4"],
  "testimonials": [
    { "text": "Depoimento real", "author": "Nome" },
    { "text": "Depoimento real", "author": "Nome" }
  ],
  "authority": "Texto demonstrando autoridade, anos de experiência ou especialização.",
  "cta": "Texto curto para botão (ex: Agendar Consulta)"
}`;

    const userMsg = `Gere o JSON de conteúdo estratégico para a seguinte empresa:

Business information:
Name: ${leadData.name || 'Empresa Local'}
Niche: ${leadData.niche || 'Negócio Local'}
City: ${leadData.city || 'Sua Cidade'}
Description: ${leadData.description || 'Uma empresa consolidada no mercado.'}

Contexto base fornecido (modifique, amplie e melhore se necessário):
Services: ${leadData.services ? leadData.services.join(', ') : 'Serviços gerais'}
Testimonials: ${leadData.testimonials ? leadData.testimonials.join(' | ') : 'Ótimos serviços e atendimento!'}
Benefits: ${leadData.benefits ? leadData.benefits.join(', ') : 'Vantagem 1, Vantagem 2'}

Detected Layout Style: ${leadData.layout_type || 'modern-business'}

Instrução Final: Return ONLY JSON. Do NOT generate HTML.`;

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
                let raw = data.choices[0].message.content.trim();
                raw = raw.replace(/^```json/i, '').replace(/```$/i, '').trim();

                let aiContent = {};
                try {
                    aiContent = JSON.parse(raw);
                } catch (parseErr) {
                    console.error("[AI GATEWAY] Falha ao parsear JSON HTML da IA, usando Fallback.", parseErr.message);
                }

                const html = generatePremiumTemplate(aiContent, leadData);

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
