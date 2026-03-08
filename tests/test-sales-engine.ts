import { generateSalesOpportunity } from '../src/lib/salesOpportunityEngine';

const mockAudit = {
    https: false,
    mobileFriendly: false,
    performanceScore: 42,
    ctaClarity: false,
    seoScore: 30
};

const mockPreview = {
    preview_data: {
        headline: "Transforme sua Sorveteria com Gelatos de Elite",
        services: ["Gelato Artesanal", "Consultoria de Sabores", "Eventos Premiuns"],
        cta_text: "Fazer Pedido no WhatsApp",
        testimonials: ["Melhor gelato da cidade!"]
    }
};

const mockLead = {
    name: "Sorveteria Delícia",
    niche: "Sorveteria",
    website: "http://sorveteriadelicia.com"
};

const result = generateSalesOpportunity(mockAudit, mockPreview, mockLead);

console.log("\n=== TESTE SALES OPPORTUNITY ENGINE ===\n");
console.log("DIAGNOSIS:", JSON.stringify(result.diagnosis, null, 2));
console.log("IMPROVEMENTS:", JSON.stringify(result.improvements, null, 2));
console.log("IMPACT:", result.business_impact);
console.log("PITCH:", result.sales_pitch);
console.log("\n======================================\n");
