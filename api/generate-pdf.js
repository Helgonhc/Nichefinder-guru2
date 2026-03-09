import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

/**
 * 🦅 DOSSIÊ B2B - SERVERLESS ENGINE (Vercel)
 * Este endpoint permite que o LeadRadar gere PDFs de alta conversão 
 * rodando em infraestrutura serverless (Vercel Functions).
 */

export const config = {
    maxDuration: 60, // Limite de 60 segundos para renderização complexa
    api: {
        bodyParser: {
            sizeLimit: '25mb', // Aumentado para suportar PDFs com muitas imagens embutidas (Limite prático Vercel)
        },
    },
};

export default async function handler(req, res) {
    // Configura Headers de Segurança e CORS
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método Não Permitido' });
    }

    const { html } = req.body;
    if (!html || typeof html !== 'string') {
        return res.status(400).json({ error: 'Payload HTML inválido.' });
    }

    let browser = null;
    try {
        console.log("🦅 [Vercel PDF] Iniciando motor serverless...");

        // Configura o Chromium para o ambiente Vercel
        // Otimizado para baixo consumo de memória
        browser = await puppeteer.launch({
            args: [
                ...chromium.args,
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--disable-setuid-sandbox",
                "--no-sandbox",
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();

        // Emula media print para CSS Tailwind e backgrounds impressos
        await page.emulateMediaType('print');

        console.log("🦅 [Vercel PDF] Injetando conteúdo HTML...");
        await page.setContent(html, {
            waitUntil: 'networkidle2', // Sincronizado com o fix local: mais resiliente a scripts externos
            timeout: 50000 // 50s de timeout interno (dentro dos 60s do Vercel)
        });

        // Pequeno fôlego para garantir renderização de fontes complexas
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log("🦅 [Vercel PDF] Exportando para A4...");
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
        });

        console.log("🦅 [Vercel PDF] Sucesso! Enviando binário...");

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.send(pdfBuffer);

    } catch (error) {
        console.error("❌ [Vercel PDF Error]:", error);

        let status = 500;
        let message = 'Falha crítica na renderização do PDF';

        if (error.name === 'TimeoutError') {
            status = 504;
            message = 'Timeout na renderização (recursos externos demoraram demais).';
        }

        return res.status(status).json({
            error: message,
            details: error.message
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
