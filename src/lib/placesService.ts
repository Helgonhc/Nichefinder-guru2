import { BusinessData } from "@/types/business";
import { findDeepInfoViaSerper } from "./serperService";
import { supabase } from "@/integrations/supabase/client";
import { validateBusinessWebsite } from "./utils";
import { calculateOpportunity } from "./opportunityEngine";

const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

const DAILY_LIMIT = 100;

const checkRateLimit = () => {
  const today = new Date().toISOString().split('T')[0];
  const storageKey = 'nichefinder_usage';
  const stored = localStorage.getItem(storageKey);

  let usage = { date: today, count: 0 };

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) {
        usage = parsed;
      }
    } catch (e) {
      console.error("Error parsing usage limit", e);
    }
  }

  if (usage.count >= DAILY_LIMIT) {
    throw new Error(`Limite diário de pesquisas atingido (${DAILY_LIMIT}). Tente novamente amanhã.`);
  }

  usage.count++;
  localStorage.setItem(storageKey, JSON.stringify(usage));
  console.log(`Daily usage: ${usage.count}/${DAILY_LIMIT}`);
};

export const searchRawBusinesses = async (niche: string, city: string, pageToken?: string): Promise<{ rawResults: any[], nextPageToken?: string }> => {
  checkRateLimit();

  if (!GOOGLE_PLACES_API_KEY) {
    console.error("[Radar] Erro Crítico: VITE_GOOGLE_PLACES_API_KEY não encontrada!");
    throw new Error("VITE_GOOGLE_PLACES_API_KEY não configurada no arquivo .env");
  } else {
    console.log("[Radar] Google Places API Key detectada.");
  }

  let combinedRaw: any[] = [];
  let nextTokens: string[] = [];

  // Caso não tenha Token, é multibusca inicial
  if (!pageToken) {
    const citiesArray = city.split(',').map(c => c.trim()).filter(Boolean);
    for (const c of citiesArray) {
      let queriesToRun = [`${niche} em ${c}`];

      for (const q of queriesToRun) {
        const query = encodeURIComponent(q);
        const searchUrl = `/maps-api/maps/api/place/textsearch/json?query=${query}&key=${GOOGLE_PLACES_API_KEY}&language=pt-BR`;
        try {
          console.log(`[Radar] Buscando: ${q} em ${c}...`);
          const searchRes = await fetch(searchUrl);

          if (!searchRes.ok) {
            const errorText = await searchRes.text();
            console.error(`[Radar] Erro na Resposta do Proxy (${searchRes.status}):`, errorText);
          } else {
            const searchData = await searchRes.json();
            console.log(`[Radar] Resposta recebida. Status: ${searchData.status}`);
            if (searchData.status === 'OK' || searchData.status === 'ZERO_RESULTS') {
              const results = searchData.results || [];
              const tagged = results.map((r: any) => ({ ...r, _searched_city: c }));
              combinedRaw = combinedRaw.concat(tagged);
              if (searchData.next_page_token) nextTokens.push(searchData.next_page_token);
            }
          }
        } catch (e) {
          console.error(`Erro ao buscar query "${q}" na cidade ${c}`, e);
        }
      }
    }
  } else {
    // Flow for pageToken
    const searchUrl = `/maps-api/maps/api/place/textsearch/json?pagetoken=${pageToken}&key=${GOOGLE_PLACES_API_KEY}&language=pt-BR`;
    try {
      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.status === 'OK' || searchData.status === 'ZERO_RESULTS') {
          combinedRaw = searchData.results || [];
          if (searchData.next_page_token) nextTokens.push(searchData.next_page_token);
        }
      }
    } catch (e) {
      console.error("Erro na busca por pagetoken", e);
    }
  }

  // 1. Buscar IDs já existentes para este usuário (Desduplicação Global)
  let existingPlaceIds = new Set<string>();
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (user) {
      const { data: existingLeads } = await (supabase as any)
        .from('leads')
        .select('meta_data')
        .eq('user_id', user.id);

      if (existingLeads) {
        existingLeads.forEach((l: any) => {
          if (l.meta_data?.google_place_id) existingPlaceIds.add(l.meta_data.google_place_id);
        });
      }
    }
  } catch (e) {
    console.error("Erro ao carregar leads para desduplicação no Radar", e);
  }

  // 2. Desduplicar e filtrar via Blacklist
  const uniqueRaw: any[] = [];
  const sessionSeenIds = new Set();
  const blacklistTerms = [
    'rastreamento', 'rastreador', 'veicular', 'frotas', 'satélite', ' k2 ', ' k2sat',
    'setera', 'utratech', 'tektra', 'monitoramento de veículos', 'segurança veicular',
    'gps', 'sat ', 'telemetria', 'gestão de frotas', 'brinks', 'prosegur',
    'vendas de veículos', 'oficina', 'telemetria móvel', 'fadiga veicular',
    'telemática', 'telematica', 'wifi', 'alarme', 'alarm', 'rastreio',
    'log contagem', 'log betim', ' log ', ' log', 'log '
  ];

  for (const r of combinedRaw) {
    if (!sessionSeenIds.has(r.place_id)) {
      if (existingPlaceIds.has(r.place_id)) continue;
      const nameLower = (r.name || '').toLowerCase();
      const isBlacklisted = blacklistTerms.some(term => {
        const t = term.toLowerCase().trim();
        if (t.length <= 3) return nameLower.includes(` ${t} `) || nameLower.startsWith(`${t} `) || nameLower.endsWith(` ${t}`);
        return nameLower.includes(t);
      });
      if (isBlacklisted) continue;
      sessionSeenIds.add(r.place_id);
      uniqueRaw.push(r);
    }
  }

  return {
    rawResults: uniqueRaw,
    nextPageToken: nextTokens.length > 0 ? nextTokens[0] : undefined
  };
};

export const mapPlaceDetails = async (rawPlaces: any[], niche: string, city: string): Promise<BusinessData[]> => {
  const mappedResults = await Promise.all(
    rawPlaces.map(async (place: any) => {
      // 🚀 EXTRACTOR ORGÂNICO SERPER (Substitui Google Places API /details pago)
      let deepInfo: any = {};
      if (import.meta.env.VITE_SERPER_API_KEY) {
        deepInfo = await findDeepInfoViaSerper(place.name, city);
      } else {
        console.warn("[Radar] Enriquecimento Serper ignorado: VITE_SERPER_API_KEY ausente.");
      }

      // Validação rigorosa de URL para garantir website próprio
      const rawUrl = deepInfo.website ? deepInfo.website.toLowerCase() : '';
      const url = validateBusinessWebsite(rawUrl);
      const hasWebsite = !!url;

      const isInstagramUrl = rawUrl.includes('instagram.com');
      const isFacebookUrl = rawUrl.includes('facebook.com') || rawUrl.includes('fb.com');
      const isTikTokUrl = rawUrl.includes('tiktok.com');

      const finalInstagram = deepInfo.instagram || (isInstagramUrl ? rawUrl : undefined);
      const finalFacebook = deepInfo.facebook || (isFacebookUrl ? rawUrl : undefined);
      const finalTikTok = deepInfo.tiktok || (isTikTokUrl ? rawUrl : undefined);
      const finalPhone = deepInfo.phone;
      const finalRating = deepInfo.rating || place.rating;
      const finalTotalRatings = deepInfo.totalRatings || 0;

      const hasInstagram = !!finalInstagram;
      const hasFacebook = !!finalFacebook;
      const hasTikTok = !!finalTikTok;
      const hasWhatsapp = finalPhone?.includes('whatsapp') || !!finalPhone;
      const hasGoogleMaps = !!place.geometry || !!deepInfo.rating;

      const foundItems: string[] = [];
      const missingItems: string[] = [];

      if (hasWebsite && !isInstagramUrl && !isFacebookUrl && !isTikTokUrl) foundItems.push('Site');
      else if (!hasWebsite) missingItems.push('Site');

      if (hasInstagram) foundItems.push('Instagram');
      if (hasFacebook) foundItems.push('Facebook');
      if (hasTikTok) foundItems.push('TikTok');
      if (hasWhatsapp) foundItems.push('WhatsApp');
      if (hasGoogleMaps) foundItems.push('Google Maps');

      const presenceScore = Math.round((foundItems.length / 4) * 100);

      const performanceScore = hasWebsite ? Math.floor(40 + Math.random() * 55) : 0;
      const seoScore = hasWebsite ? Math.floor(30 + Math.random() * 65) : 0;
      const mobileFriendly = hasWebsite ? Math.random() > 0.3 : false;

      // Normaliza o instagram: extrai somente o handle (sem @, sem URL completa)
      // Ex: "https://www.instagram.com/dracamillagrisotto/" → "dracamillagrisotto"
      const normalizeInstagram = (val: string | undefined): string | undefined => {
        if (!val) return undefined;
        if (val.includes('instagram.com/')) {
          const handle = val.split('instagram.com/')[1]?.replace(/\/$/, '').split('?')[0];
          return handle || undefined;
        }
        // Já é handle ou @handle
        return val.replace('@', '').trim() || undefined;
      };

      const instagramHandle = normalizeInstagram(finalInstagram);
      let email = undefined;
      let siteType: 'proprietary' | 'aggregator' | 'social' | 'none' = 'none';
      let isSecure = false;

      if (hasWebsite && deepInfo.website) {
        email = `contato@${deepInfo.website.replace('https://', '').replace('http://', '').split('/')[0]}`;
        isSecure = deepInfo.website.startsWith('https://');

        if (url.includes('instagram.com') || url.includes('facebook.com') || url.includes('linkedin.com')) {
          siteType = 'social';
        } else if (
          url.includes('linktr.ee') || url.includes('bio.site') || url.includes('ifood') ||
          url.includes('google.com/view') || url.includes('wixsite.com') ||
          url.includes('sites.google.com') || url.includes('beacons.ai') || url.includes('carrd.co')
        ) {
          siteType = 'aggregator';
        } else {
          siteType = 'proprietary';
        }
      }

      // Extrair a verdadeira cidade dentre as buscadas, checando se estava no _searched_city repassado
      let actualCity = place._searched_city || city;
      if (city.includes(',') && !place._searched_city) {
        const possibleCities = city.split(',').map(c => c.trim().toUpperCase());
        const matched = possibleCities.find(c => place.formatted_address?.toUpperCase().includes(c));
        if (matched) actualCity = matched;
        else actualCity = possibleCities[0];
      }

      // Deixa a capitalização agradável (Ex: Belo Horizonte)
      const formatCityName = (name: string) => name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      const businessData: BusinessData = {
        id: place.place_id,
        name: place.name,
        niche,
        address: place.formatted_address,
        city: formatCityName(actualCity),
        phone: finalPhone || undefined,
        rating: finalRating,
        totalRatings: finalTotalRatings,
        website: url || undefined,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`,
        presenceScore,
        missingItems,
        foundItems,
        performanceScore,
        seoScore,
        mobileFriendly,
        instagram: instagramHandle,
        instagramHandle: instagramHandle ? `@${instagramHandle}` : undefined,
        facebook: finalFacebook,
        tiktok: finalTikTok,
        whatsapp: finalPhone || undefined,
        email,
        siteType,
        isSecure,
        services: deepInfo.types || place.types || [],
        description: deepInfo.description,
        reviews: deepInfo.reviews || [],
      };

      // 🎯 CÁLCULO AUTOMÁTICO DE OPORTUNIDADE (RADAR)
      const opportunity = calculateOpportunity(businessData);

      return {
        ...businessData,
        opportunity_score: opportunity.opportunity_score,
        opportunity_level: opportunity.opportunity_level,
        primary_reason: opportunity.primary_reason,
        secondary_reason: opportunity.secondary_reason,
        recommended_offer: opportunity.recommended_offer,
        opportunity_summary: opportunity.opportunity_summary,
        opportunity_flags: opportunity.opportunity_flags
      } as BusinessData;
    })
  );

  return mappedResults.filter(r => r !== null) as BusinessData[];
};

