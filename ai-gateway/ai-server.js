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
    "gpt-5.3-codex",
    "claude-sonnet-4.5",
    "gpt-5.3",
    "Llama-4-maverick",
    "Llama-4-scout",
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

async function callPiramyd(model, apiKey, systemMessage, userPrompt) {
    const messages = [];
    if (systemMessage) messages.push({ role: "system", content: systemMessage });
    messages.push({ role: "user", content: userPrompt });

    const res = await fetch("https://api.piramyd.cloud/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: 0.9,
            top_p: 0.95,
            max_tokens: 6000
        }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Erro na API da Piramyd");
    }

    return await res.json();
}

app.use(cors({ origin: "*", methods: ["POST", "OPTIONS"], allowedHeaders: ["Content-Type"] }));
app.use(express.json({ limit: "20mb" }));

// ── Rota Blueprints (JSON) ──────────────────────────────────────────────────
app.post("/generate-preview", async (req, res) => {
    const { systemMessage, userPrompt, model: requestedModel } = req.body;
    if (!userPrompt) return res.status(400).json({ error: "userPrompt é obrigatório." });

    console.log({
        event: "generate_preview",
        timestamp: new Date().toISOString()
    });

    const modelsToTry = [...PIRAMYD_MODELS];
    if (requestedModel && PIRAMYD_MODELS.includes(requestedModel)) {
        // Coloca o modelo solicitado no topo
        const index = modelsToTry.indexOf(requestedModel);
        if (index > -1) modelsToTry.splice(index, 1);
        modelsToTry.unshift(requestedModel);
    } else if (requestedModel) {
        // Modelo customizado não na lista padrão (tenta mesmo assim)
        modelsToTry.unshift(requestedModel);
    }

    for (const model of modelsToTry) {
        console.log(`[AI GATEWAY] Tentando Piramyd: ${model}`);
        let attempts = 0;
        while (attempts < MAX_RETRIES) {
            attempts++;
            try {
                const data = await callPiramyd(model, PIRAMYD_API_KEY, systemMessage, userPrompt);
                if (data.choices?.[0]?.message?.content) {
                    const content = extractJsonFromContent(data.choices[0].message.content);
                    console.log({
                        event: "generate_preview_success",
                        model,
                        provider: "piramyd"
                    });
                    return res.json({ content, model, provider: "piramyd" });
                }
            } catch (err) {
                console.error(`[AI GATEWAY] Erro em ${model}: ${err.message}`);
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

    const niche = String(leadData.niche || "").toLowerCase();
    let designDirection = "";

    if (niche.includes("advocacia") || niche.includes("advogado") || niche.includes("law")) {
        designDirection = `Estilo visual: institucional premium
Paleta recomendada: navy, charcoal e dourado
Tipografia: serif elegante combinada com sans-serif moderna
Atmosfera: autoridade, confiança e sofisticação
Layout: hero forte, seções elegantes, grid de serviços refinado`;
    }
    else if (niche.includes("clinica") || niche.includes("odontologia") || niche.includes("medico")) {
        designDirection = `Estilo visual: limpo e profissional
Paleta recomendada: branco, azul suave e verde claro
Tipografia: sans-serif moderna
Atmosfera: confiança, cuidado e tecnologia
Layout: hero claro, seções organizadas, blocos informativos`;
    }
    else if (niche.includes("tecnologia") || niche.includes("software") || niche.includes("ti")) {
        designDirection = `Estilo visual: futurista moderno
Paleta recomendada: gradientes azul e roxo
Tipografia: sans-serif geométrica
Atmosfera: inovação e tecnologia
Layout: hero visual com gradientes, seções dinâmicas e cards modernos`;
    }
    else {
        designDirection = `Estilo visual: moderno premium
Paleta recomendada: dark blue, charcoal e branco
Tipografia: sans-serif moderna
Atmosfera: profissional e confiável
Layout: hero impactante, seções amplas e design elegante`;
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
- Código pronto para renderizar em iframe usando srcDoc

==================================================
IMPORTANTE
==================================================

Retornar SOMENTE o HTML.
Não escrever explicações.
Não usar markdown.
Iniciar diretamente com <!DOCTYPE html>.
`;

    const userMsg = `
Crie um site premium para o Elite Preview com base nos dados abaixo.

Empresa: ${leadData.name}
Cidade: ${leadData.city}
Tipo de negócio: ${leadData.niche}

Paleta sugerida:
${leadData.colorPalette?.join(', ') || 'dark blue, charcoal e gold'}

Direção estratégica:
${leadData.builder_prompt || 'criar um site premium, moderno, impactante e muito superior a um template genérico'}

Direção visual obrigatória:

${designDirection}

Estrutura obrigatória do site:

${siteStructure}

O objetivo é gerar uma página que impressione imediatamente o empresário.

O site precisa parecer desenvolvido por uma agência digital premium.

Evite frases genéricas.
Evite layout comum.
Evite aparência de template simples.

Comece imediatamente com <!DOCTYPE html>.
`;

    console.log(`\n[AI GATEWAY] Request HTML → ${leadData.name}`);

    const modelsToTry = [...PIRAMYD_MODELS];
    if (requestedModel && PIRAMYD_MODELS.includes(requestedModel)) {
        const index = modelsToTry.indexOf(requestedModel);
        if (index > -1) modelsToTry.splice(index, 1);
        modelsToTry.unshift(requestedModel);
    } else if (requestedModel) {
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
