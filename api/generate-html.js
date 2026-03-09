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
