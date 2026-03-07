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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generateSandCourtSystemPDF } from "./SandCourtSystemPDF";
import { generateSitePDF } from "./SitePDF";
import { generateHolisticPDF } from "./HolisticPDF";
import { generateTelemetriaPDF } from "./TelemetriaPDF";
import { generateClimatizePDF } from "./ClimatizePDF";
import { SitePDFGeneratorModal } from "./SitePDFGeneratorModal";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { ContactTimeline } from "./ContactTimeline";
import { useAuth } from "@/contexts/AuthContext";
import { LeadTags } from "./LeadTags";
import { analyzeSite } from "@/lib/siteAuditor";
import { scoreLead } from "@/lib/conversionEngine";

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
  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const [isAnalyzingSite, setIsAnalyzingSite] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState("");

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
    terapias_holisticas: 'terapias_holisticas', holistic: 'terapias_holisticas', reiki: 'terapias_holisticas',
    acupuntura: 'terapias_holisticas', meditacao: 'terapias_holisticas', yoga: 'terapias_holisticas',
    alternativa: 'terapias_holisticas', aromaterapia: 'terapias_holisticas', orgon: 'terapias_holisticas',
    telemetria: 'telemetria', reservatório: 'telemetria',
    climatização: 'climatizacao', hvac: 'climatizacao', climatizador: 'climatizacao',
    'monitoramento de água': 'telemetria', 'eficiência energética': 'climatizacao',
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
    terapias_holisticas: { basic: 'R$ 2.500', pro: 'R$ 6.000', premium: 'R$ 10.000', basicRange: 'R$ 2.000 – R$ 3.000', proRange: 'R$ 5.000 – R$ 7.500', premiumRange: 'R$ 10.000' },
    telemetria: { basic: 'R$ 1.200', pro: 'R$ 3.500', premium: 'R$ 8.500/mês', basicRange: 'R$ 1.000 – R$ 1.800', proRange: 'R$ 2.500 – R$ 4.500', premiumRange: 'R$ 7.000 – R$ 12.000/mês' }
  };

  let pricingCategory = 'default';
  const nicheKey = (business.niche + ' ' + business.name).toLowerCase();
  for (const [kw, cat] of Object.entries(keywords)) {
    if (nicheKey.includes(kw)) { pricingCategory = cat; break; }
  }

  const isSandCourt = business.niche?.toLowerCase().includes('beach tennis') || business.niche?.toLowerCase().includes('vôlei de praia') || business.niche?.toLowerCase().includes('futevôlei') || business.niche?.toLowerCase().includes('areia');
  const isHolistic = pricingCategory === 'terapias_holisticas' || business.niche === 'terapias_holisticas' || business.niche?.toLowerCase().includes('reiki') || business.niche?.toLowerCase().includes('orgon');
  const isEletricomNiche =
    business.name?.toLowerCase().includes('eletricom') ||
    business.niche?.toLowerCase().includes('condomín') ||
    business.niche?.toLowerCase().includes('síndico') ||
    business.niche?.toLowerCase().includes('administradora');

  const isTelemetria = isEletricomNiche ||
    pricingCategory === 'telemetria' ||
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
    if (!business.website) {
      toast.error("Este lead não possui website cadastrado.");
      return;
    }

    setIsAnalyzingSite(true);
    setAnalysisStatus("Iniciando...");
    const toastId = toast.loading("Conectando ao Google PageSpeed...");

    try {
      const audit = await analyzeSite(business.website, (msg) => {
        setAnalysisStatus(msg);
        toast.loading(msg, { id: toastId });
      });

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

      if (isUUID(leadId)) {
        await (supabase as any)
          .from('leads')
          .update({ meta_data: newMetaData })
          .eq('id', leadId);
      }

      // Notifica o pai para atualizar a UI instantaneamente (funciona para busca e listagem)
      if (onUpdateBusiness) {
        onUpdateBusiness({
          ...business,
          ...newMetaData,
          score: (newMetaData as any).score,
          temperature: (newMetaData as any).temperature,
          offerReason: (newMetaData as any).offerReason,
          audit: {
            ...newMetaData.technical_audit,
            // Preenche legado para evitar erros de tipagem
            speedScore: newMetaData.technical_audit.performanceScore,
            mobileFriendly: newMetaData.technical_audit.isResponsive,
            https: newMetaData.technical_audit.isSecure,
            seoBasics: !newMetaData.technical_audit.isDown && newMetaData.technical_audit.seoScore > 50,
            ctaClarity: !newMetaData.technical_audit.isDown,
            isDown: newMetaData.technical_audit.isDown
          }
        });
      }

      toast.success("Auditoria oficial concluída!", { id: toastId });
    } catch (error) {
      console.error("[BusinessCard] Erro na auditoria:", error);
      toast.error("Erro na conexão com o Google. Verifique a API.", { id: toastId });
    } finally {
      setIsAnalyzingSite(false);
      setAnalysisStatus("");
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
  // Niche-specific content helpers for the PDF
  const pdfSubTitle = isSandCourt ? 'Sistema de Gestão e Agendamento para sua Arena' : (isHolistic ? 'Inovação em Tecnologia Orgonial' : (isTelemetria ? 'Inteligência Predial · Monitoramento & Automação IoT' : 'Diagnóstico Técnico · Estratégia Digital'));

  const pdfFormalLetter = isSandCourt ? `
      <p>No dinâmico mercado de <strong>Arenas e Complexos Esportivos</strong>, a agilidade no processo de reserva é o principal diferencial para garantir que sua quadra nunca fique ociosa. Identificamos que a gestão da <strong>${business.name}</strong> pode atingir um novo patamar de eficiência tecnológica através do <strong>Sistema de Gestão ReservaAI</strong>.</p>
      <p>O <strong>ReservaAI</strong> é a solução mais completa do mercado para quem busca automatizar o atendimento, acabar com a confusão na agenda e profissionalizar a cobrança de alunos e mensalistas. Esta proposta detalha como implementaremos o ecossistema que permite agendamentos via WhatsApp, recebimento via PIX/Cartão e controle financeiro total em um só lugar.</p>
    ` : (isHolistic ? `
      <p>No segmento de <strong>Terapias Holísticas e Bem-Estar</strong>, a busca por resultados reais e duradouros é o que fideliza o interagente. Identificamos uma oportunidade única para <strong>${business.name}</strong> elevar seu patamar de atendimento através da <strong>Tecnologia Orgonial de Wilhelm Reich</strong>.</p>
      <p>Utilizar um <strong>Acumulador de Energia Orgone (Caixa Orgônica)</strong> não é apenas adicionar um serviço, mas sim implementar uma ferramenta científica de vitalização que auxilia no combate ao estresse, fortalecimento imunológico e equilíbrio energético profundo. Esta proposta detalha como você pode integrar essa solução premium em sua rotina terapêutica.</p>
    ` : (isTelemetria ? `
      <p>No competitivo cenário de <strong>Gestão Predial e Industrial</strong>, a visibilidade sobre os ativos críticos é a chave para a economia e segurança. Identificamos que a infraestrutura da <strong>${business.name}</strong> pode atingir um novo patamar de eficiência através da <strong>Plataforma de Telemetria Eletricom</strong>.</p>
      <p>Nossa tecnologia permite o monitoramento em tempo real de reservatórios, automação de climatização (HVAC) e gestão volumétrica precisa, transformando dados brutos em decisões que reduzem desperdícios e custos operacionais imediatamente. Esta proposta detalha como implementaremos o seu CCO (Centro de Controle Operacional) digital.</p>
    ` : `
      <p>Com base em dados coletados via Google Places e auditoria técnica online, identificamos que o negócio ainda não conta com um <strong>presença digital otimizada</strong> ou possui lacunas de automação críticas — o que representa uma perda direta de clientes que buscam por "${business.niche}" em ${business.city}.</p>
      <p>Esta proposta apresenta um diagnóstico completo e as soluções de <strong>gestão e automação</strong> recomendadas para posicionar <strong>${business.name}</strong> com autoridade e credibilidade no mercado.</p>
    `));

  const pdfAuditItems = isSandCourt ? [
    { label: 'Agendamento pelo WhatsApp', found: true, val: 'Disponibilidade 24h para o seu atleta' },
    { label: 'Pagamentos via PIX/Cartão', found: true, val: 'Receba sinal ou o total na hora da reserva' },
    { label: 'Gestão de Mensalistas', found: true, val: 'Cobrança e controle recorrente automatizado' },
    { label: 'Controle de Alunos', found: true, val: 'Frequência, turmas e níveis de jogo' },
    { label: 'Dashboard Administrativo', found: true, val: 'Visão clara do faturamento e inadimplência' },
    { label: 'Notificações Automáticas', found: true, val: 'Lembretes de aula e confirmação de reserva' },
  ] : (isHolistic ? [
    { label: 'Acumulação de Energia', found: true, val: 'Captação de energia vital da atmosfera para o corpo' },
    { label: 'Camadas Alternadas', found: true, val: 'Materiais orgânicos e metálicos em camadas equilibradas' },
    { label: 'Revitalização Biológica', found: true, val: 'Restauração do movimento energético natural' },
    { label: 'Fortalecimento Imune', found: true, val: 'Auxilia na resistência biológica a doenças' },
    { label: 'Equilíbrio Psicossomático', found: true, val: 'Integração entre saúde mental e corporal' },
    { label: 'Legado de Wilhelm Reich', found: true, val: 'Baseado em décadas de pesquisa científica' },
  ] : (isTelemetria ? [
    { label: 'Monitoramento de Nível', found: true, val: 'Visibilidade volumétrica em m³ em tempo real' },
    { label: 'Automação HVAC (Climatização)', found: true, val: 'Economia comprovada de até 30% de energia' },
    { label: 'Alertas via WhatsApp', found: true, val: 'Notificações instantâneas de níveis críticos' },
    { label: 'Gestão de Incêndio', found: true, val: 'Garantia de reserva técnica monitorada 24/7' },
    { label: 'Dashboard CCO 3D', found: true, val: 'Interface interativa de controle operacional' },
    { label: 'Relatórios Temporais', found: true, val: 'Análise de histórico de 24h a 30 dias' },
  ] : [
    { label: 'Site Profissional', found: !!business.website, val: business.website || 'Não identificado — oportunidade crítica' },
    { label: 'Certificado SSL (HTTPS)', found: !!business.isSecure, val: business.isSecure ? 'Certificado válido — site seguro' : business.isSecure === false ? 'Ausente — navegadores bloqueiam o site' : 'Não verificado' },
    { label: 'Otimização Mobile (Responsivo)', found: !!business.mobileFriendly, val: business.mobileFriendly ? 'Site adaptado para celular' : business.mobileFriendly === false ? 'Não responsivo — perde +60% do tráfego' : 'Não verificado' },
    { label: 'Indexação no Google (SEO)', found: !!business.website, val: business.website ? 'Site passível de indexação' : 'Sem site = invisível no Google' },
    { label: 'Google Meu Negócio', found: !!business.googleMapsUrl, val: business.googleMapsUrl ? 'Perfil ativo no Maps' : 'Não verificado' },
    { label: 'Velocidade de Carregamento', found: !!business.website && !!business.isSecure, val: business.website ? 'Verificar performance técnica' : 'Sem site para avaliar' },
  ]));

  const pdfProblemBody = isSandCourt ? `
      <p>A gestão manual de <strong>arenas e quadras</strong> através de planilhas ou conversas soltas no WhatsApp gera perda de receita e atrito para o cliente. A <strong>${business.name}</strong> pode estar deixando de faturar por não oferecer uma reserva imediata e segura.</p>
      <p>O <strong>ReservaAI</strong> resolve isso ao centralizar todas as operações. O atleta reserva por conta própria no WhatsApp, e o sistema cuida do resto: confirma o horário, recebe o pagamento e atualiza seu dashboard financeiro em tempo real.</p>
    ` : (isHolistic ? `
      <p>O mercado de práticas integrativas exige resultados tangíveis. Ao oferecer a <strong>Caixa Orgônica</strong>, sua clínica se destaca de terapias puramente verbais ou energéticas sutis, entregando um ambiente físico de alta concentração vital que o interagente <strong>sente</strong> no corpo durante e após a sessão.</p>
    ` : (isTelemetria ? `
      <p>Gerenciar grandes infraestruturas sem dados em tempo real é um risco operacional e financeiro. A <strong>${business.name}</strong> pode estar perdendo milhares de reais mensalmente devido a climatização ineficiente e falta de controle volumétrico.</p>
      <p>A <strong>Telemetria Eletricom</strong> elimina o "achismo". Com nossos sensores industriais e dashboards intuitivos, você assume o controle total do consumo, evita desabastecimentos inesperados e blinda sua operação contra falhas críticas.</p>
    ` : `
      <p>Com um score de presença digital de apenas <strong>${score}%</strong>, o negócio apresenta lacunas que impactam a credibilidade. Atualmente, <strong>87% dos consumidores</strong> desistem de uma contratação se não encontram um site profissional ou se o mesmo não transmite confiança técnica.</p>
    `));

  const pdfProblemList = isSandCourt ? [
    'Eliminação da espera por resposta manual no WhatsApp',
    'Gestão profissional de alunos e horários fixos',
    'Visibilidade total do faturamento da arena',
    'Facilidade extrema para o atleta realizar a reserva'
  ] : (isHolistic ? [
    'Diferencial competitivo frente a terapeutas convencionais',
    'Aceleração nos resultados de curas naturais e stress',
    'Aumento do valor percebido da sessão de atendimento',
    'Inovação baseada na psicofísica de Wilhelm Reich'
  ] : (isTelemetria ? [
    'Visibilidade total de reservatórios (Consumo/Incêndio)',
    'Economia direta em faturas de energia com automação HVAC',
    'Prevenção de transbordamentos e desabastecimentos',
    'Relatórios técnicos para auditorias e gestão de ativos'
  ] : (business.missingItems || [])));

  const pdfTiers = isSandCourt ? {
    starter: ['Essencial: Sistema e Automação', 'Agendamento pelo WhatsApp', 'Informações de valor de aula', '1 Usuário Administrativo', 'Notificação por e-mail', 'Configuração de 1 Quadra'],
    pro: ['Avançado: Automação + Financeiro', 'Até 4 quadras vinculadas', 'Receber sinal da reserva', 'Receber por PIX automático', 'Acesso de funcionário (Exportar horários)', 'Dashboard Financeiro completo'],
    premium: ['Master: Gestão 360 Escalável', 'Quadras Ilimitadas', 'Receber com Cartão de Crédito', 'Gestão de Day Use completo', 'Gestão de Aluno (Checking/Turmas)', 'Múltiplos Usuários Administrativos']
  } : (isHolistic ? {
    starter: ['Essencial: Configuração de 3 camadas', 'Estrutura em madeira orgânica tratada', 'Revestimento em aço galvanizado', 'Uso individual (posição sentada)', 'Manual técnico de utilização segura'],
    pro: ['Avançado: Potencializado (5 camadas)', 'Acabamento em verniz náutico premium', 'Maior concentração de energia vital', 'Ideal para sessões clínicas intensas', 'Palestra online sobre Uso Terapêutico'],
    premium: ['Master: Ultra-Potencializado (10 camadas)', 'Acessórios: Manta e Travesseiro Orgonial', 'Consultoria para protocolos complexos', 'Certificado de Autenticidade Técnica', 'Acompanhamento de resultados e telemetria']
  } : (isTelemetria ? {
    starter: ['Essencial: Monitoramento Nível', 'Visão de Nível em (m)', 'Alertas de Nível Crítico', 'Acesso 1 Usuário Operacional', 'Suporte Técnico em Horário Comercial', 'Configuração de 1 Reservatório'],
    pro: ['Avançado: Gestão Volumétrica', 'Visão 3D e Gráficos em Tempo Real', 'Gestão de Consumo e Incêndio', 'Até 5 Reservatórios Monitorados', 'Alertas via WhatsApp Ilimitados', 'Histórico de Leituras de 30 dias'],
    premium: ['Enterprise: Full IoT & Automação', 'Monitoramento Multi-site Ilimitado', 'Automação de Climatização (HVAC)', 'Dashboards CCO Customizados', 'Análise de Preditiva de Falhas', 'Suporte Prioritário 24/7 (SLA)']
  } : {
    starter: ['Site responsivo (mobile + desktop)', 'Certificado SSL (HTTPS) incluso', 'Até 5 páginas completas', 'Formulário de contato funcional', 'Hospedagem e domínio configurados'],
    pro: ['SEO local: Otimização Estratégica', `Posicionamento: "${business.niche} em ${business.city}"`, 'Design premium de alta conversão', 'Integração Analytics + Search Console', 'Painel de edição (CMS)'],
    premium: ['Sistema Web Sob Medida', 'Desenvolvimento de sistemas (agendamento, etc)', 'Área administrativa personalizada', 'Integrações com APIs externas', 'Suporte técnico prioritário']
  }));

  const pdfTableDeliveries = isSandCourt ? {
    starter: 'Agendamento WhatsApp, 2 quadras',
    pro: 'Gestão completa, multi-quadras',
    premium: 'Solução personalizada, consultoria'
  } : (isHolistic ? {
    starter: 'Acumulador 3 camadas + Manual',
    pro: 'Acumulador 5 camadas + Treinamento',
    premium: 'Acumulador 10 camadas + Acessórios'
  } : (isTelemetria ? {
    starter: 'Monitoramento Nível, 1 Tanque',
    pro: 'Gestão Volumétrica, 5 Tanques',
    premium: 'Full IoT, HVAC, Suporte 24/7'
  } : {
    starter: 'Site responsivo, SSL, formulário',
    pro: 'Site premium, SEO local, CMS',
    premium: 'Sistema sob medida, área admin'
  }));

  const sandStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
    * { box-sizing: border-box; }
    body { font-family: 'Outfit', sans-serif; background-color: #FDF6F0; color: #2C3639; width: 1024px; margin: 0; font-size: 16px; line-height: 1.6; }
    .accent-bar { background-color: #6366f1; height: 10px; }
    .header { background-color: #0A1128; padding: 40px 70px; display: flex; justify-content: space-between; align-items: center; border-bottom: 5px solid #6366f1; }
    .header img, .cover-logo img { max-width: 320px; max-height: 140px; object-fit: contain; display: block; margin: 0 auto; }
    .cover { height: 1120px; background-color: #0A1128; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 100px; color: #ffffff; position: relative; overflow: hidden; page-break-after: always; }
    .cover-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: #0A1128; z-index: 1; }
    .cover-content { position: relative; z-index: 10; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; }
    .cover h1 { font-family: 'Outfit', sans-serif; font-size: 84px; font-weight: 900; line-height: 1.1; margin-bottom: 24px; color: #ffffff; text-transform: uppercase; width: 100%; }
    .cover .subtitle { font-size: 28px; color: #818cf8; max-width: 700px; margin-bottom: 40px; font-weight: 700; }
    .cover-tag { color: #6366f1; border: 2px solid #6366f1; padding: 8px 24px; border-radius: 50px; font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; display: inline-block; margin-bottom: 30px; }
    .powered-by { font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 50px; display: flex; align-items: center; gap: 8px; position: relative; z-index: 2; background-color: rgba(99, 102, 241, 0.1); padding: 12px 22px; border-radius: 10px; border: 1px solid rgba(99, 102, 241, 0.2); }
    .site-link { color: #6366f1; text-decoration: none; font-weight: 900; font-size: 20px; margin-top: 15px; display: inline-block; position: relative; z-index: 2; border-bottom: 2px solid #6366f1; }
    .score-strip { background-color: #ffffff; border-bottom: 4px solid #6366f1; padding: 40px 70px; display: flex; align-items: center; gap: 36px; }
    .score-main { display: flex; align-items: center; gap: 20px; padding-right: 36px; border-right: 2px solid #e2e8f0; }
    .score-ring { background-color: #6366f1; width: 95px; height: 95px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: none; }
    .score-ring span { color: #ffffff !important; font-size: 32px; font-weight: 900; }
    .score-info h2 { color: #0A1128; font-size: 28px; margin: 0; line-height: 1.2; font-weight: 900; }
    .score-info p { color: #6366f1; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; font-size: 15px; margin-top: 5px; }
    .score-kpis { display: flex; gap: 0; flex: 1; }
    .score-kpi { text-align: center; flex: 1; padding: 0 20px; border-right: 1px solid #e2e8f0; }
    .score-kpi:last-child { border-right: none; }
    .score-kpi .kval { font-size: 24px; font-weight: 900; color: #0A1128; }
    .score-kpi .klbl { font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
    .section { padding: 50px 70px; border-bottom: 1px solid #f1f5f9; }
    .section-title { color: #6366f1; border-bottom: 3px solid #6366f1; padding-bottom: 12px; font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 40px; display: inline-block; }
    .section-title::after { display: none !important; content: none !important; }
    .problem-box { background-color: #EEF2FF; border-radius: 16px; border-left: 6px solid #6366f1; padding: 45px; margin-bottom: 50px; }
    .problem-box h3 { color: #0A1128; font-size: 28px; font-weight: 900; margin-bottom: 25px; line-height: 1.2; }
    .problem-box p { color: #2C3639; font-size: 18px; margin-bottom: 20px; line-height: 1.7; }
    .tiers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
    .tier { background-color: #ffffff; border-radius: 20px; padding: 40px 25px; text-align: center; border: 1px solid #e2e8f0; position: relative; display: flex; flex-direction: column; }
    .tier.pro { border: 2px solid #6366f1; box-shadow: 0 15px 35px -10px rgba(99, 102, 241, 0.15); }
    .medal { width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 5px 15px rgba(0,0,0,0.1); border-width: 3px; border-style: solid; }
    .medal svg { width: 40px; height: 40px; }
    .tier.starter .medal { background-color: #fef3c7; border-color: #f59e0b; color: #f59e0b; }
    .tier.pro .medal { background-color: #f1f5f9; border-color: #94a3b8; color: #64748b; }
    .tier.premium .medal { background-color: #fffbeb; border-color: #facc15; color: #eab308; }
    .tier h4 { font-size: 24px; font-weight: 900; color: #0A1128; margin-bottom: 10px; }
    .tier-subtitle { color: #94a3b8; font-size: 15px; font-weight: 700; text-transform: uppercase; margin-bottom: 15px; display: block; letter-spacing: 1px; }
    .price-main { color: #6366f1; font-size: 44px; font-weight: 900; margin-bottom: 25px; }
    .price-main span { font-size: 16px; color: #94a3b8; font-weight: 400; }
    .tier-list { text-align: left; list-style: none; padding: 0; margin-bottom: 10px; flex-grow: 1; }
    .tier-list li { margin-bottom: 12px; font-size: 15px; font-weight: 500; display: flex; gap: 8px; color: #475569; }
    .tier-list li::before { content: '✓'; color: #6366f1; font-weight: 900; }
    .invest-table { width: 100%; border-collapse: collapse; border-radius: 15px; overflow: hidden; border: 1px solid #e2e8f0; }
    .invest-table th { background-color: #0A1128; color: #ffffff; padding: 22px; font-size: 15px; text-transform: uppercase; text-align: center; font-weight: 900; letter-spacing: 1px; }
    .invest-table th:first-child { text-align: left; }
    .invest-table td { padding: 18px 22px; border-top: 1px solid #f1f5f9; font-size: 15px; font-weight: 500; text-align: center; color: #475569; }
    .invest-table td:first-child { text-align: left; font-weight: 600; color: #2C3639; }
    .check-icon { color: #6366f1; font-weight: 900; font-size: 22px; }
    .check-circle { width: 28px; height: 28px; border-radius: 50%; background-color: #6366f1; color: white; font-size: 16px; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; margin: auto; }
    .footer { background-color: #0A1128; color: #ffffff; padding: 40px 70px; display: flex; justify-content: space-between; align-items: center; border-top: 5px solid #6366f1; }
    .footer-left { display: flex; flex-direction: column; gap: 5px; }
    .footer-brand { font-size: 20px; font-weight: 900; color: #ffffff; display: flex; align-items: center; gap: 10px; }
    .footer-brand span { color: #6366f1; }
    .footer-meta { font-size: 14px; color: #94a3b8; font-weight: 500; }
    .footer-right { text-align: right; }
    .closing { padding: 50px 70px 70px; }
    .closing p { font-size: 18px; margin-bottom: 20px; color: #334155; line-height: 1.7; }
    .sign-block { margin-top: 50px; border-top: 2px solid #6366f1; padding-top: 35px; }
    .sign-name { font-size: 32px; font-weight: 900; color: #0A1128; margin-bottom: 6px; }
    .sign-title { font-size: 15px; color: #6366f1; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 25px; display: block; }
    .sign-contact { font-size: 14px; color: #475569; font-weight: 500; display: block; text-decoration: none; margin-bottom: 4px; }
    .sign-contact-item { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; font-size: 16px; color: #2C3639; font-weight: 600; }
    .sign-site { font-size: 14px; color: #6366f1; font-weight: 700; margin-top: 5px; display: block; }
    `;

  const telemetriaStyles = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;700;900&display=swap');
    body { font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #0f172a; width: 1024px; margin: 0; font-size: 13px; line-height: 1.6; }
    .accent-bar { background-color: #0d9488; height: 10px; }
    .header { background-color: #0f172a; padding: 40px 60px; display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #0d9488; }
    .cover { height: 1120px; background-color: #0f172a; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 60px; color: #ffffff; position: relative; overflow: hidden; page-break-after: always; }
    .cover h1 { font-family: 'Inter', sans-serif; font-size: 72px; font-weight: 900; color: #ffffff; margin-bottom: 20px; text-transform: uppercase; }
    .cover .subtitle { font-size: 24px; color: #2dd4bf; font-weight: 700; margin-bottom: 40px; }
    .score-strip { background-color: #1e293b; border-bottom: 3px solid #0d9488; }
    .score-ring { border-color: #0d9488; background-color: rgba(13, 148, 136, 0.1); }
    .score-ring span, .score-info h2 { color: #2dd4bf; }
    .section-title { color: #0d9488; border-bottom: 2px solid #0d9488; }
    .problem-box { background-color: #f0fdfa; border-color: #99f6e4; border-left-color: #0d9488; }
    .tier.pro { border-color: #0d9488; background-color: #f0fdfa; }
    .price-main { color: #0d9488; }
    .invest-table th { background-color: #0f172a; }
    .footer { background-color: #0f172a; border-top-color: #0d9488; }
    .sign-name { color: #0f172a; }
    .sign-title { color: #0d9488; }
    `;

  const pdfStyles = isSandCourt ? sandStyles : (isHolistic ? `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;700&display=swap');
    body { font-family: 'Inter', sans-serif; background-color: #F9F7F2; color: #2C3639; width: 1024px; margin: 0; font-size: 13px; line-height: 1.6; }
    .accent-bar { background-color: #4A7C59; height: 8px; }
    .header { background-color: #2C3639; padding: 44px 60px 36px; display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; border-bottom: 4px solid #C5A059; }
    .header-brand h1 { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 900; color: #F9F7F2; }
    .header-brand .brand-tag { color: #C5A059; letter-spacing: 3px; font-weight: 800; text-transform: uppercase; }
    .cover { height: 1120px; background-color: #2C3639; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 60px; color: #F9F7F2; position: relative; overflow: hidden; page-break-after: always; }
    .cover-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: #2C3639; z-index: 1; }
    .cover h1 { font-family: 'Playfair Display', serif; font-size: 64px; }
    .score-strip { background-color: #3E4A4D; border-bottom: 3px solid #C5A059; }
    .score-ring { border-color: #C5A059; background-color: rgba(197, 160, 89, 0.1); }
    .score-ring span, .score-info h2 { color: #C5A059; }
    .section-title { color: #4A7C59; border-bottom: 1px solid #DCD7C9; }
    .problem-box { background-color: #F2EFE5; border-color: #C5A059; border-left-color: #4A7C59; color: #2C3639; }
    .tier.starter { background-color: #ffffff; border-color: #DCD7C9; }
    .tier.pro { border-top-color: #4A7C59; background-color: #F2EFE5; border-width: 1px; border-top-width: 4px; }
    .tier.premium { border-top-color: #C5A059; background-color: #F9F7F2; border-width: 1px; border-top-width: 4px; }
    .invest-table th { background-color: #4A7C59; color: #F9F7F2; }
    .step { border-top-color: #4A7C59; background-color: #ffffff; }
    .step-num { background-color: #4A7C59; }
    .footer { background-color: #2C3639; color: #F9F7F2; }
    ` : (isTelemetria ? telemetriaStyles : `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    body { font-family: 'Inter', sans-serif; background-color: #ffffff; color: #1e293b; width: 1024px; margin: 0; font-size: 13px; line-height: 1.6; }
    .accent-bar { background-color: #4f46e5; height: 6px; }
    .header { background-color: #0f172a; padding: 44px 60px 36px; display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
    .header-brand h1 { font-size: 28px; font-weight: 900; color: #f1f5f9; }
    .header-brand .brand-tag { color: #818cf8; letter-spacing: 5px; font-weight: 800; text-transform: uppercase; }
    .cover { height: 1120px; background-color: #0f172a; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 60px; color: #ffffff; position: relative; overflow: hidden; page-break-after: always; }
    .cover-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: #0f172a; z-index: 1; }
    .score-strip { background-color: #0f172a; border-bottom: 3px solid #4f46e5; }
    .score-ring { border-color: ${scoreColor}; background-color: ${scoreColor}20; }
    .score-ring span, .score-info h2 { color: ${scoreColor}; }
    .section-title { color: #4f46e5; }
    .problem-box { background-color: #fffbeb; border-color: #fcd34d; border-left-color: #f59e0b; }
    .tier.starter { background-color: #f8fafc; border-color: #cbd5e1; }
    .tier.pro { background-color: #f5f3ff; border-color: #a5b4fc; border-top-width: 3px; border-top-color: #4f46e5; }
    .tier.premium { background-color: #fffbeb; border-color: #fcd34d; border-top-width: 3px; border-top-color: #f59e0b; }
    .invest-table th { background-color: #f1f5f9; color: #64748b; }
    .invest-table .rec { background-color: #eef2ff; }
    .step { background-color: #f8fafc; border-color: #e2e8f0; border-top-width: 3px; border-top-color: #4f46e5; }
    .step-num { background-color: #4f46e5; color: #ffffff; }
    .footer { background-color: #0f172a; color: #cbd5e1; }
    `));

  const commonStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    `;


  const generatePDFInternal = async (type: 'system' | 'site') => {
    const isSite = type === 'site';
    const toastId = isSite ? 'pdf-gen-site' : 'pdf-gen-system';
    toast.loading(`Gerando PDF de ${isSite ? 'Site' : 'Sistema'}...`, { id: toastId });

    // ============================================================
    // BUSCA FRESCA DOS DADOS — Nunca confia no estado React sozinho
    // ============================================================
    let freshProfile: any = userProfile;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await (supabase as any).from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (data) {
          freshProfile = data;
          setUserProfile(data); // atualiza estado para próximas gerações
        }
      }
    } catch (e) { console.error("Profile fetch failed", e); }

    // Variáveis locais — 100% baseadas em freshProfile
    const pdfSellerName = freshProfile?.full_name || 'Equipe ReservaAI';
    const pdfSellerEmail = freshProfile?.contact_email || '';
    const pdfSellerWhatsapp = freshProfile?.whatsapp || '';
    const pdfSellerInstagram = freshProfile?.instagram || '';
    const pdfSellerWebsite = freshProfile?.website_url || '';
    const pdfSellerWebsiteSite = freshProfile?.website_site_url || '';

    // ============================================================
    // LOGO — Converte para base64 aqui dentro para evitar CORS no iframe
    // ============================================================
    const toBase64FromUrl = async (url: string): Promise<string> => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch { return ''; }
    };

    let pdfLogoRaw = isSite
      ? (customLogoSiteBase64 || freshProfile?.logo_site_url || '')
      : (customLogoBase64 || freshProfile?.logo_url || '');

    // Se for URL (não base64), converte agora
    if (pdfLogoRaw && !pdfLogoRaw.startsWith('data:')) {
      pdfLogoRaw = await toBase64FromUrl(pdfLogoRaw);
    }
    const pdfLogo = pdfLogoRaw;
    const pdfWebsite = isSite ? pdfSellerWebsiteSite : pdfSellerWebsite;

    console.log('[PDF DEBUG]', { pdfSellerName, pdfSellerWhatsapp, pdfSellerInstagram, hasLogo: !!pdfLogo });

    const currentSubtitle = isSite ? `Plano de Desenvolvimento Web e SEO para ${business.niche}` : pdfSubTitle;
    const currentCoverTag = isSite ? 'Desenvolvimento Web & SEO' : (isSandCourt ? 'Sistema de Gestão e Agendamento' : 'Proposta de Valor');

    // Create a NEW fresh template for this specific generation to avoid state leakage
    const currentHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Proposta Comercial — ${business.name}</title>
  <style>
    ${commonStyles}
    ${pdfStyles}
  </style>
</head>
<body class="${isSandCourt ? 'sand' : (isHolistic ? 'holistic' : 'standard')}">
  <!-- PAGE 1: COVER -->
  <div class="cover">
    <div class="cover-bg"></div>
    <div class="cover-content">
      <div class="cover-logo" style="margin-bottom: 30px;">
        ${pdfLogo ? `<img src="${pdfLogo}" style="max-width: 200px; max-height: 100px; width: auto; height: auto; object-fit: contain; display: block; margin: 0 auto;" />` : `
        <svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #6366f1;">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        `}
      </div>
      <div class="cover-tag">${currentCoverTag}</div>
      <h1>${business.name}</h1>
      <div class="subtitle">${isSite ? `Criação de Site Profissional, SEO e Identidade Digital` : currentSubtitle}</div>
      
      ${isSandCourt && !isSite ? `
        <div class="powered-by">Oferecido por <strong>ReservaAI</strong></div>
        <div style="margin-top: 15px;"><a id="pdf-cover-link" href="https://reservaai.com.br" style="color: #6366f1; text-decoration: none; font-weight: 900; font-size: 18px;">www.reservaai.com.br</a></div>
      ` : ''}

      <div class="cover-footer">
        <div class="cover-prepared">Preparado por</div>
        <div class="cover-name">${pdfSellerName}</div>
        ${pdfWebsite ? `<div class="cover-site">${pdfWebsite}</div>` : ''}
      </div>
    </div>
  </div>

  <div class="accent-bar"></div>

  <!-- HEADER -->
  <div class="header">
    <div style="display: flex; align-items: center; gap: 30px;">
      ${pdfLogo ? `<div class="header-logo" style="flex-shrink: 0;"><img src="${pdfLogo}" style="max-height: 45px; max-width: 130px; width: auto; height: auto; object-fit: contain;" /></div>` : ''}
      <div class="header-brand">
        <div class="brand-tag">Proposta Comercial Exclusiva</div>
        <h1 style="color: #ffffff; font-size: 28px; line-height: 1.2;">${business.name}</h1>
        <div class="subtitle" style="color: #818cf8; font-size: 14px; margin-top: 5px;">${isSite ? 'Projeto de Desenvolvimento Web & SEO' : pdfSubTitle}</div>
      </div>
    </div>
    <div class="header-meta">
      <div class="doc-num">Proposta Nº ${String(Date.now()).slice(-6)}</div>
      <div class="doc-date">Emitida em ${date}</div>
      <div class="seller-name">${pdfSellerName}</div>
      ${pdfSellerEmail ? `<div class="seller-email">${pdfSellerEmail}</div>` : ''}
      ${pdfWebsite ? `<div class="seller-site">${pdfWebsite}</div>` : ''}
      <div class="confidential">Documento Confidencial</div>
    </div>
  </div>

  <!-- FORMAL LETTER -->
  <div class="letter">
    <div class="to-label">Destinatário</div>
    <div class="to-name">${business.name}</div>
    <div class="to-sub">${business.niche} · ${business.city}${business.address ? ' · ' + business.address : ''}</div>
    <p>Prezado(a) gestor(a) de <strong>${business.name}</strong>,</p>
    <p>É com grande satisfação que apresentamos esta <strong>Proposta Comercial Estratégica</strong>, elaborada exclusivamente para <strong>${business.name}</strong>, visando o fortalecimento e a inovação tecnológica através do ${isSite ? 'Desenvolvimento de Site e Estratégia de SEO' : 'nosso Ecossistema de Gestão e Automação'}.</p>
    ${isSite ? `
      <p>Identificamos que a <strong>${business.name}</strong> possui um enorme potencial inexplorado no ambiente digital. Atualmente, a falta de um site otimizado (ou lacunas técnicas no atual) impede que centenas de clientes em ${business.city} encontrem seus serviços no Google.</p>
      <p>Nossa solução de <strong>Desenvolvimento Web & SEO</strong> não foca apenas na estética, mas em transformar seu site em uma máquina de vendas, com carregamento ultra-rápido, segurança SSL e total conformidade com os algoritmos de busca.</p>
    ` : pdfFormalLetter}
  </div>

  <!-- SCORE STRIP -->
  <div class="score-strip">
    <div class="score-main">
      <div class="score-ring"><span>${score}%</span></div>
      <div class="score-info">
        <h2>${isSite ? 'Análise de Presença Digital' : (isSandCourt ? 'Match de Eficiência' : scoreLabel)}</h2>
        <p>${isSite ? 'Score de SEO e Visibilidade' : (isSandCourt ? 'Potencial de Automação Identificado' : (isHolistic ? 'Potencial de Inovação Energética' : 'Score de Presença Digital'))}</p>
      </div>
    </div>
    <div class="score-kpis">
      <div class="score-kpi"><div class="kval">${isSandCourt ? 'Benefício' : (isSite ? (business.website ? 'Sim' : 'Não') : (isHolistic ? 'Reich' : (business.website ? 'Sim' : 'Não')))}</div><div class="klbl">${isSandCourt ? 'Custo' : (isSite ? 'Site Ativo' : (isHolistic ? 'Tecnologia' : 'Site Ativo'))}</div></div>
      <div class="score-kpi"><div class="kval">${isSandCourt ? 'Sim' : (isSite ? (business.isSecure ? 'Sim' : 'Não') : (isHolistic ? 'Vital' : (business.isSecure ? 'Sim' : 'Não')))}</div><div class="klbl">${isSandCourt ? 'PIX' : (isSite ? 'Segurança SSL' : (isHolistic ? 'Energia' : 'HTTPS / SSL'))}</div></div>
      <div class="score-kpi"><div class="kval">${isSandCourt ? 'Sim' : (isSite ? (business.mobileFriendly ? 'Sim' : 'Não') : (isHolistic ? 'Cura' : (business.mobileFriendly ? 'Sim' : 'Não')))}</div><div class="klbl">${isSandCourt ? '24/7' : (isSite ? 'Mobile OK' : (isHolistic ? 'Equilíbrio' : 'Mobile OK'))}</div></div>
      <div class="score-kpi"><div class="kval">${business.rating || '—'}</div><div class="klbl">${isSandCourt ? 'Rating' : 'Nota Google'}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${isSite ? '03. Diagnóstico Técnico de Presença' : (isSandCourt ? '03. Auditoria de Gestão e Automação' : (isHolistic ? '03. Pilares da Tecnologia Orgonial' : '03. Auditoria de Presença Digital'))}</div>
    <div class="audit-grid">
      ${(isSite ? [
        { label: 'Site Profissional', found: !!business.website, val: business.website || 'Oportunidade de Melhoria' },
        { label: 'HTTPS / SSL', found: !!business.isSecure, val: business.isSecure ? 'Segurança Ativa' : 'Site não seguro' },
        { label: 'Responsivo (Mobile)', found: !!business.mobileFriendly, val: business.mobileFriendly ? 'Adaptado' : 'Não adaptado' },
        { label: 'Performance / Velocidade', found: business.performanceScore > 60, val: `${business.performanceScore}% de score energético` },
        { label: 'Google Meu Negócio', found: !!business.googleMapsUrl, val: business.googleMapsUrl ? 'Perfil Otimizado' : 'Não configurado' },
        { label: 'SEO Estrutural', found: !!business.website, val: business.website ? 'Auditado' : 'Pendente' }
      ] : pdfAuditItems).map(c => `
      <div class="audit-item ${c.found ? 'ok' : 'bad'}" style="display: flex; align-items: center; justify-content: space-between; border-radius: 12px; padding: 12px 15px; border: 1px solid ${c.found ? '#dcfce7' : '#fee2e2'};">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="audit-icon" style="font-size: 18px;">
            ${c.found ? `
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ` : `
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            `}
          </div>
          <div>
            <div class="audit-label">${c.label}</div>
            <div class="audit-val">${c.val}</div>
          </div>
        </div>
        <div class="audit-badge ${c.found ? 'ok' : 'bad'}">${c.found ? 'OK' : 'Crítico'}</div>
      </div>`).join('')}
    </div>
  </div>

  <!-- PROBLEM / DIFFERENTIATION -->
  <div class="section">
    <div class="section-title">${isSite ? 'Análise Competitiva Web' : (isSandCourt ? 'Análise de Oportunidade SaaS' : (isHolistic ? 'Diferenciação e Valor Terapêutico' : 'Análise Competitiva e Diferenciação'))}</div>
    <div class="problem-box">
      <h3>${isSite ? `Por que a ${business.name} precisa de um site profissional hoje?` : (isSandCourt ? `Por que a ${business.name} precisa automatizar agora` : (isHolistic ? `Como elevar ${business.name} ao patamar de referência em ${business.city}?` : `Por que ${business.name} está perdendo autoridade para a concorrência?`))}</h3>
      ${isSite ? `
        <p>Atualmente, <strong>93% das jornadas de compra</strong> começam em um motor de busca. Se o seu site não carrega rápido ou não passa segurança, o cliente em ${business.city} simplesmente escolhe o próximo resultado.</p>
        <p>Ter um site profissional é o pilar básico da sua credibilidade digital. Sem ele, todos os seus outros esforços de marketing perdem eficiência.</p>
      ` : pdfProblemBody}
      <div class="problem-list" style="margin-top: 25px;">
        ${(isSite ? [
        'Aumento instantâneo na confiança do cliente',
        'Visibilidade orgânica no Google (SEO)',
        'Experiência perfeita em smartphones e tablets',
        'Canal de vendas próprio (livre de taxas de terceiros)'
      ] : pdfProblemList).map(item => `
        <div class="problem-item" style="display: flex; gap: 10px; margin-bottom: 12px; align-items: flex-start;">
          <div class="problem-bullet" style="color: #6366f1; font-weight: 900;">➔</div>
          <div class="problem-text"><strong>${item}</strong></div>
        </div>`).join('')}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${isSandCourt ? 'EFICIÊNCIA E PERFORMANCE DO NEGÓCIO' : '05. Especificações Técnicas Sugeridas'}</div>
    <div class="tiers">
      <div class="tier starter">
        <div class="medal" style="background-color: #fce7ba; border-color: #d97706; color: #d97706;">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
        <span class="tier-subtitle">ESSENCIAL</span>
        <div class="price-main">${pdfTiers.starter[0]}</div>
        <ul class="tier-list">
          ${pdfTiers.starter.slice(1).map(i => `<li>${i}</li>`).join('')}
        </ul>
      </div>
      <div class="tier pro" style="border: 2px solid #6366f1; transform: scale(1.05); z-index: 2; box-shadow: 0 20px 40px rgba(99,102,241,0.2);">
        <div class="medal" style="background-color: #e2e8f0; border-color: #64748b; color: #64748b;">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
        <span class="tier-subtitle" style="color: #6366f1;">AVANÇADO</span>
        <div class="price-main">${pdfTiers.pro[0]}</div>
        <ul class="tier-list">
          ${pdfTiers.pro.slice(1).map(i => `<li>${i}</li>`).join('')}
        </ul>
      </div>
      <div class="tier premium">
        <div class="medal" style="background-color: #fef08a; border-color: #eab308; color: #eab308;">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
        <span class="tier-subtitle">MASTER</span>
        <div class="price-main">${pdfTiers.premium[0]}</div>
        <ul class="tier-list">
          ${pdfTiers.premium.slice(1).map(i => `<li>${i}</li>`).join('')}
        </ul>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">TABELA COMPARATIVA DE RECURSOS</div>
    <div class="invest-wrap">
      <table class="invest-table">
        <thead>
          <tr><th style="text-align:left;">Funcionalidades</th><th>ESSENCIAL</th><th>AVANÇADO</th><th>MASTER</th></tr>
        </thead>
        <tbody>
          <tr><td style="text-align:left;">Agendamento pelo whatsapp</td><td><div class="check-circle">✓</div></td><td><div class="check-circle">✓</div></td><td><div class="check-circle">✓</div></td></tr>
          <tr><td style="text-align:left;">Informações de valores das aulas pelo whatsapp</td><td><div class="check-circle">✓</div></td><td><div class="check-circle">✓</div></td><td><div class="check-circle">✓</div></td></tr>
          <tr><td style="text-align:left;">1 Usuário</td><td><div class="check-circle">✓</div></td><td></td><td></td></tr>
          <tr><td style="text-align:left;">Notificação cliente por e-mail</td><td><div class="check-circle">✓</div></td><td><div class="check-circle">✓</div></td><td><div class="check-circle">✓</div></td></tr>
          <tr><td style="text-align:left;">Até 1 quadra</td><td><div class="check-circle">✓</div></td><td></td><td></td></tr>
          <tr><td style="text-align:left;">Receber sinal da reserva, quando o cliente efetua a reserva</td><td></td><td><div class="check-circle">✓</div></td><td><div class="check-circle">✓</div></td></tr>
          <tr><td style="text-align:left;">Receber por PIX</td><td></td><td><div class="check-circle">✓</div></td><td><div class="check-circle">✓</div></td></tr>
          <tr><td style="text-align:left;">2 Usuários</td><td></td><td><div class="check-circle">✓</div></td><td></td></tr>
          <tr><td style="text-align:left;">Acesso de funcionário pelo whatsapp(exportar horários)</td><td></td><td><div class="check-circle">✓</div></td><td><div class="check-circle">✓</div></td></tr>
          <tr><td style="text-align:left;">Até 4 quadras</td><td></td><td><div class="check-circle">✓</div></td><td></td></tr>
          <tr><td style="text-align:left;">Gestão de pagamentos</td><td></td><td><div class="check-circle">✓</div></td><td><div class="check-circle">✓</div></td></tr>
          <tr><td style="text-align:left;">Dashboard</td><td></td><td><div class="check-circle">✓</div></td><td><div class="check-circle">✓</div></td></tr>
          <tr><td style="text-align:left;">Receber com cartão de crédito</td><td></td><td></td><td><div class="check-circle">✓</div></td></tr>
          <tr><td style="text-align:left;">Gestão de day use(receber pagamento e funcionário listar pagos pelo próprio whatsapp)</td><td></td><td></td><td><div class="check-circle">✓</div></td></tr>
          <tr><td style="text-align:left;">10 Usuários</td><td></td><td></td><td><div class="check-circle">✓</div></td></tr>
          <tr><td style="text-align:left;">Notificar cliente pelo whatsapp perto da reserva</td><td></td><td></td><td><div class="check-circle">✓</div></td></tr>
          <tr><td style="text-align:left;">Gestão de aluno(cobrança, checking, turmas, alunos e acompanhamento)</td><td></td><td></td><td><div class="check-circle">✓</div></td></tr>
          <tr><td style="text-align:left;">Quadras ilimitadas</td><td></td><td></td><td><div class="check-circle">✓</div></td></tr>
          <tr><td style="text-align:left;">Suporte Premium 24/7</td><td></td><td></td><td><div class="check-circle">✓</div></td></tr>
          <tr><td style="text-align:left;">Relatórios de Desempenho</td><td></td><td></td><td><div class="check-circle">✓</div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="section">
    <div class="section-title">07. PRONTO PARA PROFISSIONALIZAR SUA ARENA?</div>
    <div style="margin: 30px 0; padding: 40px; background-color: #ffffff; border-radius: 20px; border: 2px dashed #6366f1; text-align: center; position: relative;">
      <div style="font-size: 50px; margin-bottom: 20px;">🚀</div>
      <h3 style="color: #0f172a; margin-bottom: 15px; font-size: 24px; font-weight: 900;">Pronto para profissionalizar sua Arena?</h3>
      <p style="font-size: 16px; color: #475569; margin-bottom: 25px;">Aproveite os <strong>10 dias de uso grátis</strong> e veja na prática como o ReservaAI pode transformar seu negócio.</p>
      <a href="https://reservaai.com.br" style="display: inline-block; background-color: #6366f1; color: #fff; padding: 18px 45px; border-radius: 50px; text-decoration: none; font-weight: 900; font-size: 16px; box-shadow: 0 10px 25px rgba(99,102,241,0.3);">RESERVAAI.COM.BR</a>
    </div>
  </div>

  <div class="section closing" style="border-bottom:none; padding-bottom: 80px;">
    <p style="font-size: 18px; color: #2C3639; line-height: 1.7; margin-bottom: 20px;">Ficamos à disposição para quaisquer esclarecimentos. Acreditamos que o <strong>Sistema ReservaAI</strong> é o diferencial que <strong>${business.name}</strong> precisa para se consolidar como referência.</p>
    <p style="font-size: 18px; color: #2C3639; line-height: 1.7; margin-bottom: 50px;">Atenciosamente,</p>
    
    <div class="sign-block">
      <div class="sign-name">${isSandCourt ? (pdfSellerName !== 'Equipe ReservaAI' ? pdfSellerName : 'Equipe ReservaAI') : pdfSellerName}</div>
      <div class="sign-title">ESPECIALISTA EM GESTÃO DE ARENAS</div>
      
      <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 20px;">
        ${pdfSellerInstagram ? `
          <div class="sign-contact-item">
            <div class="sign-contact-icon" style="background-color: #E1306C;"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></div>
            <span>Instagram: @${pdfSellerInstagram.replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, '')}</span>
          </div>
        ` : ''}
        ${pdfSellerWhatsapp ? `
          <div class="sign-contact-item">
            <div class="sign-contact-icon" style="background-color: #25D366;"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></div>
            <span>WhatsApp: ${pdfSellerWhatsapp}</span>
          </div>
        ` : ''}
        ${pdfSellerEmail ? `
          <div class="sign-contact-item">
            <div class="sign-contact-icon" style="background-color: #6366f1;"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></div>
            <span>Email: ${pdfSellerEmail}</span>
          </div>
        ` : ''}
        ${pdfSellerWebsiteSite || pdfSellerWebsite ? `
          <div class="sign-contact-item">
            <div class="sign-contact-icon" style="background-color: #0A1128;"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></div>
            <span>Site: ${pdfSellerWebsiteSite || pdfSellerWebsite}</span>
          </div>
        ` : ''}
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-left">
      <div class="footer-brand">
        ${pdfLogo ? `<img src="${pdfLogo}" crossOrigin="anonymous" width="60" height="30" style="height: 30px; object-fit: contain; margin-right: 10px; vertical-align: middle; filter: none !important;" />` : ''}
        <span>${isSite ? 'WebDesign' : 'ReservaAI'}</span>
      </div>
      <div class="footer-meta">${isSite ? 'Soluções Digitais e SEO de Alta Performance' : 'Sistema de Gestão de Quadras e Arenas Esportivas'}</div>
    </div>
    <div class="footer-right">
      <div class="footer-meta">Proposta Nº ${String(Date.now()).slice(-6)}</div>
      <div class="footer-meta" style="margin-top: 4px;">${date}</div>
    </div>
  </div>
</body>
</html>`;

    try {
      const iframe = document.createElement('iframe');
      // NUCLEAR FIX: Increased opacity and forced layout recognition
      iframe.style.cssText = 'position:fixed;top:0;left:-9999px;width:1024px;height:3500px;border:none;opacity:0.1;pointer-events:none;z-index:-1000;';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument!;
      doc.open();
      doc.write(currentHtml);
      doc.close();

      // NUCLEAR SYNC
      await new Promise((resolve) => {
        const checkReady = () => {
          if (doc.readyState === 'complete') {
            (iframe.contentWindow as any).document.fonts.ready.then(resolve);
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });

      // WAIT FOR IMAGES ATOMICALLY
      const imgs = Array.from(doc.images);
      await Promise.all(imgs.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      await new Promise(resolve => setTimeout(resolve, 4000));

      const iframeBody = doc.body;
      const totalHeight = Math.max(3000, iframeBody.scrollHeight);
      iframe.style.height = totalHeight + 'px';

      const canvas = await html2canvas(iframeBody, {
        scale: 2.2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: isHolistic ? '#F9F7F2' : '#ffffff',
        width: 1024,
        height: totalHeight,
        windowWidth: 1024,
        windowHeight: totalHeight,
        logging: false,
        onclone: (clonedDoc) => {
          // DEEP FIX: Clean up complex styles and force background behavior
          const styles = clonedDoc.createElement('style');
          styles.innerHTML = `
            * { transition: none !important; animation: none !important; box-shadow: none !important; background-repeat: no-repeat !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            img { image-rendering: -webkit-optimize-contrast !important; image-rendering: crisp-edges !important; }
            .cover-bg { background-color: ${isHolistic ? '#2C3639' : (isSandCourt ? '#0A1128' : '#0f172a')} !important; background-image: none !important; }
            .score-strip { background-color: ${isHolistic ? '#3E4A4D' : (isSandCourt ? '#ffffff' : '#0f172a')} !important; border-bottom: 3px solid #6366f1 !important; background-image: none !important; }
            .section-title::after { background-color: #cbd5e1 !important; background-image: none !important; }
          `;
          clonedDoc.head.appendChild(styles);
        }
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) throw new Error('Falha na renderização: Canvas inválido.');

      const mmWidth = 210;
      const mmHeight = (canvas.height * mmWidth) / canvas.width;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [mmWidth, mmHeight], compress: true });
      const imgData = canvas.toDataURL('image/jpeg', 0.90);
      pdf.addImage(imgData, 'JPEG', 0, 0, mmWidth, mmHeight, undefined, 'FAST');

      // Clickable links restoration
      const links = Array.from(doc.querySelectorAll('a')).map(a => {
        if (!a.id) a.id = `link-${Math.random().toString(36).substr(2, 9)}`;
        return { id: a.id, url: a.href };
      });

      links.forEach(link => {
        const element = doc.getElementById(link.id);
        if (element && link.url && !link.url.includes('null')) {
          const rect = element.getBoundingClientRect();
          const ratio = mmWidth / 1024;
          pdf.link(rect.left * ratio, rect.top * ratio, rect.width * ratio, rect.height * ratio, { url: link.url });
        }
      });

      const fileName = `Proposta_${isSite ? 'Site' : 'Sistema'}_${business.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
      document.body.removeChild(iframe);
      toast.success(`PDF de ${isSite ? 'Site' : 'Sistema'} gerado com sucesso!`, { id: toastId });
    } catch (err: any) {
      console.error(`Erro ao gerar PDF de ${type}:`, err);
      toast.error(`Erro ao gerar PDF: ${err.message}`, { id: toastId });
      const ex = document.querySelector(`iframe[style*="z-index:-1000"]`);
      if (ex) document.body.removeChild(ex);
    }
  };

  const handleGeneratePDF = () => {
    generatePDFInternal('system');
  };
  const handleGeneratePDFSite = () => setSiteModalOpen(true);

  const handleGenerateTelemetriaPDF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.loading("Resgatando Credenciais da Eletricom...", { id: "telemetria-cred" });

    let freshProfile: any = userProfile;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await (supabase as any).from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (data) {
          freshProfile = data;
          setUserProfile(data);
        }
      }
    } catch (err) {
      console.error("Profile fetch failed", err);
    }

    const freshSellerName = freshProfile?.full_name || 'Consultor Eletricom';
    const freshSellerWhatsapp = freshProfile?.whatsapp || '';
    toast.dismiss("telemetria-cred");

    generateTelemetriaPDF({
      business,
      sellerName: freshSellerName,
      sellerWhatsapp: freshSellerWhatsapp
    });
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
            <h3 className="text-lg font-bold text-slate-900 leading-tight truncate group-hover:text-blue-600 transition-colors" title={business.name}>
              {business.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-slate-500 text-xs">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{business.city}</span>
            </div>
          </div>

          <div className="shrink-0">
            <div className={cn(
              "w-12 h-12 rounded-xl border flex flex-col items-center justify-center shadow-sm",
              score >= 75 ? "bg-emerald-50 border-emerald-100" : score >= 40 ? "bg-amber-50 border-amber-100" : "bg-rose-50 border-rose-100"
            )}>
              <span className={cn("text-sm font-black tabular-nums",
                score >= 75 ? "text-emerald-600" : score >= 40 ? "text-amber-600" : "text-rose-600"
              )}>{score}%</span>
              <div className="w-6 h-0.5 bg-current opacity-20 mt-0.5 rounded-full" />
            </div>
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
          {business.website && (
            <button
              onClick={(e) => { e.stopPropagation(); handleAnalyzeSite(); }}
              disabled={isAnalyzingSite}
              className="text-[9px] font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50 flex items-center gap-1 transition-all"
            >
              {isAnalyzingSite ? (
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              ) : (
                <Zap className="w-2.5 h-2.5" />
              )}
              {isAnalyzingSite ? "Analisando..." : "Analisar Agora"}
            </button>
          )}
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
          {!isSavedView ? (
            <div className="flex flex-col gap-2">
              <Button
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-[11px] shadow-lg shadow-blue-200/50 rounded-xl gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerateScript(business, 'script');
                }}
              >
                <Zap className="w-4 h-4 fill-white" />
                Script de Abordagem IA
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-9 text-[10px] font-bold uppercase tracking-wider border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const { data: { user: currentUser } } = await supabase.auth.getUser();
                      if (!currentUser) throw new Error("Não logado");
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
                        meta_data: {
                          missingItems: business.missingItems,
                          foundItems: business.foundItems,
                          performanceScore: business.performanceScore,
                          isSecure: business.isSecure,
                          mobileFriendly: business.mobileFriendly
                        }
                      });
                      if (error) throw error;
                      toast.success("Lead Salvo!");
                    } catch (err: any) {
                      toast.error("Erro ao salvar.");
                    }
                  }}
                >
                  <Users className="w-3.5 h-3.5 mr-1" />
                  Salvar Radar
                </Button>
                <Button
                  variant="outline"
                  className="h-9 text-[10px] font-bold uppercase tracking-wider border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGeneratePDF();
                  }}
                >
                  <FileDown className="w-3.5 h-3.5 mr-1" />
                  Gerar Proposta
                </Button>
                <Button
                  variant="outline"
                  className="h-9 text-[10px] font-bold uppercase tracking-wider border-[#D4AF37]/30 bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10 text-[#B8860B] rounded-xl shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGeneratePDFSite();
                  }}
                >
                  <Zap className="w-3.5 h-3.5 mr-1" />
                  Alta Conversão
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold uppercase tracking-wider text-[11px] shadow-lg shadow-blue-200/50 rounded-xl gap-2 h-11"
                onClick={(e) => { e.stopPropagation(); onGenerateScript(business, 'battle_plan'); }}
              >
                <Target className="w-4 h-4" />
                Plano de Batalha IA
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 border-[#D4AF37]/30 bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10 text-[#B8860B] font-bold uppercase tracking-wider text-[10px] rounded-xl gap-2 shadow-sm"
                onClick={(e) => { e.stopPropagation(); handleGeneratePDFSite(); }}
              >
                <Sparkles className="w-4 h-4" />
                Proposta de Alta Conversão
              </Button>
              <div className="flex gap-2">
                <select
                  className="flex-1 h-9 rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-bold px-2 outline-none focus:ring-1 focus:ring-blue-400"
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
                  className="w-20 h-9 rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-bold px-3 outline-none focus:ring-1 focus:ring-blue-400"
                  placeholder="Ticket"
                  value={ticketValue || ""}
                  onChange={(e) => setTicketValue(Number(e.target.value))}
                  onBlur={async () => {
                    try {
                      await (supabase as any).from('leads').update({ ticket_medio: ticketValue }).eq('id', business.id);
                      toast.success("Ticket Atualizado!");
                    } catch (err) {
                      console.error('[BusinessCard] Falha ao atualizar ticket médio:', err);
                      toast.error("Erro ao salvar ticket.");
                    }
                  }}
                />
              </div>
            </>
          )}

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
