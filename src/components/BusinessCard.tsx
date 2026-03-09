import { BusinessData, GeneratorType } from "@/types/business";
import { useState, useEffect, useRef, memo } from "react";
import { PresenceBadge, PresenceScore } from "./PresenceBadge";
import { Button } from "@/components/ui/button";
import {
  Star, Phone, MapPin, Sparkles, Zap, Globe, MessageSquare, Clock,
  CheckCircle, Target, ShieldCheck, ShieldAlert, Layout, Share2,
  FileDown, TrendingUp, History, Users, RefreshCw, Calendar
} from "lucide-react";
import { FaInstagram, FaWhatsapp, FaGlobe, FaFacebook, FaTiktok } from "react-icons/fa";
import { SiGooglemaps } from "react-icons/si";
import { cn, validateBusinessWebsite } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateSitePDF } from "./SitePDF";
import { SiteRemakePreview } from "./SiteRemakePreview";
import { SitePDFGeneratorModal } from "./SitePDFGeneratorModal";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { ContactTimeline } from "./ContactTimeline";
import { useAuth } from "@/contexts/AuthContext";
import { LeadTags } from "./LeadTags";
import { analyzeSite } from "@/lib/siteAuditor";
import { scoreLead } from "@/lib/conversionEngine";
import { calculateOpportunity } from "@/lib/opportunityEngine";
import { generateRemakePreview } from "@/lib/remakePreviewEngine";
import { SiteAuditResult } from "@/lib/siteAuditor";
import { analyzeLead } from "@/lib/leadAnalysisPipeline";

const totalWidth = 1024;


interface BusinessCardProps {
  business: BusinessData;
  onGenerateScript: (business: BusinessData, type?: GeneratorType) => void;
  onGeneratePrompt: (business: BusinessData) => void;
  onStatusChange?: (id: string, status: BusinessData["status"]) => void;
  onUpdateBusiness?: (business: BusinessData) => void;
  isSavedView?: boolean;
  index: number;
}

export const BusinessCard = memo(function BusinessCard({
  business,
  onGenerateScript,
  onGeneratePrompt,
  onStatusChange,
  onUpdateBusiness,
  isSavedView,
  index
}: BusinessCardProps) {
  const { user } = useAuth();
  // Enhanced Presence Score calculation
  const calculateDeepScore = (b: BusinessData) => {
    // Phase 1: Prefer robot-calculated lead_score if available
    const robotScore = (b as any).meta_data?.lead_score;
    if (robotScore !== undefined) return robotScore;

    // If we have a stored score and no new audit data, use the stored one
    if (b.score !== undefined && b.score > 0) return b.score;
    if (b.presenceScore !== undefined && b.presenceScore > 0 && !b.audit && !b.performanceScore) {
      return b.presenceScore;
    }

    let points = 0;
    let itemsPoints = 0;

    // 4 base items (Site, Instagram, WhatsApp, GMN)
    if (b.foundItems?.includes('Site')) itemsPoints++;
    if (b.foundItems?.includes('Instagram no Google')) itemsPoints++;
    if (b.foundItems?.includes('WhatsApp')) itemsPoints++;
    if (b.foundItems?.includes('Google Meu Negócio')) itemsPoints++;

    points += itemsPoints;
    let totalPoints = 4;

    // Tech Audit Points (Adds 2 more possible points)
    if (b.audit || b.performanceScore) {
      totalPoints = 6;
      const perf = b.performanceScore || b.audit?.speedScore || 0;
      if (perf > 70) points++;
      if (b.isSecure || (b.audit && b.audit.https)) points++;
    }

    // Default to at least the presence score if available
    const calculated = Math.round((points / totalPoints) * 100);
    return Math.max(calculated, b.presenceScore || 0);
  };

  // State for profile data
  const [userProfile, setUserProfile] = useState<any>(null);
  const [customLogoBase64, setCustomLogoBase64] = useState('');
  const [customLogoSiteBase64, setCustomLogoSiteBase64] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showRemakePreview, setShowRemakePreview] = useState(false);
  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const [isAnalyzingSite, setIsAnalyzingSite] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Constants
  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const score = calculateDeepScore(business);
  const scoreColor = score >= 75 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  const scoreLabel = score >= 75 ? 'Alta Presença Digital' : score >= 40 ? 'Presença Parcial' : 'Baixa Presença Digital';
  const opportunity = 100 - score;

  // Niche Detection Logic
  const keywords: Record<string, string> = {
    dentista: 'saude', odonto: 'saude', médico: 'saude', clinica: 'saude', estetica: 'saude',
    psicolo: 'saude', psicotera: 'saude', terapia: 'saude', cura: 'saude', bem_estar: 'saude', massa: 'saude',
    advocacia: 'juridico', advogado: 'juridico',
    restaurante: 'alimentacao', sushi: 'alimentacao', pizza: 'alimentacao', hamburgueria: 'alimentacao',
    academia: 'fitness', crossfit: 'fitness', beach: 'fitness',
    imobiliaria: 'imobiliario', imoveis: 'imobiliario',
    energia: 'energia_solar', solar: 'energia_solar',
    arquitetura: 'arquitetura', interiores: 'arquitetura',
    contabilidade: 'contabilidade', contador: 'contabilidade',
    barbearia: 'beleza', salao: 'beleza', pet: 'beleza',
    climatização: 'climatizacao', hvac: 'climatizacao', climatizador: 'climatizacao',
    'eficiência energética': 'climatizacao',
  };

  const pricingMap: Record<string, { basic: string; pro: string; premium: string; basicRange: string; proRange: string; premiumRange: string }> = {
    default: { basic: 'R$ 800', pro: 'R$ 1.800', premium: 'R$ 3.500/mês', basicRange: 'R$ 600 – R$ 1.000', proRange: 'R$ 1.500 – R$ 2.200', premiumRange: 'R$ 3.000 – R$ 5.000/mês' },
    saude: { basic: 'R$ 1.200', pro: 'R$ 2.800', premium: 'R$ 5.000/mês', basicRange: 'R$ 1.000 – R$ 1.500', proRange: 'R$ 2.500 – R$ 3.500', premiumRange: 'R$ 4.500 – R$ 7.000/mês' },
    juridico: { basic: 'R$ 1.500', pro: 'R$ 3.200', premium: 'R$ 6.000/mês', basicRange: 'R$ 1.200 – R$ 1.800', proRange: 'R$ 2.800 – R$ 4.000', premiumRange: 'R$ 5.000 – R$ 8.000/mês' },
    alimentacao: { basic: 'R$ 700', pro: 'R$ 1.600', premium: 'R$ 3.200/mês', basicRange: 'R$ 600 – R$ 900', proRange: 'R$ 1.400 – R$ 2.000', premiumRange: 'R$ 2.800 – R$ 4.500/mês' },
    fitness: { basic: 'R$ 900', pro: 'R$ 2.000', premium: 'R$ 4.000/mês', basicRange: 'R$ 700 – R$ 1.100', proRange: 'R$ 1.700 – R$ 2.500', premiumRange: 'R$ 3.500 – R$ 5.500/mês' },
    imobiliario: { basic: 'R$ 1.800', pro: 'R$ 4.000', premium: 'R$ 7.500/mês', basicRange: 'R$ 1.500 – R$ 2.200', proRange: 'R$ 3.500 – R$ 5.000', premiumRange: 'R$ 6.500 – R$ 10.000/mês' },
    energia_solar: { basic: 'R$ 1.400', pro: 'R$ 3.000', premium: 'R$ 5.500/mês', basicRange: 'R$ 1.200 – R$ 1.700', proRange: 'R$ 2.500 – R$ 3.800', premiumRange: 'R$ 5.000 – R$ 7.500/mês' },
    arquitetura: { basic: 'R$ 1.600', pro: 'R$ 3.500', premium: 'R$ 6.500/mês', basicRange: 'R$ 1.400 – R$ 2.000', proRange: 'R$ 3.000 – R$ 4.500', premiumRange: 'R$ 5.500 – R$ 9.000/mês' },
    contabilidade: { basic: 'R$ 1.000', pro: 'R$ 2.200', premium: 'R$ 4.200/mês', basicRange: 'R$ 800 – R$ 1.200', proRange: 'R$ 1.900 – R$ 2.800', premiumRange: 'R$ 3.800 – R$ 5.500/mês' },
    beleza: { basic: 'R$ 750', pro: 'R$ 1.700', premium: 'R$ 3.300/mês', basicRange: 'R$ 600 – R$ 950', proRange: 'R$ 1.500 – R$ 2.100', premiumRange: 'R$ 2.900 – R$ 4.200/mês' },
  };

  let pricingCategory = 'default';
  const nicheKey = (business.niche + ' ' + business.name).toLowerCase();
  for (const [kw, cat] of Object.entries(keywords)) {
    if (nicheKey.includes(kw)) { pricingCategory = cat; break; }
  }

  const isSandCourt = business.niche?.toLowerCase().includes('beach tennis') || business.niche?.toLowerCase().includes('vôlei de praia') || business.niche?.toLowerCase().includes('futevôlei') || business.niche?.toLowerCase().includes('areia');
  const isEletricomNiche =
    business.name?.toLowerCase().includes('eletricom') ||
    business.niche?.toLowerCase().includes('condomín') ||
    business.niche?.toLowerCase().includes('síndico') ||
    business.niche?.toLowerCase().includes('administradora');

  const isTelemetria = isEletricomNiche ||
    business.niche?.toLowerCase().includes('telemetria') ||
    business.niche?.toLowerCase().includes('monitoramento') ||
    business.niche?.toLowerCase().includes('reservatório') ||
    business.niche?.toLowerCase().includes('água') ||
    business.niche?.toLowerCase().includes('logístico') ||
    business.niche?.toLowerCase().includes('residencial') ||
    business.niche?.toLowerCase().includes('indústria') ||
    business.niche?.toLowerCase().includes('infraestrutura') ||
    business.niche?.toLowerCase().includes('shopping') ||
    business.niche?.toLowerCase().includes('edifício comercial') ||
    business.niche?.toLowerCase().includes('varejo');

  const isClimatiza = isEletricomNiche ||
    pricingCategory === 'climatizacao' ||
    business.niche?.toLowerCase().includes('climatiza') ||
    business.niche?.toLowerCase().includes('hvac') ||
    business.niche?.toLowerCase().includes('ar-condicionado') ||
    business.niche?.toLowerCase().includes('refrigeração') ||
    business.niche?.toLowerCase().includes('predial') ||
    business.niche?.toLowerCase().includes('condomín') ||
    business.niche?.toLowerCase().includes('comercial');
  const pricing = pricingMap[pricingCategory] || pricingMap.default;
  const itemColor = {
    border: score >= 75 ? 'border-emerald-500/20' : score >= 40 ? 'border-orange-500/20' : 'border-rose-500/20',
    bg: score >= 75 ? 'bg-emerald-500/5' : score >= 40 ? 'bg-orange-500/5' : 'bg-rose-500/5',
    text: score >= 75 ? 'text-emerald-500' : score >= 40 ? 'text-orange-500' : 'text-rose-500'
  };



  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await (supabase as any).from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (data) {
            setUserProfile(data);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleAnalyzeSite = async () => {
    setIsAnalyzingSite(true);
    setAnalysisStatus("Iniciando...");
    const toastId = toast.loading(business.website ? "Conectando ao Google PageSpeed..." : "Gerando Diagnóstico Estratégico...");

    try {
      let audit: any;
      if (business.website) {
        audit = await analyzeSite(business.website, (msg) => {
          setAnalysisStatus(msg);
          toast.loading(msg, { id: toastId });
        });
      } else {
        // Auditoria Virtual para quem não tem site
        setAnalysisStatus("Analisando Nicho e Cidade...");
        await new Promise(r => setTimeout(r, 1500));
        audit = {
          url: "Nenhum site cadastrado",
          isSecure: false,
          performanceScore: 0,
          accessibilityScore: 0,
          seoScore: 0,
          bestPracticesScore: 0,
          lcp: "N/A",
          cls: "N/A",
          hasViewport: false,
          analyzedAt: new Date().toISOString(),
          isDown: false
        };
      }

      // Verificação de UUID (Lead já salvo no banco)
      const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      const leadId = business.id;
      let existingMetaData = {};

      if (isUUID(leadId)) {
        try {
          const { data: currentLead } = await (supabase as any)
            .from('leads')
            .select('meta_data')
            .eq('id', leadId)
            .single();

          if (currentLead?.meta_data) {
            existingMetaData = currentLead.meta_data;
          }
        } catch (dbError) {
          console.warn("[BusinessCard] Erro ao buscar metadados:", dbError);
        }
      }

      const currentYear = new Date().getFullYear();
      const copyrightYear = audit.copyrightYear;
      const isOutdated = copyrightYear && copyrightYear < currentYear - 1;

      let aiInsight = `O site deste lead está com score de SEO ${audit.seoScore} e Performance ${audit.performanceScore}. FOCO: Atacar o tempo de carregamento de ${audit.lcp}, que afeta o rankeamento no Google.`;

      if (audit.isDown) {
        aiInsight = `🚨 SITE FORA DO AR: O site deste lead existe mas está exibindo erros ou não carrega. ARGUMENTO FATAL: "Seu site é uma vitrine quebrada que está afastando clientes neste exato momento. Posso resolver isso hoje."`;
      } else if (!business.website) {
        aiInsight = `❌ SEM SITE: Este lead é invisível no Google. Oportunidade máxima de venda de site institucional + Google Maps. Foque na autoridade digital.`;
      } else if (isOutdated) {
        aiInsight = `🚨 ALERTA DE QUEDA: O site deste cliente foi atualizado pela última vez em ${copyrightYear}. Ele está abandonado há ${currentYear - copyrightYear} anos. Argumento letal: "Seu site parece de outra década e isso afasta clientes."`;
      } else if (audit.performanceScore < 50) {
        aiInsight = `O site é muito LENTO (${audit.performanceScore}/100). O cliente está perdendo dinheiro porque as pessoas desistem de esperar o site carregar. Foque na velocidade.`;
      }

      const newMetaData = {
        ...existingMetaData,
        technical_audit: {
          performanceScore: audit.performanceScore,
          seoScore: audit.seoScore,
          accessibilityScore: audit.accessibilityScore,
          bestPracticesScore: audit.bestPracticesScore,
          lcp: audit.lcp,
          cls: audit.cls,
          isResponsive: audit.hasViewport,
          isSecure: audit.isSecure,
          copyrightYear: audit.copyrightYear,
          analyzedAt: audit.analyzedAt,
          ai_insight: aiInsight,
          isDown: audit.isDown
        },
        isSecure: audit.isSecure,
        mobileFriendly: audit.hasViewport
      };

      const validatedWebsite = validateBusinessWebsite(audit.url);
      const updatedBusiness = { ...business, ...newMetaData, website: validatedWebsite || undefined };
      const { score: newScore } = scoreLead(updatedBusiness as any);
      (newMetaData as any).score = newScore;
      (newMetaData as any).presenceScore = newScore;

      // --- OPPORTUNITY ENGINE INTEGRATION ---
      const opp = calculateOpportunity({ ...updatedBusiness, ...newMetaData } as any);

      // --- REMAKE PREVIEW ENGINE INTEGRATION ---
      const preview = await generateRemakePreview({ ...updatedBusiness, ...newMetaData } as any);

      const finalMetaData = {
        ...newMetaData,
        opportunity_score: opp.opportunity_score,
        opportunity_level: opp.opportunity_level,
        primary_reason: opp.primary_reason,
        secondary_reason: opp.secondary_reason,
        recommended_offer: opp.recommended_offer,
        opportunity_summary: opp.opportunity_summary,
        opportunity_flags: opp.opportunity_flags,
        site_preview: preview.preview_data,
        site_preview_summary: preview.summary
      };

      if (isUUID(leadId)) {
        await (supabase as any)
          .from('leads')
          .update({
            meta_data: finalMetaData,
            // --- NEW TOP-LEVEL COLUMNS ---
            opportunity_score: opp.opportunity_score,
            opportunity_level: opp.opportunity_level,
            primary_reason: opp.primary_reason,
            secondary_reason: opp.secondary_reason,
            recommended_offer: opp.recommended_offer,
            opportunity_summary: opp.opportunity_summary,
            opportunity_flags: opp.opportunity_flags,
            site_preview: preview.preview_data,
            site_preview_summary: preview.summary,
            html_preview: preview.html_preview || null
          })
          .eq('id', leadId);
      }

      // Notifica o pai para atualizar a UI instantaneamente (funciona para busca e listagem)
      if (onUpdateBusiness) {
        onUpdateBusiness({
          ...business,
          ...finalMetaData,
          // 🛡️ PROTEÇÃO DOS CANAIS REAIS: não deixar o metadado nulo do banco apagar o React State!
          instagram: business.instagram,
          facebook: business.facebook,
          googleMapsUrl: business.googleMapsUrl,
          tiktok: business.tiktok,
          website: business.website,
          phone: business.phone,
          whatsapp: business.whatsapp,
          email: business.email,
          city: business.city,
          address: business.address,
          name: business.name,
          niche: business.niche,
          meta_data: finalMetaData,
          score: (finalMetaData as any).score,
          temperature: (finalMetaData as any).temperature,
          offerReason: (finalMetaData as any).offerReason,
          audit: {
            ...finalMetaData.technical_audit,
            speedScore: finalMetaData.technical_audit.performanceScore,
            mobileFriendly: finalMetaData.technical_audit.isResponsive,
            https: finalMetaData.technical_audit.isSecure,
            seoBasics: !finalMetaData.technical_audit.isDown && finalMetaData.technical_audit.seoScore > 50,
            ctaClarity: !finalMetaData.technical_audit.isDown,
            isDown: finalMetaData.technical_audit.isDown
          },
          html_preview: preview.html_preview || null,
        });
      }

      toast.success(business.website ? "Auditoria oficial concluída!" : "Estratégia de presença digital gerada!", { id: toastId });

      // Auto-abrir preview para quem não tem site para "uau" imediato
      if (!business.website) {
        setShowRemakePreview(true);
      }
    } catch (error) {
      console.error("[BusinessCard] Erro na auditoria:", error);
      toast.error("Erro na conexão com o Google. Verifique a API.", { id: toastId });
    } finally {
      setIsAnalyzingSite(false);
      setAnalysisStatus("");
    }
  };

  const handleAnalyzeLead = async () => {
    setLoadingAnalysis(true);
    const toastId = toast.loading("Analisando presença digital...");
    try {
      const result = await analyzeLead(business);
      setAnalysis(result);

      if (onUpdateBusiness && result.audit) {
        onUpdateBusiness({
          ...business,
          audit: result.audit,
          site_preview: result.preview?.preview_data,
          site_preview_summary: result.preview?.summary,
          opportunity_score: result.opportunity?.opportunity_score
        });
      }

      toast.success("Análise completa!", { id: toastId });
      setShowRemakePreview(true);
    } catch (error) {
      console.error("Lead analysis failed", error);
      toast.error("Falha na análise do lead.", { id: toastId });
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const [ticketValue, setTicketValue] = useState(business.ticketMedio || 0);

  const handleToggleAutomation = async () => {
    const isStopped = business.automationStatus === 'stopped_by_user';
    const nextStatus = isStopped ? 'ready_for_dispatch' : 'stopped_by_user';

    try {
      const { error } = await (supabase as any).from('leads').update({
        automation_status: nextStatus,
        meta_data: {
          ...(business as any).meta_data,
          automation_status: nextStatus
        }
      }).eq('id', business.id);

      if (error) throw error;
      toast.success(isStopped ? "Automação retomada!" : "Automação pausada.");
      if (onStatusChange) onStatusChange(business.id!, business.status!); // Trigger refresh
    } catch (err) {
      toast.error("Erro ao alterar automação.");
    }
  };

  // Convert System logo to Base64
  useEffect(() => {
    const convertLogo = async () => {
      const logoUrl = userProfile?.logo_url;
      if (logoUrl && logoUrl.startsWith('http')) {
        try {
          const response = await fetch(logoUrl);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          setCustomLogoBase64(base64);
        } catch (err) {
          console.error('Error converting logo to base64:', err);
        }
      } else {
        setCustomLogoBase64('');
      }
    };
    convertLogo();
  }, [userProfile?.logo_url]);

  // Convert Site logo to Base64
  useEffect(() => {
    const convertLogoSite = async () => {
      const logoUrl = userProfile?.logo_site_url;
      if (logoUrl && logoUrl.startsWith('http')) {
        try {
          const response = await fetch(logoUrl);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          setCustomLogoSiteBase64(base64);
        } catch (err) {
          console.error('Error converting site logo to base64:', err);
        }
      } else {
        setCustomLogoSiteBase64('');
      }
    };
    convertLogoSite();
  }, [userProfile?.logo_site_url]);

  // Derived variables for display
  const sellerName = userProfile?.full_name || 'Consultor Digital';
  const sellerEmail = userProfile?.contact_email || '';
  const sellerWebsite = userProfile?.website_url || '';
  const sellerWebsiteSite = userProfile?.website_site_url || '';
  const sellerWhatsapp = userProfile?.whatsapp || '';
  const sellerInstagram = userProfile?.instagram || '';
  const customLogo = customLogoBase64 || userProfile?.logo_url || '';
  const customLogoSite = customLogoSiteBase64 || userProfile?.logo_site_url || '';
  // Niche-specific content helpers (legacy)
  const pdfSubTitle = isSandCourt ? 'Sistema de Gestão e Agendamento para sua Arena' : 'Diagnóstico Técnico · Estratégia Digital';

  const pdfFormalLetter = isSandCourt ? `
      <p>No dinâmico mercado de <strong>Arenas e Complexos Esportivos</strong>, a agilidade no processo de reserva é o principal diferencial para garantir que sua quadra nunca fique ociosa. Identificamos que a gestão da <strong>${business.name}</strong> pode atingir um novo patamar de eficiência tecnológica através do <strong>Sistema de Gestão ReservaAI</strong>.</p>
      <p>O <strong>ReservaAI</strong> é a solução mais completa do mercado para quem busca automatizar o atendimento, acabar com a confusão na agenda e profissionalizar a cobrança de alunos e mensalistas. Esta proposta detalha como implementaremos o ecossistema que permite agendamentos via WhatsApp, recebimento via PIX/Cartão e controle financeiro total em um só lugar.</p>
    ` : `
      <p>Com base em dados coletados via Google Places e auditoria técnica online, identificamos que o negócio ainda não conta com um <strong>presença digital otimizada</strong> ou possui lacunas de automação críticas — o que representa uma perda direta de clientes que buscam por "${business.niche}" em ${business.city}.</p>
      <p>Esta proposta apresenta um diagnóstico completo e as soluções de <strong>gestão e automação</strong> recomendadas para posicionar <strong>${business.name}</strong> com autoridade e credibilidade no mercado.</p>
    `;

  const pdfAuditItems = isSandCourt ? [
    { label: 'Agendamento pelo WhatsApp', found: true, val: 'Disponibilidade 24h para o seu atleta' },
    { label: 'Pagamentos via PIX/Cartão', found: true, val: 'Receba sinal ou o total na hora da reserva' },
    { label: 'Gestão de Mensalistas', found: true, val: 'Cobrança e controle recorrente automatizado' },
    { label: 'Controle de Alunos', found: true, val: 'Frequência, turmas e níveis de jogo' },
    { label: 'Dashboard Administrativo', found: true, val: 'Visão clara do faturamento e inadimplência' },
    { label: 'Notificações Automáticas', found: true, val: 'Lembretes de aula e confirmação de reserva' },
  ] : [
    { label: 'Site Profissional', found: !!business.website, val: business.website || 'Não identificado — oportunidade crítica' },
    { label: 'Certificado SSL (HTTPS)', found: !!business.isSecure, val: business.isSecure ? 'Certificado válido — site seguro' : business.isSecure === false ? 'Ausente — navegadores bloqueiam o site' : 'Não verificado' },
    { label: 'Otimização Mobile (Responsivo)', found: !!business.mobileFriendly, val: business.mobileFriendly ? 'Site adaptado para celular' : business.mobileFriendly === false ? 'Não responsivo — perde +60% do tráfego' : 'Não verificado' },
    { label: 'Indexação no Google (SEO)', found: !!business.website, val: business.website ? 'Site passível de indexação' : 'Sem site = invisível no Google' },
    { label: 'Google Meu Negócio', found: !!business.googleMapsUrl, val: business.googleMapsUrl ? 'Perfil ativo no Maps' : 'Não verificado' },
    { label: 'Velocidade de Carregamento', found: !!business.website && !!business.isSecure, val: business.website ? 'Verificar performance técnica' : 'Sem site para avaliar' },
  ];

  const pdfProblemBody = isSandCourt ? `
      <p>A gestão manual de <strong>arenas e quadras</strong> através de planilhas ou conversas soltas no WhatsApp gera perda de receita e atrito para o cliente. A <strong>${business.name}</strong> pode estar deixando de faturar por não oferecer uma reserva imediata e segura.</p>
      <p>O <strong>ReservaAI</strong> resolve isso ao centralizar todas as operações. O atleta reserva por conta própria no WhatsApp, e o sistema cuida do resto: confirma o horário, recebe o pagamento e atualiza seu dashboard financeiro em tempo real.</p>
    ` : `
      <p>Com um score de presença digital de apenas <strong>${score}%</strong>, o negócio apresenta lacunas que impactam a credibilidade. Atualmente, <strong>87% dos consumidores</strong> desistem de uma contratação se não encontram um site profissional ou se o mesmo não transmite confiança técnica.</p>
    `;

  const pdfProblemList = isSandCourt ? [
    'Eliminação da espera por resposta manual no WhatsApp',
    'Gestão profissional de alunos e horários fixos',
    'Visibilidade total do faturamento da arena',
    'Facilidade extrema para o atleta realizar a reserva'
  ] : (business.missingItems || []);

  const pdfTiers = isSandCourt ? {
    starter: ['Essencial: Sistema e Automação', 'Agendamento pelo WhatsApp', 'Informações de valor de aula', '1 Usuário Administrativo', 'Notificação por e-mail', 'Configuração de 1 Quadra'],
    pro: ['Avançado: Automação + Financeiro', 'Até 4 quadras vinculadas', 'Receber sinal da reserva', 'Receber por PIX automático', 'Acesso de funcionário (Exportar horários)', 'Dashboard Financeiro completo'],
    premium: ['Master: Gestão 360 Escalável', 'Quadras Ilimitadas', 'Receber com Cartão de Crédito', 'Gestão de Day Use completo', 'Gestão de Aluno (Checking/Turmas)', 'Múltiplos Usuários Administrativos']
  } : {
    starter: ['Site responsivo (mobile + desktop)', 'Certificado SSL (HTTPS) incluso', 'Até 5 páginas completas', 'Formulário de contato funcional', 'Hospedagem e domínio configurados'],
    pro: ['SEO local: Otimização Estratégica', `Posicionamento: "${business.niche} em ${business.city}"`, 'Design premium de alta conversão', 'Integração Analytics + Search Console', 'Painel de edição (CMS)'],
    premium: ['Sistema Web Sob Medida', 'Desenvolvimento de sistemas (agendamento, etc)', 'Área administrativa personalizada', 'Integrações com APIs externas', 'Suporte técnico prioritário']
  };

  const pdfTableDeliveries = isSandCourt ? {
    starter: 'Agendamento WhatsApp, 2 quadras',
    pro: 'Gestão completa, multi-quadras',
    premium: 'Solução personalizada, consultoria'
  } : {
    starter: 'Site responsivo, SSL, formulário',
    pro: 'Site premium, SEO local, CMS',
    premium: 'Sistema sob medida, área admin'
  };

  // PDF Generation handlers - Unified to use SitePDF engine
  const handleGeneratePDF = () => {
    generateSitePDF(business);
  };

  const handleGeneratePDFSite = () => {
    // Priority: local analysis result -> persisted business data
    const htmlToUse = analysis?.preview?.html_preview || (business as any).html_preview || business.html_preview;

    if (htmlToUse) {
      toast.info("Gerando proposta com design personalizado de elite...");
      generateSitePDF(business, htmlToUse);
    } else {
      // Se não houver preview, abrimos o modal como fallback para o usuário descrever,
      // ou avisamos que a análise pode ser feita para gerar automaticamente.
      setSiteModalOpen(true);
    }
  };


  return (
    <div
      className={cn(
        "group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200/50 transition-all duration-500 overflow-hidden flex flex-col h-full",
        "hover:-translate-y-1"
      )}
      style={{
        animationDelay: `${index * 50}ms`,
        animation: 'fadeInUp 0.5s ease forwards'
      }}
    >
      {/* Top Banner Accent */}
      <div className={cn("h-1.5 w-full",
        score >= 75 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-rose-500"
      )} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {business.niche}
              </span>
              {isSavedView && business.status && (
                <span className={cn(
                  "text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider",
                  business.status === "new" ? "bg-slate-50 text-slate-600 border-slate-200" :
                    business.status === "contacted" ? "bg-amber-50 text-amber-600 border-amber-200" :
                      business.status === "interested" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        "bg-slate-900 text-white border-slate-900"
                )}>
                  {business.status === "new" ? "Novo" :
                    business.status === "contacted" ? "Contatado" :
                      business.status === "interested" ? "Interessado" : "Fechado"}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors" title={business.name}>
              {business.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-slate-500 text-xs">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{business.city}</span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <div className={cn(
              "w-12 h-12 rounded-xl border flex flex-col items-center justify-center shadow-sm",
              score >= 75 ? "bg-emerald-50 border-emerald-100" : score >= 40 ? "bg-amber-50 border-amber-100" : "bg-rose-50 border-rose-100"
            )}>
              <span className={cn("text-sm font-black tabular-nums",
                score >= 75 ? "text-emerald-600" : score >= 40 ? "text-amber-600" : "text-rose-600"
              )}>{score}%</span>
              <div className="w-6 h-0.5 bg-current opacity-20 mt-0.5 rounded-full" />
            </div>

            {(business.opportunity_score !== undefined || (business as any).meta_data?.opportunity_score) && (
              <div
                className={cn(
                  "px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-tighter shadow-xs whitespace-nowrap animate-in fade-in slide-in-from-right-2 duration-700",
                  (business.opportunity_level === "very_high" || (business as any).meta_data?.opportunity_level === "very_high") ? "bg-purple-600 border-purple-400 text-white" :
                    (business.opportunity_level === "high" || (business as any).meta_data?.opportunity_level === "high") ? "bg-blue-600 border-blue-400 text-white" :
                      (business.opportunity_level === "medium" || (business as any).meta_data?.opportunity_level === "medium") ? "bg-orange-500 border-orange-300 text-white" :
                        "bg-slate-500 border-slate-400 text-white"
                )}
                title={business.opportunity_summary || (business as any).meta_data?.opportunity_summary}
              >
                💡 OPORTUNIDADE: {(business.opportunity_score !== undefined ? business.opportunity_score : (business as any).meta_data?.opportunity_score)}%
              </div>
            )}
          </div>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5 py-3 border-y border-slate-50">
          {business.phone ? (
            <a
              href={`tel:${business.phone.replace(/\D/g, '')}`}
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors group/phone"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover/phone:bg-blue-50 group-hover/phone:border-blue-100 transition-colors">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-medium truncate">{business.phone}</span>
            </a>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-medium truncate">Sem Telefone</span>
            </div>
          )}
          {business.website ? (
            <a
              href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors group/site"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover/site:bg-blue-50 group-hover/site:border-blue-100 transition-colors">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-medium truncate underline underline-offset-2">Visitar Site</span>
            </a>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-medium truncate">Sem Site</span>
            </div>
          )}
        </div>

        {/* Presence Icons Grid - Clickable Links */}
        <div className="mb-5">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Canais de Presença</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">

            {/* Site */}
            {business.website ? (
              <a
                href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border bg-blue-50 border-blue-200 hover:bg-blue-100 hover:scale-105 hover:shadow-md transition-all cursor-pointer"
                title="Abrir Website"
              >
                <FaGlobe className="w-5 h-5 text-blue-600" />
                <span className="text-[8px] font-bold text-blue-600 uppercase tracking-tight">Site</span>
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-slate-100 bg-slate-50 opacity-40" title="Site: não encontrado">
                <FaGlobe className="w-5 h-5 text-slate-300" />
                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tight">Site</span>
              </div>
            )}

            {/* Instagram */}
            {business.instagram ? (
              <a
                href={(() => {
                  const val = business.instagram!;
                  if (val.startsWith('http')) return val;
                  return `https://www.instagram.com/${val.replace('@', '').trim()}/`;
                })()}
                target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-pink-200 hover:scale-105 hover:shadow-md transition-all cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #fcefef 0%, #fce7f3 50%, #ede9fe 100%)' }}
                title="Abrir Instagram"
              >
                <FaInstagram className="w-5 h-5" style={{ color: '#E1306C' }} />
                <span className="text-[8px] font-bold uppercase tracking-tight" style={{ color: '#E1306C' }}>Instagram</span>
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-slate-100 bg-slate-50 opacity-40" title="Instagram: não encontrado">
                <FaInstagram className="w-5 h-5 text-slate-300" />
                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tight">Instagram</span>
              </div>
            )}

            {/* WhatsApp */}
            {business.whatsapp ? (
              <a
                href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:scale-105 hover:shadow-md transition-all cursor-pointer"
                title="Abrir WhatsApp"
              >
                <FaWhatsapp className="w-5 h-5 text-[#25D366]" />
                <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-tight">WhatsApp</span>
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-slate-100 bg-slate-50 opacity-40" title="WhatsApp: não encontrado">
                <FaWhatsapp className="w-5 h-5 text-slate-300" />
                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tight">WhatsApp</span>
              </div>
            )}

            {/* Google Maps */}
            {business.googleMapsUrl ? (
              <a
                href={business.googleMapsUrl}
                target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 hover:scale-105 hover:shadow-md transition-all cursor-pointer"
                title="Abrir no Google Maps"
              >
                <SiGooglemaps className="w-5 h-5 text-[#EA4335]" />
                <span className="text-[8px] font-bold text-amber-700 uppercase tracking-tight">Maps</span>
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-slate-100 bg-slate-50 opacity-40" title="Google Maps: não encontrado">
                <SiGooglemaps className="w-5 h-5 text-slate-300" />
                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tight">Maps</span>
              </div>
            )}

            {/* Facebook */}
            {business.facebook ? (
              <a
                href={business.facebook}
                target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:scale-105 hover:shadow-md transition-all cursor-pointer"
                title="Abrir Facebook"
              >
                <FaFacebook className="w-5 h-5 text-[#1877F2]" />
                <span className="text-[8px] font-bold text-blue-700 uppercase tracking-tight">Facebook</span>
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-slate-100 bg-slate-50 opacity-40" title="Facebook: não encontrado">
                <FaFacebook className="w-5 h-5 text-slate-300" />
                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tight">Facebook</span>
              </div>
            )}

            {/* TikTok */}
            {business.tiktok ? (
              <a
                href={business.tiktok}
                target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:scale-105 hover:shadow-md transition-all cursor-pointer"
                title="Abrir TikTok"
              >
                <FaTiktok className="w-5 h-5 text-black" />
                <span className="text-[8px] font-bold text-black uppercase tracking-tight">TikTok</span>
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-slate-100 bg-slate-50 opacity-40" title="TikTok: não encontrado">
                <FaTiktok className="w-5 h-5 text-slate-300" />
                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tight">TikTok</span>
              </div>
            )}
          </div>
        </div>

        {/* Qualification Indicators */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Auditoria Técnica</p>
          <div className="flex items-center gap-2">
            {business.site_preview && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowRemakePreview(true); }}
                className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-all bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 animate-pulse"
              >
                <Layout className="w-2.5 h-2.5" />
                Dossiê Disponível
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleAnalyzeLead(); }}
              disabled={loadingAnalysis}
              className="text-[9px] font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50 flex items-center gap-1 transition-all"
            >
              {loadingAnalysis ? (
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              ) : (
                <Zap className="w-2.5 h-2.5" />
              )}
              {loadingAnalysis ? "Analisando..." : business.website ? "Analisar Agora" : "Gerar Estratégia Digital"}
            </button>
          </div>
        </div>

        {/* Alerta de Site Fora do Ar */}
        {(business.audit?.isDown ?? (business as any).meta_data?.technical_audit?.isDown) && (
          <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[10px] font-black text-red-600 uppercase tracking-tight">
              Site Fora do Ar ou com Erro de Carregamento
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-3">
          <QualificationItem
            label="HTTPS"
            status={(business.audit?.isDown ?? (business as any).meta_data?.technical_audit?.isDown) ? false : business.isSecure}
            icon={ShieldCheck}
          />
          <QualificationItem
            label="Mobile"
            status={(business.audit?.isDown ?? (business as any).meta_data?.technical_audit?.isDown) ? false : business.mobileFriendly}
            icon={Layout}
          />
          <QualificationItem
            label="Performance"
            status={business.audit?.performanceScore ?? (business as any).meta_data?.technical_audit?.performanceScore}
            icon={Zap}
          />
          <QualificationItem
            label="SEO"
            status={business.audit?.seoScore ?? (business as any).meta_data?.technical_audit?.seoScore}
            icon={Target}
          />
          <QualificationItem
            label="Copyright"
            status={(business.audit?.copyrightYear ?? (business as any).meta_data?.technical_audit?.copyrightYear) ?
              ((business.audit?.copyrightYear ?? (business as any).meta_data?.technical_audit?.copyrightYear) >= new Date().getFullYear() - 1) : undefined}
            icon={Calendar}
          />
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-xl border text-[9px] font-bold uppercase tracking-tighter transition-all",
            (business.audit?.copyrightYear ?? (business as any).meta_data?.technical_audit?.copyrightYear) ?
              ((business.audit?.copyrightYear ?? (business as any).meta_data?.technical_audit?.copyrightYear) < new Date().getFullYear() - 1 ? "bg-red-50 border-red-100 text-red-600" : "bg-blue-50 border-blue-100 text-blue-600")
              : "bg-slate-50 border-slate-100 text-slate-400"
          )}>
            <History className="w-3 h-3" />
            <span>Ano: {(business.audit?.copyrightYear ?? (business as any).meta_data?.technical_audit?.copyrightYear) || "N/A"}</span>
          </div>
        </div>

        {/* Auditoria IA Insight */}
        {(business.audit?.ai_insight ?? (business as any).meta_data?.technical_audit?.ai_insight) && (
          <div className="mb-5 p-2.5 bg-amber-50 rounded-xl border border-amber-100 flex gap-2 items-start">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <span className="block text-[8px] font-black uppercase text-amber-600 tracking-wider mb-0.5">Diagnóstico IA</span>
              <p className="text-[10px] text-amber-700 font-medium leading-tight">
                {business.audit?.ai_insight ?? (business as any).meta_data?.technical_audit?.ai_insight}
              </p>
            </div>
          </div>
        )}

        {/* Pipeline Analysis Results */}
        {analysis && (
          <div className="mb-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
            {/* Oportunidade de Venda */}
            {analysis.opportunity && (
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Oportunidade de Venda</span>
                </div>
                <p className="text-[11px] text-indigo-900 font-bold mb-2 leading-tight">
                  {analysis.opportunity.sales_pitch}
                </p>
                <div className="space-y-1">
                  <span className="block text-[8px] font-bold uppercase text-indigo-500 tracking-widest">Impacto de Negócio</span>
                  <p className="text-[10px] text-indigo-700 leading-snug">
                    {analysis.opportunity.business_impact}
                  </p>
                </div>
              </div>
            )}

            {/* Diagnóstico do Site */}
            {analysis.opportunity?.diagnosis && analysis.opportunity.diagnosis.length > 0 && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span className="text-[10px] font-black uppercase text-red-700 tracking-wider">Diagnóstico do Site</span>
                </div>
                <ul className="space-y-1">
                  {analysis.opportunity.diagnosis.map((item: string, i: number) => (
                    <li key={i} className="text-[10px] text-red-700 flex items-start gap-1.5 font-medium">
                      <span className="text-red-400 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview de Melhorias */}
            {analysis.opportunity?.improvements && analysis.opportunity.improvements.length > 0 && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Melhorias Recomendadas</span>
                </div>
                <ul className="space-y-1">
                  {analysis.opportunity.improvements.map((item: string, i: number) => (
                    <li key={i} className="text-[10px] text-emerald-700 flex items-start gap-1.5 font-medium">
                      <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Insight Box */}
        {business.offerReason && (
          <div className="p-3 bg-blue-50/20 rounded-2xl border border-blue-100/50 mb-6 flex gap-3 group/reason hover:bg-blue-50/40 transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-blue-600 group-hover/reason:scale-110 transition-transform" />
            </div>
            <div className="flex-1 overflow-hidden">
              <span className="block text-[10px] font-black uppercase text-blue-600 tracking-wider mb-0.5">IA Insight</span>
              <p className="text-[11px] text-slate-600 font-medium italic leading-relaxed line-clamp-3">"{business.offerReason}"</p>
            </div>
          </div>
        )}

        <div className="flex-1" />

        {/* Actions Section */}
        <div className="space-y-3">
          <div className="flex flex-col gap-3">
            {/* Linha Principal de Ações — Sincronizada Radar/Leads */}
            <div className="flex gap-2">
              {!isSavedView && (
                <Button
                  className="flex-1 h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wider text-[10px] rounded-xl gap-2 shadow-lg"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const { data: { user: currentUser } } = await supabase.auth.getUser();
                      if (!currentUser) {
                        toast.error("Faça login para salvar.");
                        return;
                      }

                      const opp = calculateOpportunity(business);

                      const { error } = await (supabase as any).from('leads').insert({
                        user_id: currentUser.id,
                        name: business.name,
                        niche: business.niche,
                        city: business.city,
                        address: business.address,
                        phone: business.phone,
                        website: business.website,
                        rating: business.rating,
                        total_ratings: business.totalRatings,
                        presence_score: business.presenceScore,
                        status: 'new',
                        opportunity_score: opp.opportunity_score,
                        meta_data: {
                          googleMapsUrl: business.googleMapsUrl,
                          missingItems: business.missingItems,
                          foundItems: business.foundItems,
                          performanceScore: business.performanceScore,
                          isSecure: business.isSecure,
                          mobileFriendly: business.mobileFriendly,
                          instagram: business.instagram,
                          facebook: business.facebook,
                          tiktok: business.tiktok,
                          whatsapp: business.whatsapp,
                          ...opp
                        }
                      });
                      if (error) throw error;
                      toast.success("Lead Salvo no Radar!");
                    } catch (err: any) {
                      toast.error("Erro ao salvar.");
                    }
                  }}
                >
                  <Users className="w-3.5 h-3.5" />
                  Salvar
                </Button>
              )}

              <Button
                variant="outline"
                className="flex-1 h-9 text-[10px] font-bold uppercase tracking-wider border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGeneratePDF();
                }}
              >
                <FileDown className="w-3.5 h-3.5" />
                Dossiê
              </Button>

              <Button
                variant="outline"
                className="flex-1 h-9 text-[10px] font-bold uppercase tracking-wider border-[#D4AF37]/30 bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10 text-[#B8860B] rounded-xl shadow-sm gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGeneratePDFSite();
                }}
              >
                <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
                VIP
              </Button>
            </div>

            {/* Ações Especiais de Leads Salvos */}
            {isSavedView && (
              <>
                <Button
                  className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold uppercase tracking-wider text-[10px] shadow-lg shadow-blue-200/50 rounded-xl gap-2"
                  onClick={(e) => { e.stopPropagation(); onGenerateScript?.(business, 'battle_plan'); }}
                >
                  <Target className="w-3.5 h-3.5" />
                  Plano de Batalha Elite
                </Button>

                <div className="flex gap-2">
                  <select
                    className="flex-1 h-8 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-bold px-2 outline-none focus:ring-1 focus:ring-blue-400"
                    value={business.status || "new"}
                    onChange={(e) => onStatusChange?.(business.id!, e.target.value as any)}
                  >
                    <option value="new">🆕 Novo</option>
                    <option value="contacted">💬 Contatado</option>
                    <option value="interested">⭐ Interessado</option>
                    <option value="closed">✅ Fechado</option>
                  </select>
                  <input
                    type="number"
                    className="w-16 h-8 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-bold px-2 outline-none focus:ring-1 focus:ring-blue-400"
                    placeholder="Ticket"
                    value={ticketValue || ""}
                    onChange={(e) => setTicketValue(Number(e.target.value))}
                    onBlur={async () => {
                      try {
                        await (supabase as any).from('leads').update({ ticket_medio: ticketValue }).eq('id', business.id);
                        toast.success("Ticket Atualizado!");
                      } catch (err) {
                        console.error('[BusinessCard] Falha ao atualizar ticket médio:', err);
                      }
                    }}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-50">
            <Button
              variant="ghost"
              className="flex-1 h-8 text-[9px] font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600 uppercase tracking-widest gap-1"
              onClick={(e) => { e.stopPropagation(); setShowHistory(true); }}
            >
              <History className="w-3" />
              Logs do Lead
            </Button>
            {isSavedView && (
              <Button
                variant="ghost"
                className={cn(
                  "flex-1 h-8 text-[9px] font-bold uppercase tracking-widest gap-1",
                  business.automationStatus === 'stopped_by_user' ? "text-emerald-500" : "text-rose-500"
                )}
                onClick={(e) => { e.stopPropagation(); handleToggleAutomation(); }}
              >
                {business.automationStatus === 'stopped_by_user' ? <Zap className="w-3" /> : <Clock className="w-3" />}
                {business.automationStatus === 'stopped_by_user' ? "Retomar IA" : "Pausar IA"}
              </Button>
            )}
          </div>
        </div>

        {/* History Modal */}
        {showHistory && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={(e) => { e.stopPropagation(); setShowHistory(false); }}>
            <div className="bg-white w-full max-w-sm rounded-[32px] border border-slate-200 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <History className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Linha do Tempo</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)} className="h-8 w-8 rounded-full p-0">✕</Button>
              </div>
              <div className="max-h-[350px] overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
                {((business as any).meta_data?.automation_logs || []).length > 0 ? (
                  (business as any).meta_data.automation_logs.map((log: any, i: number) => (
                    <div key={i} className="flex gap-4 relative">
                      <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-100 last:hidden" />
                      <div className="w-6 h-6 rounded-full bg-blue-50 border-2 border-blue-200 shrink-0 z-10 flex items-center justify-center text-[10px] font-bold text-blue-600">
                        {i + 1}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black uppercase text-blue-700">{log.stage}</span>
                          <span className="text-[10px] text-slate-400">{new Date(log.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{log.message || "Ação concluída com sucesso."}</p>
                      </div>
                    </div>
                  )).reverse()
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">Nenhum registro encontrado</p>
                    <p className="text-xs text-slate-300 mt-1">As ações da IA aparecerão aqui.</p>
                  </div>
                )}
              </div>
              <div className="p-5 bg-slate-50 border-t border-slate-100">
                <Button size="sm" className="w-full bg-white text-slate-900 border-slate-200 hover:bg-slate-100 font-bold h-11 rounded-2xl" onClick={() => setShowHistory(false)}>Fechar Histórico</Button>
              </div>
            </div>
          </div>
        )}
        {/* Lead Score Badge — A1 */}
        <div className="mb-3">
          <LeadScoreBadge lead={business} showReason size="md" />
        </div>

        {/* Tags — A4 (apenas em saved view) */}
        {isSavedView && business.id && (
          <div className="mb-4">
            <LeadTags
              leadId={business.id}
              initialTags={(business as any).meta_data?.tags ?? []}
              initialFollowUp={(business as any).meta_data?.next_follow_up}
            />
          </div>
        )}

      </div>

      {/* Contact Timeline — A2 (apenas em saved view) */}
      {isSavedView && business.id && user?.id && (
        <div className="px-5 pb-4">
          <ContactTimeline
            leadId={business.id}
            userId={user.id}
          />
        </div>
      )}

      <SitePDFGeneratorModal
        business={business}
        open={siteModalOpen}
        onClose={() => setSiteModalOpen(false)}
      />

      <SiteRemakePreview
        business={{
          ...business,
          site_preview: analysis?.preview?.preview_data || business.site_preview,
          site_preview_summary: analysis?.preview?.summary || business.site_preview_summary,
          html_preview: analysis?.preview?.html_preview || (business as any).html_preview,
          audit: analysis?.audit || business.audit,
        }}
        open={showRemakePreview}
        onClose={() => setShowRemakePreview(false)}
        onRegenerate={(updated) => {
          if (onUpdateBusiness) {
            onUpdateBusiness(updated);
          }
          setAnalysis((prev: any) => ({
            ...prev,
            preview: {
              ...prev?.preview,
              preview_data: updated.site_preview,
              summary: updated.site_preview_summary,
              html_preview: updated.html_preview
            }
          }));
        }}
      />
    </div>
  );
});

const QualificationItem = memo(({ label, status, icon: Icon }: { label: string, status: boolean | number | undefined, icon: any }) => {
  const isNumber = typeof status === 'number';

  let colorClass = "bg-slate-50/80 border-slate-200/50 text-slate-400";
  let statusText = status === undefined ? '?' : status ? 'OK' : 'X';

  if (isNumber) {
    statusText = `${status}%`;
    if (status >= 90) colorClass = "bg-green-50/80 border-green-200/50 text-green-600";
    else if (status >= 50) colorClass = "bg-amber-50/80 border-amber-200/50 text-amber-600";
    else colorClass = "bg-red-50/80 border-red-200/50 text-red-600";
  } else if (status === true) {
    colorClass = "bg-green-50/80 border-green-200/50 text-green-600";
  } else if (status === false) {
    colorClass = "bg-red-50/80 border-red-200/50 text-red-600";
  }

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-xl border text-[9px] font-bold uppercase tracking-tighter transition-all",
      colorClass
    )}>
      <Icon className="w-3 h-3 shrink-0" />
      <span className="truncate">{label}</span>
      <span className="ml-auto font-black">{statusText}</span>
    </div>
  );
});
