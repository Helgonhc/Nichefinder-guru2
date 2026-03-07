import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SearchForm } from "@/components/SearchForm";
import { BusinessCard } from "@/components/BusinessCard";
import { GeneratorModal } from "@/components/GeneratorModal";
import { Button } from "@/components/ui/button";
import { BusinessData, SearchParams, GeneratorType } from "@/types/business";
import { searchRawBusinesses, mapPlaceDetails } from "@/lib/placesService";
import { Radar, TrendingUp, Users, AlertTriangle, ChevronRight, Zap, Trash2, FileText, Download, Search } from "lucide-react";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth(); // Replaced navigate with useAuth hook
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessData | null>(null);
  const [modalType, setModalType] = useState<GeneratorType>('script');
  const [modalOpen, setModalOpen] = useState(false);
  const [lastSearch, setLastSearch] = useState<SearchParams | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [pendingRawPlaces, setPendingRawPlaces] = useState<any[]>([]);
  const [filterQuery, setFilterQuery] = useState("");

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) { // Modified to use user and authLoading
      navigate("/login");
    }
  }, [user, authLoading, navigate]); // Added user and authLoading to dependencies

  // Persistence: Load state on mount
  useEffect(() => {
    const savedBusinesses = localStorage.getItem('nichefinder_businesses');
    const savedLastSearch = localStorage.getItem('nichefinder_lastSearch');
    const savedNextPageToken = localStorage.getItem('nichefinder_nextPageToken');
    const savedPendingRawPlaces = localStorage.getItem('nichefinder_pendingRawPlaces');

    if (savedBusinesses) {
      try {
        setBusinesses(JSON.parse(savedBusinesses));
        setSearched(true);
      } catch (e) {
        console.error("Failed to parse saved businesses", e);
      }
    }

    if (savedPendingRawPlaces) {
      try {
        setPendingRawPlaces(JSON.parse(savedPendingRawPlaces));
      } catch (e) {
        console.error("Failed to parse pending raw places", e);
      }
    }

    if (savedLastSearch) {
      try {
        setLastSearch(JSON.parse(savedLastSearch));
      } catch (e) {
        console.error("Failed to parse saved last search", e);
      }
    }

    if (savedNextPageToken) {
      setNextPageToken(savedNextPageToken);
    }
  }, []);

  // Persistence: Save state on changes with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searched && businesses.length > 0) {
        localStorage.setItem('nichefinder_businesses', JSON.stringify(businesses));
      }
      if (lastSearch) {
        localStorage.setItem('nichefinder_lastSearch', JSON.stringify(lastSearch));
      }
      if (nextPageToken) {
        localStorage.setItem('nichefinder_nextPageToken', nextPageToken);
      } else {
        localStorage.removeItem('nichefinder_nextPageToken');
      }
      if (pendingRawPlaces.length > 0) {
        localStorage.setItem('nichefinder_pendingRawPlaces', JSON.stringify(pendingRawPlaces));
      } else {
        localStorage.removeItem('nichefinder_pendingRawPlaces');
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [businesses, searched, lastSearch, nextPageToken, pendingRawPlaces]);

  const handleSearch = async (params: SearchParams) => {
    setLoading(true);
    setSearched(false);
    setLastSearch(params);
    setNextPageToken(undefined); // Reset token on new search
    setPendingRawPlaces([]);

    // Clear previous persistence on new search start
    localStorage.removeItem('nichefinder_businesses');
    localStorage.removeItem('nichefinder_nextPageToken');
    localStorage.removeItem('nichefinder_pendingRawPlaces');

    try {
      const { rawResults, nextPageToken } = await searchRawBusinesses(params.niche, params.city);

      // Process only first 10 immediately, keep rest pending
      const head = rawResults.slice(0, 10);
      const tail = rawResults.slice(10);

      const enrichedResults = await mapPlaceDetails(head, params.niche, params.city);

      setPendingRawPlaces(tail);
      setBusinesses(prev => {
        const combined = enrichedResults;
        const unique = combined.filter((item, index, self) =>
          index === self.findIndex((t) => t.id === item.id)
        );
        return unique;
      });
      setNextPageToken(nextPageToken);
      setSearched(true);
    } catch (error: any) {
      toast.error(error.message || "Erro ao buscar empresas reais.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    localStorage.removeItem('nichefinder_businesses');
    localStorage.removeItem('nichefinder_lastSearch');
    localStorage.removeItem('nichefinder_nextPageToken');
    localStorage.removeItem('nichefinder_pendingRawPlaces');
    setBusinesses([]);
    setPendingRawPlaces([]);
    setSearched(false);
    setLastSearch(null);
    setNextPageToken(undefined);
    toast.success('Pesquisa limpa!');
  };

  const handleLoadMore = async () => {
    if (!lastSearch) return;

    if (pendingRawPlaces.length === 0 && !nextPageToken) {
      toast.info("Todos os estabelecimentos para essa busca já foram carregados pelo Google.");
      return;
    }

    setLoading(true);
    try {
      if (pendingRawPlaces.length > 0) {
        // Enforce 10 processing limit from in-memory raw buffer
        const head = pendingRawPlaces.slice(0, 10);
        const tail = pendingRawPlaces.slice(10);

        const enrichedResults = await mapPlaceDetails(head, lastSearch.niche, lastSearch.city);

        setPendingRawPlaces(tail);
        setBusinesses(prev => {
          const combined = [...prev, ...enrichedResults];
          const unique = combined.filter((item, index, self) =>
            index === self.findIndex((t) => t.id === item.id)
          );
          return unique;
        });
      } else if (nextPageToken) {
        // Hit real Google Maps endpoint for next 20 places chunk
        const { rawResults, nextPageToken: newToken } = await searchRawBusinesses(lastSearch.niche, lastSearch.city, nextPageToken);

        const head = rawResults.slice(0, 10);
        const tail = rawResults.slice(10);

        const enrichedResults = await mapPlaceDetails(head, lastSearch.niche, lastSearch.city);

        setPendingRawPlaces(tail);
        setBusinesses(prev => {
          const combined = [...prev, ...enrichedResults];
          const unique = combined.filter((item, index, self) =>
            index === self.findIndex((t) => t.id === item.id)
          );
          return unique;
        });
        setNextPageToken(newToken);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar mais resultados: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateScript = (business: BusinessData, type: GeneratorType = 'script') => {
    setSelectedBusiness(business);
    setModalType(type);
    setModalOpen(true);
  };

  const handleGeneratePrompt = (business: BusinessData) => {
    setSelectedBusiness(business);
    setModalType('prompt');
    setModalOpen(true);
  };

  const handleExportXLS = () => {
    if (businesses.length === 0) return;

    const headers = ["Nome", "Nicho", "Site", "Cidade", "WhatsApp", "Instagram", "Score", "Website"];
    const rows = businesses.map(b => [
      b.name,
      b.niche,
      b.urlSite || b.website || "",
      b.city,
      b.whatsapp || "",
      b.instagram || "",
      b.presenceScore,
      b.website ? "Sim" : "Não"
    ]);

    const content = [headers, ...rows].map(e => e.join("\t")).join("\n");
    const blob = new Blob([content], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_radar_${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Leads exportados para XLS!");
  };

  const handleExportPDF = async () => {
    // 1. Filtragem Inteligente: Apenas leads com telefone/whatsapp
    const qualifiedLeads = businesses.filter(b =>
      b.phone || b.whatsapp
    );

    if (qualifiedLeads.length === 0) {
      toast.error("Nenhum lead com telefone encontrado para exportar.");
      return;
    }

    const toastId = "pdf-export-radar";
    toast.loading("Organizando Relatório Técnico...", { id: toastId });

    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;
      const contentWidth = pageWidth - (margin * 2);
      let currY = 15;

      // Configuração de Colunas (Grid)
      const cols = {
        name: { x: margin + 2, w: 75 },
        niche: { x: margin + 79, w: 55 },
        contact: { x: margin + 136, w: 50 }
      };

      // Helper: Desenhar Célula com Truncamento
      const drawCell = (text: string, x: number, y: number, w: number, align: 'left' | 'center' = 'left', bold = false) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        const truncated = doc.splitTextToSize(text || "N/A", w - 4);
        doc.text(truncated[0], align === 'center' ? x + (w / 2) : x, y, { align });
      };

      const checkNewPage = (neededHeight: number) => {
        if (currY + neededHeight > pageHeight - 15) {
          doc.addPage();
          currY = 15;
          drawHeader();
          return true;
        }
        return false;
      };

      const drawHeader = () => {
        doc.setFillColor(15, 23, 42); // Slate-900
        doc.rect(margin, currY, contentWidth, 22, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("AUDITORIA TÉCNICA DE LEADS", margin + 6, currY + 10);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text("PRECISION SCAN · RADAR ENGINE V4.2", margin + 6, currY + 16);

        const dateStr = new Date().toLocaleDateString('pt-BR');
        doc.setTextColor(255, 255, 255);
        doc.text(`EMISSÃO: ${dateStr}`, margin + contentWidth - 6, currY + 10, { align: 'right' });
        doc.text(`${qualifiedLeads.length} LEADS QUALIFICADOS`, margin + contentWidth - 6, currY + 16, { align: 'right' });

        currY += 22;
      };

      // Início do Documento
      drawHeader();
      currY += 5;

      // Cabeçalho da Tabela
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.rect(margin, currY, contentWidth, 9, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      drawCell("EMPRESA / SITE", cols.name.x, currY + 6, cols.name.w, 'left', true);
      drawCell("NICHO / LOCALIDADE", cols.niche.x, currY + 6, cols.niche.w, 'left', true);
      drawCell("CONTATOS DIRETOS", cols.contact.x, currY + 6, cols.contact.w, 'left', true);

      currY += 9;

      // Linhas dos Leads
      qualifiedLeads.forEach((b, i) => {
        const rowHeight = 16;
        checkNewPage(rowHeight);

        // Zebra Striping
        if (i % 2 === 1) {
          doc.setFillColor(248, 250, 252); // Slate-50
          doc.rect(margin, currY, contentWidth, rowHeight, 'F');
        }

        // Linha Divisória
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.1);
        doc.line(margin, currY + rowHeight, margin + contentWidth, currY + rowHeight);

        // Col 1: Empresa
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(9);
        drawCell(b.name, cols.name.x, currY + 6, cols.name.w, 'left', true);

        let subY = currY + 11;
        if (b.instagram) {
          // Sanitização robusta do Instagram
          let instaValue = b.instagram.trim();
          let displayHandle = instaValue.replace(/https?:\/\/(www\.)?instagram\.com\//, '').replace('@', '').replace(/\/$/, '');
          let finalUrl = instaValue.startsWith('http') ? instaValue : `https://instagram.com/${displayHandle}`;

          doc.setTextColor(79, 70, 229); // Indigo para link
          doc.setFontSize(7);
          doc.text(`@${displayHandle}`, cols.name.x, subY);

          // Adiciona Link Clicável
          const textWidth = doc.getTextWidth(`@${displayHandle}`);
          doc.link(cols.name.x, subY - 3, textWidth, 4, { url: finalUrl });
          subY += 4;
        }

        if (b.website || b.urlSite) {
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(7);
          drawCell(b.website || b.urlSite || "", cols.name.x, subY, cols.name.w);
        }

        // Col 2: Nicho
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(8);
        drawCell(b.niche, cols.niche.x, currY + 6, cols.niche.w);
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7);
        drawCell(b.city, cols.niche.x, currY + 11, cols.niche.w);

        // Col 3: Contatos
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(7.5);
        let cY = currY + 6;
        if (b.phone || b.whatsapp) {
          drawCell(`TEL: ${b.phone || b.whatsapp}`, cols.contact.x, cY, cols.contact.w);
        }

        currY += rowHeight;
      });

      // Rodapé
      currY += 10;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, currY, margin + contentWidth, currY);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(6);
      doc.text(`RELATÓRIO GERADO POR LEADRADAR · PÁGINA ${doc.internal.pages.length - 1}`, pageWidth / 2, currY + 6, { align: 'center' });

      doc.save(`auditoria_leads_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Relatório organizado gerado com sucesso!", { id: toastId });
    } catch (error: any) {
      console.error("Erro na exportação PDF:", error);
      toast.error("Erro ao organizar PDF: " + error.message, { id: toastId });
    }
  };

  const stats = searched
    ? {
      total: businesses.length,
      withSite: businesses.filter((b) => b.website).length,
      withoutSite: businesses.filter((b) => !b.website).length,
      avgScore: Math.round(businesses.reduce((s, b) => s + b.presenceScore, 0) / (businesses.length || 1)),
    }
    : null;

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-12 max-w-7xl relative">
      <div className="mb-8 sm:mb-12 text-center">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3 sm:mb-4 tracking-tight">
          Encontramos o próximo cliente
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto px-2">
          Escaneie qualquer nicho e cidade para identificar empresas com falhas digitais e gere argumentos de venda automáticos.
        </p>
      </div>

      {/* Feature pills */}
      <div className="flex overflow-x-auto pb-4 sm:pb-0 sm:flex-wrap justify-start sm:justify-center gap-2 sm:gap-3 mt-4 sm:mt-8 mb-8 sm:mb-10 no-scrollbar">
        {[
          { icon: '🌐', text: 'Site' },
          { icon: '📸', text: 'Instagram' },
          { icon: '💬', text: 'WhatsApp' },
          { icon: '📍', text: 'GMN' },
          { icon: '📝', text: 'IA Script' },
          { icon: '🤖', text: 'IA Web' },
        ].map((f) => (
          <span
            key={f.text}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-slate-600 text-[10px] sm:text-xs border border-slate-100 shadow-sm whitespace-nowrap active:scale-95 transition-transform"
          >
            <span className="text-sm">{f.icon}</span>
            <span className="font-bold uppercase tracking-tight">{f.text}</span>
          </span>
        ))}
      </div>

      {/* Search Card */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 sm:p-6 mb-6 transition-all">
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100/50">
            <Radar className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base tracking-tight">Nova varredura radar</h3>
        </div>
        <SearchForm onSearch={handleSearch} loading={loading} />
      </div>

      {/* Loading State */}
      {loading && !searched && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-muted-foreground text-[12px] sm:text-sm px-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
            {`Escaneando presença digital em ${lastSearch?.city || 'sua região'}...`}
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-glass rounded-2xl p-5 h-40 skeleton-shimmer" />
          ))}
        </div>
      )}

      {/* Stats */}
      {searched && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Encontradas', value: stats.total, icon: Users, color: 'text-blue-600' },
            { label: 'Com site', value: stats.withSite, icon: TrendingUp, color: 'text-green-600' },
            { label: 'Sem site', value: stats.withoutSite, icon: AlertTriangle, color: 'text-amber-500' },
            { label: 'Score médio', value: `${stats.avgScore}%`, icon: Radar, color: 'text-blue-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 text-center hover:scale-[1.02] transition-transform">
              <s.icon className={`w-4 h-4 mx-auto mb-1.5 ${s.color}`} />
              <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-tight text-slate-400 mt-0.5 truncate">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {searched && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="font-display font-semibold text-foreground text-base sm:text-lg">
              {businesses.length} resultados
              <span className="text-muted-foreground font-normal text-xs sm:text-sm ml-2">
                — por oportunidade
              </span>
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 text-[11px] sm:text-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar Lista
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3 items-stretch sm:items-center">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportXLS}
                className="flex-1 sm:flex-none gap-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all h-10 sm:h-9 text-xs"
              >
                <Download className="w-4 h-4 text-primary" />
                XLS
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="flex-1 sm:flex-none gap-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all h-10 sm:h-9 text-xs"
              >
                <FileText className="w-4 h-4 text-primary" />
                PDF
              </Button>
            </div>

            <div className="relative flex-1 min-w-[200px] w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filtrar por nome ou endereço..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full h-10 sm:h-9 pl-9 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {businesses
              .filter(b =>
                b.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
                b.address.toLowerCase().includes(filterQuery.toLowerCase())
              )
              .sort((a, b) => a.presenceScore - b.presenceScore)
              .map((business, i) => (
                <BusinessCard
                  key={business.id ? `lead-${business.id}-${i}` : `search-${i}-${business.name}`}
                  business={business}
                  index={i}
                  onGenerateScript={handleGenerateScript}
                  onGeneratePrompt={handleGeneratePrompt}
                  onUpdateBusiness={(updatedLead) => {
                    setBusinesses(prev => prev.map((b, idx) => (b.id && b.id === updatedLead.id) || idx === i ? updatedLead : b));
                  }}
                />
              ))}
          </div>

          {/* Load More Button */}
          {businesses.length > 0 && (
            <div className="py-8 flex justify-center">
              <Button
                onClick={handleLoadMore}
                disabled={loading}
                variant="outline"
                className="min-w-[200px] gap-2 h-11 sm:h-10"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    Carregar mais resultados
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Loading indication for pagination */}
      {loading && searched && (
        <div className="mt-4 space-y-4 pb-10">
          {[1, 2].map((i) => (
            <div key={i} className="card-glass rounded-2xl p-5 h-40 skeleton-shimmer opacity-50" />
          ))}
        </div>
      )}

      <GeneratorModal
        business={selectedBusiness}
        type={modalType}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default Index;
