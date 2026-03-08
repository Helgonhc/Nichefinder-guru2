const fetch = require('node-fetch');

/**
 * Geração automática de uma proposta de redesign (Preview) usando IA para o Bot de WA.
 */
async function generateRemakePreview(lead) {
    const apiKey = process.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
        return generateFallbackPreview(lead);
    }

    try {
        const prompt = `
      Você é um especialista em CRO e Web Design de alta conversão.
      Analise os dados deste lead e crie uma proposta de "NOVA HOME PAGE" que seja impossível de ignorar.
      
      DADOS DO LEAD:
      NOME: ${lead.name}
      NICHO: ${lead.niche}
      CIDADE: ${lead.city}
      SITE ATUAL: ${lead.website || "NÃO POSSUI"}
      
      REQUISITOS DA RESPOSTA:
      Retorne APENAS um JSON válido seguindo exatamente esta estrutura:
      {
        "headline": "Uma headline matadora focada em benefício principal",
        "subheadline": "Explicação curta de como resolve o problema",
        "benefits": ["Benefício 1", "Benefício 2", "Benefício 3"],
        "services": ["Serviço Principal 1", "Serviço Principal 2"],
        "testimonials": ["Um depoimento fictício premium adaptado ao nicho"],
        "cta_text": "Texto do botão de ação",
        "cta_action": "WhatsApp",
        "summary": "Um parágrafo técnico explicando por que esse novo design converteria 3x mais que o atual."
      }
    `;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        const result = await response.json();
        if (!result.choices) return generateFallbackPreview(lead);

        const content = JSON.parse(result.choices[0].message.content);

        return {
            preview_data: {
                headline: content.headline,
                subheadline: content.subheadline,
                benefits: content.benefits,
                services: content.services,
                testimonials: content.testimonials,
                cta_text: content.cta_text,
                cta_action: content.cta_action
            },
            summary: content.summary
        };

    } catch (error) {
        console.error("Error generating remake preview in Bot:", error);
        return generateFallbackPreview(lead);
    }
}

function generateFallbackPreview(lead) {
    return {
        preview_data: {
            headline: `O Novo Padrão de Atendimento para ${lead.niche} em ${lead.city}`,
            subheadline: `Aumente sua autoridade digital e converta mais visitantes em clientes fiéis com um design focado em resultados.`,
            benefits: [
                "Design Moderno e Veloz",
                "Focado 100% em Conversão",
                "Otimizado para Celulares"
            ],
            services: [
                "Presença Digital VIP",
                "Atendimento Automatizado"
            ],
            testimonials: [
                "Excelente! Meu faturamento aumentou 40% após a nova presença digital."
            ],
            cta_text: "Quero meu Site Premium",
            cta_action: "WhatsApp"
        },
        summary: "Preview estratégico gerado automaticamente para demonstrar o potencial de escala do negócio."
    };
}

module.exports = { generateRemakePreview };
