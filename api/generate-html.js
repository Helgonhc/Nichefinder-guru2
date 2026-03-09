import generatePremiumTemplate from '../src/templates/premium-business-template.js';

const PIRAMYD_API_KEY = process.env.PIRAMYD_API_KEY;

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

async function callPiramyd(model, apiKey, systemMessage, userPrompt) {
    const messages = [];
    if (systemMessage) messages.push({ role: "system", content: systemMessage });
    messages.push({ role: "user", content: userPrompt });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout

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
                temperature: 0.35,
                top_p: 0.9,
                presence_penalty: 0.2,
                frequency_penalty: 0.2,
                max_tokens: 6000
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

    const { leadData, model: requestedModel } = req.body;
    if (!leadData) return res.status(400).json({ error: "leadData é obrigatório." });

    if (!PIRAMYD_API_KEY) {
        return res.status(500).json({ error: "PIRAMYD_API_KEY não configurada no Vercel." });
    }

    const layout = leadData.layout_type || "modern-business";
    let designDirection = "";

    if (layout === "bento-medical-clean") {
        designDirection = `Estilo visual: Bento Grid Moderno (Apple Style)\nFoco: Higiene visual, organização modular e calma\nPaleta: Pure White (#FFFFFF), Soft Blue (#F0F7FF), Accent Blue (#2563EB)\nTipografia: Inter (Geométrica e Limpa)\nLayout: Services em grade irregular (Bento), Hero com muito respiro, transições suaves de fade-in`;
    }
    else if (layout === "glass-tech-dark") {
        designDirection = `Estilo visual: Glassmorphism / Dark Mode Futurista\nFoco: Tecnologia, inovação e autoridade digital\nPaleta: Deep Space (#020617), Glass White (white/10), Electric Blue (#3B82F6)\nTipografia: Space Grotesk ou Inter (Bold)\nLayout: Cards com bordas brilhantes, gradients de fundo pulsantes, seções em camadas com blur`;
    }
    else if (layout === "luxury-author-classic") {
        designDirection = `Estilo visual: Clássico Moderno / Exclusividade\nFoco: Autoridade absoluta, prestígio e confiança\nPaleta: Charcoal (#1F2937), Ivory (#F9FAFB), Gold Accent (#D4AF37)\nTipografia: Playfair Display (Serifada Luxo) para títulos, Inter para corpo\nLayout: Simetria perfeita, Hero imponente, tipografia grande, espaços de respiro generosos`;
    }
    else if (layout === "kinetic-energy-bold") {
        designDirection = `Estilo visual: Cinético / Brutalismo Leve\nFoco: Energia, movimento e resultados rápidos\nPaleta: Black (#000000), Slate Gray (#1E293B), Neon Green (#22C55E)\nTipografia: Archivo Black ou Sans-Serif Itálica de impacto\nLayout: Seções em diagonal, cards com sombras duras, tipografia "loud", animações de scroll aceleradas`;
    }
    else if (layout === "immersive-food-visual") {
        designDirection = `Estilo visual: Imersivo Gastronômico\nFoco: Desejo, sabor e experiência sensorial\nPaleta: Warm Orange (#F97316), Deep Black (#000000), Cream (#FFFBEB)\nTipografia: Serifas Rústicas ou Cursivas Elegantes em títulos\nLayout: Full-width imagens, seções de menu com hover detalhado, grids visuais de alta definição`;
    }
    else if (layout === "trusted-local-vibe") {
        designDirection = `Estilo visual: Confiabilidade Local / Hands-on\nFoco: Resolução imediata, agilidade e proximidade\nPaleta: Royal Blue (#1D4ED8), Industrial Safety (#EA580C), White\nTipografia: Roboto ou Sans-Serif robusta\nLayout: CTAs redundantes e visíveis, seções de "Como Funciona" em steps, prova social do Google em destaque`;
    }
    else {
        designDirection = `Estilo visual: Modern B2B Bento\nFoco: Profissionalismo corporativo contemporâneo\nPaleta: Slate Blue (#475569), Cool Gray (#F1F5F9), Royal Blue (#2563EB)\nTipografia: Plus Jakarta Sans\nLayout: Bento Grid modular, Hero-split, animações de entrada elegantes`;
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

    const modelsToTry = [...PIRAMYD_MODELS];
    if (requestedModel && requestedModel !== "Llama-4-maverick") {
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
                    console.error("[API HTML] Falha ao parsear JSON da IA, caindo para fallback.", parseErr.message);
                }

                const html = generatePremiumTemplate(aiContent, leadData);

                res.setHeader('Access-Control-Allow-Origin', '*');
                return res.json({ html, model });
            }
        } catch (err) {
            console.error(`[API HTML] Error in ${model}: ${err.message}`);
        }
    }
    return res.status(503).json({ error: "Falha ao gerar HTML Elite." });
}
