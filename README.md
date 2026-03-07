# NicheFinder Guru 🎯

Bem-vindo ao repositório do **NicheFinder Guru**, uma plataforma de inteligência de prospecção e automação B2B projetada para dominar o Google Maps e transformar leads frios em clientes reais utilizando análise avançada e Inteligência Artificial.

---

## 🚀 O que é o NicheFinder Guru?

O NicheFinder Guru não é apenas um CRM ou um buscador de leads. É uma **Máquina de Vendas Autônoma** focada em encontrar e converter negócios com a pior dor digital possível: **A falta de um site profissional**.

1. **Minera (Radar):** Faz buscas em múltiplas cidades e nichos simultaneamente através da API do Google, removendo concorrentes e duplicidades.
2. **Scanner de Dor (Audit):** O foco definitivo é identificar empresas **SEM SITE** (a mina de ouro escondida), ou analisar os sites existentes apontando falhas críticas de infraestrutura e performance.
3. **Classifica (Score/Thermal Sorting):** Separa instantaneamente quem está "sangrando dinheiro" (ex: lead Sem Site ou com site super lento) daqueles que já são bem atendidos.
4. **O Robô de $1 Milhão (WhatsApp Bot):** O grande motor do fechamento. Um bot autônomo conectado ao seu WhatsApp que roda em background 24/7. Ele pega os melhores leads, envia a análise do Google via IA com um PDF anexado, abordando de maneira persuasiva diretamente no celular do dono, gerando demanda quente e automática.

---

## 🏗️ Stack Tecnológica

* **Frontend:** React 18, TypeScript, Vite
* **Estilização:** Tailwind CSS v3, shadcn/ui (Radix UI), Lucide Icons
* **Gerenciamento de Estado & Data Fetching:** TanStack Query (React Query)
* **Backend & Banco de Dados:** Supabase (Auth, PostgreSQL)
* **Geração de PDF:** Node.js, Puppeteer (Serviço Local)
* **Inteligência Artificial:** Groq API (Processamento ultrarrápido) e Serper API (Busca no Google)

---

## ⚙️ Funcionalidades Core

### 1. Radar B2B Engine (`/src/pages/Radar.tsx`)
O coração da captação.
- `searchLeads()`: Interage diretamente com a API do Google Places (via Edge Functions/Servidor Local) e Serper API para varrer áreas geográficas específicas e encontrar contatos.
- Implementa um sistema de *Blacklist* para evitar adicionar empresas indesejadas (ex: agências concorrentes).

![Radar B2B Desktop](./docs/assets/radar_main.png)

### 2. Auditoria Técnica e IA (`/src/lib/siteAuditor.ts` & `/src/lib/aiService.ts`)
- **Auditor:** Ao analisar um site, coletamos métricas cruciais de Performance e SEO através da API oficial do Google.
- **AI Insights:** Esses dados alimentam a Groq API, que gera automaticamente um parágrafo de abordagem ultrarrápido (Script Frio) utilizando *Copywriting* focado em conversão.

![Auditor de Site e Score](./docs/assets/audit_modal.png)

### 3. PDF VIP Generator (`/server/pdf-engine.js` & `/src/components/SitePDF.tsx`)
- Um gerador de propostas VIP *On-The-Fly*.
- O frontend envia um payload de dados para o motor Node.js (Puppeteer) rodando na porta 3001, que renderiza um layout React (`SitePDF`) em um PDF de alta fidelidade e converte para base64 para envio imediato no WhatsApp.

### 4. O Robô: Automação WhatsApp (`/standalone-bot/wa-bot.js` & `/src/pages/Automation.tsx`)
A joia da coroa da operação. É aqui que saímos do manual para a escala assustadora.
- **WhatsApp Standalone Bot:** Um motor Node.js nos bastidores. Funciona com QR Code e atua como seu melhor vendedor 24h.
- **Ataque Autônomo:** O bot varre a sua fila do Radar. Se a dor principal do lead for *"Sem Site"*, ele pede para a IA formular o pitch perfeito ("Notei que seus clientes do Google não te encontram direito..."), anexa o PDF e envia direto no WhatsApp com delays humanizados (para não tomar ban).
- **Control Room:** O frontend (`Automation.tsx`) atua só como painel de pausa/início e monitoramento visual das métricas de ataque do robô.

![Dashboard de Automação do WhatsApp](./docs/assets/automation_main.png)

---

## 🛠️ Como Iniciar o Projeto Localmente

### Pré-requisitos
- Node.js (v18+)
- Conta no Supabase (com banco provisionado)
- Chaves de API (Groq, Serper, Google Places)

### Instalação

1. Clone este repositório para o seu ambiente local:
```bash
git clone https://github.com/Helgonhc/Nichefinder-guru2.git
cd Nichefinder-guru2
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as Variáveis de Ambiente. Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_PROJECT_ID="seu_project_id"
VITE_SUPABASE_URL="sua_url_supabase"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_chave_anonima"
VITE_GOOGLE_PLACES_API_KEY="sua_chave_google_places"
VITE_SERPER_API_KEY="sua_chave_serper"
VITE_GROQ_API_KEY="sua_chave_groq"
```

4. Inicie o Servidor de Desenvolvimento:
O sistema necessita que o frontend e o motor de PDF rodem simultaneamente. O comando `dev` já faz isso usando concurrently.
```bash
npm run dev
```
> O Frontend estará em `http://localhost:8080`
> O Motor PDF estará aguardando na porta `3001`

---

## 📂 Estrutura de Pastas Principal

```text
├── server/
│   └── pdf-engine.js        # Worker do Puppeteer para geração de PDF
├── src/
│   ├── components/          # Componentes visuais reutilizáveis (UI) e Layout
│   ├── contexts/            # React Contexts (Ex: AuthContext)
│   ├── hooks/               # Custom hooks globais
│   ├── integrations/        # Config do Supabase e rotas
│   ├── lib/                 # Serviços lógicos (APIs, Inteligência, Utils)
│   └── pages/               # Views principais da aplicação (Radar, Leads, etc)
├── tests/                   # Suíte de testes (Playwright/E2E)
└── supabase/                # Edge Functions e schemas do banco de dados
```

---

## 🤝 Contribuição

Siga os padrões estabelecidos no `eslint` e mantenha a estética "Luxury Modern" nas implementações frontend.
1. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
2. Faça commit das mudanças (`git commit -m 'feat: minha nova feature'`)
3. Faça o push para a branch (`git push origin feature/minha-feature`)
4. Abra um Pull Request.

---
*NicheFinder Guru - Transformando internet em lucro estruturado.*
