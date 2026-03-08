import "dotenv/config";
import express from "express";
import cors from "cors";

/**
 * 🤖 AI GATEWAY SERVER
 * Provedor primário: Piramyd (api.piramyd.cloud) — OpenAI-compatible
 * Fallback: Gemini (se disponível)
 * Porta: 3002
 */

const app = express();
const PORT = process.env.AI_GATEWAY_PORT || 3002;

// ── Configuração ─────────────────────────────────────────────────────────────

const PIRAMYD_API_KEY = process.env.PIRAMYD_API_KEY || "sk-3af8a2ee98a046ea960e69556ae96dcb";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "AIzaSyBbAp_VX1u6eyYCbTeR2MKSH_jOKV_N_SQ";

// Modelos de texto da Piramyd em ordem de qualidade/capacidade
// (excluídos modelos de imagem: qwen-image, flux2-klein-4b, lucid-origin, dreamshaper, sdxl-lite, z-image-turbo, nano-banana*)
const PIRAMYD_MODELS = [
    "Llama-4-maverick",          // Meta — 500k ctx
    "Llama-4-scout",             // Meta AI — 500k ctx
    "Kimi-k2-thinking",          // Moonshot AI — 256k ctx
    "Glm-5",                     // Z-AI — 256k ctx
    "Gpt-oss-120b",              // OpenAI — 128k ctx
    "claude-sonnet-4.5",         // Anthropic — 128k ctx
    "gpt-5.3",                   // Anthropic — 128k ctx
    "gpt-5.3-codex",             // Anthropic — 128k ctx
    "Minimax-m2.1",              // Minimax AI — 128k ctx
    "Glm-4.7",                   // Z-AI — 128k ctx
    "Phi-4-mini-flash-reasoning",// Microsoft — 128k ctx
    "Sonar-Pro",                 // Perplexity — 80k ctx
    "Nemotron-3-nano",           // Nvidia — 500k ctx
];

// Fallback Gemini
const GEMINI_MODELS = ["gemini-2.0-flash"];

const MAX_RETRIES = 2;

// ── Utilitários ──────────────────────────────────────────────────────────────

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function extractJsonFromContent(text = "") {
    // Remove blocos markdown ```json ... ```
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    return match ? match[1].trim() : text.trim();
}

// ── Provedores ────────────────────────────────────────────────────────────────

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
        body: JSON.stringify({ model, messages, temperature: 0.6 }),
    });

    return { status: res.status, data: await res.json() };
}

async function callGemini(model, apiKey, systemMessage, userPrompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const body = {
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 8192, responseMimeType: "application/json" },
    };
    if (systemMessage) body.system_instruction = { parts: [{ text: systemMessage }] };

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return { status: res.status, data: await res.json() };
}

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({ origin: "*", methods: ["POST", "OPTIONS"], allowedHeaders: ["Content-Type"] }));
app.use(express.json({ limit: "10mb" }));

// ── Rota principal ────────────────────────────────────────────────────────────

app.post("/generate-preview", async (req, res) => {
    const { systemMessage, userPrompt } = req.body;

    if (!userPrompt) return res.status(400).json({ error: "userPrompt é obrigatório." });

    console.log(`\n[AI GATEWAY] Request received | ${new Date().toISOString()}`);

    // ── 1. Piramyd (provedor primário) ────────────────────────────────────────
    for (const model of PIRAMYD_MODELS) {
        console.log(`[AI GATEWAY] Trying Piramyd: ${model}`);
        let attempts = 0;

        while (attempts < MAX_RETRIES) {
            attempts++;
            try {
                const { status, data } = await callPiramyd(model, PIRAMYD_API_KEY, systemMessage, userPrompt);

                if (status === 200 && data.choices?.[0]?.message?.content) {
                    const raw = data.choices[0].message.content;
                    const content = extractJsonFromContent(raw);
                    console.log(`[AI GATEWAY] ✅ Piramyd success: ${model}`);
                    return res.json({ content, model, provider: "piramyd" });
                }

                const errMsg = data.error?.message || data.detail || `HTTP ${status}`;
                const isRate = status === 429;

                if (isRate && attempts < MAX_RETRIES) {
                    console.warn(`[AI GATEWAY] Rate limit on ${model}, retrying...`);
                    await sleep(3000);
                    continue;
                }

                console.warn(`[AI GATEWAY] Piramyd error on ${model}: ${errMsg}`);
                break;

            } catch (err) {
                console.error(`[AI GATEWAY] Network error: ${err.message}`);
                if (attempts < MAX_RETRIES) await sleep(1500);
                else break;
            }
        }
    }

    // ── 2. Gemini (fallback) ───────────────────────────────────────────────────
    for (const model of GEMINI_MODELS) {
        console.log(`[AI GATEWAY] 🔄 Fallback to Gemini: ${model}`);
        try {
            const { status, data } = await callGemini(model, GEMINI_API_KEY, systemMessage, userPrompt);

            if (status === 200 && !data.error) {
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    console.log(`[AI GATEWAY] ✅ Gemini success: ${model}`);
                    return res.json({ content: text, model, provider: "gemini" });
                }
            }
            const errMsg = data.error?.message || `HTTP ${status}`;
            console.warn(`[AI GATEWAY] Gemini error: ${errMsg}`);
        } catch (err) {
            console.error(`[AI GATEWAY] Gemini network error: ${err.message}`);
        }
    }

    console.error("[AI GATEWAY] ❌ All providers exhausted.");
    return res.status(503).json({ error: "Todos os provedores de IA falharam. Tente novamente." });
});

// ── Rota HTML Preview ─────────────────────────────────────────────────────────

app.post("/generate-html", async (req, res) => {
    const { leadData } = req.body;
    if (!leadData) return res.status(400).json({ error: "leadData é obrigatório." });

    const systemMsg = `Você é um designer/dev frontend EXPERT. Gere um site HTML COMPLETO, BONITO e RESPONSIVO.
REGRAS ABSOLUTAS:
1. Retorne APENAS o HTML puro — sem markdown, sem \`\`\`, sem explicações.
2. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
3. Use Google Fonts via link tag para a fonte especificada.
4. HTML standalone (funcional sem dependência além de CDN).
5. Seções obrigatórias: Hero com imagem de fundo, Serviços em cards, Depoimentos, Contato com WhatsApp.
6. Use dados REAIS — NUNCA placeholder ou Lorem Ipsum.
7. Design premium: gradientes, sombras, hover effects, animações CSS (não JS).
8. Botão WhatsApp flutuante no canto inferior direito.`;

    const userMsg = `Gere o HTML completo do site para:
Empresa: ${leadData.name}
Nicho: ${leadData.niche} - ${leadData.categoria}
Endereço: ${leadData.address}, ${leadData.city}
WhatsApp: ${leadData.whatsapp || leadData.phone || ''}
Instagram: @${leadData.instagram || ''}
Google Maps: ${leadData.googleMapsUrl || ''}
Serviços: ${(leadData.services || []).slice(0, 6).join(', ')}
Depoimentos: ${(leadData.testimonials || []).slice(0, 3).join(' | ') || 'Gere 3 depoimentos realistas para ' + leadData.niche}
Cores: ${(leadData.colorPalette || ['#2563eb', '#1e293b']).join(', ')}
Fonte: ${leadData.font || 'Space Grotesk'}

Inicie IMEDIATAMENTE com <!DOCTYPE html> sem nenhum texto antes.`;

    console.log(`\n[AI GATEWAY] HTML Preview → ${leadData.name}`);

    for (const model of PIRAMYD_MODELS) {
        try {
            const apiRes = await fetch("https://api.piramyd.cloud/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${PIRAMYD_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model,
                    messages: [{ role: "system", content: systemMsg }, { role: "user", content: userMsg }],
                    temperature: 0.7,
                }),
            });
            const data = await apiRes.json();
            if (apiRes.ok && data.choices?.[0]?.message?.content) {
                let html = data.choices[0].message.content.trim();
                html = html.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim();
                console.log(`[AI GATEWAY] ✅ HTML gerado com: ${model}`);
                return res.json({ html, model });
            }
            console.warn(`[AI GATEWAY] HTML error on ${model}:`, data.detail || data.error?.message);
        } catch (err) {
            console.error(`[AI GATEWAY] HTML network error:`, err.message);
        }
    }
    res.status(503).json({ error: "Não foi possível gerar o HTML preview." });
});

// ── Health ────────────────────────────────────────────────────────────────────

app.get("/health", (_, res) => res.json({ status: "ok", port: PORT, provider: "piramyd+gemini" }));

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`\n${"=".repeat(54)}`);
    console.log(`🤖 AI GATEWAY ONLINE | PORT: ${PORT}`);
    console.log(`${"=".repeat(54)}\n`);
    console.log(`Primário: Piramyd (${PIRAMYD_MODELS.join(", ")})`);
    console.log(`Fallback: Gemini (${GEMINI_MODELS.join(", ")})\n`);
});

process.on("uncaughtException", err => console.error("[AI GATEWAY] Uncaught:", err));
process.on("unhandledRejection", r => console.error("[AI GATEWAY] Rejection:", r));
