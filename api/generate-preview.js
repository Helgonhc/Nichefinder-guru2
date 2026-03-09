
const PIRAMYD_API_KEY = process.env.PIRAMYD_API_KEY;

const PIRAMYD_MODELS = [
    "Llama-4-scout",
    "gpt-5.3-codex",
    "claude-sonnet-4.5",
    "gpt-5.3",
    "Llama-4-maverick",
    "Kimi-k2-thinking",
    "Glm-5",
    "Gpt-oss-120b",
    "Minimax-m2.1",
    "Glm-4.7",
    "Phi-4-mini-flash-reasoning",
    "Sonar-Pro",
    "Nemotron-3-nano",
];

const MAX_RETRIES = 1;

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
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
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
                temperature: 0.9,
                top_p: 0.95,
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

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { systemMessage, userPrompt, model: requestedModel, maxTokens } = req.body;
    if (!userPrompt) return res.status(400).json({ error: "userPrompt é obrigatório." });

    if (!PIRAMYD_API_KEY) {
        return res.status(500).json({ error: "PIRAMYD_API_KEY não configurada no Vercel." });
    }

    const modelsToTry = [...PIRAMYD_MODELS];
    if (requestedModel && requestedModel !== "Llama-4-scout") {
        const index = modelsToTry.indexOf(requestedModel);
        if (index > -1) modelsToTry.splice(index, 1);
        modelsToTry.unshift(requestedModel);
    }

    for (const model of modelsToTry) {
        let attempts = 0;
        while (attempts < MAX_RETRIES) {
            attempts++;
            try {
                const data = await callPiramyd(model, PIRAMYD_API_KEY, systemMessage, userPrompt, maxTokens);
                if (data.choices?.[0]?.message?.content) {
                    const content = extractJsonFromContent(data.choices[0].message.content);

                    res.setHeader('Access-Control-Allow-Origin', '*');
                    return res.json({ content, model, provider: "piramyd" });
                }
            } catch (err) {
                console.error(`[API] Error in ${model}: ${err.message}`);
                if (attempts < MAX_RETRIES) await sleep(1000);
            }
        }
    }

    return res.status(503).json({ error: "Todos os modelos Piramyd falharam." });
}
