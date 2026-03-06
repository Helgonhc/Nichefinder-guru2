import { BusinessData } from "@/types/business";

/**
 * Exporta a lista de leads para um arquivo CSV.
 * Converte camelCase para colunas legíveis em português.
 */
export function exportLeadsToCSV(leads: BusinessData[], filename = "leads_leadradar.csv"): void {
    if (!leads.length) return;

    const headers = [
        "Nome",
        "Nicho",
        "Cidade",
        "Endereço",
        "Telefone",
        "WhatsApp",
        "Website",
        "Instagram",
        "Google Maps",
        "Avaliação Google",
        "Nº Avaliações",
        "Score de Presença",
        "Score de Lead",
        "Temperatura",
        "Status",
        "Notas",
    ];

    const rows = leads.map((lead) => {
        // Calcula score dinamicamente se não tiver cached
        const temperature = lead.temperature ?? "—";
        const score = lead.score ?? lead.presenceScore ?? 0;

        return [
            escapeCsvValue(lead.name),
            escapeCsvValue(lead.niche),
            escapeCsvValue(lead.city),
            escapeCsvValue(lead.address),
            escapeCsvValue(lead.phone ?? ""),
            escapeCsvValue(lead.whatsapp ?? ""),
            escapeCsvValue(lead.website ?? ""),
            escapeCsvValue(lead.instagram ?? lead.instagramHandle ?? ""),
            escapeCsvValue(lead.googleMapsUrl ?? ""),
            String(lead.rating ?? ""),
            String(lead.totalRatings ?? ""),
            String(lead.presenceScore ?? 0),
            String(score),
            escapeCsvValue(translateTemperature(temperature)),
            escapeCsvValue(translateStatus(lead.status ?? "new")),
            escapeCsvValue(lead.notes ?? ""),
        ];
    });

    const csvContent = [
        headers.join(";"),
        ...rows.map((row) => row.join(";")),
    ].join("\n");

    // BOM para compatibilidade com Excel em UTF-8
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
}

/** Escapa aspas e vírgulas para CSV */
function escapeCsvValue(value: string): string {
    if (!value) return "";
    const str = String(value).replace(/"/g, '""');
    return str.includes(";") || str.includes('"') || str.includes("\n")
        ? `"${str}"`
        : str;
}

function translateTemperature(temp: string): string {
    const map: Record<string, string> = {
        quente: "🔥 HOT",
        morno: "🌡️ WARM",
        frio: "❄️ COLD",
    };
    return map[temp] ?? temp;
}

function translateStatus(status: string): string {
    const map: Record<string, string> = {
        new: "Novo",
        contacted: "Contatado",
        interested: "Interessado",
        closed: "Fechado",
    };
    return map[status] ?? status;
}
