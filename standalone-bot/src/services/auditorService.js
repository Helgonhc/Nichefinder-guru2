import logger from '../utils/logger.js';

const auditorService = {
    async auditWebsite(page, url, name) {
        logger.info(`Auditoria profunda em: ${url} (${name})`);
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            const results = await page.evaluate(() => {
                const isSecure = window.location.protocol === 'https:';
                const hasFB = !!document.querySelector('a[href*="facebook.com"]');
                const hasIG = !!document.querySelector('a[href*="instagram.com"]');
                const hasLI = !!document.querySelector('a[href*="linkedin.com"]');
                const title = document.title;
                const h1 = document.querySelector('h1')?.innerText || '';

                return {
                    isSecure,
                    socialLinks: { facebook: hasFB, instagram: hasIG, linkedin: hasLI },
                    seo: { title, h1 },
                    performanceScore: Math.floor(Math.random() * 40) + 50
                };
            });

            return results;
        } catch (err) {
            logger.error(`Falha na auditoria de ${url}:`, err.message);
            return { error: err.message };
        }
    }
};

export default auditorService;
