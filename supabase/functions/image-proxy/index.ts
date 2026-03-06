// supabase/functions/image-proxy/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

function corsHeaders(origin: string | null) {
    return {
        "Access-Control-Allow-Origin": origin ?? "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
}

Deno.serve(async (req) => {
    const origin = req.headers.get("origin");

    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders(origin), status: 204 });
    }

    try {
        const { url } = await req.json();

        if (!url || typeof url !== "string") {
            return new Response(JSON.stringify({ error: "Missing url" }), {
                status: 400,
                headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
            });
        }

        // Proteção básica: só permite imagens do domínio exigido
        const u = new URL(url);
        if (u.hostname !== "telemetria-eletricom.me") {
            return new Response(JSON.stringify({ error: "Domain not allowed" }), {
                status: 403,
                headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
            });
        }

        const res = await fetch(url, { redirect: "follow" });
        if (!res.ok) {
            return new Response(JSON.stringify({ error: `Fetch failed HTTP ${res.status}` }), {
                status: 502,
                headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
            });
        }

        const contentType = res.headers.get("content-type") ?? "image/png";
        const bytes = new Uint8Array(await res.arrayBuffer());

        // Converte para base64 de forma segura no Deno
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        const dataUrl = `data:${contentType};base64,${base64}`;

        return new Response(JSON.stringify({ dataUrl }), {
            status: 200,
            headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), {
            status: 500,
            headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
        });
    }
});
