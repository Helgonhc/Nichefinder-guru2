import puppeteer from 'puppeteer';
import config from './config.js';
import logger from './utils/logger.js';
import supabaseService from './services/supabaseService.js';
import scraperService from './services/scraperService.js';
import auditorService from './services/auditorService.js';
import aiService from './services/aiService.js';
import whatsappService from './services/whatsappService.js';
import scoringService from './services/scoringService.js';

let browser;
let page;

async function initBrowser() {
    logger.info('Iniciando Navegador Puppeteer (ESM)...');
    try {
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();
        await page.setUserAgent(config.bot.userAgent);
        await page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle2' });
    } catch (err) {
        logger.error('Erro ao iniciar browser:', err.message);
    }
}

async function mainLoop() {
    logger.info('🤖 Robô Guru Modular Iniciado!');
    await supabaseService.logToSupabase('🚀 Robô Guru Modular Iniciado com SUCESSO (ESM)!');

    while (true) {
        try {
            // Update Activity Heartbeat
            await supabaseService.updateRobotStatus({
                automation_status: 'IDLE',
                connected: true,
                paused: false
            });

            const { data: status } = await supabaseService.client
                .from('leads')
                .select('meta_data')
                .eq('name', 'ROBOT_STATUS')
                .eq('user_id', config.bot.ownerId)
                .maybeSingle();

            if (status?.meta_data?.paused) {
                logger.warn('⏸️ Robô Pausado via Dashboard.');
                await supabaseService.updateRobotStatus({ automation_status: 'PAUSADO', paused: true });
                await new Promise(r => setTimeout(r, 10000));
                continue;
            }

            // Simular Ciclo de Trabalho (Para demonstração da Fase 3)
            await supabaseService.updateRobotStatus({ automation_status: '🔍 VERIFICANDO FILA...' });
            await new Promise(r => setTimeout(r, 5000));

            logger.info('Aguardando próximas tarefas...');
            await supabaseService.updateRobotStatus({ automation_status: '💤 AGUARDANDO TAREFAS' });
            await new Promise(r => setTimeout(r, 30000));

        } catch (err) {
            logger.error('Erro no Main Loop:', err.message);
            await supabaseService.logToSupabase(`❌ Erro Crítico: ${err.message}`);
            await new Promise(r => setTimeout(r, 10000));
        }
    }
}

initBrowser().then(() => mainLoop()).catch(e => logger.error('Falha crítica:', e));

process.on('SIGINT', async () => {
    logger.warn('🛑 Desligando robô...');
    if (browser) await browser.close();
    process.exit(0);
});
