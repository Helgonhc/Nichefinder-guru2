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

    const primaryColorHex = (leadData.colorPalette && leadData.colorPalette[0]) ? leadData.colorPalette[0] : '#2563EB';
    const fontName = leadData.font || 'Inter';
    const fontUrl = fontName.replace(' ', '+');

    // Parse logic for array of strings vs array of objects
    const renderServices = (Array.isArray(services) ? services : []).map(s => `
        <div class="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <h3 class="text-xl font-bold mb-3 text-gray-900">${typeof s === 'object' ? (s.title || s.name || '') : s}</h3>
            ${typeof s === 'object' && s.description ? `<p class="text-gray-600">${s.description}</p>` : ''}
        </div>
    `).join('');

    const renderBenefits = (Array.isArray(benefits) ? benefits : []).map(b => `
        <li class="flex items-start">
            <svg class="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span class="text-gray-700 text-lg">${typeof b === 'object' ? (b.title || b.description || '') : b}</span>
        </li>
    `).join('');

    const renderTestimonials = (Array.isArray(testimonials) ? testimonials : []).map(t => `
        <div class="bg-gray-50 p-8 rounded-xl shadow-sm">
            <div class="flex text-yellow-400 mb-4 text-xl">
                ★★★★★
            </div>
            <p class="text-gray-700 italic mb-6 leading-relaxed">"${typeof t === 'object' ? (t.text || t.quote || '') : t}"</p>
            <p class="font-bold text-gray-900">- ${typeof t === 'object' ? (t.author || t.name || 'Cliente Satisfeito') : 'Cliente'}</p>
        </div>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="pt-BR" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${leadData.name || 'Website Premium'} - ${leadData.niche || ''}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=${fontUrl}:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['${fontName}', 'sans-serif'],
                    },
                    colors: {
                        primary: '${primaryColorHex}',
                    }
                }
            }
        }
    </script>
</head>
<body class="font-sans text-gray-800 antialiased selection:bg-primary selection:text-white">
    
    <!-- Header / Nav -->
    <nav class="absolute top-0 left-0 w-full z-50 px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
        <div class="max-w-7xl mx-auto w-full flex justify-between items-center">
            <div class="text-2xl font-black text-white tracking-tighter">
                ${leadData.name || 'Logo'}
            </div>
            <a href="#contato" class="hidden md:inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold rounded-full text-gray-900 bg-white hover:bg-gray-50 transition-colors shadow-sm">
                Falar com consultor
            </a>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative overflow-hidden bg-gray-900 text-white min-h-[90vh] flex items-center">
        <div class="absolute inset-0 z-0">
            <div class="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-primary/40 opacity-95"></div>
        </div>
        
        <div class="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col lg:flex-row items-center">
            <div class="w-full lg:w-1/2 pr-0 lg:pr-12 text-center lg:text-left pt-12 lg:pt-0">
                <span class="inline-block py-1.5 px-4 rounded-full bg-white/10 text-white/90 text-sm font-semibold tracking-wider mb-8 border border-white/20 uppercase">
                    ${leadData.niche || 'Soluções Premium'}
                </span>
                <h1 class="text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                    ${headline}
                </h1>
                <p class="text-xl text-gray-300 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                    ${subheadline}
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <a href="#contato" class="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-white bg-primary hover:bg-opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                        ${cta}
                        <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </a>
                </div>
                
                ${leadData.phone ? `
                <div class="mt-8 flex items-center justify-center lg:justify-start text-gray-400 text-sm">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    Atendimento imediato: ${leadData.phone}
                </div>
                ` : ''}
            </div>
            
            <div class="w-full lg:w-1/2 mt-16 lg:mt-0 hidden md:block">
                <div class="relative rounded-[2rem] overflow-hidden shadow-2xl transform lg:rotate-2 hover:rotate-0 transition-transform duration-500 border border-white/10">
                    <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070&auto=format&fit=crop" alt="Hero Image" class="w-full h-[600px] object-cover opacity-90 transition-opacity hover:opacity-100">
                    <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
                </div>
            </div>
        </div>
    </header>

    <!-- Problema & Solução -->
    <section class="py-28 bg-white relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col md:flex-row gap-16 items-center">
                <div class="w-full md:w-1/2">
                    <h2 class="text-primary font-bold tracking-wide uppercase text-sm mb-4">O Seu Desafio</h2>
                    <h3 class="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                        ${problem}
                    </h3>
                </div>
                <div class="w-full md:w-1/2 bg-gray-50 border-l-4 border-primary p-10 rounded-xl shadow-sm">
                    <h2 class="text-primary font-bold tracking-wide uppercase text-sm mb-4">A Nossa Solução</h2>
                    <p class="text-xl text-gray-700 leading-relaxed font-light">
                        ${solution}
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Serviços -->
    <section class="py-28 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-20">
                <h2 class="text-primary font-bold tracking-wide uppercase text-sm mb-4">Nossos Serviços</h2>
                <h3 class="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">Especialidades</h3>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                ${renderServices}
            </div>
        </div>
    </section>

    <!-- Benefícios & Autoridade -->
    <section class="py-28 bg-white overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-20 items-center">
            <div class="w-full lg:w-1/2">
                <h2 class="text-primary font-bold tracking-wide uppercase text-sm mb-4">Por que nos escolher?</h2>
                <h3 class="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-8 tracking-tight">
                    ${authority}
                </h3>
                
                <ul class="space-y-6 mt-8">
                    ${renderBenefits}
                </ul>
            </div>
            <div class="w-full lg:w-1/2 relative hidden md:block">
                <div class="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-[2.5rem] transform translate-x-6 translate-y-6"></div>
                <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop" alt="Equipe" class="relative rounded-[2.5rem] shadow-2xl z-10 w-full object-cover h-[550px]">
            </div>
        </div>
    </section>

    <!-- Prova Social -->
    <section class="py-28 bg-gray-900 text-white relative">
        <div class="absolute inset-0 bg-primary/5"></div>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="text-center max-w-3xl mx-auto mb-20">
                <h2 class="text-primary font-bold tracking-wide uppercase text-sm mb-4">Depoimentos</h2>
                <h3 class="text-4xl lg:text-5xl font-extrabold text-white tracking-tight">O que dizem sobre nós</h3>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                ${renderTestimonials}
            </div>
        </div>
    </section>

    <!-- CTA Final -->
    <section id="contato" class="py-32 bg-primary relative overflow-hidden">
        <div class="absolute inset-0 bg-black/10"></div>
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center text-white">
            <h2 class="text-5xl md:text-6xl font-extrabold mb-8 leading-tight tracking-tight">Pronto para dar o próximo passo?</h2>
            <p class="text-xl md:text-2xl mb-12 opacity-90 max-w-3xl mx-auto font-light">Entre em contato agora mesmo e descubra como podemos ajudar <strong>${leadData.name || 'sua empresa'}</strong> a alcançar resultados extraordinários no mercado.</p>
            
            <form class="max-w-md mx-auto space-y-5 bg-white p-10 rounded-3xl shadow-2xl text-left border border-white/20 relative transform hover:-translate-y-1 transition-transform">
                <h3 class="text-2xl font-bold text-gray-900 mb-6 text-center">Fale Conosco Agora</h3>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Nome Completo</label>
                    <input type="text" placeholder="Seu nome" class="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none text-gray-900 transition-all bg-gray-50 focus:bg-white">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Telefone / WhatsApp</label>
                    <input type="tel" placeholder="(00) 00000-0000" class="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none text-gray-900 transition-all bg-gray-50 focus:bg-white">
                </div>
                <button type="button" class="w-full bg-primary text-white font-bold text-lg py-4 rounded-xl hover:bg-opacity-90 transition-all shadow-lg hover:shadow-xl mt-4 flex justify-center items-center">
                    ${cta}
                    <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
            </form>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-50 border-t border-gray-200 py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
            <div class="mb-6 md:mb-0">
                <span class="text-3xl font-black text-gray-900 tracking-tighter">${leadData.name || 'Empresa'}</span>
                <p class="text-gray-500 mt-2 text-lg">${leadData.city || 'Sua Cidade'} - ${leadData.niche || 'Seu Nicho'}</p>
                ${leadData.phone ? `<p class="text-gray-500 mt-1">${leadData.phone}</p>` : ''}
            </div>
            <div class="text-gray-400 text-sm">
                &copy; ${new Date().getFullYear()} ${leadData.name || 'Empresa'}. Todos os direitos reservados.
                <div class="mt-2 text-primary font-medium cursor-pointer hover:underline">Política de Privacidade</div>
            </div>
        </div>
    </footer>
</body>
</html>
    `;
}
