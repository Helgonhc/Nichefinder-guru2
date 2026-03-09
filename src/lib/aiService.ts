import { BusinessData, GeneratorType } from "@/types/business";
import { getSystemPrompt, getUserPrompt } from "../../shared/aiPrompts.js";

const PIRAMYD_API_KEY = import.meta.env.VITE_PIRAMYD_API_KEY;

export const generateContent = async (
    business: BusinessData,
    type: GeneratorType | 'objections',
    userName: string = 'Você',
    objectionId: string = '',
    contactEmail: string = ''
) => {
    const rawKey = import.meta.env.VITE_PIRAMYD_API_KEY;
    const apiKey = rawKey?.replace(/['"]+/g, '').trim();

    if (!apiKey) {
        throw new Error("PIRAMYD API KEY não configurada no arquivo .env");
    }

    // Log para conferência
    console.log(`[Piramyd] Encaminhando geração para o AI Gateway local...`);

    const systemPrompt = getSystemPrompt(business, type, userName, 'D0', objectionId, contactEmail);
    const userPrompt = getUserPrompt(business, type, (business as any).audit || null, 'D0', userName, objectionId, contactEmail);

    try {
        // Chamada via AI Gateway local para evitar bloqueios de CSP e centralizar gestão de modelos
        const response = await fetch('/api/generate-preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                systemMessage: systemPrompt,
                userPrompt: userPrompt
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`[AI Gateway] Error:`, errorData);
            throw new Error(`Erro no AI Gateway: ${errorData.error || 'Falha na resposta'}`);
        }

        const data = await response.json();
        const content = data.content;

        if (!content) {
            throw new Error(`O AI Gateway não retornou conteúdo disponível.`);
        }

        console.log(`[Piramyd] Sucesso via Gateway! Modelo utilizado: ${data.model}`);
        return { content };

    } catch (err: any) {
        console.error(`[Piramyd] Falha crítica via Gateway:`, err.message);
        throw err;
    }
};
