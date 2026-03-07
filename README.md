<div align="center">
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React Badge"/>
  <img src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" alt="NodeJS Badge"/>
  <img src="https://img.shields.io/badge/supabase-%233FCF8E.svg?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase Badge"/>
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind Badge"/>
  <br/>
  <h1>🚀 NicheFinder Guru 🚀</h1>
  <p><strong>Automação B2B que parece Mágica.</strong><br>O ecossistema open-source que encontra a dor invisível do Google Maps e automatiza propostas VIP.</p>
</div>

<br/>

## 🎯 Por que o NicheFinder existe?

Se você trabalha com marketing ou vende sites, sabe a dor: Pegar contatos no Maps, tentar achar o telefone, mandar um textão frio no WhatsApp e ser completamente ignorado. 

O **NicheFinder Guru** hackeou essa dor. Nós resolvemos isso usando a melhor *stack* moderna (React + Supabase + API do Groq), transformando o que demorava 2 dias num processo glorioso de apertar um botão e ver leads caindo no celular convertidos.

---

## 🤯 Como a Mágica Acontece (A Arquitetura)

### 1. O Radar (Mina de Dados)
Chega de procurar à mão. Você insere "Clínicade de Estética" + "Campinas" e nosso *Edge Function* bate no **Google Places** e na **Serper**. Retornamos os nomes numa UI Glassmorphism deliciosa. Aquela concorrência inútil? Cortada na Blacklist antes de bater no Front.

<div align="center">
  <img src="./docs/assets/radar_main.png" alt="O Radar Vendo Leads" width="800" style="border-radius: 8px;" />
</div>

<br/>

### 2. Scanner de Dor (Thermal Score)
Nós construímos um classificador absurdo (Thermal Sorting). Quando a requisição volta, a mágica do React separa o joio do trigo: se a empresa **NÃO TIVER SITE** listado lá no Maps, a interface sangra de vermelho. A urgência de venda é de R$5 mil na mesa. Tem site? Então o App espiona silencioso: Tá sem cadeado HTTPS? É lento no Celular? Tá frito também!

<div align="center">
  <img src="./docs/assets/audit_modal.png" alt="Modal com o Score de Auditoria" width="800" style="border-radius: 8px;" />
</div>

<br/>

### 3. A Central de Tiro (Robô + IA Groq + PDF Generator)
Não travamos o PC com laços pesados e descargas manuais de arquivos PDF. Se o lead tá ruim, você manda pra fila do banco de dados (Supabase).
Nas trincheiras do Backend, um script `wa-bot.js` entra no Whatsapp Web nativo.
1. A IA da Groq estuda o nome e a cidade e escreve uma **mensagem curta absurdamente persuasiva e humanizada**.
2. Um robô local numa porta `:3001` abre um Chrome fantasma (*Puppeteer*), tira fotos visuais do prospect, e converte num PDF luxuoso sem você encostar no teclado.
3. Como não ser Banido do WhatsApp? O robô envia o combo da Mensagem + PDF em *delays assíncronos sorrateiros* (de 45 a 120s entre empresas). 

<div align="center">
  <img src="./docs/assets/automation_main.png" alt="Painel do Robô Autônomo" width="800" style="border-radius: 8px;" />
</div>

---

## 🛠️ Como dar Boot nisso na sua Máquina?

A gente sabe que ninguém quer gastar 2h configurando pacote. Deixamos o ambiente liso.

### 📋 Pré-requisitos Rápidos
- Ter o `Node.js` (v18+) na veia.
- Uma continha grátis lá no Supabase.
- Suas chaves de IA (Groq 🔥, Serper e Google Places).

### 🚀 Setup em 1 Minuto

1. **Baixe o foguete:**
```bash
git clone https://github.com/Helgonhc/Nichefinder-guru2.git
cd Nichefinder-guru2
```

2. **Dê o `install` master:**
```bash
npm install
```

3. **Crie o Arquivo `.env` na raiz** e injete o sangue (dados fictícios abaixo):
```env
VITE_SUPABASE_PROJECT_ID="project_do_supabase"
VITE_SUPABASE_URL="https://sua_url_unica.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_chave_anon_gigante"
VITE_GOOGLE_PLACES_API_KEY="AIzaSy..."
VITE_SERPER_API_KEY="sua_chave_magica_do_serper"
VITE_GROQ_API_KEY="gsk_..."
```

4. **Acenda a faísca:**
Usamos a magia negra chamada `concurrently` no `package.json`. Esse comando roda o Frontend no `:8080` E o motor de PDF invisível no `:3001` de uma vez só!
```bash
npm run dev
```

Abra `http://localhost:8080` no navegador, coloque os óculos escuros e veja a magia da UI escura rolar solta! 😎

---

## 🤝 Quer codar com a gente? (Contribuição)

A comunidade ama pull requests elegantes.
1. Dá o fork e cria sua branch inovadora (`git checkout -b feature/hack-novo`)
2. Commita o pulo do gato (`git commit -m 'feat: refatorando botão de score'`)
3. E joga pro GitHub (`git push origin feature/hack-novo`)

Vamos espalhar a mentalidade automatizada de ganhos pelo Brasil inteiro! 🇧🇷
