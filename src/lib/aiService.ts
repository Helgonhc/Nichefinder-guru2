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

    // Log mascarado para conferência do usuário
    console.log(`[Piramyd] Iniciando geração. Chave detectada: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`);

    const systemPrompt = getSystemPrompt(business, type, userName, 'D0', objectionId, contactEmail);
    const userPrompt = getUserPrompt(business, type, (business as any).audit || null, 'D0', userName, objectionId, contactEmail);

    const fallbackModels = [
        'Llama-4-maverick',
        'gpt-5.3-codex',
        'Glm-5'
    ];

    let lastError: any = null;

    for (const currentModel of fallbackModels) {
        try {
            console.log(`[Piramyd] Tentando gerar conteúdo com modelo: ${currentModel}...`);
            const response = await fetch('https://api.piramyd.cloud/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: currentModel,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.9,
                    max_tokens: 2048
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error(`[Piramyd] API Error details (${currentModel}):`, {
                    status: response.status,
                    body: errorData
                });

                if (response.status === 429) {
                    console.warn(`[Piramyd] Limite estourado (429) no modelo ${currentModel}. Mudando de modelo...`);
                    continue;
                }
                if (response.status === 401) {
                    throw new Error(`Erro de Autenticação na Piramyd (401): Verifique se VITE_PIRAMYD_API_KEY no .env é válida.`);
                }
                throw new Error(`Erro na API Piramyd (${currentModel}): ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;

            if (!content) {
                throw new Error(`A API Piramyd não retornou conteúdo com o modelo ${currentModel}.`);
            }

            console.log(`[Piramyd] Sucesso gerando com ${currentModel}!`);
            return { content };

        } catch (err: any) {
            lastError = err;
            console.warn(`[Piramyd] Falha com ${currentModel}: ${err.message}`);
        }
    }

    console.error(`[Piramyd] Falha crítica e definitiva após esgotar todos os modelos.`, lastError?.message);
    throw lastError;
};
