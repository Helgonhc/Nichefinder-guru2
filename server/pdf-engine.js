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
    'http://localhost:8081',
    'http://localhost:5173',
    'https://leadradar.com.br',
    'https://www.leadradar.com.br',
];

app.use(cors({
    origin: '*', // Permite todas as origens em desenvolvimento para evitar falhas de preflight
    methods: ['POST', 'OPTIONS'],
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
        /<script\b[^>]*src\s*=\s*["'](?!https:\/\/cdn\.tailwindcss\.com)https?:\/\//gi,   // scripts externos exceto tailwind
        /on(error|load|click|mouseover)\s*=/gi,          // event handlers inline
        /<iframe\b[^>]*src\s*=\s*["']https?:\/\//gi,   // iframes externos
    ];

    const hasSuspiciousContent = SUSPICIOUS_PATTERNS.some(pattern => pattern.test(html));
    if (hasSuspiciousContent) {
        console.warn('🚨 [PDF Engine] Payload suspeito bloqueado do IP:', req.ip);
        return res.status(400).json({ error: "Payload contém conteúdo não permitido." });
    }

    let page = null;
    try {
        console.log("🦅 [PDF Engine] Obtendo instância do Motor Chromium...");
        const browser = await getBrowser();
        page = await browser.newPage();

        await page.emulateMediaType("print");

        console.log("🦅 [PDF Engine] Injetando a Estrutura HTML B2B...");
        await page.setContent(html, {
            waitUntil: "networkidle0",
            timeout: 60000
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        console.log("🦅 [PDF Engine] Destilando o Pipeline. Gerando Binário PDF (A4)...");
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            preferCSSPageSize: true,
            margin: { top: "0", right: "0", bottom: "0", left: "0" }
        });

        console.log("🦅 [PDF Engine] Sucesso Absoluto! Enviando Stream.");

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", pdfBuffer.length);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("❌ [PDF Engine] Falha Crítica ao Renderizar PDF:", error);

        let status = 500;
        let message = "Falha interna no Motor Headless";

        if (error.message.includes("Target closed") || error.message.includes("Protocol error")) {
            message = "O motor de renderização crashou ou foi fechado inesperadamente. A instância será reiniciada na próxima tentativa.";
            status = 503;
            if (_browserInstance) {
                _browserInstance.close().catch(() => { });
                _browserInstance = null;
            }
        }

        res.status(status).json({ error: message, details: error.message });
    } finally {
        if (page) {
            await page.close().catch(() => { });
        }
    }
});

let _browserInstance = null;
async function getBrowser() {
    if (_browserInstance && _browserInstance.connected && (await _browserInstance.pages().then(() => true).catch(() => false))) {
        return _browserInstance;
    }

    if (_browserInstance) {
        try { await _browserInstance.close(); } catch (e) { }
    }

    console.log("🦅 [PDF Engine] Iniciando novo processo Chromium...");
    _browserInstance = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu",
            "--no-first-run",
            "--no-zygote",
            "--disable-extensions",
            "--disable-features=IsolateOrigins,site-per-process",
            "--font-render-hinting=none"
        ]
    });

    _browserInstance.on('disconnected', () => {
        console.warn('🦅 [PDF Engine] Chromium desconectado. Limpando instância...');
        _browserInstance = null;
    });

    return _browserInstance;
}

app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🦅 B2B PDF ENGINE ONLINE (Puppeteer Worker) | PORT: ${PORT}`);
    console.log(`======================================================\n`);
    console.log(`Motor aguardando payloads HTML para Geração de Propostas...\n`);
});

process.on('exit', (code) => {
    console.log(`🦅 [PDF Engine] Processo saindo com código: ${code}`);
});

process.on('uncaughtException', (err) => {
    console.error('🦅 [PDF Engine] Erro não capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🦅 [PDF Engine] Rejeição não tratada em:', promise, 'razão:', reason);
});

// Força o event loop a permanecer ativo caso o Express não o faça (estranho)
setInterval(() => { }, 1000 * 60 * 60); 
