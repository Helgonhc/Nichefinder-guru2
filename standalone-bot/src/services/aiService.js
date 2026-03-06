import fetch from 'node-fetch';
import config from '../config.js';
import logger from '../utils/logger.js';
import { getSystemPrompt, getUserPrompt } from '../../../shared/aiPrompts.js';

const aiService = {
    async generateAIContent(business, type, auditResult = null, cadenceStage = 'D0', userName = 'Você') {
        if (!config.apis.groq) {
            logger.error('VITE_GROQ_API_KEY não configurada');
            return null;
        }

        const systemPrompt = getSystemPrompt(business, type, userName, cadenceStage);
        const userPrompt = getUserPrompt(business, type, auditResult, cadenceStage, userName);

        const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'];

        for (const model of models) {
            try {
                logger.ai(`Tentando gerar conteúdo com modelo: ${model}...`);
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.apis.groq}`
                    },
                    body: JSON.stringify({
                        model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        temperature: 0.8,
                        max_tokens: 1024
                    })
                });

                if (response.status === 429) continue;

                const data = await response.json();
                return data.choices?.[0]?.message?.content || null;
            } catch (err) {
                logger.error(`Falha com modelo ${model}:`, err.message);
            }
        }
        return null;
    }
};

export default aiService;
