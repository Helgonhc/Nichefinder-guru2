import { BusinessData, GeneratorType } from "@/types/business";
import { getSystemPrompt, getUserPrompt } from "../../shared/aiPrompts.js";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export const generateContent = async (
    business: BusinessData,
    type: GeneratorType | 'objections',
    userName: string = 'Você',
    objectionId: string = '',
    contactEmail: string = ''
) => {
    const rawKey = import.meta.env.VITE_GROQ_API_KEY;
    const apiKey = rawKey?.replace(/['"]+/g, '').trim();

    if (!apiKey) {
        throw new Error("GROQ API KEY não configurada no arquivo .env");
    }

    // Log mascarado para conferência do usuário (ajuda no debug do 401)
    console.log(`[Groq] Iniciando geração. Chave detectada: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`);

    const systemPrompt = getSystemPrompt(business, type, userName, 'D0', objectionId, contactEmail);
    const userPrompt = getUserPrompt(business, type, (business as any).audit || null, 'D0', userName, objectionId, contactEmail);

    const fallbackModels = [
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'gemma2-9b-it'
    ];

    let lastError: any = null;

    for (const currentModel of fallbackModels) {
        try {
            console.log(`[Groq] Tentando gerar conteúdo com modelo: ${currentModel}...`);
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
                const errorText = await response.text();
                console.error(`[Groq] API Error details (${currentModel}):`, {
                    status: response.status,
                    body: errorText
                });

                if (response.status === 429) {
                    console.warn(`[Groq] Limite estourado (429) no modelo ${currentModel}. Mudando de modelo...`);
                    continue;
                }
                if (response.status === 401) {
                    throw new Error(`Erro de Autenticação na Groq (401): Verifique se VITE_GROQ_API_KEY no .env é válida.`);
                }
                throw new Error(`Erro na API Groq (${currentModel}): ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;

            if (!content) {
                throw new Error(`A API Groq não retornou conteúdo com o modelo ${currentModel}.`);
            }

            console.log(`[Groq] Sucesso gerando com ${currentModel}!`);
            return { content };

        } catch (err: any) {
            lastError = err;
            console.warn(`[Groq] Falha com ${currentModel}: ${err.message}`);
        }
    }

    console.error(`[Groq] Falha crítica e definitiva após esgotar todos os modelos.`, lastError?.message);
    throw lastError;
};
