# 🤖 LeadRadar WhatsApp Bot (Standalone)

Este é o robô de disparo automático do LeadRadar Guru, separado para que você possa rodá-lo em qualquer computador de forma independente.

## 📋 Pré-requisitos
- **Node.js instalado** (Recomendado v18 ou superior).

## 🚀 Como Instalar e Rodar

1.  **Copie esta pasta** (`standalone-bot`) para o outro computador.
2.  **Configure as Chaves**: Copie o arquivo `.env` do projeto original para dentro desta pasta. Se não tiver, crie um arquivo chamado `.env` e coloque:
    ```env
    VITE_SUPABASE_URL=seu_url_do_supabase
    VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
    ```
3.  **Instale as Dependências**:
    Abra o terminal dentro desta pasta e digite:
    ```bash
    npm install
    ```
4.  **Inicie o Robô**:
    ```bash
    npm start
    ```

## 💡 Como funciona?
- O robô se conecta ao seu banco de dados no Supabase.
- Ele envia logs em tempo real para o seu painel na Web no Vercel.
- Você pode ver o console funcionando direto na página de "Automações".

---
*LeadRadar Guru - Automação Inteligente*
