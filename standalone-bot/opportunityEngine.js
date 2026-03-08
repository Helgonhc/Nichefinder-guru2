/**
 * Opportunity Engine (JS Version for Standalone Bot)
 */

export function calculateOpportunity(lead) {
    let score = 0;
    const flags = [];
    const audit = lead.audit || lead.technical_audit || (lead.meta_data && lead.meta_data.technical_audit) || {};

    // 1. PRESENÇA ONLINE (Base: 40 pts)
    if (!lead.website) {
        score += 35;
        flags.push("SEM_WEBSITE");
    } else {
        // Se tem site, avaliamos a qualidade
        if (audit.performanceScore !== undefined && audit.performanceScore < 40) {
            score += 15;
            flags.push("SITE_LENTO");
        }
        if (audit.isSecure === false || audit.https === false) {
            score += 15;
            flags.push("SITE_INSEGURO");
        }
        if (audit.isResponsive === false || audit.mobileFriendly === false) {
            score += 10;
            flags.push("NAO_RESPONSIVO");
        }
    }

    // 2. GOOGLE MEU NEGÓCIO & REPUTAÇÃO (Base: 30 pts)
    const rating = lead.rating || 0;
    const totalRatings = lead.totalRatings || lead.total_ratings || 0;

    if (rating > 0 && rating < 4.2) {
        score += 15;
        flags.push("BAIXA_AVALIACAO");
    }
    if (totalRatings > 0 && totalRatings < 10) {
        score += 15;
        flags.push("POUCAS_AVALIACOES");
    } else if (totalRatings === 0) {
        score += 20;
        flags.push("SEM_AVALIACOES");
    }

    // 3. CANAIS DE CONTATO (Base: 30 pts)
    if (!lead.phone && !lead.whatsapp) {
        score += 10; // Menor score pois é difícil contatar, mas é uma falha
        flags.push("DIFICIL_CONTATO");
    }

    const hasInstagram = !!(lead.instagram || (audit.socialLinks && audit.socialLinks.instagram));
    if (!hasInstagram) {
        score += 20;
        flags.push("SEM_INSTAGRAM");
    }

    // 4. NICHO PREMIUM (Multiplicador)
    const premiumNiches = ['advocacia', 'clinica', 'medico', 'estetica', 'energia_solar', 'imobiliaria', 'arquitetura', 'beach_tennis'];
    const niche = (lead.niche || '').toLowerCase();
    const isPremium = premiumNiches.some(p => niche.includes(p));

    if (isPremium) {
        score += 10;
        flags.push("NICHO_VALOR_ALTO");
    }

    // Normalização (0-100)
    const finalScore = Math.min(score, 100);

    // Determinação de Nível
    let level = "low";
    if (finalScore >= 85) level = "very_high";
    else if (finalScore >= 60) level = "high";
    else if (finalScore >= 35) level = "medium";

    // Razões e Ofertas Recomendadas
    let primaryReason = "Presença digital básica identificada.";
    let secondaryReason = "Oportunidade de melhoria em canais de conversão.";
    let recommendedOffer = "Criação de Site Exclusivo";
    let summary = "Lead com potencial de modernização digital.";

    if (flags.includes("SEM_WEBSITE")) {
        primaryReason = "Empresa não possui website oficial, perdendo buscas no Google.";
        recommendedOffer = "Site de Alta Conversão + SEO Local";
    } else if (flags.includes("SITE_LENTO") || flags.includes("NAO_RESPONSIVO")) {
        primaryReason = "Experiência do usuário prejudicada por tecnologia obsoleta ou lentidão.";
        recommendedOffer = "Redesign Premium (Foco em Performance)";
    }

    if (flags.includes("BAIXA_AVALIACAO") || flags.includes("SEM_AVALIACOES")) {
        secondaryReason = "Reputação no Google Maps precisa de gestão estratégica.";
    }

    if (level === "very_high") {
        summary = "Oportunidade Crítica: Empresa invisível ou obsoleta em mercado competitivo.";
    } else if (level === "high") {
        summary = "Oportunidade Elevada: Presença digital frágil com gaps claros de autoridade.";
    }

    return {
        opportunity_score: finalScore,
        opportunity_level: level,
        primary_reason: primaryReason,
        secondary_reason: secondaryReason,
        recommended_offer: recommendedOffer,
        opportunity_summary: summary,
        opportunity_flags: flags
    };
}
