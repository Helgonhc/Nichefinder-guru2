import { BusinessData } from "@/types/business";
import { PresenceScore } from "@/components/PresenceBadge";

interface ProposalPDFProps {
    business: BusinessData;
    userName: string;
    contactEmail: string;
}

export function ProposalPDF({ business, userName, contactEmail }: ProposalPDFProps) {
    const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const score = business.presenceScore ?? 0;
    const scoreColor = score >= 75 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
    const scoreLabel = score >= 75 ? 'Alta Presença Digital' : score >= 40 ? 'Presença Parcial' : 'Baixa Presença Digital';

    const checks = [
        { label: 'Site Profissional', found: !!business.website, value: business.website },
        { label: 'Instagram', found: !!business.instagram, value: business.instagram },
        { label: 'WhatsApp Business', found: !!business.whatsapp, value: business.phone },
        { label: 'Google Meu Negócio', found: !!business.googleMapsUrl, value: business.googleMapsUrl },
        { label: 'Site Seguro (HTTPS)', found: !!business.isSecure, value: null },
    ];

    return (
        <div
            id="proposal-pdf-content"
            style={{
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                background: '#0f1117',
                color: '#e2e8f0',
                width: '794px',
                minHeight: '1123px',
                padding: '0',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Header gradient bar */}
            <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)', height: '6px', width: '100%' }} />

            {/* Header */}
            <div style={{ padding: '40px 48px 32px', background: 'linear-gradient(180deg, #1a1d2e 0%, #0f1117 100%)', borderBottom: '1px solid #1e2235' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: '#6366f1', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Diagnóstico Digital
                        </div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', margin: 0, lineHeight: 1.2 }}>
                            {business.name}
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '6px' }}>
                            {business.niche} · {business.city}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{date}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Preparado por</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginTop: '2px' }}>{userName || 'Consultor Digital'}</div>
                        {contactEmail && (
                            <div style={{ fontSize: '11px', color: '#6366f1', marginTop: '2px' }}>{contactEmail}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div style={{ padding: '32px 48px', display: 'grid', gridTemplateColumns: '1fr 220px', gap: '32px' }}>

                {/* Left column */}
                <div>
                    {/* Score section */}
                    <div style={{ background: '#1a1d2e', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid #1e2235' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#64748b', textTransform: 'uppercase', marginBottom: '16px' }}>
                            Score de Presença Digital
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                border: `4px solid ${scoreColor}`,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                background: `${scoreColor}15`,
                            }}>
                                <span style={{ fontSize: '24px', fontWeight: 800, color: scoreColor }}>{score}%</span>
                            </div>
                            <div>
                                <div style={{ fontSize: '18px', fontWeight: 700, color: scoreColor }}>{scoreLabel}</div>
                                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                                    {business.foundItems?.length || 0} de 4 canais ativos
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Presence checklist */}
                    <div style={{ background: '#1a1d2e', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid #1e2235' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#64748b', textTransform: 'uppercase', marginBottom: '16px' }}>
                            Auditoria de Presença
                        </div>
                        {checks.map((item) => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #1e2235' }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%',
                                    background: item.found ? '#22c55e20' : '#ef444420',
                                    border: `1px solid ${item.found ? '#22c55e40' : '#ef444440'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '14px', flexShrink: 0,
                                }}>
                                    {item.found ? '✓' : '✗'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: item.found ? '#e2e8f0' : '#94a3b8' }}>{item.label}</div>
                                    {item.value && <div style={{ fontSize: '11px', color: '#6366f1', marginTop: '2px', wordBreak: 'break-all' }}>{item.value}</div>}
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: item.found ? '#22c55e' : '#ef4444' }}>
                                    {item.found ? 'ATIVO' : 'AUSENTE'}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Opportunities */}
                    {business.missingItems && business.missingItems.length > 0 && (
                        <div style={{ background: '#1a1d2e', borderRadius: '16px', padding: '24px', border: '1px solid #f59e0b30' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '16px' }}>
                                ⚡ Oportunidades Identificadas
                            </div>
                            {business.missingItems.map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#f59e0b20', border: '1px solid #f59e0b40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#f59e0b', flexShrink: 0, marginTop: '1px' }}>!</div>
                                    <div style={{ fontSize: '13px', color: '#cbd5e1' }}>{item}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Business info */}
                    <div style={{ background: '#1a1d2e', borderRadius: '16px', padding: '20px', border: '1px solid #1e2235' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                            Dados do Negócio
                        </div>
                        {[
                            { icon: '📍', label: business.address || business.city },
                            { icon: '📞', label: business.phone || '—' },
                            { icon: '⭐', label: business.rating ? `${business.rating} (${business.totalRatings} avaliações)` : '—' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '14px' }}>{item.icon}</span>
                                <span style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Metrics */}
                    {business.website && (
                        <div style={{ background: '#1a1d2e', borderRadius: '16px', padding: '20px', border: '1px solid #1e2235' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                                Métricas do Site
                            </div>
                            {[
                                { label: 'Performance', value: business.performanceScore, color: (business.performanceScore || 0) >= 70 ? '#22c55e' : '#f59e0b' },
                                { label: 'SEO', value: business.seoScore, color: (business.seoScore || 0) >= 70 ? '#22c55e' : '#f59e0b' },
                            ].map((m) => (
                                <div key={m.label} style={{ marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{m.label}</span>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: m.color }}>{m.value || 0}%</span>
                                    </div>
                                    <div style={{ height: '4px', background: '#1e2235', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${m.value || 0}%`, background: m.color, borderRadius: '2px' }} />
                                    </div>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Mobile Friendly</span>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: business.mobileFriendly ? '#22c55e' : '#ef4444' }}>
                                    {business.mobileFriendly ? '✓ Sim' : '✗ Não'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* CTA */}
                    <div style={{ background: 'linear-gradient(135deg, #6366f120, #8b5cf220)', borderRadius: '16px', padding: '20px', border: '1px solid #6366f130', marginTop: 'auto' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#a5b4fc', marginBottom: '8px' }}>
                            🚀 Próximo Passo
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                            Agende uma conversa de 15 minutos para apresentar o plano de ação personalizado.
                        </div>
                        {contactEmail && (
                            <div style={{ fontSize: '12px', color: '#6366f1', marginTop: '8px', fontWeight: 600 }}>
                                {contactEmail}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '20px 48px', borderTop: '1px solid #1e2235', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0c14' }}>
                <div style={{ fontSize: '10px', color: '#475569' }}>Diagnóstico gerado por LeadRadar Intelligence · {date}</div>
                <div style={{ fontSize: '10px', color: '#475569' }}>Confidencial · Uso exclusivo do destinatário</div>
            </div>
        </div>
    );
}
