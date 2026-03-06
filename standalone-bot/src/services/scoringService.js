const scoringService = {
    scoreLead(lead, audit = null) {
        let score = 0;
        const reasons = [];

        if (lead.rating) {
            score += Math.min(lead.rating * 6, 30);
            if (lead.rating < 3.5) reasons.push('Baixa avaliação no Google');
        }

        if (lead.totalRatings > 50) score += 20;
        else if (lead.totalRatings > 10) score += 10;
        else reasons.push('Poucas avaliações (Invisível)');

        if (audit) {
            if (!audit.isSecure) score -= 15, reasons.push('Site Inseguro');
            if (audit.performanceScore < 50) score -= 10, reasons.push('Site Lento');
            if (!audit.socialLinks?.instagram) score -= 5, reasons.push('Sem Instagram visível');
        } else if (!lead.website) {
            score -= 25;
            reasons.push('NÃO POSSUI SITE (Crítico)');
        }

        let temperature = 'Frio';
        if (score > 70) temperature = '🔥 Quente';
        else if (score > 40) temperature = '☀️ Morno';

        return { score, temperature, reasons };
    }
};

export default scoringService;
