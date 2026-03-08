/**
 * @agent @piramyd-coder
 * @description Sales Opportunity Engine - Transformador de dados técnicos em argumentos comerciais.
 */

export interface SalesOpportunity {
    diagnosis: string[];
    improvements: string[];
    business_impact: string;
    sales_pitch: string;
}

/**
 * Gera uma análise de oportunidade de venda baseada na auditoria e no preview da IA.
 * 
 * @param auditData Resultado do Site Auditor (technical_audit)
 * @param previewData Resultado do Remake Preview Engine (site_preview)
 * @param lead Dados da empresa (lead)
 */
export const generateSalesOpportunity = (
    auditData: any,
    previewData: any,
    lead: any
): SalesOpportunity => {
    console.log('[SALES ENGINE] Generating opportunity analysis for:', lead.name);

    // --- TAREFA 3: ANALISAR PROBLEMAS DO SITE (DIAGNOSIS) ---
    const diagnosis: string[] = [];

    if (auditData) {
        if (auditData.isDown) {
            diagnosis.push("O site atual está fora do ar ou inacessível");
        } else {
            if (!auditData.https && !auditData.isSecure) {
                diagnosis.push("Ausência de certificado SSL (Site marcado como 'Inseguro' pelo Google)");
            }
            if (!auditData.mobileFriendly && !auditData.isResponsive) {
                diagnosis.push("O site não é adaptado para dispositivos móveis (Dificulta a leitura no celular)");
            }
            if ((auditData.performanceScore || 0) < 50) {
                diagnosis.push(`Baixa performance de carregamento (${auditData.performanceScore || 0}/100)`);
            }
            if (!auditData.ctaClarity) {
                diagnosis.push("Ausência de chamadas para ação (CTA) claras para conversão");
            }
            if ((auditData.seoScore || 0) < 50) {
                diagnosis.push("Baixa otimização para buscas (SEO), dificultando ser encontrado organicamente");
            }
        }
    } else if (!lead.website) {
        diagnosis.push("A empresa ainda não possui um site institucional próprio");
    }

    console.log('[SALES ENGINE] Diagnosis generated:', diagnosis.length, 'points identified');

    // --- TAREFA 4: USAR PREVIEW PARA MELHORIAS (IMPROVEMENTS) ---
    const improvements: string[] = [];
    const p = previewData?.preview_data || previewData; // Suporte a diferentes formatos de wrap

    if (p) {
        if (p.headline) {
            improvements.push(`Nova Headline focada em conversão: "${p.headline}"`);
        }
        if (p.cta_text) {
            improvements.push(`Botão de ação estratégico: "${p.cta_text}"`);
        }
        if (p.services && p.services.length > 0) {
            improvements.push(`Exposição profissional dos serviços: ${p.services.slice(0, 3).join(', ')}`);
        }
        if (p.testimonials && p.testimonials.length > 0) {
            improvements.push("Inclusão de Mural de Depoimentos para gerar Prova Social");
        }
        if (p.design_style) {
            improvements.push(`Design modernizado no estilo ${p.design_style}`);
        }
    }

    console.log('[SALES ENGINE] Improvements mapped');

    // --- TAREFA 5: GERAR IMPACTO DE NEGÓCIO (BUSINESS IMPACT) ---
    let business_impact = "";
    if (!lead.website) {
        business_impact = "A criação de uma presença digital profissional permitirá que a empresa seja encontrada por novos clientes que buscam seus serviços no Google e redes sociais, aumentando a autoridade e o volume de orçamentos.";
    } else {
        business_impact = "Resolver as falhas técnicas e modernizar o design aumentará a taxa de conversão do site. Um site rápido, seguro e adaptado para celulares transmite maior credibilidade, reduz o abandono de usuários e gera mais contatos diretos via WhatsApp.";
    }

    // --- TAREFA 6: GERAR SALES PITCH ---
    const sales_pitch = `Olá, ${lead.name}! Analisei a presença digital da sua empresa e identifiquei alguns pontos críticos, como ${diagnosis[0]?.toLowerCase() || 'oportunidades de melhoria no design'}, que podem estar limitando o seu alcance de novos clientes. 

Tomei a liberdade de criar uma prévia de como o seu site poderia ficar com um visual moderno e focado em vendas. Com essas melhorias em ${lead.niche || 'seu setor'}, podemos aumentar drasticamente a confiança de quem visita seu perfil e converter mais curiosos em clientes reais. Podemos conversar sobre como implementar isso?`;

    console.log('[SALES ENGINE] Sales pitch ready');

    return {
        diagnosis,
        improvements,
        business_impact,
        sales_pitch
    };
};
