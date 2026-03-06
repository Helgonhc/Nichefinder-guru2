import { useState, useEffect } from "react";
import { NICHES, SearchParams } from "@/types/business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  loading: boolean;
}

export function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [niche, setNiche] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const [city, setCity] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };
    getUser();
  }, []);

  const filteredNiches = NICHES.filter(n => {
    if (n.value === 'terapias_holisticas') {
      return userEmail === 'junioemanuel38@gmail.com' || userEmail === 'helgonhc19@yahoo.com.br';
    }
    if (['telemetria', 'condominio_logistico', 'condominio_residencial', 'shopping_center', 'edificio_comercial', 'rede_varejo', 'industria_infra'].includes(n.value)) {
      return userEmail === 'junioemanuel38@gmail.com' || userEmail === 'helgonhc19@yahoo.com.br' || userEmail === 'operacaomg@eletricom.me';
    }
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche || !city) return;

    // Find the keyword for the selected niche
    const selectedNicheObj = NICHES.find(n => n.value === niche);
    let searchTerm = niche;

    if (niche === 'outro' && customNiche) {
      searchTerm = customNiche;
    } else if (selectedNicheObj?.keyword) {
      searchTerm = selectedNicheObj.keyword;
    }

    onSearch({ niche: searchTerm, city, customNiche: customNiche || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-4 w-full">
      <div className="grid gap-5 md:gap-4 grid-cols-1 md:grid-cols-2">
        <div className="space-y-2.5 sm:space-y-2">
          <Label className="text-sm text-muted-foreground font-medium ml-1 sm:ml-0">Nicho / Segmento</Label>
          <Select value={niche} onValueChange={setNiche}>
            <SelectTrigger className="bg-slate-50 border-slate-200 h-14 sm:h-11 rounded-xl sm:rounded-md text-base sm:text-sm px-4 focus:ring-primary/20 transition-all">
              <SelectValue placeholder="Selecione o nicho..." />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 rounded-xl sm:rounded-md shadow-xl">
              {filteredNiches.map((n) => (
                <SelectItem key={n.value} value={n.value} className="hover:bg-secondary text-base sm:text-sm py-3 sm:py-1.5 focus:bg-primary/20">
                  {n.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2.5 sm:space-y-2">
          <Label className="text-sm text-muted-foreground font-medium ml-1 sm:ml-0 flex items-center">
            <MapPin className="w-4 h-4 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-1" />
            Cidade
          </Label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex: São Paulo, SP"
            className="bg-slate-50 border-slate-200 h-14 sm:h-11 rounded-xl sm:rounded-md text-base sm:text-sm px-4 focus:ring-primary/20 transition-all"
            required
          />
        </div>
      </div>

      {niche === 'outro' && (
        <div className="space-y-2.5 sm:space-y-2">
          <Label className="text-sm text-muted-foreground font-medium ml-1 sm:ml-0">Nicho personalizado</Label>
          <Input
            value={customNiche}
            onChange={(e) => setCustomNiche(e.target.value)}
            placeholder="Ex: clínica veterinária, escola de idiomas..."
            className="bg-slate-50 border-slate-200 h-14 sm:h-11 rounded-xl sm:rounded-md text-base sm:text-sm px-4 focus:ring-primary/20 transition-all"
          />
        </div>
      )}

      <Button
        type="submit"
        disabled={!niche || !city || (niche === 'outro' && !customNiche) || loading}
        className="w-full h-14 sm:h-12 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-base sm:text-base hover:shadow-blue-500/20 hover:scale-[1.02] transition-all rounded-xl shadow-lg shadow-blue-500/10 mt-2 active:scale-[0.98]"
      >
        {loading ? (
          <>
            <Zap className="w-5 h-5 sm:w-4 sm:h-4 animate-pulse" />
            {['telemetria', 'condominio_logistico', 'condominio_residencial', 'shopping_center', 'edificio_comercial', 'rede_varejo', 'industria_infra'].includes(niche) ? 'Mapeando Infra...' : 'Escaneando...'}
          </>
        ) : (
          <>
            <Search className="w-5 h-5 sm:w-4 sm:h-4" />
            {['telemetria', 'condominio_logistico', 'condominio_residencial', 'shopping_center', 'edificio_comercial', 'rede_varejo', 'industria_infra'].includes(niche) ? 'Mapear Infraestrutura' : 'Escanear Presença Digital'}
          </>
        )}
      </Button>
    </form>
  );
}
