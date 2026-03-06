# NicheFinder Guru 🎯

Bem-vindo ao repositório do **NicheFinder Guru**, uma plataforma de inteligência de prospecção e automação B2B projetada para dominar o Google Maps e transformar leads frios em clientes reais utilizando análise avançada e Inteligência Artificial.

---

## 🚀 O que é o NicheFinder Guru?

O NicheFinder Guru não é apenas um CRM ou um buscador de leads. É uma **Máquina de Vendas Autônoma** que:
1. **Minera (Radar):** Faz buscas em múltiplas cidades e nichos simultaneamente através da API do Google, removendo concorrentes e duplicidades.
2. **Audita (Audit):** Analisa tecnicamente a presença digital de cada lead encontrado (PageSpeed, SEO, Segurança SSL).
3. **Classifica (Score):** Identifica automaticamente quem são os "leads quentes" (desatualizados, lentos) e quem são os "frios" (estruturados).
4. **Converte (AI & Bot):** Utiliza IA para gerar scripts de abordagem baseados na "dor técnica" do cliente e disponibiliza PDFs de impacto (Mockups VIP) para envio via WhatsApp de forma massiva com a automação integrada.

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

### 2. Auditoria Técnica e IA (`/src/lib/siteAuditor.ts` & `/src/lib/aiService.ts`)
- **Auditor:** Ao analisar um site, coletamos métricas cruciais de Performance e SEO através da API oficial do Google.
- **AI Insights:** Esses dados alimentam a Groq API, que gera automaticamente um parágrafo de abordagem ultrarrápido (Script Frio) utilizando *Copywriting* focado em conversão.

### 3. PDF VIP Generator (`/server/pdf-engine.js` & `/src/components/SitePDF.tsx`)
- Um gerador de propostas VIP *On-The-Fly*.
- O frontend envia um payload de dados para o motor Node.js (Puppeteer) rodando na porta 3001, que renderiza um layout React (`SitePDF`) em um PDF de alta fidelidade e converte para base64 para envio imediato no WhatsApp.

### 4. Automação (`/src/pages/Automation.tsx`)
- Gerenciamento de filas (Queue). Onde os leads classificados aguardam a execução do robô.
- Interface para controle do loop automatizado de abordagem.

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
