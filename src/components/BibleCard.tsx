import { useState, useEffect, useRef } from "react";
import { BookOpen, Quote } from "lucide-react";
import { getRandomVerse, BibleVerse } from "@/lib/bibleVerses";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface BibleCardProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: '3d' | 'minimal';
}

export function BibleCard({ className, size = 'md', variant = '3d' }: BibleCardProps) {
    const [prevVerse, setPrevVerse] = useState<BibleVerse | null>(null);
    const [currentVerse, setCurrentVerse] = useState<BibleVerse | null>(null);
    const [nextVerse, setNextVerse] = useState<BibleVerse | null>(null);
    const [isFlipping, setIsFlipping] = useState(false);
    const [isMinimalTransition, setIsMinimalTransition] = useState(false);
    const [canMeditate, setCanMeditate] = useState(false);

    const versesRef = useRef({ prevVerse, currentVerse, nextVerse });

    useEffect(() => {
        versesRef.current = { prevVerse, currentVerse, nextVerse };
    }, [prevVerse, currentVerse, nextVerse]);

    useEffect(() => {
        // Check for personalized meditation mode
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.email === 'helgonhc19@yahoo.com.br') {
                setCanMeditate(true);
            }
        });

        // Initial Setup
        const v1 = getRandomVerse();
        const v2 = getRandomVerse();
        setCurrentVerse(v1);
        setNextVerse(v2);

        const interval = setInterval(() => {
            if (variant === '3d') {
                setIsFlipping(true);
                setTimeout(() => {
                    const refs = versesRef.current;
                    setPrevVerse(refs.currentVerse);
                    setCurrentVerse(refs.nextVerse);
                    setNextVerse(getRandomVerse());
                    setIsFlipping(false);
                }, 1200);
            } else {
                setIsMinimalTransition(true);
                setTimeout(() => {
                    const refs = versesRef.current;
                    setPrevVerse(refs.currentVerse);
                    setCurrentVerse(refs.nextVerse);
                    setNextVerse(getRandomVerse());

                    setTimeout(() => {
                        setIsMinimalTransition(false);
                    }, 50);
                }, 500);
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [variant]);

    const handleMeditation = (verse: BibleVerse | null) => {
        if (canMeditate && verse?.fullUrl) {
            window.open(verse.fullUrl, '_blank');
        }
    };

    if (!currentVerse) return null;

    const isSmall = size === 'sm';

    // --- MINIMAL VARIANT (App Content) ---
    if (variant === 'minimal') {
        return (
            <div
                onClick={() => handleMeditation(currentVerse)}
                className={cn(
                    "relative rounded-xl border border-primary/10 bg-primary/[0.02] p-4 backdrop-blur-sm transition-all duration-1000",
                    isMinimalTransition ? "opacity-40 scale-[0.98]" : "opacity-100 scale-100",
                    canMeditate && "cursor-pointer hover:bg-primary/[0.05] hover:border-primary/30 group",
                    className
                )}
            >
                <div className="flex items-center gap-2 mb-2 opacity-40 group-hover:opacity-60 transition-opacity">
                    <Quote className="w-3 h-3 text-primary" />
                    <span className="text-[9px] uppercase font-black tracking-widest text-primary">Inspirar</span>
                    {canMeditate && (
                        <span className="ml-auto text-[7px] text-primary/40 uppercase font-black tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Meditar no Capítulo</span>
                    )}
                </div>

                <div className="custom-scrollbar overflow-y-auto max-h-[120px] pr-2">
                    <p className="text-slate-700 italic font-serif leading-relaxed text-xs">
                        "{currentVerse.text}"
                    </p>
                    <p className="text-blue-600 font-bold mt-2 text-[10px]">
                        — {currentVerse.reference}
                    </p>
                </div>

                <div className="absolute top-0 right-0 p-2 opacity-[0.03]">
                    <BookOpen className="w-8 h-8 text-blue-900" />
                </div>
            </div>
        );
    }

    // --- 3D VARIANT (Login Wow Factor) ---
    return (
        <div className={cn("perspective-2000 relative select-none flex justify-center", className)}>
            <div
                onClick={() => !isFlipping && handleMeditation(currentVerse)}
                className={cn(
                    "relative flex preserve-3d transition-all duration-700",
                    isSmall ? "w-[200px] h-[140px]" : "w-[560px] h-[320px]",
                    canMeditate && !isFlipping && "cursor-pointer"
                )}
            >

                {/* LEFT PAGE (Static - The PREVIOUS Verse) */}
                <div
                    onClick={(e) => {
                        if (canMeditate && prevVerse) {
                            e.stopPropagation();
                            handleMeditation(prevVerse);
                        }
                    }}
                    className={cn(
                        "w-1/2 h-full bg-gradient-to-l from-card/80 to-background border-y border-l border-primary/20 relative overflow-hidden flex flex-col justify-center",
                        isSmall ? "p-3" : "p-6",
                        "shadow-[inset_-10px_0_20px_rgba(0,0,0,0.5)] transition-all duration-300",
                        canMeditate && prevVerse && "hover:from-white/5 transition-colors group/left"
                    )}
                >
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper.png')]" />

                    <div className={cn(
                        "relative z-10 transition-all duration-700",
                        prevVerse ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                    )}>
                        {prevVerse ? (
                            <>
                                <div className="flex items-center gap-2 mb-2 opacity-30 group-hover/left:opacity-50 transition-opacity">
                                    <BookOpen className="w-3 h-3 text-primary" />
                                    <span className="text-[8px] uppercase font-black tracking-widest text-primary">Anterior</span>
                                    {canMeditate && (
                                        <span className="ml-auto text-[6px] text-primary/40 uppercase font-black opacity-0 group-hover/left:opacity-100 transition-opacity">Meditar</span>
                                    )}
                                </div>
                                <div className={cn("overflow-y-auto custom-scrollbar pr-2", isSmall ? "max-h-[100px]" : "max-h-[180px]")}>
                                    <p className={cn("text-white/40 italic font-serif leading-relaxed", isSmall ? "text-[9px]" : "text-sm")}>
                                        "{prevVerse.text}"
                                    </p>
                                    <p className={cn("text-primary/30 font-bold mt-1", isSmall ? "text-[8px]" : "text-[10px]")}>
                                        — {prevVerse.reference}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full opacity-10">
                                <BookOpen className={isSmall ? "w-6 h-6" : "w-12 h-12"} />
                                <span className="text-[9px] uppercase font-black mt-2 tracking-widest">Iniciando...</span>
                            </div>
                        )}
                    </div>
                    <div className="absolute left-1 top-1 bottom-1 w-px bg-white/5 opacity-50" />
                </div>

                {/* RIGHT PAGE (Static Bottom - The NEXT Verse) */}
                <div className={cn(
                    "w-1/2 h-full bg-gradient-to-r from-card/80 to-background border-y border-r border-primary/20 relative overflow-hidden flex flex-col justify-center",
                    isSmall ? "p-3" : "p-6",
                    "shadow-[inset_10px_0_20px_rgba(0,0,0,0.5)] transition-all duration-300"
                )}>
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper.png')]" />
                    <div className={cn("relative z-0 opacity-100 overflow-y-auto custom-scrollbar pr-2", isSmall ? "max-h-[80px]" : "max-h-[180px]")}>
                        <div className="flex items-center gap-2 mb-3 opacity-40">
                            <Quote className="w-3 h-3 text-primary" />
                            <span className="text-[8px] uppercase font-black tracking-widest text-primary">Inspirar</span>
                        </div>
                        <p className={cn("text-white/90 italic font-serif leading-relaxed", isSmall ? "text-[10px]" : "text-base")}>
                            "{nextVerse?.text}"
                        </p>
                        <p className={cn("text-primary/70 font-bold mt-2", isSmall ? "text-[9px]" : "text-xs")}>
                            — {nextVerse?.reference}
                        </p>
                    </div>
                </div>

                {/* THE FLIPPING LEAF */}
                <div className={cn(
                    "absolute right-0 top-0 w-1/2 h-full preserve-3d z-30 transition-none",
                    isFlipping && "animate-leaf-turn"
                )}>
                    {/* FRONT */}
                    <div className={cn(
                        "absolute inset-0 backface-hidden bg-gradient-to-r from-card/80 to-background border-y border-r border-primary/20 flex flex-col justify-center",
                        isSmall ? "p-3" : "p-6",
                        "shadow-[inset_10px_0_20px_rgba(0,0,0,0.5)]"
                    )}>
                        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper.png')]" />
                        <div className={cn("relative z-10 overflow-y-auto custom-scrollbar pr-2", isSmall ? "max-h-[80px]" : "max-h-[180px]")}>
                            <div className="flex items-center gap-2 mb-3 opacity-40">
                                <Quote className="w-3 h-3 text-primary" />
                                <span className="text-[8px] uppercase font-black tracking-widest text-primary">Momento de Inspiração</span>
                            </div>
                            <p className={cn("text-white italic font-serif leading-relaxed", isSmall ? "text-[10px]" : "text-base")}>
                                "{currentVerse.text}"
                            </p>
                            <p className={cn("text-primary font-bold mt-2", isSmall ? "text-[9px]" : "text-xs")}>
                                — {currentVerse.reference}
                            </p>
                        </div>
                    </div>

                    {/* BACK */}
                    <div className={cn(
                        "absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-l from-card/80 to-background border-y border-l border-primary/20 flex flex-col justify-center shadow-[inset_-10px_0_20px_rgba(0,0,0,0.5)]",
                        isSmall ? "p-3" : "p-6"
                    )}>
                        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper.png')]" />
                        <div className={cn("relative z-10 overflow-y-auto custom-scrollbar pr-2", isSmall ? "max-h-[80px]" : "max-h-[180px]")}>
                            <div className="flex items-center gap-2 mb-2 opacity-30">
                                <BookOpen className="w-3 h-3 text-primary" />
                                <span className="text-[8px] uppercase font-black tracking-widest text-primary">Anterior</span>
                            </div>
                            <p className={cn("text-white/40 italic font-serif leading-relaxed", isSmall ? "text-[10px]" : "text-sm")}>
                                "{currentVerse.text}"
                            </p>
                            <p className={cn("text-primary/30 font-bold mt-2", isSmall ? "text-[9px]" : "text-xs")}>
                                — {currentVerse.reference}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black/40 z-40 shadow-[0_0_15px_rgba(0,0,0,0.8)]" />
                <div className="absolute left-[calc(50%-1px)] top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-primary/20 to-transparent z-40 opacity-50" />
                <div className="absolute -bottom-8 inset-x-12 h-12 bg-primary/5 blur-3xl rounded-full z-0 pointer-events-none" />
            </div>
        </div>
    );
}
