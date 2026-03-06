import { cn } from "@/lib/utils";
import { Globe, Instagram, MessageCircle, MapPin, CheckCircle2, XCircle } from "lucide-react";

interface PresenceBadgeProps {
  type: 'site' | 'instagram' | 'whatsapp' | 'googlemaps';
  found: boolean;
  value?: string;
}

const config = {
  site: { icon: Globe, label: 'Site' },
  instagram: { icon: Instagram, label: 'Instagram' },
  whatsapp: { icon: MessageCircle, label: 'WhatsApp' },
  googlemaps: { icon: MapPin, label: 'Google Maps' },
};

export function PresenceBadge({ type, found, value }: PresenceBadgeProps) {
  const { icon: Icon, label } = config[type];

  const content = (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
        found
          ? "bg-green-50 border-green-200/50 text-green-600 hover:bg-green-100/50 shadow-sm"
          : "bg-slate-50 border-slate-200 text-slate-300 opacity-60"
      )}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
      {found ? (
        <CheckCircle2 className="w-3 h-3 ml-0.5" />
      ) : (
        <XCircle className="w-3 h-3 ml-0.5 text-destructive/70" />
      )}
    </div>
  );

  if (found && value) {
    let href = value;
    if (type === 'whatsapp') {
      href = `https://wa.me/${value.replace(/\D/g, '')}`;
    } else if (type === 'instagram') {
      // Tenta extrair o username para garantir link de perfil limpo
      const parts = value.split('instagram.com/');
      if (parts.length > 1) {
        const username = parts[1].split('/')[0].split('?')[0];
        href = `https://www.instagram.com/${username}/`;
      } else {
        href = value.startsWith('http') ? value : `https://www.instagram.com/${value.replace(/^@/, '')}/`;
      }
    } else if (!value.startsWith('http') && !value.startsWith('//')) {
      href = `https://${value}`;
    }

    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
        {content}
      </a>
    );
  }

  return content;
}

interface PresenceScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PresenceScore({ score, size = 'md' }: PresenceScoreProps) {
  const color = score >= 75 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-red-600';
  const bgColor = score >= 75 ? 'bg-green-50' : score >= 40 ? 'bg-amber-50' : 'bg-red-50';
  const borderColor = score >= 75 ? 'border-green-200/50' : score >= 40 ? 'border-amber-200/50' : 'border-red-200/50';
  const label = score >= 75 ? 'Alta presença' : score >= 40 ? 'Presença parcial' : 'Baixa presença';

  const sizeClass = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-3xl';

  return (
    <div className={cn("flex flex-col items-center justify-center p-3 rounded-xl border shadow-sm", bgColor, borderColor)}>
      <span className={cn("font-display font-bold tabular-nums", sizeClass, color)}>{score}%</span>
      <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400 mt-0.5">{label}</span>
    </div>
  );
}
