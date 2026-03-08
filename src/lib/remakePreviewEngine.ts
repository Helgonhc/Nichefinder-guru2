import { BusinessData } from "@/types/business";

export interface RemakePreviewResult {
    preview_data: {
        headline: string;
        subheadline: string;
        benefits: string[];
        services: string[];
        service_details?: Array<{ title: string; description: string }>;
        testimonials: string[];
        cta_text: string;
        cta_action: string;
        design_style: string;
        color_palette: string[];
        font_family?: string;
        hero_typography?: string;
        hero_image_url: string;
        hero_image_keyword?: string;
        layout_type: string;
        builder_prompt: string;
        real_social_media?: Record<string, string>;
    };
    summary: string;
    html_preview?: string; // HTML completo gerado pela IA para visualização
}

/**
 * Geração automática de uma proposta de redesign (Preview) usando IA.
 * NÍVEL: ULTRA GOD MODE GALAXY EDITION (3000+ PALAVRAS / BLUEPRINT DE ENGENHARIA RADICAL)
 */
export async function generateRemakePreview(lead: BusinessData, style: string = 'Premium Modern'): Promise<RemakePreviewResult> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyCf8wHRi1Yp-7bqy0zWexgHZYcCbYOROtU";
    if (!apiKey) {
        console.warn("API Key not found. Falling back to niche template.");
        return generateFallbackPreview(lead);
    }

    try {
        // ── Busca reviews via Places API se place_id estiver disponível ──────────
        let fetchedReviews: Array<{ user: string; rating: number; text: string }> = [];
        const placeIdMatch = (lead.googleMapsUrl || '').match(/query_place_id=([^&]+)/);
        const placeId = placeIdMatch ? placeIdMatch[1] : null;
        const placesApiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

        if (placeId && placesApiKey && (!lead.reviews || lead.reviews.length === 0)) {
            try {
                const placesRes = await fetch(
                    `https://places.googleapis.com/v1/places/${placeId}?fields=reviews&languageCode=pt-BR&key=${placesApiKey}`
                );
                const placesData = await placesRes.json();
                if (placesData.reviews && placesData.reviews.length > 0) {
                    fetchedReviews = placesData.reviews.map((r: any) => ({
                        user: r.authorAttribution?.displayName || 'Cliente',
                        rating: r.rating || 5,
                        text: r.text?.text || '',
                    })).filter((r: any) => r.text.length > 10);
                    console.log(`[Remake] Buscou ${fetchedReviews.length} reviews via Places API`);
                }
            } catch (err) {
                console.warn('[Remake] Falha ao buscar reviews via Places API:', err);
            }
        }

        // Lógica de Persistência e Prioridade de Prova Social Real:
        const realReviews = fetchedReviews.length > 0
            ? fetchedReviews
            : (lead.reviews && lead.reviews.length > 0 ? lead.reviews : []);
        const existingTestimonials = lead.site_preview?.testimonials || [];

        let reviewsSource = '';
        let reviewsInstruction = '';

        if (realReviews.length > 0) {
            // PRIORIDADE 1: REVIEWS REAIS DO GOOGLE MAPS
            reviewsSource = realReviews.slice(0, 15).map(r => `[CLIENTE: ${r.user} | NOTA: ${r.rating}★]: "${r.text}"`).join('\n');
            reviewsInstruction = `⚠️ REGRAS DE OURO DE PROVA SOCIAL:
            1. INJETAR LITERALMENTE TODOS OS ${realReviews.length} DEPOIMENTOS REAIS ABAIXO NO BLUEPRINT.
            2. PROIBIDO RESUMIR OU PARAFASEAR. USE NOMES E TEXTOS EXATOS.
            3. LISTE-OS na seção "testimonials" do JSON.`;
        } else if (existingTestimonials.length > 0 && !existingTestimonials.some(t => t.includes('${'))) {
            // PRIORIDADE 2: MEMÓRIA DE GERAÇÃO ANTERIOR (com blacklist de cache sujo)
            reviewsSource = existingTestimonials.map(t => `[Depoimento]: "${t}"`).join('\n');
            reviewsInstruction = `USE OS DEPOIMENTOS ABAIXO NA SEÇÃO testimonials DO JSON.`;
        } else {
            // PRIORIDADE 3: GERAÇÃO REALISTA PELA IA
            reviewsSource = '';
            reviewsInstruction = `NÃO HÁ REVIEWS REAIS DISPONÍVEIS. Você DEVE gerar 5 depoimentos extremamente realistas e específicos para o segmento de ${lead.niche} em ${lead.city}. Use nomes brasileiros reais, mencione serviços específicos do nicho. Insira no campo "testimonials" do JSON.`;
        }

        const systemMessage = `VOCÊ É O ARQUITETO MAESTRO SUPREMO DE FRONTEND E ENGENHARIA DE PROMPT.
        Sua missão é gerar um BLUEPRINT TÉCNICO COMPLETO EM JSON, ESTRITAMENTE JSON.
        ESCREVA EM PORTUGUÊS brasileiro.
        
        PROTOCOLO ANTI-PREGUIÇA E FRONTEND:
        - Detalhe pixels, animações do Framer Motion e classes do Tailwind v4.
        - Não use placeholders. Use dados reais do lead.
        
        REGRAS DE PROVA SOCIAL E MÍDIAS:
        - Injetar INTEGRALMENTE todos os depoimentos fornecidos.
        - INJETAR os links e informações de redes sociais REAIS fornecidos no Payload nos campos correspondentes do JSON. Se não houver, ignore a rede.
        
        CAMPO BUILDER_PROMPT:
        - ESSE É O MAIS IMPORTANTE: no campo "builder_prompt" você deve escrever um SUPREMO E IMENSO PROMPT Markdown técnico, focado em frontend Next.js, pronto para eu copiar e passar meu time de 'vibecoders' desenvolver e clonar a sua ideia de site 100%. Mínimo 500 palavras nesse campo!`;

        const userPrompt = `
### DATA DUMP - INJETAR TUDO NO BLUEPRINT E NO BUILDER_PROMPT:
- Empresa: ${lead.name}
- Nicho: ${lead.niche} (${lead.categoria})
- Localização: ${lead.address}, ${lead.city}
- Contato: ${lead.whatsapp || lead.phone || 'Nenhum'}
- Site Original/Atual: ${lead.website || 'Nenhum'}
- Redes Sociais REAIS do lead: 
    * Instagram: ${lead.instagram || 'Nao Encontrado'}
    * Facebook: ${lead.facebook || 'Nao Encontrado'}
    * Google Maps URL: ${lead.googleMapsUrl || 'Nao Encontrado'}

### DEPOIMENTOS REAIS (Injetar no JSON e no Site):
${reviewsInstruction}
${reviewsSource}

### REQUISITOS DO JSON:
Retorne APENAS um objeto JSON ESTRITO contendo a estrutura abaixo.
Preencha TODOS os campos com dados REAIS do lead acima. NUNCA use placeholders.

{
  "headline": "Headline Master-Tier para ${lead.name}",
  "subheadline": "Copy de autoridade máxima para ${lead.niche}",
  "benefits": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4", "Benefit 5"],
  "services": ["Service 1", "Service 2", "Service 3", "Service 4", "Service 5"],
  "service_details": [
     { "title": "Service Name", "description": "30-50 words technical copy" }
  ],
  "testimonials": [ "INSERIR AQUI OS DEPOIMENTOS REAIS BRUTOS OU GERADOS PARA O NICHO ${lead.niche}" ],
  "real_social_media": {
      "instagram": "${lead.instagram || ''}",
      "facebook": "${lead.facebook || ''}",
      "google_maps": "${lead.googleMapsUrl || ''}",
      "whatsapp": "${lead.whatsapp || lead.phone || ''}"
  },
  "real_address": "${lead.address}, ${lead.city}",
  "cta_text": "Texto de conversão",
  "cta_action": "WhatsApp",
  "design_style": "${style}",
  "color_palette": ["HEX1", "HEX2", "HEX3"],
  "font_family": "Space Grotesk",
  "hero_typography": "tech | brutalist | elegant",
  "hero_image_keyword": "Ultra specific Unsplash keyword para ${lead.niche}",
  "layout_type": "experimental-asymmetry | typographic-brutalism | modern-split",
  "summary": "Resumo estratégico da proposta para ${lead.name}.",
  "builder_prompt": "ESCREVA AQUI O SUPER PROMPT MASSIVO DOS VIBECODERS EM MARKDOWN. Mencionar: nome da empresa ${lead.name}, nicho ${lead.niche}, redes sociais reais, endereço ${lead.address}. Detalhe seções TSX, cores, Framer Motion. Mínimo 500 palavras."
}
`;

        // Chamada via AI Gateway (porta 3002) — server-to-server, sem bloqueio de quota do browser
        const response = await fetch(`http://localhost:3002/generate-preview`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ systemMessage, userPrompt, apiKey })
        });

        const result = await response.json();
        console.log("[AI GATEWAY] Status:", response.status, "| Model:", result.model);

        if (!response.ok || result.error) {
            console.error("AI Gateway Error:", result.error);
            throw new Error(`AI Error: ${result.error || "Unknown error"}`);
        }

        const rawContent = result.content;

        if (!rawContent) {
            throw new Error("AI failed to return content");
        }

        let content;

        try {
            content = JSON.parse(rawContent);
        } catch (parseError) {
            console.error("JSON Parse Error, attempting recovery...", parseError);

            // Tenta forçar a leitura do RAW se puder usar REGEX ou limpeza
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    content = JSON.parse(jsonMatch[0]);
                } catch (e) {
                    // Tentativa de fechamento simples
                    if (rawContent.includes('"builder_prompt": "') && !rawContent.trim().endsWith('"}')) {
                        const recovered = rawContent.trim() + '"}';
                        try {
                            content = JSON.parse(recovered);
                        } catch (e2) {
                            throw new Error("Failed to recover JSON payload completely.");
                        }
                    } else {
                        throw new Error("Failed to recover JSON payload.");
                    }
                }
            } else {
                throw new Error("No JSON structure found in AI response.");
            }
        }

        const layout_type = content.layout_type || 'modern-split';
        const keyword = content.hero_image_keyword || lead.niche;

        const base_prompt = typeof content.builder_prompt === 'object'
            ? JSON.stringify(content.builder_prompt, null, 2)
            : content.builder_prompt;

        const forcedDump = `\n\n---
### 🚨 DADOS REAIS DO LEAD (USO OBRIGATÓRIO PARA OS VIBECODERS)
**Endereço Físico:** ${lead.address || "N/A"}, ${lead.city || "N/A"}
**Telefone:** ${lead.phone || 'Sem Telefone'} | **WhatsApp:** ${lead.whatsapp || 'Sem WhatsApp'}
**Site Original:** ${lead.website || 'Oceano Azul'}

#### REDES SOCIAIS OFICIAIS:
- **Instagram:** ${lead.instagram || 'Não Localizado'}
- **Facebook:** ${lead.facebook || 'Não Localizado'}
- **Google Maps (GMB):** ${lead.googleMapsUrl || 'Não Localizado'}

#### MURAL DE DEPOIMENTOS PROVA SOCIAL:
${reviewsSource}
---`;

        // Gera HTML preview em paralelo (não bloqueia o resultado do JSON)
        let html_preview: string | undefined;
        try {
            const htmlRes = await fetch('http://localhost:3002/generate-html', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadData: {
                        ...lead,
                        services: content.services || lead.services,
                        testimonials: content.testimonials || [],
                        colorPalette: content.color_palette,
                        font: content.font_family,
                    }
                })
            });
            if (htmlRes.ok) {
                const htmlData = await htmlRes.json();
                html_preview = htmlData.html;
                console.log('[Remake] HTML preview gerado via:', htmlData.model);
            }
        } catch (err) {
            console.warn('[Remake] Falha ao gerar HTML preview:', err);
        }

        return {
            preview_data: {
                headline: content.headline,
                subheadline: content.subheadline,
                benefits: content.benefits,
                services: content.services,
                service_details: content.service_details || [],
                testimonials: content.testimonials,
                cta_text: content.cta_text,
                cta_action: content.cta_action,
                design_style: content.design_style,
                color_palette: content.color_palette || ["#2563eb", "#1e293b", "#f8fafc"],
                font_family: content.font_family,
                hero_typography: content.hero_typography || 'tech',
                hero_image_url: `https://images.unsplash.com/photo-1600880212340-02d9565539d0?auto=format&fit=crop&q=80&w=1200&sig=${Math.random()}`,
                hero_image_keyword: keyword,
                layout_type: layout_type,
                builder_prompt: (base_prompt || "N/A") + forcedDump,
                real_social_media: content.real_social_media || {},
            },
            summary: content.summary,
            html_preview,
        };

    } catch (error) {
        console.error("Error generating remake preview:", error);
        return generateFallbackPreview(lead);
    }
}

function generateFallbackPreview(lead: BusinessData): RemakePreviewResult {
    // 🛡️ O MODO FALLBACK AGORA GERA UM PROMPT MASSIVO DE ELITE LOCALMENTE.
    // NUNCA mais exibir a frase "Crie um site Next.js..."

    const massiveBlueprint = `
[ARQUITETURA_CARREGADA] [MODO_EMERGENCIA_ELITE]
### BLUEPRINT TÉCNICO DE ENGENHARIA DISRUPTIVA PARA ${lead.name.toUpperCase()}

⚠️ SISTEMA DE CONTINGÊNCIA ATIVADO: A IA central atingiu o limite, mas a arquitetura de ${lead.niche} foi preservada.

1. CONFIGURAÇÃO DE AMBIENTE:
- Framework: Next.js 15 (App Router)
- Estilização: Tailwind CSS v4 + Framer Motion
- Tipografia: Space Grotesk (Titulos) e Inter (Corpo)

2. DESIGN IDENTITY & RADICAL COMMITMENT:
- Estilo: Brutalismo Minimalista com Glassmorphism localizado.
- Cores: Primária (#2F4F7F), Secundária (#8B9467), Fundo (#FFFFFF).
- Layout: Experimental Asymmetry (Grid 90/10).

3. HERO SECTION (COPY DE ALTA PERFORMANCE):
- Headline: "${lead.name}: A Nova Referência em Odontologia de ${lead.city}"
- Subheadline: "Excelência técnica, tecnologia de ponta e um atendimento que redefine o padrão de ${lead.niche} em ${lead.address}."
- Animação: Intro staggered com Spring Physics (Damping: 20, Stiffness: 100).

4. SERVIÇOS DE ELITE (INJEÇÃO TÉCNICA):
${(lead.services || ['Implantes de Elite', 'Estética Avançada', 'Checkup Digital']).map(s => `- ${s}: Implementar card com hover 'glow' e descrição detalhando a precisão técnica necessária para o nicho de ${lead.niche}.`).join('\n')}

5. PROVA SOCIAL (GOOGLE MAPS INTEGRADO):
- Status: ${lead.rating} estrelas em ${lead.totalRatings} avaliações reais.
- Localização: ${lead.address}
- Implemente um mural de reviews com scroll infinito utilizando 'framer-motion'.

6. CONVERSÃO SOCIAL (ELITE CTA):
- WhatsApp: ${lead.whatsapp || lead.phone || 'Verificar Contato'}
- Botão: Pulsante com indicador de status online e animação de entrada lateral.
`;

    return {
        preview_data: {
            headline: `${lead.name}: Liderança em ${lead.city}`,
            subheadline: `A experiência definitiva em ${lead.niche} agora 100% digital.`,
            benefits: ["Tecnologia de Ponta", "Localização Premium", "Atendimento VIP", "SEO Dominante", "Mobile First"],
            services: lead.services?.slice(0, 5) || ["Especialidade 1", "Especialidade 2"],
            testimonials: ["Simplesmente fantástico.", "O melhor de toda a cidade."],
            cta_text: "Quero meu Site Premium",
            cta_action: "WhatsApp",
            design_style: "Premium Modern",
            color_palette: ["#2F4F7F", "#8B9467", "#FFFFFF"],
            hero_image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop",
            layout_type: "experimental-asymmetry",
            builder_prompt: massiveBlueprint.trim()
        },
        summary: "Blueprint de Contingência Ativado para garantir a entrega de alta fidelidade."
    };
}
