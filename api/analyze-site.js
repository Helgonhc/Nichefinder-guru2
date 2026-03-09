
export default async function handler(req, res) {
    const { url } = req.query;
    const GOOGLE_API_KEY = process.env.VITE_GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    if (!GOOGLE_API_KEY) {
        return res.status(500).json({ error: 'Google API Key not configured' });
    }

    try {
        const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=PERFORMANCE&category=SEO&category=ACCESSIBILITY&category=BEST_PRACTICES&key=${GOOGLE_API_KEY}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok) {
            console.error('[PageSpeed API Error]', data);
            return res.status(response.status).json(data);
        }

        // Configurar CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

        return res.status(200).json(data);
    } catch (error) {
        console.error('[PageSpeed API] Critical Error:', error.message);
        return res.status(500).json({ error: 'PageSpeed Insight failed', message: error.message });
    }
}
