# 🏗️ Relatório de Arquitetura Técnica: NicheFinder Guru

Este documento descreve a arquitetura técnica, o fluxo de dados e a stack tecnológica do sistema **NicheFinder Guru** (também referido como **Leads Ninja**). O sistema é uma plataforma avançada de prospecção B2B que combina scraping de dados geográficos, análise por Inteligência Artificial e automação de engajamento via WhatsApp.

---

## 1️⃣ VISÃO GERAL DO PROJETO

O **NicheFinder Guru** é um ecossistema de automação de vendas focado em transformar buscas no Google Maps em leads qualificados e engajados. O sistema resolve o problema da prospecção fria manual, automatizando a descoberta de empresas, a análise de sua presença digital e o primeiro contato comercial.

*   **Problema Resolvido:** Dificuldade em encontrar leads B2B locais com informações de contato válidas e realizar abordagens personalizadas em escala.
*   **Objetivo:** Capturar leads, gerar propostas de marketing visualmente ricas baseadas em auditorias reais e automatizar o envio via WhatsApp usando sequências pré-definidas.
*   **Tipo de Aplicação:** Sistema de Automação de Marketing & Prospecção (SaaS Engine).

---

## 2️⃣ ÁRVORE DE DIRETÓRIOS DO PROJETO

```text
nichefinder-guru-main
├ api                   # Handlers de funções serverless/API
├ docs                  # Documentação e guias de usuário
├ public                # Ativos estáticos (logos, ícones)
├ server                # Motores de backend especializados
│ └ pdf-engine.js       # Motor de renderização de PDF via Puppeteer
├ shared                # Lógica e prompts compartilhados entre Bot e Frontend
├ src                   # Frontend Principal (React + Vite)
│ ├ components          # Componentes UI e Templates de Proposta
│ │ ├ automation        # UI de controle dos robôs
│ │ └ ui                # Componentes base (shadcn/ui)
│ ├ integrations        # Conexão com Supabase e APIs externas
│ ├ lib                 # Motores Lógicos (IA, Scraping, Auditoria)
│ ├ pages               # Telas principais (Radar, Leads, Automação)
│ └ types               # Definições de tipos TypeScript
├ standalone-bot        # Motor de Automação Independente (Node.js)
│ ├ src/services        # Integração com Evolution API e Supabase
│ └ wa-bot.js           # Orquestrador central do Robô de WhatsApp
├ supabase              # Definições de Banco de Dados e Migrations
└ docker-compose-evolution.yml  # Infraestrutura de containers (API, DB, Redis)
```

---

## 3️⃣ IDENTIFICAÇÃO DOS MÓDULOS PRINCIPAIS

*   **Módulo Radar (Scraping):** Localizado em `src/lib/placesService.ts` e `serperService.ts`. Utiliza as APIs do Google Places e Serper para buscar empresas por nicho e cidade, extraindo dados como telefone, site e redes sociais.
*   **Módulo Auditoria:** Localizado em `src/lib/siteAuditor.ts`. Realiza uma análise técnica da presença digital do lead (SSL, Performance, Mobile Friendly), gerando um score de presença.
*   **Módulo Inteligência Artificial:** Localizado em `src/lib/aiService.ts`. Conecta-se à API da Groq (Llama 3/Gemma) para gerar scripts de vendas personalizados, quebra de objeções e resumos estratégicos.
*   **Módulo Gerador de PDF:** Localizado em `server/pdf-engine.js` e `src/components/SitePDF.tsx`. Renderiza propostas comerciais de "luxo" em PDF usando Puppeteer, injetando os dados da auditoria e da IA.
*   **Módulo Automação (Bot):** Orquestrado pelo `standalone-bot/wa-bot.js`. Este serviço monitora o banco de dados e utiliza a **Evolution API v2** para disparar mensagens automáticas no WhatsApp.
*   **Módulo Dashboard:** Interface React que permite ao usuário gerenciar leads, configurar nichos, monitorar disparos e visualizar KPIs de conversão.

---

## 4️⃣ FLUXO DE DADOS DO SISTEMA

O fluxo segue uma progressão linear do "Radar" ao "Bot":

1.  **Busca & Descoberta (Radar):** O usuário busca nicho + cidade no Frontend.
2.  **Enriquecimento (Scraping):** O sistema busca dados profundos (Serper) e valida presença digital.
3.  **Captura (Supabase):** O lead é salvo na tabela `leads` com status `new`.
4.  **Engajamento IA (Content Gen):** Scripts de abordagem são gerados dinamicamente via Groq Cloud.
5.  **Produção de Proposta:** Um PDF personalizado é gerado pelo motor de renderização.
6.  **Disparo Automatizado (Bot):** O `wa-bot.js` detecta o lead, gera a mensagem e envia via Evolution API.
7.  **Monitoramento:** O status do lead é atualizado (contacted, interested, etc.) e exibido no Dashboard.

---

## 5️⃣ SERVIÇOS OU ENGINES DO SISTEMA

*   **Scraper Engine:** Híbrido entre Google Places Search e Serper Deep Analysis.
*   **IA Engine:** Provedor Groq (Modelos Llama-3 para alta velocidade e baixo custo).
*   **PDF Engine:** Puppeteer (Headless Browser) convertendo componentes React estilizados com Tailwind em arquivos A4.
*   **WhatsApp Engine:** Evolution API v2 (Dockerizada) servindo como bridge entre o sistema e o protocolo Baileys.
*   **Database Engine:** Supabase (PostgreSQL) com suporte a Realtime e Row Level Security (RLS).

---

## 6️⃣ ESTRUTURA DO BANCO DE DADOS

O sistema utiliza PostgreSQL (Supabase). As entidades principais são:

*   **`profiles`**: Armazena dados do usuário (admin, empresa, logo, configurações de marca).
*   **`leads`**: Tabela central contendo nome, nicho, cidade, telefone, website, `presence_score` e metadados JSON do scraping.
*   **`contact_history`**: (Implicitada em migrations) Registra cada interação do robô com o lead para evitar SPAM e controlar sequências (D0, D1, D3).
*   **`ROBOT_STATUS`**: Uma entrada especial na tabela de leads (ou metadados) usada pelo bot standalone para reportar logs e saúde em tempo real para a UI.

---

## 7️⃣ TECNOLOGIAS UTILIZADAS

*   **Frontend:** React 18, Vite, TypeScript, TailwindCSS.
*   **UI Framework:** shadcn/ui + Framer Motion (animações premium).
*   **Backend (Auth/DB):** Supabase (PostgreSQL + RLS).
*   **Server/Bot:** Node.js (Express para motor PDF, Scripts independentes para Bot).
*   **Automação WhatsApp:** Evolution API v2 (Docker).
*   **Inteligência Artificial:** Groq SDK (Modelos Llama, Gemma, MixTrall).
*   **Scraping:** Serper.dev API + Google Maps Platform.

---

## 8️⃣ POSSÍVEIS RISCOS DE ARQUITETURA

*   **Dependência de APIs Externas:** O sistema depende fortemente da estabilidade da Groq, Serper e Google Places. Falhas nessas chaves paralisam o Radar e a IA.
*   **Acoplamento Frontend/Backend no Scraping:** Grande parte da lógica de enriquecimento de leads (`mapPlaceDetails`) reside no cliente (React), o que pode expor chaves de API se não forem bem protegidas por proxies (embora utilize o Vite Env).
*   **Sincronização do Bot Standalone:** O bot roda como um processo separado. Se o servidor Supabase tiver latência ou interrupção nas conexões Realtime/Polling, a sequência de mensagens pode atrasar.

---

## 9️⃣ RESUMO FINAL DA ARQUITETURA

**Radar / Descoberta de leads (Maps/Serper)**
↓
**Persistência no Supabase (PostgreSQL)**
↓
**Processamento de IA (Prompts Estratégicos via Groq)**
↓
**Motor de Propostas PDF (Puppeteer)**
↓
**Envio Automático WhatsApp (Evolution API v2)**
↓
**Gestão de Pipeline & CRM no Dashboard (Frontend)**

---
*Relatório gerado para fins de documentação técnica e transferência de conhecimento entre arquitetos.*
