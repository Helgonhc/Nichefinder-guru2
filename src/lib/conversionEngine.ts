import { BusinessData } from "@/types/business";

/**
 * Calcula o Lead Score baseado em dor e oportunidade.
 * Escala 0-100.
 */
export function scoreLead(lead: BusinessData): { score: number; temperature: 'frio' | 'morno' | 'quente'; reason: string } {
    let score = 0;
    let reasons: string[] = [];

    const isTelemetria = ['telemetria', 'condominio', 'shopping', 'logistico', 'hospital', 'industria', 'predio'].some(kw => (lead.niche || '').toLowerCase().includes(kw));

    if (isTelemetria) {
        // Regras Mapeamento Técnico de Engenharia
        score += 25; // Oportunidade base alta para visita técnica
        reasons.push("Infraestrutura Não Monitorada (Oportunidade de Dossiê)");

        if (lead.totalRatings && lead.totalRatings > 50) {
            score += 15;
            reasons.push("Alta Circulação de Pessoas (Risco Hídrico Crítico)");
        }
        if (lead.rating && lead.rating < 4) {
            score += 10;
            reasons.push("Gestão sob pressão (Possíveis falhas técnicas frequentes)");
        }
        if (!lead.whatsapp) {
            score += 5;
            reasons.push("Contato primário dificultado (Mapeamento Local Recomendado)");
        }
    } else {
        // Regras Presença Digital Tradicionais
        // 1. Oportunidade de Site (+25 se não tem site)
        const hasNoWebsite = !lead.website || lead.website === "" || lead.siteType === 'none';
        if (hasNoWebsite) {
            score += 25;
            reasons.push("Ausência de Site (Oportunidade Máxima)");
        } else {
            // 2. Falhas no Site Existente (+20 total se problemas técnicos)
            if (!lead.isSecure || (lead.audit && !lead.audit.https)) {
                score += 10;
                reasons.push("Site inseguro (sem SSL)");
            }
            if ((lead.performanceScore && lead.performanceScore < 50) || (lead.audit && lead.audit.speedScore < 50)) {
                score += 10;
                reasons.push("Performance crítica (lento)");
            }
            if (lead.mobileFriendly === false || (lead.audit && !lead.audit.mobileFriendly)) {
                score += 10;
                reasons.push("Incompatível com Mobile");
            }

            // SEO/CTA Clarity (+5 cada)
            if (lead.audit && !lead.audit.seoBasics) score += 5;
            if (lead.audit && !lead.audit.ctaClarity) {
                score += 5;
                reasons.push("Falta de Chamadas para Ação (CTA)");
            }
        }

        // 3. Redes Sociais Ativas
        if (lead.instagramHandle || lead.instagramAtivo || lead.instagram) {
            score += 10;
            reasons.push("Presença ativa no Instagram");
        }

        if (lead.facebook) {
            score += 5;
            reasons.push("Presença no Facebook");
        }

        if (lead.tiktok) {
            score += 5;
            reasons.push("Presença no TikTok");
        }

        // 4. Prova Social / Autoridade (+10 se indicativo de negócio vivo)
        if (lead.totalRatings && lead.totalRatings > 50) {
            score += 10; // Indica ticket/fluxo
            reasons.push("Negócio consolidado (>50 reviews)");
        }

        // Baixa reputação / dor (+5)
        if (lead.rating && lead.rating < 4) {
            score += 5;
            reasons.push("Baixa reputação no Google");
        }

        // 5. Nicho Premium (+15)
        const premiumNiches = ['advocacia', 'clinica', 'medico', 'estetica', 'energia_solar', 'imobiliaria', 'arquitetura'];
        if (lead.niche && premiumNiches.some(n => lead.niche.toLowerCase().includes(n))) {
            score += 15;
            reasons.push("Nicho de Alto Ticket");
        }
    }

    // 6. Contato disponível (+10) - GLOBAL
    if (lead.phone || lead.whatsapp || lead.email) {
        score += 10;
    }

    // Normalização (Max 100)
    score = Math.min(100, score);

    // Temperatura
    let temperature: 'frio' | 'morno' | 'quente' = 'frio';
    if (score >= 70) temperature = 'quente';
    else if (score >= 40) temperature = 'morno';

    return {
        score,
        temperature,
        reason: reasons[0] || (isTelemetria ? "Mapeamento Incompleto" : "Oportunidade Digital")
    };
}
