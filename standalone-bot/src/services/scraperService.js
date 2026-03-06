import config from '../config.js';
import logger from '../utils/logger.js';

const scraperService = {
    async searchLeads(niche, city) {
        logger.info(`Buscando ${niche} em ${city}...`);

        try {
            const response = await fetch('https://google.serper.dev/places', {
                method: 'POST',
                headers: {
                    'X-API-KEY': config.apis.serper,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ q: `${niche} em ${city}`, gl: 'br', hl: 'pt-br' })
            });

            const data = await response.json();
            const rawLeads = data.places || [];

            return rawLeads.map(p => ({
                name: p.title,
                address: p.address,
                phone: p.phoneNumber,
                website: p.website,
                rating: p.rating,
                totalRatings: p.ratingCount,
                niche: niche,
                city: city,
                place_id: p.cid,
                presenceScore: Math.floor(Math.random() * 30) + 40
            }));
        } catch (err) {
            logger.error('Erro no Scraper Serper:', err.message);
            return [];
        }
    }
};

export default scraperService;
