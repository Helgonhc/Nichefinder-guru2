import { BusinessData } from "../types/business";

export interface OpportunityResult {
    opportunity_score: number;
    opportunity_level: "low" | "medium" | "high" | "very_high";
    primary_reason: string;
    secondary_reason: string;
    recommended_offer: string;
    opportunity_summary: string;
    opportunity_flags: string[];
}

/**
 * Opportunity Engine - Motor de Qualificação de Leads
 * Analisa a presença digital do lead e calcula o potencial de fechamento (Opportunity Score).
 */
export const calculateOpportunity = (lead: BusinessData): OpportunityResult => {
    let score = 0;
    const flags: string[] = [];
    const reasons: string[] = [];

    // 1. Análise de Website e Domínio
    const hasProprietarySite = lead.siteType === 'proprietary' || (lead.website && !lead.website.includes('instagram.com') && !lead.website.includes('facebook.com'));
    const isOnlySocial = lead.siteType === 'social' || (lead.website && (lead.website.includes('instagram.com') || lead.website.includes('facebook.com')));
    const noSite = lead.siteType === 'none' || !lead.website;

    if (noSite) {
        score += 40;
        flags.push("SEM_SITE");
        reasons.push("Empresa não possui site institucional próprio");
    } else if (isOnlySocial) {
        score += 12;
        flags.push("APENAS_REDE_SOCIAL");
        reasons.push("Utiliza redes sociais como link principal, sem domínio profissional");
    }

    // 2. Pontuação de Presença Digital (Presence Score)
    if (lead.presenceScore < 30) {
        score += 20;
        flags.push("BAIXISSIMA_PRESENCA");
        reasons.push("Presença digital crítica (abaixo de 30%)");
    } else if (lead.presenceScore < 50) {
        score += 12;
        flags.push("BAIXA_PRESENCA");
        reasons.push("Presença digital fraca (abaixo de 50%)");
    }

    // 3. Prova Social (Reviews)
    const totalReviews = lead.totalRatings || 0;
    if (totalReviews >= 20) {
        score += 10;
        flags.push("PROVA_SOCIAL_ATIVA");
        reasons.push("Empresa possui boa movimentação de avaliações (prova social)");
    }

    // 4. Análise Técnica da Auditoria (se existir)
    if (lead.audit) {
        if (!lead.audit.ctaClarity) {
            score += 10;
            flags.push("SEM_CTA");
            reasons.push("Site sem chamadas para ação (CTA) claras");
        }
        if (!lead.audit.https && !lead.audit.isSecure) {
            score += 8;
            flags.push("SEM_SSL");
            reasons.push("Site inseguro (sem certificado SSL)");
        }
        if (lead.audit.mobileFriendly === false || lead.audit.isResponsive === false) {
            score += 10;
            flags.push("NAO_RESPONSIVO");
            reasons.push("Site apresenta problemas de visualização em dispositivos móveis");
        }

        // SEO Score
        const seo = lead.audit.seoScore || lead.seoScore || 0;
        if (seo > 0 && seo < 50) {
            score += 12;
            flags.push("SEO_FRACO");
            reasons.push("Otimização para motores de busca (SEO) deficiente");
        }

        // Conversion/Performance
        const conversion = lead.audit.performanceScore || lead.performanceScore || 0;
        if (conversion > 0 && conversion < 50) {
            score += 14;
            flags.push("CONVERSAO_FRACA");
            reasons.push("Site com carregamento lento e baixa taxa de conversão");
        }
    }

    // 5. Dados de Contato
    if (lead.phone || lead.email) {
        score += 5;
        flags.push("CONTATO_DIRETO_DISPONIVEL");
    }

    // 6. Nichos Estratégicos (High Value)
    const strongNiches = ['dentista', 'clinica', 'estetica', 'advogado', 'academia', 'restaurante', 'medico', 'arquitetura'];
    const leadNiche = (lead.niche || '').toLowerCase();
    if (strongNiches.some(n => leadNiche.includes(n))) {
        score += 8;
        flags.push("NICHO_ALTO_VALOR");
        reasons.push("Nicho de mercado com alto ticket médio e necessidade de autoridade digital");
    }

    // 7. Cidades Grandes (Potencial de Mercado)
    const bigCitiesKeywords = ['são paulo', 'rio de janeiro', 'belo horizonte', 'curitiba', 'porto alegre', 'brasília', 'salvador', 'fortaleza'];
    const leadCity = (lead.city || '').toLowerCase();
    if (bigCitiesKeywords.some(c => leadCity.includes(c))) {
        score += 5;
        flags.push("MERCADO_AQUECIDO");
    }

    // --- Normalização do Score (0 - 100) ---
    const finalScore = Math.min(score, 100);

    // --- Nível de Oportunidade ---
    let level: OpportunityResult["opportunity_level"] = "low";
    if (finalScore >= 85) level = "very_high";
    else if (finalScore >= 65) level = "high";
    else if (finalScore >= 40) level = "medium";

    // --- Oferta Recomendada ---
    let offer = "Análise estratégica de presença digital";
    if (noSite) {
        offer = "Site institucional + Google Meu Negócio + WhatsApp comercial";
    } else if (isOnlySocial) {
        offer = "Landing page + domínio próprio + botão de WhatsApp";
    } else if (flags.includes("CONVERSAO_FRACA") || flags.includes("SEM_CTA")) {
        offer = "Redesign focado em conversão";
    } else if (flags.includes("SEO_FRACO")) {
        offer = "Otimização de SEO local";
    }

    // --- Resumo e Motivos ---
    const primaryReason = reasons[0] || "Necessidade de melhor posicionamento digital";
    const secondaryReason = reasons[1] || (flags.length > 2 ? `Presença em canais como ${lead.foundItems.join(', ')} pode ser otimizada` : "Potencial de escala inexplorado");

    const summary = `Lead com ${finalScore}% de potencial de conversão. ${noSite ? 'A ausência de um site próprio' : 'A qualidade atual da presença digital'} representa uma oportunidade clara de melhoria com foco em ${offer.split('+')[0].trim()}.`;

    return {
        opportunity_score: finalScore,
        opportunity_level: level,
        primary_reason: primaryReason,
        secondary_reason: secondaryReason,
        recommended_offer: offer,
        opportunity_summary: summary,
        opportunity_flags: flags
    };
};
