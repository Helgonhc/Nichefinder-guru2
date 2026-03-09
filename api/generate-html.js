
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

    const siteStructure = `Arquitetura obrigatória da página:\n\n1. HERO\n   * headline forte\n   * subheadline clara\n   * botão CTA principal\n   * background visual moderno\n\n2. SEÇÃO PROBLEMA\n   * explicar o problema do cliente\n   * conectar emocionalmente\n\n3. SEÇÃO SOLUÇÃO\n   * mostrar como a empresa resolve o problema\n\n4. SEÇÃO SERVIÇOS\n   * grid moderno com cards\n\n5. SEÇÃO BENEFÍCIOS\n   * diferenciais da empresa\n\n6. PROVA SOCIAL\n   * depoimentos ou indicadores de confiança\n\n7. AUTORIDADE\n   * experiência ou especialização\n\n8. CTA FINAL\n   * chamada forte para ação\n\n9. CONTATO\n   * formulário simples\n\n10. FOOTER`;

    const systemMsg = `Você é um DIRETOR CRIATIVO DE AGÊNCIA DIGITAL PREMIUM, DESIGNER UI/UX SÊNIOR e FRONT-END DEVELOPER ESPECIALISTA EM LANDING PAGES DE ALTO IMPACTO.\n\nSua missão é gerar um HTML COMPLETO, visualmente impressionante e altamente profissional para ser exibido no módulo Elite Preview.\n\nEste site será mostrado ao empresário como uma prévia de como o site dele poderia ser muito melhor.\n\nPORTANTO:\n- o resultado NÃO pode parecer template genérico\n- o resultado NÃO pode parecer site simples de IA\n- o resultado DEVE parecer projeto feito por uma agência premium\n\nDIREÇÃO VISUAL OBRIGATÓRIA:\n- hero section impactante, gradientes modernos, profundidade visual, containers bem espaçados, tipografia moderna e marcante, micro interações visuais leves.\n- Use modern spacing (py-24 sections), rounded-xl cards and subtle shadows.\n\nDIREÇÃO CRIATIVA:\n${designDirection}\n\nARQUITETURA DA PÁGINA:\n${siteStructure}\n\nREQUISITOS TÉCNICOS:\n- Retornar APENAS HTML completo\n- Iniciar com <!DOCTYPE html>\n- Usar Tailwind CSS via CDN\n- Layout totalmente responsivo\n- Container max-width 1200px ou 1280px\n- Hero com tipografia robusta (>56px)\n- Pelo menos uma seção com background gradient moderno e uma com layout alternado.\n\nRetornar SOMENTE o HTML.`;

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

The result must be a COMPLETE HTML page using TailwindCSS.

Do NOT generate placeholder text like "Company Name".
Use the real business data.

OUTPUT:
Return ONLY valid HTML.`;

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
                let html = data.choices[0].message.content.trim();
                html = html.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim();

                if (html.length > 150000) html = html.slice(0, 150000);

                res.setHeader('Access-Control-Allow-Origin', '*');
                return res.json({ html, model });
            }
        } catch (err) {
            console.error(`[API HTML] Error in ${model}: ${err.message}`);
        }
    }
    return res.status(503).json({ error: "Falha ao gerar HTML Elite." });
}
