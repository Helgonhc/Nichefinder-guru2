import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { business, type, apiKey } = await req.json();
    const PIRAMYD_API_KEY = Deno.env.get('PIRAMYD_API_KEY') || apiKey;

    if (!PIRAMYD_API_KEY) {
      throw new Error('PIRAMYD_API_KEY não configurada. Configure no Supabase Secrets ou envie via body.');
    }

    const nicheName = (business.niche || '').toLowerCase();
    const isSportsNiche = nicheName.includes('areia') ||
      nicheName.includes('futevoley') ||
      nicheName.includes('futevôlei') ||
      nicheName.includes('beach tennis') ||
      nicheName.includes('quadra') ||
      nicheName.includes('arena');

    const missingItems = business.missingItems?.join(', ') || 'presença digital';
    const foundItems = business.foundItems?.join(', ') || 'nenhum';
    const presenceScore = business.presenceScore || 0;

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'script') {
      systemPrompt = `Você é uma pessoa comum e cordial que ajuda negócios locais.
Seu objetivo é criar mensagens de WhatsApp extremamente naturais e educadas.

REGRAS OBRIGATÓRIAS (PENA DE ERRO):
- NUNCA use as palavras: "Especialista", "B2B", "Alta Conversão", "Vendas", "Agência", "SaaS", "Otimização" ou "Taxa de Conversão".
- NÃO fale "Estou entrando em contato". Fale "Oi", "Tudo bem?", "Vi o perfil de vocês aqui".
- NÃO pareça uma empresa ou robô. Pareça uma pessoa comum ajudando outra.
- Seja muito cordial ("Oi, tudo bem?", "Espero que esteja bem").
- MENCIONE O NOME DA EMPRESA (${business.name}) e a CIDADE (${business.city}) casualmente.
`;

      let nicheSpecificContext = '';
      if (isSportsNiche) {
        nicheSpecificContext = `Dica: Como eles são do esporte, mencione que existe um jeito fácil dos clientes agendarem pelo WhatsApp (ReservaAI).`;
      }

      userPrompt = `Escreva uma mensagem de WhatsApp para:
EMPRESA: ${business.name}
CIDADE: ${business.city}
Foco: ${missingItems.includes('site') ? 'Falta de um site legal' : 'Melhorar a presença no Google'}

A mensagem deve ser curta, amigável e sem papo de vendedor chato.`;
    } else {
      systemPrompt = `Você é um analista de marketing digital e especialista em negócios locais brasileiros.`;
      userPrompt = `Analise a empresa ${business.name} do nicho ${business.niche} em ${business.city}. 
      Ela tem score de ${presenceScore}%. Gere um diagnóstico rápido de 3 pontos de melhoria.`;
      if (isSportsNiche) {
        userPrompt += ` Sugira o uso do sistema ReservaAI (https://reservaai.com.br/) como diferencial tecnológico.`;
      }
    }

    // Piramyd Cloud API Call
    const response = await fetch('https://api.piramyd.cloud/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PIRAMYD_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-4-maverick',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Piramyd API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'Não foi possível gerar o conteúdo.';

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno na função' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
