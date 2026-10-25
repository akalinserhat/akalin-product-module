import React from 'react';
import { Package, Truck } from 'lucide-react';

export interface RenderStokDurumuOptions {
    onClick?: (e: React.MouseEvent) => void;
    isClickable?: boolean;
}

const formatCompactNumber = (value: number): string => {
    if (value >= 1_000_000) {
        return (value / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + 'M';
    }
    if (value >= 100_000) {
        return (value / 1_000).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + 'K';
    }
    return value.toLocaleString('tr-TR');
};

export const renderStokDurumu = (item: any, options?: RenderStokDurumuOptions) => {
    if (item?.urunVeHizmetTuru === 'Hizmet') {
        return <span style={{ color: 'var(--text-muted)' }}>-</span>;
    }

    const kesinSatilabilir = item?.kesinSatilabilirStokMiktari || 0;
    const mevcutDepo = item?.toplamDepoMiktari || 0;
    const genelSatilabilir = item?.satilabilirStokMiktari || 0;

    let state: 'success' | 'warning' | 'danger' = 'danger';
    if (kesinSatilabilir > 0) state = 'success';
    else if (mevcutDepo > 0) state = 'warning';

    const colorVars = {
        success: { text: 'var(--success)', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' },
        warning: { text: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' },
        danger: { text: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)' },
    };

    const theme = colorVars[state];

    return (
        <div 
            onClick={options?.onClick}
            style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-end', 
                gap: '5px',
                cursor: options?.isClickable ? 'pointer' : 'default',
            }}
            title={options?.isClickable ? "Detaylı stok analizi için tıklayın" : "Stok Durumu Özeti"}
        >
            <div 
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: theme.bg,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    transition: 'all 0.2s ease',
                    boxShadow: options?.isClickable ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
            >
                <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: theme.text,
                    boxShadow: `0 0 5px ${theme.text}`,
                    opacity: 0.9
                }} />
                
                <span style={{ 
                    fontWeight: '700', 
                    fontSize: '13px', 
                    letterSpacing: '-0.3px',
                    fontVariantNumeric: 'tabular-nums'
                }}>
                    {kesinSatilabilir.toLocaleString('tr-TR')}
                </span>
                <span style={{ 
                    fontSize: '10.5px', 
                    fontWeight: '600', 
                    opacity: 0.75,
                    textTransform: 'uppercase',
                    letterSpacing: '0.2px'
                }}>
                    {item?.birimAdi} (Satılabilir)
                </span>
            </div>

            <div 
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '11px', 
                    color: 'var(--text-secondary)', 
                    opacity: 0.8,
                    letterSpacing: '-0.2px',
                    fontVariantNumeric: 'tabular-nums'
                }}
            >
                <div 
                    title={`Fiziki Mevcut Depo: ${mevcutDepo.toLocaleString('tr-TR')} ${item?.birimAdi || ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                    <Package size={12} strokeWidth={2.5} style={{ opacity: 0.6 }} />
                    <span style={{ fontWeight: '600' }}>{formatCompactNumber(mevcutDepo)}</span>
                </div>

                <div style={{ 
                    width: '3px', 
                    height: '3px', 
                    borderRadius: '50%', 
                    backgroundColor: 'currentColor',
                    opacity: 0.4
                }} />

                <div 
                    title={`Genel Satılabilir (Siparişler Dahil): ${genelSatilabilir.toLocaleString('tr-TR')} ${item?.birimAdi || ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                    <Truck size={12} strokeWidth={2.5} style={{ opacity: 0.6 }} />
                    <span style={{ fontWeight: '600' }}>{formatCompactNumber(genelSatilabilir)}</span>
                </div>
            </div>
        </div>
    );
};

export default renderStokDurumu;
