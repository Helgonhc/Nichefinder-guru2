const logger = {
    info: (msg) => console.log(`[INFO] [${new Date().toLocaleTimeString()}] ${msg}`),
    error: (msg, err) => console.error(`[ERROR] [${new Date().toLocaleTimeString()}] ${msg}`, err || ''),
    warn: (msg) => console.warn(`[WARN] [${new Date().toLocaleTimeString()}] ${msg}`),
    ai: (msg) => console.log(`[IA] [${new Date().toLocaleTimeString()}] ${msg}`),
    wa: (msg) => console.log(`[WA] [${new Date().toLocaleTimeString()}] ${msg}`),
};

export default logger;
