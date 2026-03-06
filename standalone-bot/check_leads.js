import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const ownerId = process.env.BOT_OWNER_ID;

(async () => {
    console.log("Teste de Filtragem com LTE...");
    const nowISO = new Date().toISOString();
    console.log("Tempo atual ISO:", nowISO);

    const { data: leads, error } = await supabase.from('leads')
        .select('*')
        .or(`automation_status.eq.queued,meta_data->>automation_status.eq.queued`)
        .eq('user_id', ownerId)
        .lte('meta_data->>scheduled_at', nowISO);

    if (error) {
        console.error("ERRO SUPABASE:", error);
    } else {
        console.log(`Leads encontrados com filtro de tempo: ${leads?.length || 0}`);
        leads?.forEach(l => console.log(l.id, l.name));
    }
})();
