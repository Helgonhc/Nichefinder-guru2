import * as dotenv from 'dotenv';
dotenv.config();

const config = {
    supabase: {
        url: process.env.VITE_SUPABASE_URL,
        key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    },
    apis: {
        groq: process.env.VITE_GROQ_API_KEY,
        serper: process.env.VITE_SERPER_API_KEY,
        googlePlaces: process.env.VITE_GOOGLE_PLACES_API_KEY,
    },
    bot: {
        ownerId: process.env.BOT_OWNER_ID,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
};

if (!config.supabase.url || !config.supabase.key) {
    console.error('❌ ERRO: SUPABASE_URL ou KEY não configurada no .env');
    process.exit(1);
}

export default config;
