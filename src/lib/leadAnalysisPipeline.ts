import { BusinessData } from "@/types/business";
import { analyzeSite } from "./siteAuditor";
import { generateRemakePreview } from "./remakePreviewEngine";
import { generateSalesOpportunity } from "./salesOpportunityEngine";

/**
 * Lead Analysis Pipeline
 * Executa os motores de análise em sequência: Auditoria -> Preview -> Oportunidade.
 * Melhorado com robustez para tratar falhas e ausência de dados.
 * 
 * @param lead Dados do lead para análise
 * @returns Objeto consolidado com auditoria, preview e oportunidade
 */
export async function analyzeLead(lead: BusinessData) {
    console.log('[PIPELINE] Starting lead analysis');

    let audit = null;
    let preview = null;
    let opportunity = null;

    // 1. Rodar auditoria do site (apenas se existir website)
    if (lead.website) {
        try {
            audit = await analyzeSite(lead.website);
            console.log('[PIPELINE] Audit completed');
        } catch (error) {
            console.error('[PIPELINE] Audit failed', error);
        }
    } else {
        console.log('[PIPELINE] Audit skipped: No website');
    }

    // 2. Gerar preview do site (protegido contra falhas de IA)
    try {
        preview = await generateRemakePreview(lead);
        console.log('[PIPELINE] Preview generated');
    } catch (error) {
        console.error('[PIPELINE] Preview generation failed', error);
    }

    // 3. Gerar oportunidade de venda (protegido contra falhas de lógica)
    try {
        opportunity = generateSalesOpportunity(audit, preview, lead);
        console.log('[PIPELINE] Sales opportunity created');
    } catch (error) {
        console.error('[PIPELINE] Sales opportunity generation failed', error);
    }

    console.log('[PIPELINE] Lead analysis finished');

    return {
        audit,
        preview,
        opportunity
    };
}

/**
 * EXEMPLO DE USO NO DASHBOARD:
 * 
 * import { analyzeLead } from "@/lib/leadAnalysisPipeline";
 * 
 * const result = await analyzeLead(lead);
 * 
 * console.log(result.audit);
 * console.log(result.preview);
 * console.log(result.opportunity);
 */
