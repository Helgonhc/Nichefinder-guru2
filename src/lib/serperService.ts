const SERPER_API_KEY = import.meta.env.VITE_SERPER_API_KEY;

export interface DeepInfo {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    tiktok?: string;
    phone?: string;
    website?: string;
    rating?: number;
    totalRatings?: number;
}

const getHeaders = () => {
    const myHeaders = new Headers();
    myHeaders.append("X-API-KEY", SERPER_API_KEY || '');
    myHeaders.append("Content-Type", "application/json");
    return myHeaders;
};

export const searchGoogle = async (query: string): Promise<any> => {
    if (!SERPER_API_KEY) return null;
    try {
        const response = await fetch("https://google.serper.dev/search", {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ q: query, gl: "br", hl: "pt-br", num: 10 }),
            redirect: 'follow'
        });
        return response.ok ? await response.json() : null;
    } catch (error) {
        console.error("Serper Search Error:", error);
        return null;
    }
};

export const searchPlaces = async (query: string): Promise<any> => {
    if (!SERPER_API_KEY) return null;
    try {
        const response = await fetch("https://google.serper.dev/places", {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ q: query, gl: "br", hl: "pt-br" }),
            redirect: 'follow'
        });
        return response.ok ? await response.json() : null;
    } catch (error) {
        console.error("Serper Places Error:", error);
        return null;
    }
};

const extractPhone = (text: string): string | null => {
    if (!text) return null;
    // Regex aprimorada para padrões brasileiros: (XX) 9XXXX-XXXX, XX 9XXXXXXXX, +55...
    const patterns = [
        /(?:\+55\s?)?(?:\(?\d{2}\)?\s?)(?:9\d{4})[-\s\.]?\d{4}/g,
        /(?:\(?\d{2}\)?\s?)(?:9\d{4})[-\s\.]?\d{4}/g,
        /(?:\(?\d{2}\)?\s?)\d{4}[-\s\.]?\d{4}/g,
        /\d{2}\s?9\d{8}/g,
        /\d{2}\s?\d{8}/g,
        /\(?\d{2}\)?\s?9\d{8}/g,
        /\b\d{10,11}\b/g,
        /\d{2}-\d{4,5}-\d{4}/g
    ];

    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) return matches[0];
    }
    return null;
};

export const findDeepInfoViaSerper = async (businessName: string, city: string): Promise<DeepInfo> => {
    const info: DeepInfo = { totalRatings: 0, rating: 0 };
    if (!SERPER_API_KEY) return info;

    console.log(`[Serper] Investigação Profunda: ${businessName} em ${city}`);

    // 1. Busca via Places (Mais preciso para dados comerciais)
    const placesJson = await searchPlaces(`${businessName} ${city}`);
    if (placesJson?.places && placesJson.places.length > 0) {
        const place = placesJson.places[0];
        if (place.phoneNumber) info.phone = place.phoneNumber;
        if (place.website) info.website = place.website;
        if (place.rating) info.rating = place.rating;
        if (place.ratingCount) info.totalRatings = place.ratingCount;
        console.log(`[Serper] Dados de Places capturados para ${businessName}`);
    }

    // 2. Busca Geral para Redes Sociais e Fallback
    const generalJson = await searchGoogle(`${businessName} ${city}`);
    if (generalJson) {
        // Knowledge Graph Fallback
        if (generalJson.knowledgeGraph) {
            const kg = generalJson.knowledgeGraph;
            if (!info.website && kg.website) info.website = kg.website;
            if (!info.phone && kg.phone) info.phone = kg.phone;
            if (!info.phone) {
                const kgPhone = extractPhone(JSON.stringify(kg));
                if (kgPhone) info.phone = kgPhone;
            }
        }

        // Organic Results (Socials focus)
        if (generalJson.organic) {
            for (const result of generalJson.organic) {
                const link = (result.link || '').toLowerCase();
                if (!info.instagram && link.includes('instagram.com/')) info.instagram = result.link;
                if (!info.facebook && link.includes('facebook.com/')) info.facebook = result.link;
                if (!info.linkedin && link.includes('linkedin.com/')) info.linkedin = result.link;
                if (!info.tiktok && link.includes('tiktok.com/@')) info.tiktok = result.link;

                if (!info.phone) {
                    const phone = extractPhone(result.snippet || '') || extractPhone(result.title || '');
                    if (phone) info.phone = phone;
                }

                if (!info.website && !link.includes('instagram') && !link.includes('facebook') && !link.includes('linkedin')) {
                    // Evitar agregadores óbvios
                    const aggregators = ['tripadvisor', 'reclameaqui', 'guiamais', 'solutudo', 'mapa.com', 'listamais', 'yelp'];
                    if (!aggregators.some(a => link.includes(a))) {
                        info.website = result.link;
                    }
                }
            }
        }
    }

    // 3. Busca Direcionada de Redes Sociais (se faltar)
    if (!info.instagram || !info.facebook || !info.tiktok) {
        const socialJson = await searchGoogle(`${businessName} ${city} instagram facebook tiktok`);
        if (socialJson?.organic) {
            for (const result of socialJson.organic) {
                const link = (result.link || '').toLowerCase();
                if (!info.instagram && link.includes('instagram.com/')) info.instagram = result.link;
                if (!info.facebook && link.includes('facebook.com/')) info.facebook = result.link;
                if (!info.tiktok && link.includes('tiktok.com/@')) info.tiktok = result.link;
            }
        }
    }

    return info;
};
