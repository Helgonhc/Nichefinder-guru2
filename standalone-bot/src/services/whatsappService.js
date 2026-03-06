import logger from '../utils/logger.js';

const whatsappService = {
    async sendMessage(page, phone, message) {
        logger.wa(`Enviando mensagem para: ${phone}`);
        try {
            await page.goto(`https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, { waitUntil: 'networkidle2' });
            await new Promise(r => setTimeout(r, 6000));

            const invalidPhone = await page.evaluate(() => {
                const modal = document.querySelector('[data-animate-modal-popup="true"]') || document.querySelector('[data-testid="popup-contents"]');
                if (modal && modal.innerText.toLowerCase().includes('inválid')) {
                    modal.querySelector('button')?.click();
                    return true;
                }
                return false;
            });

            if (invalidPhone) {
                logger.wa(`NÚMERO INVÁLIDO: ${phone}`);
                return { success: false, reason: 'telefone_invalido' };
            }

            await page.keyboard.press('Enter');
            await new Promise(r => setTimeout(r, 2000));

            return { success: true };
        } catch (err) {
            logger.error(`Erro ao enviar WhatsApp para ${phone}:`, err.message);
            return { success: false, reason: err.message };
        }
    },

    async checkForReply(page, phone) {
        try {
            await page.goto(`https://web.whatsapp.com/send?phone=${phone}`, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(r => setTimeout(r, 5000));

            const hasReply = await page.evaluate(() => {
                const messages = document.querySelectorAll('.message-in');
                if (messages.length === 0) return false;
                const all = document.querySelectorAll('[class*="message-"]');
                const last = all[all.length - 1];
                return last && last.classList.contains('message-in');
            });

            return hasReply;
        } catch (err) {
            logger.error(`Erro ao verificar resposta de ${phone}:`, err.message);
            return false;
        }
    }
};

export default whatsappService;
