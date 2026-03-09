<div align="center">
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React Badge"/>
  <img src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" alt="NodeJS Badge"/>
  <img src="https://img.shields.io/badge/supabase-%233FCF8E.svg?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase Badge"/>
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind Badge"/>
  <img src="https://img.shields.io/badge/puppeteer-%2340B5A4.svg?style=for-the-badge&logo=puppeteer&logoColor=white" alt="Puppeteer Badge"/>
  <br/>
  <h1>🚀 NicheFinder Guru 🚀</h1>
  <p><strong>A Documentação Arquitetural e Funcional Absoluta.</strong><br>O ecossistema que automatiza desde a prospecção profunda local até o ataque final de Automação de WhatsApp via Supabase Queues e Microserviços Node.js.</p>
</div>

<br/>

## 🎯 Por que o NicheFinder existe?

O fluxo manual de venda de desenvolvimento web ou marketing local é morto e ineficiente. A dor não é "vender", é gastar 4 horas minerando locais no mapa para descobrir que as empresas abordadas já têm um site excelente.

O **NicheFinder Guru** hackeou essa dor fundindo requisições HTTP em massa com IA sem latência (Piramyd Cloud) e Automação de Baixo Nível (WebSockets/Baileys).

---

## 🤯 Entidades e Motores (TUDO o que a ferramenta faz)

### 1. O Radar Multi-Cidades (Mina de Dados / Data Mining)
Diferente de sistemas básicos, o input do Radar permite inserir um **Array de cidades separado por vírgulas** (Ex: *Pedigree em Betim, Contagem e BH*).
- **As APIs:** O front-end invoca via Edge Functions a API do **Google Places** e a **Serper API**. Elas trazem juntas: Coordenadas, Nota de Consumidor, Endereço Físico Exato, Telefone e Redes Sociais.
- **O Motor de Blacklist Anti-Lixo:** Antes de renderizar um único contato na tela, a ferramenta passa uma navalha em Javascript (`string.includes` num dicionário gigante) que vaporiza Prefeitura, Agências de Marketing (concorrentes), SEBRAE e franquias bloqueadas. Só aparece lead quente.

<div align="center">
  <img src="./docs/assets/radar_main.png" alt="O Radar Vendo Leads" width="800" style="border-radius: 8px;" />
</div>

<br/>

### 2. Scanner de Dor Absoluta (Thermal Score e Auditoria)
A lógica não ordena prospectos por ordem alfabética. A tabela é inteligente (Thermal Sorting):
- **O Trigger "Sem Site":** Se o pacote de dados do Places retornar com o campo URL vazio, o sistema acende a **Tarja Vermelha**. Ele sabe que aquela empresa fatura milhares de reais presencialmente, mas inexiste digitalmente. **A melhor venda do mundo é essa.**
- **O Pen-Test Auditor:** Se o campo URL vier preenchido, você pode espionar o site apertando um botão. O código vai cruzar o `PageSpeed Insights do Google` e checar portas SSL. Se o carregamento 4G (Mobile) daquele dentista demorar 4 segundos e ele não tiver "Cadeado Seguro (HTTPS)", o sistema joga ele na mesma vala de Dor Vermelha avisando que o site dele está falido.

<div align="center">
  <img src="./docs/assets/audit_modal.png" alt="Modal com o Score de Auditoria" width="800" style="border-radius: 8px;" />
</div>

<br/>

### 3. A Central de Fila e Automação (Robô + IA Piramyd + PDF Generator)
Não travamos o PC com laços `FOR` manuais e downloads pesados. Quando um lead é selecionado em massa, ele é empurrado via `insert` para a tabela `whatsapp_queue` do seu Banco Supabase. O Frontend agora apenas *Assiste* via WebSockets em tempo real.

O Trabalho pesado fica com o **Motor Backend Node** (`server/wa-bot.js`):
1. **Inteligência Piramyd Llama:** O motor NodeJS pega as tags "Sem site" e "Concessionária" e pede pra IA da Piramyd Cloud criar uma mensagem micro, persuasiva e totalmente disfarçada de um morador local sugerindo ajuda ("Aviso de Vizinho Cidadão"). A latência desse LLM é de menos de 1 segundo.
2. **Gerador PDF On-the-Fly (Port 3001):** Um Node secundário ligado no pacote **Puppeteer** abre debaixo do capô um "Chrome Sem Interface". Ele desenha na RAM a proposta incrível em Tailwind (com o design super premium), tira screenshot HTML -> PDF e repassa tudo pelo formato `Base64` sem nunca criar arquivos zumbis no seu disco rígido (C:).
3. **Mágica Anti-Banimento via Baileys WebSockets:** Não usamos painel de navegador que toma Ban da Meta. Usamos conexões socket criptografadas puras.
   - *Presence:* O robô sinaliza `"Composing..."` (Digitando...) com tempo proporcional ao tamanho da mensagem da IA.
   - *Sleep Caótico:* Após o envio do PDF + Texto Frio mágico, o robô congela por **45s até 120s** de forma absurdamente randômica usando `Math.random()`. Para os servidores do WhatsApp, é um humano lerdo digitando em casa. Segurança Mestra.

<div align="center">
  <img src="./docs/assets/automation_main.png" alt="Painel do Robô Autônomo" width="800" style="border-radius: 8px;" />
</div>

---

## 🛠️ Como dar Boot nisso na sua Máquina?

A arquitetura moderna foi reduzida a um comando.

### 📋 Pré-requisitos
- Ter o `Node.js` (v18+) instalado.
- O Git nativo na sua máquina.
- Um Bucket grátis no painel da **Supabase**.
- Chaves: Google Places API, Serper API e Piramyd API.

### 🚀 Setup em Modo Exaustivo 

1. **Baixe o repositório principal:**
```bash
git clone https://github.com/Helgonhc/Nichefinder-guru2.git
cd nichefinder-guru-main2
```

2. **O Instalador Geral:**
Usamos o gerenciador de pacote nativo para inflar a _`node_modules`_.
```bash
npm install
```

3. **Crie o Arquivo de Definições de Ambiente (`.env`)** e coloque exatamente isso:
```env
# Seu Hub de Banco de Dados e Filas em Tempo Real
VITE_SUPABASE_PROJECT_ID="project_do_supabase"
VITE_SUPABASE_URL="https://[sua_url_unica].supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="[Sua_chave_anon_gigante_aqui]"

# Suas Armas Numéricas e Busca Orgânica
VITE_GOOGLE_PLACES_API_KEY="AIzaSy..."
VITE_SERPER_API_KEY="sua_chave_magica_do_serper"

# Inteligência de Processamento (A Melhor Llama Rápida da Piramyd Cloud)
VITE_PIRAMYD_API_KEY="pira_..."
```

4. **Acendendo as Turbinas Simultâneas:**
O *NicheFinder* rodava antes em 3 terminais separados. Injetamos o `concurrently` no arquivo de pacotes JSON para encapsular.
Ao digitar o comando abaixo:
- **Painel Front-end:** Nascerá nativo na porta `:8080`.
- **Backend Phantom/PDF Node:** Adormecerá na porta `:3001` monitorando rede.
```bash
npm run dev
```

Abra `http://localhost:8080` no navegador, coloque os óculos escuros e assista a inteligência de negócios trucidar limites. 

---

## 🤝 Quer expandir a máquina B2B com a gente?

A comunidade Open Source é a força motriz.
1. Dê fork neste Repo e force um desmembramento (`git checkout -b feature/hack-novo`)
2. Desenvolva o detalhamento da Feature nos seus commits (`git commit -m 'feat: refatorando botão de score de velocidade'`)
3. E devolva o PR pro Master Branch (`git push origin feature/hack-novo`)
