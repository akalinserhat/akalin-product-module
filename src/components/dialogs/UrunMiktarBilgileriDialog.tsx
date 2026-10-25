import React, { useEffect, useState } from 'react';
import { BaseDetailDialog } from '@akalin/ui';
import { Package, CheckCircle, Clock, Truck, ArrowDownRight, ArrowUpRight, Layers, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface UrunMiktarBilgileriDialogProps {
  isOpen: boolean;
  onClose: () => void;
  urun: any;
}

const UrunMiktarBilgileriDialog: React.FC<UrunMiktarBilgileriDialogProps> = ({
  isOpen,
  onClose,
  urun
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [detay, setDetay] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'depo' | 'envanter'>('depo');

  useEffect(() => {
    if (isOpen && urun?.id) {
      setLoading(true);
      axios.get(`/api/UrunVeHizmetKartlari/${urun.id}/miktar-detaylari`)
        .then(res => setDetay(res.data))
        .catch(err => console.error("Miktar detayları çekilemedi", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, urun]);

  if (!urun) return null;

  // Custom UI Card for primary metrics (The Big Numbers)
  const renderHeroCard = (title: string, value: number, icon: React.ReactNode, colorClass: string, subtitle?: string) => (
    <div style={{
      flex: 1,
      background: `linear-gradient(145deg, var(--bg-primary), var(--bg-secondary))`,
      border: `1px solid var(--${colorClass}-light)`,
      borderRadius: '12px',
      display: 'flex',
      padding: '12px',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
    }}>
      <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.1, color: `var(--${colorClass})`, transform: 'scale(2.5)' }}>
        {icon}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: `var(--${colorClass})`, marginBottom: '8px', zIndex: 1 }}>
        <div style={{ background: `var(--${colorClass}-light)`, padding: '4px', borderRadius: '6px', display: 'flex' }}>
          {icon}
        </div>
        <span style={{ fontSize: '12px', fontWeight: '600' }}>{title}</span>
      </div>
      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', zIndex: 1, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
        {(value || 0).toLocaleString('tr-TR')}
        <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)' }}>{urun.birimAdi}</span>
      </div>
      {subtitle && (
        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', zIndex: 1, textAlign: 'center' }}>
          {subtitle}
        </div>
      )}
    </div>
  );

  // Custom UI for secondary metrics (Flow / Movements)
  const renderMiniCard = (title: string, value: number, icon: React.ReactNode, colorClass: string) => (
    <div style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--glass-border)',
      borderRadius: '10px',
      padding: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'all 0.2s',
    }} className="hover-bg-secondary">
      <div className="flex-row items-center gap-8">
        <div style={{ color: `var(--${colorClass})`, display: 'flex' }}>{icon}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>{title}</div>
      </div>
      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
        {(value || 0).toLocaleString('tr-TR')} <span style={{ fontSize: '10px', fontWeight: 'normal', color: 'var(--text-muted)' }}>{urun.birimAdi}</span>
      </div>
    </div>
  );

  return (
    <BaseDetailDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Stok Analizi"
      size="md"
      hideSaveButton={true}
      cancelText="Kapat"
    >
      <div style={{ padding: 'clamp(12px, 2vw, 20px)', display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', gap: 'clamp(10px, 1.5vw, 16px)', background: 'var(--bg-body)' }}>
        
        {/* Product Header Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px dashed var(--glass-border)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={20} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{urun.ad}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{urun.kod}</div>
          </div>
        </div>

        {/* Custom Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '10px', padding: '4px' }}>
          <div 
            onClick={() => setActiveTab('depo')}
            style={{ flex: 1, padding: '8px', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s',
              background: activeTab === 'depo' ? 'var(--bg-primary)' : 'transparent',
              color: activeTab === 'depo' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'depo' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
              wordBreak: 'break-word'
            }}
          >
            Fiziki Depo {detay ? `(${detay.depoMiktari.toLocaleString('tr-TR')})` : ''}
          </div>
          <div 
            onClick={() => setActiveTab('envanter')}
            style={{ flex: 1, padding: '8px', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s',
              background: activeTab === 'envanter' ? 'var(--bg-primary)' : 'transparent',
              color: activeTab === 'envanter' ? 'var(--secondary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'envanter' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
              wordBreak: 'break-word'
            }}
          >
            Kayıtsal Envanter {detay ? `(${detay.envanterMiktari.toLocaleString('tr-TR')})` : ''}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('auto_miktar_analizleri_he_c2d1')}</div>
        ) : detay ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease-in-out' }}>
            
            {/* The Big Numbers Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 'clamp(8px, 1.5vw, 12px)' }}>
              {activeTab === 'depo' ? (
                <>
                  {renderHeroCard('Mevcut Depo', detay.depoMiktari, <Package size={20}/>, 'primary', 'Fiziki olarak rafta bulunan')}
                  {renderHeroCard('Kesin Satılabilir', detay.depoKesinSatilabilirMiktar, <CheckCircle size={20}/>, 'success', 'Rafta olup rezerve edilmemiş')}
                  {renderHeroCard('Genel Satılabilir', detay.depoSatilabilirMiktar, <Truck size={20}/>, 'warning', 'Gelecek olan siparişler dahil')}
                </>
              ) : (
                <>
                  {renderHeroCard('Envanter (Fatura)', detay.envanterMiktari, <Layers size={20}/>, 'secondary', 'Faturalanmış net miktar')}
                  {renderHeroCard('Kesin Satılabilir', detay.envanterKesinSatilabilirMiktar, <CheckCircle size={20}/>, 'success', 'Faturalı net kullanılabilir')}
                  {renderHeroCard('Genel Satılabilir', detay.envanterSatilabilirMiktar, <Truck size={20}/>, 'warning', 'Bekleyen faturalar dahil')}
                </>
              )}
            </div>

            {/* Hareket Detayları */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} color="var(--text-muted)" />
                Hareket ve Sipariş Detayları
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'clamp(6px, 1.5vw, 10px)' }}>
                {activeTab === 'depo' ? (
                  <>
                    {renderMiniCard('Müşteriden Alınan Sipariş', detay.depoAlinanSiparis, <Clock size={18} />, 'warning')}
                    {renderMiniCard('Tedarikçiye Verilen Sipariş', detay.depoVerilenSiparis, <Truck size={18} />, 'info')}
                    {renderMiniCard('Toplam Giren', detay.depoGirenMiktar, <ArrowDownRight size={18} />, 'success')}
                    {renderMiniCard('Toplam Çıkan', detay.depoCikanMiktar, <ArrowUpRight size={18} />, 'danger')}
                  </>
                ) : (
                  <>
                    {renderMiniCard('Müşteriden Alınan Sipariş', detay.envanterAlinanSiparis, <Clock size={18} />, 'warning')}
                    {renderMiniCard('Tedarikçiye Verilen Sipariş', detay.envanterVerilenSiparis, <Truck size={18} />, 'info')}
                    {renderMiniCard('Toplam Giren', detay.envanterGirenMiktar, <ArrowDownRight size={18} />, 'success')}
                    {renderMiniCard('Toplam Çıkan', detay.envanterCikanMiktar, <ArrowUpRight size={18} />, 'danger')}
                  </>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('auto_miktar_bilgisi_bulun_b462')}</div>
        )}

      </div>
    </BaseDetailDialog>
  );
};

export default UrunMiktarBilgileriDialog;
