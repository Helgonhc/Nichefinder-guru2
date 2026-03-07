import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";

/**
 * 🦅 DOSSIÊ B2B ENGINE (Node.js + Puppeteer)
 * Micro-serviço satélite projetado exclusivamente para renderizar o Dossiê Comercial
 * com fidelidade absoluta de design, margens zero e backgrounds impressos nativamente.
 */

const app = express();
const PORT = process.env.PORT || 3001;

// --- Rate Limiting manual (sem dependências externas) ---
const requestCounts = new Map();
const RATE_LIMIT = 20;       // máx requisições por janela
const RATE_WINDOW = 60_000;  // janela de 1 minuto (ms)

function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const entry = requestCounts.get(ip) || { count: 0, resetAt: now + RATE_WINDOW };

    if (now > entry.resetAt) {
        entry.count = 0;
        entry.resetAt = now + RATE_WINDOW;
    }

    entry.count++;
    requestCounts.set(ip, entry);

    res.setHeader('X-RateLimit-Limit', RATE_LIMIT);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT - entry.count));

    if (entry.count > RATE_LIMIT) {
        return res.status(429).json({ error: "Muitas requisições. Aguarde 1 minuto." });
    }
    next();
}

// CORS restrito: aceita apenas localhost e domínio de produção
const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:5173',
    'https://leadradar.com.br',
    'https://www.leadradar.com.br',
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS bloqueado para origem: ${origin}`));
        }
    },
    methods: ['POST'],
    allowedHeaders: ['Content-Type'],
}));

// --- Middleware de Payload (Aumentado para 30MB para segurança) ---
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

// --- Tratamento de Erro de Payload (JSON amigável) ---
app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            error: "Payload Too Large",
            details: "O HTML enviado é muito grande (limite 30MB). Tente reduzir o tamanho das imagens embutidas."
        });
    }
    next(err);
});

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

// Rate limiting aplicado globalmente (MANTIDO DEPOIS DOS PARSERS PARA EVITAR PROBLEMAS)
app.use(rateLimiter);


app.post("/generate-pdf", async (req, res) => {
    const { html } = req.body;

    // Validação 1: payload obrigatório
    if (!html) {
        return res.status(400).json({ error: "Faltou enviar o payload HTML da proposta." });
    }

    // Validação 2: tipo correto
    if (typeof html !== 'string') {
        return res.status(400).json({ error: "Payload HTML inválido." });
    }

    // Validação 3: tamanho máximo (25MB)
    const MAX_HTML_BYTES = 25 * 1024 * 1024;
    if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) {
        return res.status(413).json({ error: "O arquivo da proposta excedeu o limite do motor (25MB)." });
    }

    // Validação 4: detectar padrões suspeitos de script injection
    const SUSPICIOUS_PATTERNS = [
        /javascript\s*:/gi,
        /<script\b[^>]*src\s*=\s*["']https?:\/\//gi,   // scripts externos
        /on(error|load|click|mouseover)\s*=/gi,          // event handlers inline
        /<iframe\b[^>]*src\s*=\s*["']https?:\/\//gi,   // iframes externos
    ];

    const hasSuspiciousContent = SUSPICIOUS_PATTERNS.some(pattern => pattern.test(html));
    if (hasSuspiciousContent) {
        console.warn('🚨 [PDF Engine] Payload suspeito bloqueado do IP:', req.ip);
        return res.status(400).json({ error: "Payload contém conteúdo não permitido." });
    }

    let browser = null;
    try {
        console.log("🦅 [PDF Engine] Lançando o Motor Chromium Headless...");
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--disable-gpu",
                "--no-first-run",
                "--no-zygote",
                "--single-process"
            ]
        });

        const page = await browser.newPage();

        // Emula media "print" para aplicar a folha de estilo de impressão do CSS nativamente
        await page.emulateMediaType("print");

        console.log("🦅 [PDF Engine] Injetando a Estrutura HTML B2B...");
        await page.setContent(html, {
            waitUntil: "networkidle0", // Aguarda renderização completa (Fontes, Tailwind, Imagens)
            timeout: 30000
        });

        console.log("🦅 [PDF Engine] Destilando o Pipeline. Gerando Binário PDF (A4)...");
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true, // Garante cores e sombras Tailwind
            preferCSSPageSize: true,
            margin: {
                top: "0",
                right: "0",
                bottom: "0",
                left: "0"
            }
        });

        console.log("🦅 [PDF Engine] Sucesso Absoluto! Enviando Stream de volta ao Radar.");

        // Define os headers de resposta
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", pdfBuffer.length);

        // Retorna o buffer binário
        res.send(pdfBuffer);

    } catch (error) {
        console.error("❌ [PDF Engine] Falha Crítica ao Renderizar PDF:", error);
        res.status(500).json({ error: "Falha interna no Motor Headless", details: error.message });
    } finally {
        if (browser) {
            console.log("🦅 [PDF Engine] Encerrando Instância Chromium Limpando Memória.");
            await browser.close();
        }
    }
});

app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🦅 B2B PDF ENGINE ONLINE (Puppeteer Worker) | PORT: ${PORT}`);
    console.log(`======================================================\n`);
    console.log(`Motor aguardando payloads HTML para Geração de Propostas...\n`);
});
