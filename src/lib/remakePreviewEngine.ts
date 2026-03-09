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
        site_diagnostics?: {
            score: number;
            problems: string[];
            suggestions: string[];
        };
    };
    summary: string;
    html_preview?: string; // HTML completo gerado pela IA para visualização
}

/**
 * Função dedicada para analisar a presença digital do lead.
 */
export async function analyzeWebsite(lead: BusinessData): Promise<{ score: number; problems: string[]; suggestions: string[] }> {
    console.log(`[Remake] Iniciando analyzeWebsite para: ${lead.website || lead.name}`);

    const systemMessage = `Você é um AUDITOR PROFISSIONAL. Analise o site e retorne:
Site Score: XX/100
Problemas identificados:
• item
Sugestões de melhoria:
• item
Seja extremamente direto.`;

    const userPrompt = `Lead: ${lead.name} | Nicho: ${lead.niche} | Website: ${lead.website || 'Nenhum'} | Audit: ${JSON.stringify(lead.audit || {})}`;

    try {
        const response = await fetch(`/api/generate-preview`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemMessage,
                userPrompt,
                model: 'Llama-4-maverick',
                maxTokens: 800
            })
        });

        const result = await response.json();
        const content = result.content;

        return parseDiagnosticResponse(content);
    } catch (err) {
        console.error("[Remake] Erro em analyzeWebsite:", err);
        return {
            score: lead.website ? 45 : 0,
            problems: ["Erro ao conectar com o motor de análise."],
            suggestions: ["Tente novamente em instantes."]
        };
    }
}

/**
 * Parser para o formato específico de resposta da Auditoria Digital.
 */
function parseDiagnosticResponse(content: string): { score: number; problems: string[]; suggestions: string[] } {
    const scoreMatch = content.match(/Site Score:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

    const problems: string[] = [];
    const suggestions: string[] = [];

    const lines = content.split('\n');
    let currentSection: 'problems' | 'suggestions' | null = null;

    for (const line of lines) {
        const text = line.trim();
        if (text.toLowerCase().includes('problemas identificados')) {
            currentSection = 'problems';
            continue;
        } else if (text.toLowerCase().includes('sugestões de melhoria')) {
            currentSection = 'suggestions';
            continue;
        }

        if (text.startsWith('•') || text.startsWith('-') || text.startsWith('*')) {
            const cleanText = text.replace(/^[•\-\*]\s*/, '').trim();
            if (cleanText) {
                if (currentSection === 'problems') problems.push(cleanText);
                else if (currentSection === 'suggestions') suggestions.push(cleanText);
            }
        }
    }

    return { score, problems, suggestions };
}

/**
 * Geração automática de uma proposta de redesign (Preview) usando IA.
 * NÍVEL: ULTRA GOD MODE GALAXY EDITION (3000+ PALAVRAS / BLUEPRINT DE ENGENHARIA RADICAL)
 */
export async function generateRemakePreview(
    lead: BusinessData,
    style: string = 'Premium Modern',
    model: string = 'Llama-4-maverick'
): Promise<RemakePreviewResult> {
    // Chamada via AI Gateway (porta 3002) — agora usando exclusivamente Piramyd Elite
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

        const hasWebsite = !!lead.website;
        const auditInfo = lead.audit ? `
AUDITORIA TÉCNICA REAL (Google PageSpeed):
- Performance: ${lead.audit.performanceScore}/100
- SEO: ${lead.audit.seoScore}/100
- Responsivo: ${lead.audit.isResponsive ? 'Sim' : 'Não'}
- HTTPS: ${lead.audit.isSecure ? 'Sim' : 'Não'}
` : '';

        const systemMessage = `Você é um especialista em auditoria de presença digital e design de websites.

Sua tarefa é:
1. Analisar a presença digital da empresa.
2. Avaliar a qualidade do site atual (se existir).
3. Criar um conceito de redesign profissional para essa empresa.

Critérios de avaliação:
- design visual
- clareza da proposta de valor
- estrutura de navegação
- presença de CTA
- prova social
- autoridade da marca

Retorne um objeto JSON com:
- headline
- subheadline
- benefits
- services
- testimonials
- design_style
- color_palette
- layout_type
- site_diagnostics
- builder_prompt

O builder_prompt deve explicar como recriar um site moderno para esse negócio. (MÁXIMO 200 PALAVRAS).
O retorno DEVE ser EXCLUSIVAMENTE o JSON válido.`;

        const userPrompt = `DADOS DO LEAD:
- Empresa: ${lead.name}
- Nicho: ${lead.niche} (${lead.categoria})
- Localização: ${lead.address}, ${lead.city}
- Website Atual: ${lead.website || 'Nenhum'}
${auditInfo}

DEPOIMENTOS REAIS:
${reviewsInstruction}
${reviewsSource}

ESTRUTURA ESPERADA DO JSON (Respeite os tipos e nomes das chaves):
{
  "headline": "Título de Elite",
  "subheadline": "Copy persuasivo",
  "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "services": ["Service 1", "Service 2", "Service 3"],
  "site_diagnostics": {
    "score": 0,
    "problems": ["Problema 1", "Problema 2"],
    "suggestions": ["Melhoria 1", "Melhoria 2"]
  },
  "service_details": [ { "title": "...", "description": "..." } ],
  "testimonials": [ "Depoimentos" ],
  "cta_text": "Texto CTA",
  "design_style": "${style}",
  "color_palette": ["HEX1", "HEX2", "HEX3"],
  "layout_type": "modern-split | experimental-asymmetry",
  "summary": "Resumo estratégico",
  "builder_prompt": "Máximo de 200 palavras explicando o layout..."
}`;

        // Chamada via AI Gateway (porta 3002) — server-to-server, sem bloqueio de quota do browser
        const response = await fetch(`http://localhost:3002/generate-preview`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ systemMessage, userPrompt, model })
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
            content = JSON.parse(cleanJsonPayload(rawContent));
        } catch (parseError) {
            console.error("JSON Parse Error, attempting recovery...", parseError);

            // Tenta isolar apenas o bloco JSON caso haja texto ao redor
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    content = JSON.parse(cleanJsonPayload(jsonMatch[0]));
                } catch (e) {
                    console.error("Failed to parse matched JSON block:", e);
                    // Tentativa desesperada de fechamento se o builder_prompt for o culpado (truncamento)
                    if (rawContent.includes('"builder_prompt": "')) {
                        try {
                            // Tenta fechar a string e o objeto se parecer truncado
                            const simplified = rawContent.trim().replace(/[^\}]*$/, '') + '"}';
                            content = JSON.parse(cleanJsonPayload(simplified));
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

        // O HTML preview agora é desacoplado para performance (gerado sob demanda no frontend)
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
                site_diagnostics: content.site_diagnostics || {
                    score: lead.website ? 45 : 0,
                    problems: lead.website ? ["Design datado", "Baixa conversão"] : [],
                    suggestions: lead.website ? ["Modernizar UI/UX", "Adicionar CTAs claros"] : []
                },
            },
            summary: content.summary,
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

/**
 * Limpa o payload retornado pela IA para garantir que seja um JSON válido.
 * Trata blocos de código markdown, caracteres de controle e quebras de linha ilegais.
 */
function cleanJsonPayload(str: string): string {
    if (!str) return "";

    let cleaned = str.trim();

    // 1. Remover blocos de código Markdown (```json ... ```)
    cleaned = cleaned.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1');

    // 2. Tratar caracteres de controle ilegais dentro de strings JSON
    // Esta regex identifica conteúdo entre aspas duplas e escapa quebras de linha reais
    cleaned = cleaned.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/gs, (match, p1) => {
        // Substitui quebras de linha reais por \n literal para o JSON.parse aceitar
        const escaped = p1
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r")
            .replace(/\t/g, "\\t");
        return `"${escaped}"`;
    });

    // 3. Remover vírgulas trapalheiras (trailing commas) antes de fechar chaves/colchetes
    cleaned = cleaned.replace(/,\s*([\]\}])/g, '$1');

    return cleaned.trim();
}
