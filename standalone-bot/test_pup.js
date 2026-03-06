import puppeteer from 'puppeteer';

(async () => {
    try {
        console.log("Iniciando teste de inicializacao ESM...");
        const browser = await puppeteer.launch({
            headless: false,
            userDataDir: './wa_session_test',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log("SUCESSO: Navegador (Chromium) lançado!");
        await browser.close();
        console.log("Teste finalizado limpo.");
    } catch (e) {
        console.error("FALHA CRITICA NO PUPPETEER:", e);
    }
})();
