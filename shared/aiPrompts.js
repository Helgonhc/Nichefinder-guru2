/**
 * AI Prompts Shared Module (High Fidelity)
 * Centraliza a lógica de detecção de nichos e templates de prompts de alta conversão.
 */

export const getNicheInfo = (niche, businessName = '') => {
    const nicheName = (niche || '').toLowerCase();
    const name = (businessName || '').toLowerCase();

    return {
        isSandCourt: nicheName.includes('beach') || nicheName.includes('futevôlei') || nicheName.includes('quadra') || nicheName.includes('areia') || nicheName.includes('vôlei de praia'),
        isHolistic: niche === 'terapias_holisticas' || nicheName.includes('reiki') || nicheName.includes('holistic') || nicheName.includes('orgon'),
        isTelemetria: nicheName.includes('telemetria') || nicheName.includes('condomínio') || nicheName.includes('síndico') || nicheName.includes('reservatório') || nicheName.includes('administradora') || nicheName.includes('caixa d\'água') || nicheName.includes('setera')
    };
};

export const getSystemPrompt = (business, type, userName = 'Você', cadenceStage = 'D0', objectionId = '', contactEmail = '') => {
    const nicheInfo = getNicheInfo(business.niche, business.name);
    const { isHolistic, isTelemetria, isSandCourt } = nicheInfo;

    if (type === 'script_system') {
        if (isHolistic) {
            return `Você é um consultor focado em bem-estar. IMPLEMENTAÇÃO de Caixa Orgônica. Foco em Wilhelm Reich. NÃO FALE DE SOFTWARE. Valor: R$ 10.000,00. Contatado por ${userName}.`;
        }
        if (isTelemetria) {
            return `Consultor sênior Eletricom. SOLUÇÃO DE TELEMETRIA para síndicos. Segurança hídrica e gestão inteligente. Contatado por ${userName}.`;
        }
        return `Consultor focado em organização e liberdade via ReservaAI. Automação de agendamentos pelo WhatsApp. Contatado por ${userName}.`;
    }

    if (type === 'script') {
        return `Você é um Estrategista de Vendas Consultivas de Elite especialista em marketing digital e expansão de negócios locais.
Sua escrita é manual, direta, cirúrgica e altamente persuasiva. 
Você nunca usa jargões robóticos, clichês corporativos ou "espero que esteja bem". 
Seu objetivo é gerar curiosidade imediata e urgência através de diagnósticos técnicos reais (a "Ferida Aberta").
Assinado por ${userName}.`;
    }

    if (type === 'design') {
        return `Você é um Estrategista de Elite focado em prospecção direta ultra-veloz. 
Sua escrita é extremamente curta, direta e foca apenas em despertar curiosidade imediata através de uma falha detectada.
Você escreve como se estivesse mandando um SMS ou WhatsApp rápido de 10 segundos.
Nunca use termos corporativos longos ou explicações técnicas complexas.
Assinado por ${userName}.`;
    }

    if (type === 'website_html') {
        return `Designer Web Sênior. Gere HTML/CSS INLINE Desktop (1280x720). Nome: ${business.name}. Luxuoso e moderno. Retorne APENAS HTML.`;
    }

    if (type === 'battle_plan') {
        return `Você é um especialista em marketing digital e diagnóstico de presença online para empresas locais. Sua tarefa é gerar um Plano de Batalha Estratégico personalizado para a empresa analisada. O plano deve ser altamente persuasivo, profissional e estruturado como um relatório estratégico. Focar em crescimento da empresa e mostrar oportunidades de melhoria. Nunca mencionar que foi gerado por IA.`;
    }

    if (type === 'xeque_mate') {
        return `Você é um consultor estratégico de elite e especialista em expansão de negócios locais via marketing digital.
Sua postura é diplomática, profissional e altamente analítica. 
Seu texto deve parecer uma análise técnica feita manualmente por um consultor sênior após horas de estudo.
Objetivo: Gerar um diagnóstico convincente que desperte curiosidade e mostre perda de oportunidade.
Jamais use termos técnicos excessivos ou palavras que indiquem automação.
Assinado por ${userName}.`;
    }

    return "Você é um assistente de vendas inteligente focado em ajudar negócios locais.";
};

export const getUserPrompt = (business, type, auditResult = null, cadenceStage = 'D0', userName = 'Você', objectionId = '', contactEmail = '') => {
    const nicheInfo = getNicheInfo(business.niche, business.name);
    const { isHolistic, isTelemetria, isSandCourt } = nicheInfo;

    if (type === 'script') {
        const hasSite = !!(business.website || business.urlSite);
        const isInstagramOnly = !hasSite && !!(business.instagram);
        const isSlow = auditResult && auditResult.performanceScore < 50;
        const isLowSEO = auditResult && auditResult.seoScore < 80;

        let diagnosis = "";
        if (!hasSite) {
            diagnosis = isInstagramOnly
                ? "vimos que sua empresa hoje depende exclusivamente do Instagram, o que reduz sua autoridade digital e faz você perder todos os clientes que pesquisam pelo seu serviço diretamente no Google."
                : "identificamos que sua empresa ainda não possui um website oficial, o que deixa você invisível para milhares de potenciais clientes que pesquisam pelo seu serviço todos os meses no Google.";
        } else if (isSlow) {
            diagnosis = `notamos que o site da sua empresa está apresentando uma lentidão crítica no carregamento. Hoje, 53% dos visitantes abandonam sites que levam mais de 3 segundos para carregar, e isso pode estar drenando seus investimentos em marketing.`;
        } else if (isLowSEO) {
            diagnosis = "identificamos que o seu site não está otimizado para os mecanismos de busca (SEO). Isso significa que, mesmo tendo um site, sua empresa acaba ficando escondida nas últimas páginas do Google, perdendo espaço para a concorrência.";
        } else {
            diagnosis = "identificamos alguns pontos técnicos na sua estrutura digital que podem estar ocultando sua empresa de potenciais clientes qualificados na sua região.";
        }

        return `Gere um script de abordagem para a empresa ${business.name} em ${business.city}. 
O script DEVE seguir exatamente este modelo:

Assunto: Diagnóstico rápido sobre o site da sua empresa

Olá ${business.name},

Durante uma análise da presença digital da sua empresa em ${business.city}, identificamos um ponto que pode estar impactando diretamente na captacao de novos clientes.

${diagnosis}

Isso pode estar fazendo com que potenciais clientes desistam antes mesmo de conhecer seus serviços.

Hoje, a maior parte das pessoas pesquisa no Google antes de contratar qualquer serviço, e pequenos problemas técnicos podem reduzir significativamente a visibilidade e conversão.

A boa notícia é que esse tipo de problema normalmente pode ser corrigido com ajustes técnicos relativamente simples.

Se fizer sentido para você, posso mostrar rapidamente o diagnóstico completo e as oportunidades de melhoria que encontramos para sua empresa.

Atenciosamente,
${userName}

REGRAS:
- NUNCA mencione que é uma IA ou análise automatizada.
- Mantenha o tom de um consultor humano escrevendo manualmente.
- Foco em impacto financeiro e perda de clientes.`;
    }

    if (type === 'xeque_mate') {
        const hasSite = !!(business.website || business.urlSite);
        const performance = auditResult?.performanceScore || 0;
        const seo = auditResult?.seoScore || 0;

        // Determinar os 3 pontos críticos prioritários
        let criticalPoints = [];
        if (!hasSite) {
            criticalPoints.push("- Ausência de Website Profissional: Sem um ponto de conversão oficial, sua empresa fica invisível para milhares de potenciais clientes que buscam seus serviços no Google.");
        } else {
            if (performance < 50) criticalPoints.push("- Performance Crítica: A lentidão do seu site atual afasta potenciais clientes que buscam agilidade e eficiência, impactando sua taxa de conversão.");
            if (seo < 80) criticalPoints.push("- Baixa Visibilidade (SEO): Seu site não está otimizado para os mecanismos de busca, permitindo que concorrentes apareçam na frente da sua empresa.");
        }
        if (criticalPoints.length < 2) criticalPoints.push("- Estratégia de Presença Passiva: A estrutura atual não induz o visitante à ação imediata, o que pode estar limitando seu potencial de faturamento digital.");

        return `Gere um Relatório Xeque Mate Estratégico para ${business.name} em ${business.city}. 
O texto DEVE ter entre 180 e 250 palavras e seguir exatamente esta estrutura de 5 passos:

1 — Introdução Direta: Apresentação curta sua (${userName}) e contexto da análise da ${business.name}.
2 — Diagnóstico Principal: Listar estes 2 ou 3 pontos detectados:
${criticalPoints.join('\n')}
3 — Impacto no Crescimento: Explicar como o comportamento do consumidor (pesquisa prévia) afeta a autoridade e faturamento da empresa.
4 — Oportunidade Estratégica: Mostrar o caminho do crescimento (otimização, site profissional ou fortalecimento de autoridade).
5 — Convite Estratégico: CTA para conversar e mostrar o diagnóstico completo e estratégias.

REGRAS CRÍTICAS:
- NUNCA use: "nosso sistema detectou", "ferramenta automatizada", "análise automática", "IA".
- O tom deve ser DIPLOMÁTICO e profissional.
- Use frases curtas e objetivas.
- O texto deve parecer escrito manualmente por um especialista.`;
    }

    if (type === 'website_html') {
        return `Gere HTML/CSS para ${business.name}. Prompt: ${objectionId || "Site moderno e profissional"}.`;
    }

    if (type === 'battle_plan') {
        const website = business.website || business.urlSite || "Não possui website (falha estratégica de presença digital)";
        return `Gere um Plano de Batalha Estratégico personalizado para:
Nome da empresa: ${business.name}
Cidade: ${business.city}
Segmento: ${business.niche}
Website encontrado: ${website}

O relatório deve conter obrigatoriamente as seguintes seções numeradas:
1. Diagnóstico Inicial da Presença Digital
2. Ponto Crítico Detectado
3. Impacto no Crescimento da Empresa
4. Oportunidades de Expansão
5. Plano Estratégico de Crescimento
6. Estrutura de Marketing Digital Recomendada
7. Conclusão Estratégica

Regras:
- Ser altamente profissional e persuasivo.
- Parecer uma análise feita manualmente por um consultor sênior.
- Induzir o empresário a querer melhorar sua presença digital urgentemente.
- Foco total em autoridade e faturamento.`;
    }

    if (type === 'design') {
        const hasSite = !!(business.website || business.urlSite);
        const performance = auditResult?.performanceScore || 0;
        const lcp = auditResult?.lcp || "N/A";

        let subject = "Diagnóstico rápido sobre seu site";
        let diagnostic = "";

        if (!hasSite) {
            subject = `Notei um detalhe importante sobre sua presença em ${business.city}`;
            diagnostic = `identificamos que sua empresa ainda não possui um website oficial, o que deixa você invisível para potenciais clientes que pesquisam pelo seu serviço diretamente no Google.`;
        } else if (performance < 50) {
            subject = `Seu site pode estar perdendo clientes em ${business.city}`;
            diagnostic = `seu site atualmente apresenta uma lentidão crítica no carregamento (métrica LCP: ${lcp}). Hoje, mais de 50% dos visitantes abandonam páginas que demoram mais de 3 segundos para carregar.`;
        } else {
            subject = `Diagnóstico rápido sobre o site da ${business.name}`;
            diagnostic = `identificamos alguns pontos na sua estrutura digital que podem estar impactando diretamente na captação de novos clientes qualificados na sua região.`;
        }

        return `Gere uma mensagem de contato ultra-curta para ${business.name}. 
O texto DEVE ter entre 80 e 120 palavras e seguir EXATAMENTE esta estrutura de 4 blocos curtos:

Bloco 1 (Assunto Magnético):
${subject}

Bloco 2 (Diagnóstico Rápido): 
Olá ${business.name}, durante uma análise da presença digital da sua empresa em ${business.city}, identificamos que ${diagnostic}

Bloco 3 (Consequência e Impacto): 
Isso significa que potenciais clientes podem estar desistindo antes mesmo de conhecer seus serviços, reduzindo sua autoridade e faturamento na região.

Bloco 4 (Convite Simples): 
Se fizer sentido para você, posso mostrar rapidamente o diagnóstico completo que fizemos e as oportunidades de melhoria.

Atenciosamente, 
${userName}

REGRAS:
- NUNCA use "análise automatizada", "nosso sistema", "IA".
- Use frases curtas. Pareça uma mensagem escrita à mão em 1 minuto.
- Máximo 120 palavras totais.`;
    }

    return `Gere conteúdo ${type} para ${business.name} em ${business.city}.`;
};
