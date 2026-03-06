import { useState, useEffect } from "react";
import { BusinessData, GeneratorType } from "@/types/business";
import { generateContent } from "@/lib/aiService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Loader2, Sparkles, RefreshCw, MessageSquare, ShieldAlert, Zap, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface GeneratorModalProps {
  business: BusinessData | null;
  type: GeneratorType; open: boolean;
  onClose: () => void;
}

const OBJECTIONS = [
  { id: 'no_money', label: '💸 "Não tenho dinheiro"' },
  { id: 'already_have', label: '🤝 "Já tenho alguém"' },
  { id: 'not_interested', label: '😐 "Não tenho interesse"' },
  { id: 'think_about', label: '🤔 "Vou pensar..."' },
  { id: 'no_time', label: '⏰ "Não tenho tempo agora"' },
  { id: 'too_expensive', label: '💰 "Está muito caro"' },
];

export function GeneratorModal({ business, type: initialType, open, onClose }: GeneratorModalProps) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeType, setActiveType] = useState<GeneratorType | 'objections'>(initialType);
  const [selectedObjection, setSelectedObjection] = useState<string>('');
  const [customObjection, setCustomObjection] = useState<string>('');
  const { toast } = useToast();
  const [userName, setUserName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');

  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Você';
      let finalName = name;
      if (name.toLowerCase().includes('helgon') || name === 'helgonhc19') finalName = 'Helgon';
      if (name.toLowerCase().includes('junio')) finalName = 'Júnio';
      setUserName(finalName);

      if (profile?.full_name) {
        let profName = profile.full_name;
        if (profName.toLowerCase().includes('helgon')) profName = 'Helgon';
        if (profName.toLowerCase().includes('junio')) profName = 'Júnio';
        setUserName(profName);
      }
      if (profile?.contact_email) setContactEmail(profile.contact_email);
    }
  }, [user, profile]);

  // Update active type when prop changes & reset state
  useEffect(() => {
    if (open && business) {
      setActiveType(initialType);
      setSelectedObjection('');
      setCustomObjection('');
      setContent('');
      generate(initialType);
    }
  }, [initialType, business, open]);

  const generate = async (typeOverride?: GeneratorType | 'objections', objectionId?: string) => {
    if (!business) return;
    const currentType = typeOverride || activeType;
    setLoading(true);
    setContent('');

    try {
      const data = await generateContent(business, currentType as GeneratorType, userName, objectionId || selectedObjection, contactEmail);
      setContent(data.content || '');
    } catch (error: any) {
      console.error('Error generating content:', error);
      toast({
        title: "Erro ao gerar",
        description: `Erro: ${error.message || error.toString()}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copiado!", description: "Conteúdo copiado para a área de transferência." });
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && business) {
      setActiveType(initialType);
      setSelectedObjection('');
      setContent('');
      generate(initialType);
    }
    if (!isOpen) {
      setContent('');
      onClose();
    }
  };

  const handleTabChange = (val: string) => {
    const newType = val as GeneratorType | 'objections';
    setActiveType(newType);
    setContent('');
    setSelectedObjection('');
    setCustomObjection('');
    if (newType !== 'objections') {
      generate(newType);
    }
  };

  const handleObjectionSelect = (objId: string) => {
    setSelectedObjection(objId);
    generate('objections', objId);
  };

  const ContentArea = () => {
    if (activeType === 'objections' && !selectedObjection) {
      return (
        <div className="space-y-3 pt-2">
          <p className="text-sm text-muted-foreground text-center mb-4">
            Qual objeção o cliente usou? Escolha para gerar a resposta ideal:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {OBJECTIONS.map((obj) => (
              <button
                key={obj.id}
                onClick={() => handleObjectionSelect(obj.id)}
                className="text-left px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 hover:shadow-sm transition-all text-sm font-bold text-slate-700"
              >
                {obj.label}
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">✍️ Ou escreva o que o cliente disse:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customObjection}
                onChange={(e) => setCustomObjection(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && customObjection.trim() && handleObjectionSelect('custom:' + customObjection.trim())}
                placeholder='Ex: "Já tentei isso antes e não funcionou"'
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
              <button
                onClick={() => customObjection.trim() && handleObjectionSelect('custom:' + customObjection.trim())}
                disabled={!customObjection.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Gerar
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Aguarde, a IA está analisando...</p>
        </div>
      );
    }

    if (content) {
      return (
        <div className="space-y-4 pt-2">
          {activeType === 'objections' && selectedObjection && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSelectedObjection(''); setContent(''); }}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                ← Escolher outra objeção
              </button>
              <span className="text-xs text-muted-foreground">|</span>
              <span className="text-xs font-medium text-foreground">
                {selectedObjection.startsWith('custom:')
                  ? `"${selectedObjection.replace('custom:', '')}"`
                  : OBJECTIONS.find(o => o.id === selectedObjection)?.label}
              </span>
            </div>
          )}
          <div className="relative bg-slate-50/50 rounded-xl p-4 border border-slate-100 max-h-80 overflow-y-auto scrollbar-thin">
            <pre className="text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
              {content}
            </pre>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => generate()}>
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerar
            </Button>
            <Button className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-blue-500/10" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
            {business?.phone && (
              <Button
                variant="outline"
                className="gap-2 border-success/30 text-success hover:bg-success/10"
                onClick={() => {
                  const phone = business.phone?.replace(/\D/g, '');
                  const message = encodeURIComponent(content);
                  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                }}
              >
                <MessageSquare className="w-4 h-4" />
                Enviar
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Button onClick={() => generate()} className="gap-2 bg-gradient-primary text-primary-foreground">
          <Sparkles className="w-4 h-4" />
          Gerar Inteligência
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-2xl bg-white border-slate-200 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Inteligência de Vendas
          </DialogTitle>
          {business && (
            <p className="text-sm text-muted-foreground">
              Analisando: <span className="text-foreground font-medium">{business.name}</span>
            </p>
          )}
        </DialogHeader>

        <Tabs value={activeType} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-slate-50 border border-slate-100 p-1 mb-4 h-10">
            <TabsTrigger value="script" className="text-[10px] sm:text-[11px]">Script</TabsTrigger>
            <TabsTrigger value="battle_plan" className="text-[10px] sm:text-[11px] font-black text-primary flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Batalha
            </TabsTrigger>
            <TabsTrigger value="xeque_mate" className="text-[10px] sm:text-[11px] font-black text-orange-500 flex items-center gap-1">
              <Target className="w-3 h-3" />
              Mate
            </TabsTrigger>
            <TabsTrigger value="objections" className="text-[10px] sm:text-[11px] flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              Objeções
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-[10px] sm:text-[11px]">Análise</TabsTrigger>
            <TabsTrigger value="design" className="text-[10px] sm:text-[11px]">Visual</TabsTrigger>
          </TabsList>

          <div className="min-h-[300px] flex flex-col">
            <ContentArea />
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
