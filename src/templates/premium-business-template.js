export default function generatePremiumTemplate(aiContent, leadData) {
    const {
        headline = leadData.headline || leadData.name || "Transformando o seu Negócio",
        subheadline = leadData.subheadline || leadData.niche || "Soluções de alta qualidade focadas em resultados reais.",
        services = leadData.services || [],
        benefits = leadData.benefits || [],
        testimonials = leadData.testimonials || [],
        cta = "Fale Conosco Agora",
        authority = "Anos de experiência entregando excelência e resultados.",
        problem = "Você enfrenta desafios no seu mercado e precisa de mais visibilidade?",
        solution = "Nós temos a metodologia exata para impulsionar o seu negócio hoje."
    } = aiContent || {};

    const layout = leadData.layout_type || "modern-bento-business";
    const primaryColorHex = (leadData.colorPalette && leadData.colorPalette[0]) ? leadData.colorPalette[0] : '#2563EB';
    const fontName = leadData.font || (layout.includes('luxury') ? 'Playfair Display' : 'Inter');
    const fontUrl = fontName.replace(' ', '+');

    // Estilos por arquétipo
    const isDark = layout.includes('dark') || layout.includes('kinetic');
    const isBento = layout.includes('bento');
    const isGlass = layout.includes('glass');
    const isSerif = layout.includes('luxury');

    const renderServices = (Array.isArray(services) ? services : []).map((s, idx) => {
        const title = typeof s === 'object' ? (s.title || s.name || '') : s;
        const desc = typeof s === 'object' && s.description ? s.description : '';

        if (isBento) {
            const spans = ['md:col-span-2', 'md:col-span-1', 'md:col-span-1', 'md:col-span-2'];
            const spanClass = spans[idx % spans.length];
            return `
                <div class="${spanClass} ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'} p-8 rounded-3xl shadow-sm border hover:shadow-xl transition-all group overflow-hidden relative">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
                    <h3 class="text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'} relative z-10">${title}</h3>
                    <p class="${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed relative z-10">${desc}</p>
                </div>
            `;
        }

        return `
            <div class="${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'} p-8 rounded-2xl shadow-sm border hover:-translate-y-1 transition-all">
                <h3 class="text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}">${title}</h3>
                <p class="${isDark ? 'text-gray-400' : 'text-gray-600'}">${desc}</p>
            </div>
        `;
    }).join('');

    const renderBenefits = (Array.isArray(benefits) ? benefits : []).map(b => `
        <li class="flex items-start">
            <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <span class="${isDark ? 'text-gray-300' : 'text-gray-700'} text-lg">${typeof b === 'object' ? (b.title || b.description || '') : b}</span>
        </li>
    `).join('');

    const renderTestimonials = (Array.isArray(testimonials) ? testimonials : []).map(t => {
        const text = typeof t === 'object' ? (t.text || t.quote || '') : t;
        const author = typeof t === 'object' ? (t.author || t.name || 'Cliente Satisfeito') : 'Cliente';
        return `
            <div class="${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-transparent'} p-8 rounded-3xl border">
                <div class="flex text-yellow-500 mb-6 text-xl">★★★★★</div>
                <p class="${isDark ? 'text-gray-300' : 'text-gray-700'} italic mb-8 leading-relaxed text-lg">"${text}"</p>
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-full bg-primary/20 mr-4 flex items-center justify-center font-bold text-primary">
                        ${author.charAt(0)}
                    </div>
                    <p class="font-bold ${isDark ? 'text-white' : 'text-gray-900'}">${author}</p>
                </div>
            </div>
        `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="pt-BR" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${leadData.name || 'Website Premium'} - ${leadData.niche || ''}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=${fontUrl}:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['${isSerif ? 'Inter' : (isDark ? 'Plus Jakarta Sans' : fontName)}', 'sans-serif'],
                        serif: ['${isSerif ? fontName : 'Georgia'}', 'serif'],
                        display: ['Space Grotesk', 'sans-serif'],
                    },
                    colors: {
                        primary: '${primaryColorHex}',
                        dark: '#020617',
                    }
                }
            }
        }
    </script>
    <style>
        .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .text-gradient { background: linear-gradient(to right, ${primaryColorHex}, #8B5CF6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-20px); } 100% { transform: translateY(0px); } }
        .float-anim { animation: float 6s ease-in-out infinite; }
    </style>
</head>
<body class="font-sans ${isDark ? 'bg-dark text-white' : 'bg-white text-gray-800'} antialiased selection:bg-primary selection:text-white">
    
    <!-- Header -->
    <nav class="fixed top-0 left-0 w-full z-50 px-6 py-6 font-display">
        <div class="max-w-7xl mx-auto flex justify-between items-center ${isGlass ? 'glass px-8 py-4 rounded-2xl' : ''}">
            <div class="text-2xl font-bold tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}">
                ${leadData.name || 'Logo'}
            </div>
            <a href="#contato" class="px-6 py-2.5 text-sm font-bold rounded-full ${isDark ? 'bg-white text-dark hover:bg-gray-200' : 'bg-primary text-white hover:bg-opacity-90'} transition-all shadow-lg">
                Falar com Especialista
            </a>
        </div>
    </nav>

    <!-- Hero -->
    <header class="relative min-h-screen flex items-center pt-24 overflow-hidden">
        ${isDark ? '<div class="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -mr-64 -mt-64"></div>' : ''}
        
        <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div class="relative z-10 text-center lg:text-left">
                <span class="inline-block py-2 px-4 rounded-full ${isDark ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-600'} text-xs font-bold uppercase tracking-widest mb-8">
                    ${leadData.niche || 'Soluções Premium'}
                </span>
                <h1 class="text-5xl lg:text-7xl font-bold ${isSerif ? 'font-serif' : 'font-display'} tracking-tight mb-8 leading-[1.1]">
                    <span class="${isDark ? 'text-white' : 'text-gray-900'}">${headline}</span>
                </h1>
                <p class="text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-12 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                    ${subheadline}
                </p>
                <div class="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                    <a href="#contato" class="px-10 py-5 text-lg font-bold rounded-2xl text-white bg-primary hover:scale-105 transition-all shadow-[0_20px_50px_rgba(37,99,235,0.3)]">
                        ${cta}
                    </a>
                </div>
            </div>
            
            <div class="relative hidden lg:block">
                <div class="absolute inset-0 bg-primary/10 rounded-[3rem] blur-3xl transform rotate-6 scale-90"></div>
                <div class="relative rounded-[3rem] overflow-hidden shadow-2xl border-4 ${isDark ? 'border-white/10' : 'border-white'} float-anim">
                    <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=1200" class="w-full h-[650px] object-cover">
                </div>
            </div>
        </div>
    </header>

    <!-- Audit / Problem -->
    <section class="py-32 ${isDark ? 'bg-white/5' : 'bg-gray-50'}">
        <div class="max-w-7xl mx-auto px-6">
            <div class="max-w-3xl mb-20 text-center lg:text-left px-4">
                <h2 class="text-primary font-bold uppercase tracking-widest text-sm mb-6">Redefinindo Padrões</h2>
                <h3 class="text-4xl lg:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-10 leading-tight">
                    ${problem}
                </h3>
                <p class="text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed">
                    ${solution}
                </p>
            </div>
        </div>
    </section>

    <!-- Services -->
    <section class="py-32">
        <div class="max-w-7xl mx-auto px-6">
            <div class="text-center mb-24 max-w-2xl mx-auto">
                <h2 class="text-primary font-bold uppercase tracking-widest text-sm mb-6">Expertise em ${leadData.niche}</h2>
                <h3 class="text-4xl lg:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}">Nossos Pilares</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 ${isBento ? 'md:grid-cols-3' : ''}">
                ${renderServices}
            </div>
        </div>
    </section>

    <!-- Benefits -->
    <section class="py-32 ${isDark ? 'bg-dark' : 'bg-white'}">
        <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div class="order-2 lg:order-1 relative">
                <div class="absolute -inset-4 bg-primary/20 rounded-[2.5rem] rotate-2"></div>
                <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200" class="relative rounded-[2.5rem] shadow-2xl h-[600px] w-full object-cover">
            </div>
            <div class="order-1 lg:order-2">
                <h2 class="text-primary font-bold uppercase tracking-widest text-sm mb-6">A Diferença é a Excelência</h2>
                <h3 class="text-4xl lg:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-10 leading-tight">
                    ${authority}
                </h3>
                <ul class="space-y-8">
                    ${renderBenefits}
                </ul>
            </div>
        </div>
    </section>

    <!-- Testimonials -->
    <section class="py-32 ${isDark ? 'bg-white/5' : 'bg-gray-50'} overflow-hidden relative">
        <div class="max-w-7xl mx-auto px-6 relative z-10">
            <div class="text-center mb-24">
                <h2 class="text-primary font-bold uppercase tracking-widest text-sm mb-6">Voz dos Clientes</h2>
                <h3 class="text-4xl lg:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}">Resultados que Falam</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                ${renderTestimonials}
            </div>
        </div>
    </section>

    <!-- Final CTA -->
    <section id="contato" class="py-32 px-6">
        <div class="max-w-6xl mx-auto rounded-[3rem] ${isDark ? 'bg-primary' : 'bg-gray-900'} p-12 lg:p-24 text-center relative overflow-hidden">
            <div class="absolute inset-0 bg-white/5 opacity-50"></div>
            <div class="relative z-10">
                <h2 class="text-5xl lg:text-7xl font-bold text-white mb-10 leading-tight">Sua nova era digital começa hoje.</h2>
                <p class="text-xl text-white/80 mb-16 max-w-3xl mx-auto leading-relaxed">
                    Estamos prontos para levar <strong>${leadData.name || 'sua empresa'}</strong> ao topo em ${leadData.city}. Vamos conversar?
                </p>
                <div class="flex flex-col md:flex-row gap-6 justify-center">
                    <a href="https://wa.me/${leadData.whatsapp || leadData.phone}" class="px-12 py-6 bg-white text-dark font-bold text-xl rounded-2xl hover:scale-105 transition-all shadow-2xl">
                        Acessar Consultoria Gratuita
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-20 px-6 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
            <div class="text-center md:text-left">
                <div class="text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}">${leadData.name}</div>
                <p class="${isDark ? 'text-gray-500' : 'text-gray-400'}">${leadData.city} | ${leadData.niche}</p>
            </div>
            <div class="text-center md:text-right">
                <p class="${isDark ? 'text-gray-500' : 'text-gray-400'} text-sm">&copy; ${new Date().getFullYear()} ${leadData.name}. Direitos de Elite Reservados.</p>
                <div class="mt-4 flex gap-6 justify-center md:justify-end text-primary font-bold text-sm">
                    <a href="#" class="hover:underline">Políticas</a>
                    <a href="#" class="hover:underline">Termos</a>
                </div>
            </div>
        </div>
    </footer>
</body>
</html>
    `;
}
