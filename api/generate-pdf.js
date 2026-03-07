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
            sizeLimit: '10mb', // Permite payloads maiores com imagens base64
        },
    },
};

export default async function handler(req, res) {
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
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();

        // Emula media print para CSS Tailwind
        await page.emulateMediaType('print');

        console.log("🦅 [Vercel PDF] Injetando conteúdo HTML...");
        await page.setContent(html, {
            waitUntil: 'networkidle0',
            timeout: 45000
        });

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
        return res.status(500).json({
            error: 'Falha crítica na renderização do PDF',
            details: error.message
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
