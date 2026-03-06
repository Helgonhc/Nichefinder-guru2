import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Valida se uma URL pertence a um website real de empresa.
 * Descarta redes sociais, agregadores de links e apps de mensagem.
 */
export function validateBusinessWebsite(url: string | undefined | null): string | null {
  if (!url) return null;

  const blockedDomains = [
    'instagram.com', 'facebook.com', 'fb.com', 'm.facebook.com',
    'whatsapp.com', 'wa.me', 'api.whatsapp.com',
    't.me', 'telegram.me',
    'linkedin.com',
    'linktr.ee', 'beacons.ai', 'bio.site',
    'youtube.com', 'youtu.be',
    'tiktok.com',
    'pinterest.com',
    'twitter.com', 'x.com'
  ];

  try {
    const lowerUrl = url.toLowerCase().trim();

    // Verifica se contém algum dos domínios bloqueados
    const isBlocked = blockedDomains.some(domain =>
      lowerUrl.includes(domain)
    );

    if (isBlocked) return null;

    // Se for vazio ou apenas protocolos, descarta
    if (lowerUrl.replace('https://', '').replace('http://', '').replace('www.', '').length < 3) {
      return null;
    }

    return lowerUrl;
  } catch (e) {
    return null;
  }
}
