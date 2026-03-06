import { BusinessData } from "@/types/business";

// Mock data to demonstrate the UI while Places API integration is set up
export const generateMockBusinesses = (niche: string, city: string): BusinessData[] => {
  const nicheNames: Record<string, string[]> = {
    dentista: ['Clínica Dr. Andrade', 'Odontologia Sorriso Perfeito', 'Studio Dental Silva', 'Clínica Dra. Fernanda Lima'],
    mecanica: ['Auto Center Ribeiro', 'Mecânica do João', 'Oficina Rápida Express', 'Centro Automotivo Melo'],
    medico: ['Clínica Saúde Total', 'Consultório Dr. Pereira', 'Centro Médico Vida', 'Clínica Dra. Santos'],
    quadra_futebol: ['Arena Sports', 'Quadras do Zé', 'Centro Esportivo Elite', 'Arena Futebol Society'],
    salao_beleza: ['Salão Glamour', 'Studio Hair & Beauty', 'Beleza & Estilo', 'Espaço VIP Beauty'],
    default: ['Empresa A', 'Empresa B', 'Empresa C', 'Empresa D'],
  };

  const names = nicheNames[niche] || nicheNames.default;

  return names.map((name, i) => {
    const hasWebsite = Math.random() > 0.6;
    const hasInstagram = Math.random() > 0.4;
    const hasWhatsapp = Math.random() > 0.3;
    const hasGoogleMaps = Math.random() > 0.2;

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
      id: `mock-${i}`,
      name,
      niche,
      address: `Rua das Flores, ${100 + i * 50} - ${city}`,
      city,
      phone: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      rating: +(3.5 + Math.random() * 1.5).toFixed(1),
      totalRatings: Math.floor(10 + Math.random() * 200),
      website: hasWebsite ? `https://www.${name.toLowerCase().replace(/\s/g, '')}.com.br` : undefined,
      instagram: hasInstagram ? `@${name.toLowerCase().replace(/\s/g, '').substring(0, 12)}` : undefined,
      whatsapp: hasWhatsapp ? `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      googleMapsUrl: hasGoogleMaps ? `https://maps.google.com/?q=${encodeURIComponent(name)}` : undefined,
      presenceScore,
      missingItems,
      foundItems,
    };
  });
};
