export interface BusinessData {
  id: string;
  name: string;
  niche: string;
  address: string;
  city: string;
  phone?: string;
  rating?: number;
  totalRatings?: number;
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  thumbnail?: string;
  description?: string;
  services?: string[];
  reviews?: Array<{
    user?: string;
    rating?: number;
    text?: string;
    date?: string;
  }>;
  whatsapp?: string;
  googleMapsUrl?: string;
  placeId?: string;
  presenceScore: number;
  missingItems: string[];
  foundItems: string[];

  // Legacy & Basic Metrics (Internal Sync)
  performanceScore?: number;
  seoScore?: number;
  mobileFriendly?: boolean;
  instagramHandle?: string;
  email?: string;
  status?: 'new' | 'contacted' | 'interested' | 'closed';
  notes?: string;
  siteType?: 'proprietary' | 'aggregator' | 'social' | 'none';
  isSecure?: boolean;
  score?: number;
  temperature?: 'frio' | 'morno' | 'quente';
  lastPostDate?: string;
  offerReason?: string;

  // --- NEW CONVERSION MACHINE FIELDS (Deep Qualification) ---
  temSite?: boolean;
  urlSite?: string;
  audit?: {
    mobileFriendly?: boolean;
    https?: boolean;
    speedScore?: number;
    seoBasics?: boolean;
    ctaClarity?: boolean;
    performanceScore?: number;
    seoScore?: number;
    accessibilityScore?: number;
    bestPracticesScore?: number;
    lcp?: string;
    cls?: string;
    isResponsive?: boolean;
    isSecure?: boolean;
    copyrightYear?: number;
    analyzedAt?: string;
    ai_insight?: string;
    isDown?: boolean;
  };
  instagramAtivo?: boolean;
  ultimaPostagem?: string;
  contatoPreferido?: 'whats' | 'email' | 'ig';
  categoria?: string;
  prioridade?: number; // Calculated by score
  motivoPrincipalDaOferta?: string; // AI generated

  // Funnel & Cadence tracking
  cadenceStage?: 'D0' | 'D2' | 'D5' | 'D9' | 'Completed';
  lastInteractionDate?: string;
  automationLogs?: Array<{
    date: string;
    action: string;
    result: 'enviado' | 'entregue' | 'respondido' | 'bloqueado' | 'erro';
    templateUsed?: string;
  }>;
  ticketMedio?: number;
  conversionResult?: 'reuniao' | 'fechamento' | 'perdido' | 'nulo';
  automationStatus?: 'idle' | 'queued' | 'sending' | 'paused' | 'stopped' | 'completed' | 'stopped_by_user' | 'ready_for_dispatch';
  lastScanAt?: string;
  motivoOferta?: string;

  // Opportunity Engine Fields
  opportunity_score?: number;
  opportunity_level?: "low" | "medium" | "high" | "very_high";
  primary_reason?: string;
  secondary_reason?: string;
  recommended_offer?: string;
  opportunity_summary?: string;
  opportunity_flags?: string[];

  // Remake Preview Engine Fields
  site_preview?: {
    headline: string;
    subheadline: string;
    benefits: string[];
    services: string[];
    testimonials: string[];
    cta_text: string;
    cta_action: string;
    builder_prompt?: string;
    color_palette?: string[];
    layout_type?: string;
    font_family?: string;
    site_diagnostics?: {
      score: number;
      problems: string[];
      suggestions: string[];
    };
  };
  site_preview_summary?: string;
  meta_data?: Record<string, any>;
  html_preview?: string | null;
  vibe_prompt?: string;
  generated_site_code?: string;
}

export interface SearchParams {
  niche: string;
  city: string;
  customNiche?: string;
}

export type GeneratorType = 'script' | 'prompt' | 'analysis' | 'design' | 'script_system' | 'script_website' | 'battle_plan' | 'xeque_mate' | 'objections' | 'website_html';

export const NICHES = [
  { value: 'energia_solar', label: '☀️ Energia Solar', keyword: 'energia solar instalação fotovoltaica' },
  { value: 'estetica', label: '✨ Clínica de Estética', keyword: 'clínica estética harmonização facial' },
  { value: 'dentista', label: '🦷 Dentista / Odonto', keyword: 'consultório odontológico dentista' },
  { value: 'medico', label: '👨‍⚕️ Consultório Médico', keyword: 'clínica médica consultório' },
  { value: 'advocacia', label: '⚖️ Advocacia', keyword: 'escritório de advocacia advogado' },
  { value: 'arquitetura', label: '🏗️ Arquitetura & Interiores', keyword: 'escritório arquitetura design interiores' },
  { value: 'imobiliaria', label: '🏠 Imobiliária', keyword: 'imobiliária corretor imóveis' },
  { value: 'beach_tennis', label: '🎾 Beach Tennis / Futevôlei', keyword: 'quadra beach tennis futevôlei arena' },
  { value: 'academia', label: '💪 Academia / Crossfit', keyword: 'academia fitness crossfit' },
  { value: 'mecanica', label: '🔧 Oficina Mecânica', keyword: 'oficina mecânica automotiva' },
  { value: 'concessionaria', label: '🚗 Concessionária / Lojas', keyword: 'concessionária veículos revenda carros' },
  { value: 'restaurante', label: '🍽️ Restaurante', keyword: 'restaurante gastronomia' },
  { value: 'sushi', label: '🍣 Sushi / Japonês', keyword: 'restaurante japonês sushi delivery' },
  { value: 'pizzaria', label: '🍕 Pizzaria', keyword: 'pizzaria delivery' },
  { value: 'hamburgueria', label: '🍔 Hamburgueria', keyword: 'hamburgueria artesanal' },
  { value: 'escola', label: '🎓 Escola Particular', keyword: 'escola particular colégio infantil' },
  { value: 'pet_shop', label: '🐾 Pet Shop / Vet', keyword: 'pet shop clínica veterinária' },
  { value: 'contabilidade', label: '📊 Contabilidade', keyword: 'escritório contabilidade contador' },
  { value: 'salao_beleza', label: '💇 Salão de Beleza', keyword: 'salão de beleza cabeleireiro' },
  { value: 'barbearia', label: '💈 Barbearia', keyword: 'barbearia moderna' },
  { value: 'farmacia', label: '💊 Farmácia', keyword: 'farmácia drogaria' },
  { value: 'construtora', label: '🏗️ Construtora / Engenharia', keyword: 'construtora engenharia civil' },
  { value: 'reformas', label: '🔨 Reformas / Construção Civil', keyword: 'reforma construção civil pedreiro' },
  { value: 'limpeza', label: '🧹 Limpeza Residencial', keyword: 'limpeza residencial faxina' },
  { value: 'dedetizacao', label: '🪳 Dedetização', keyword: 'dedetização controle pragas' },
  { value: 'fotografo', label: '📸 Fotógrafo', keyword: 'fotógrafo ensaio fotográfico' },
  { value: 'filmagem', label: '🎥 Filmagem de Eventos', keyword: 'filmagem eventos videomaker' },
  { value: 'buffet', label: '🍲 Buffet / Eventos', keyword: 'buffet eventos catering' },
  { value: 'casa_festas', label: '🎉 Casa de Festas', keyword: 'casa de festas salão eventos' },
  { value: 'transportadora', label: '🚚 Transportadora / Mudanças', keyword: 'transportadora mudanças frete' },
  { value: 'assistencia_celular', label: '📱 Assistência Técnica Celular', keyword: 'assistência celular conserto smartphone' },
  { value: 'assistencia_informatica', label: '💻 Assistência Técnica Informática', keyword: 'assistência informática conserto computador' },
  { value: 'idiomas', label: '🗣️ Escola de Idiomas', keyword: 'escola idiomas curso inglês' },
  { value: 'cursos', label: '📚 Cursos Profissionalizantes', keyword: 'cursos profissionalizantes aula' },
  { value: 'eletricista', label: '⚡ Eletricista', keyword: 'eletricista instalação elétrica' },
  { value: 'encanador', label: '🪠 Encanador', keyword: 'encanador desentupidora' },
  { value: 'vidracaria', label: '🪟 Vidraçaria', keyword: 'vidraçaria vidros espelhos' },
  { value: 'marcenaria', label: '🪚 Marcenaria', keyword: 'marcenaria móveis planejados' },
  { value: 'depilacao', label: '🪒 Clínica de Depilação', keyword: 'clínica depilação laser' },
  { value: 'outro', label: '🔍 Outro (personalizado)', keyword: "" },
];
