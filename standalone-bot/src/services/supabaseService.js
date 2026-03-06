import { createClient } from '@supabase/supabase-js';
import config from '../config.js';
import logger from '../utils/logger.js';

const supabase = createClient(config.supabase.url, config.supabase.key);

const supabaseService = {
    client: supabase,

    async logToSupabase(message) {
        logger.info(message);
        try {
            const { data: statusLeads } = await supabase
                .from('leads')
                .select('*')
                .eq('name', 'ROBOT_STATUS')
                .eq('user_id', config.bot.ownerId)
                .order('created_at', { ascending: false })
                .limit(1);

            const statusLead = statusLeads?.[0];

            if (statusLead) {
                const currentLogs = statusLead.meta_data?.logs || [];
                const newLog = `[${new Date().toLocaleTimeString()}] ${message}`;
                const updatedLogs = [newLog, ...currentLogs].slice(0, 50);

                await supabase.from('leads').update({
                    meta_data: {
                        ...statusLead.meta_data,
                        logs: updatedLogs,
                        last_ping: new Date().toISOString()
                    }
                }).eq('id', statusLead.id);
            }
        } catch (err) {
            logger.error('Erro ao logar no Supabase:', err.message);
        }
    },

    async updateRobotStatus(statusData) {
        try {
            const { data: statusLeads } = await supabase
                .from('leads')
                .select('*')
                .eq('name', 'ROBOT_STATUS')
                .eq('user_id', config.bot.ownerId)
                .limit(1);

            if (statusLeads?.[0]) {
                await supabase.from('leads').update({
                    meta_data: {
                        ...statusLeads[0].meta_data,
                        ...statusData,
                        last_ping: new Date().toISOString()
                    }
                }).eq('id', statusLeads[0].id);
            }
        } catch (err) {
            logger.error('Erro ao atualizar status do robô:', err.message);
        }
    }
};

export default supabaseService;
