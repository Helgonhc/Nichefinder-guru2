import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { niche, city } = await req.json();
        const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');

        if (!GOOGLE_PLACES_API_KEY) {
            throw new Error('GOOGLE_PLACES_API_KEY não configurada no Supabase');
        }

        const query = encodeURIComponent(`${niche} em ${city}`);
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${GOOGLE_PLACES_API_KEY}&language=pt-BR`;

        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
            throw new Error(`Google API error: ${searchData.status} - ${searchData.error_message || ''}`);
        }

        const results = searchData.results || [];

        // Process top 10 results to get details (website/phone)
        // In a real production app, you might want to do this sequentially or use a smarter strategy
        const mappedResults = await Promise.all(
            results.slice(0, 10).map(async (place: any) => {
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,international_phone_number,url&key=${GOOGLE_PLACES_API_KEY}&language=pt-BR`;

                const detailsRes = await fetch(detailsUrl);
                const detailsData = await detailsRes.json();
                const details = detailsData.result || {};

                const hasWebsite = !!details.website;
                const hasInstagram = false;
                const hasWhatsapp = details.international_phone_number?.includes('whatsapp') || false;
                const hasGoogleMaps = !!details.url || !!place.geometry;

                const foundItems: string[] = [];
                const missingItems: string[] = [];

                if (hasWebsite) foundItems.push('Site');
                else missingItems.push('Site');

                if (hasInstagram) foundItems.push('Instagram');
                else missingItems.push('Instagram');

                if (hasWhatsapp) foundItems.push('WhatsApp Business');
                else missingItems.push('WhatsApp Business');

                if (hasGoogleMaps) foundItems.push('Google Meu Negócio');
                else missingItems.push('Google Meu Negócio');

                const presenceScore = Math.round((foundItems.length / 4) * 100);

                return {
                    id: place.place_id,
                    name: place.name,
                    niche,
                    address: place.formatted_address,
                    city,
                    phone: details.international_phone_number,
                    rating: place.rating,
                    totalRatings: place.user_ratings_total,
                    website: details.website,
                    googleMapsUrl: details.url,
                    presenceScore,
                    missingItems,
                    foundItems,
                };
            })
        );

        return new Response(
            JSON.stringify(mappedResults),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error in search-places:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
