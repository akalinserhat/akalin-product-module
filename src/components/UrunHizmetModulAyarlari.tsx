import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Type, Sparkles } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { BaseCardPage, IModuleSettingsProps, BaseInput, HarfDonusumu } from '@akalin/ui';

export interface IUrunHizmetModulAyarlari {
  ureticiKoduMetinTercihi?: HarfDonusumu;
  [key: string]: any;
}

export interface UrunHizmetModulAyarlariProps extends Partial<IModuleSettingsProps<IUrunHizmetModulAyarlari>> {}

export const UrunHizmetModulAyarlari: React.FC<UrunHizmetModulAyarlariProps> = ({
  value,
  onChange,
  onSave,
  onClose,
  isSaving = false,
  readOnly = false
}) => {
  const { t } = useTranslation();

  // Controlled (FaaliyetForm / ModulSettingsRegistry) vs Standalone (Firma Ayarları) modu
  const isControlled = typeof onChange === 'function';

  const [localValue, setLocalValue] = useState<IUrunHizmetModulAyarlari>({
    ureticiKoduMetinTercihi: 'hepsiBuyuk'
  });
  const [localSaving, setLocalSaving] = useState(false);
  const [testMetni, setTestMetni] = useState('');

  useEffect(() => {
    if (isControlled) return;

    let isMounted = true;
    axios.get('/api/FirmaAyarlari/UrunVeHizmetler')
      .then(res => {
        if (isMounted && res.data) {
          const settingVal = res.data.UreticiKoduMetinTercihi || res.data.ureticiKoduMetinTercihi || 'hepsiBuyuk';
          setLocalValue({
            ureticiKoduMetinTercihi: settingVal as HarfDonusumu
          });
        }
      })
      .catch(err => {
        console.error('Ürün ve hizmet ayarları yüklenemedi:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isControlled]);

  const activeValue = isControlled ? (value || {}) : localValue;
  const currentCasing: HarfDonusumu = activeValue?.ureticiKoduMetinTercihi || 'hepsiBuyuk';

  const handleCasingChange = (newCasing: HarfDonusumu) => {
    if (readOnly) return;

    if (isControlled && onChange) {
      onChange({
        ...(value || {}),
        ureticiKoduMetinTercihi: newCasing
      });
    } else {
      setLocalValue(prev => ({
        ...prev,
        ureticiKoduMetinTercihi: newCasing
      }));
    }
  };

  const handleSave = async (e?: any) => {
    if (onSave) {
      return onSave(e);
    }

    try {
      setLocalSaving(true);
      await axios.post('/api/FirmaAyarlari/UrunVeHizmetler', {
        UreticiKoduMetinTercihi: activeValue.ureticiKoduMetinTercihi || 'hepsiBuyuk'
      });
      toast.success(t('urun_hizmet_modul_ayarlari_kaydedildi', 'Ürün ve hizmet modülü ayarları başarıyla kaydedildi.'));
    } catch (err: any) {
      console.error('Ürün ve hizmet ayarları kaydedilemedi:', err);
      const errorMsg = err?.response?.data?.mesaj || t('hata_olustu', 'İşlem sırasında bir hata oluştu.');
      toast.error(errorMsg);
    } finally {
      setLocalSaving(false);
    }
  };

  const casingOptions: Array<{
    id: HarfDonusumu;
    title: string;
    description: string;
    example: string;
  }> = useMemo(() => [
    {
      id: 'hepsiBuyuk',
      title: t('harf_donusumu_buyuk_baslik', 'Tümü Büyük Harf'),
      description: t('uretici_kodu_buyuk_aciklama', 'Üretici kodu girişinde tüm harfler otomatik olarak büyük harfe dönüştürülür.'),
      example: 'PRD-ABC-01'
    },
    {
      id: 'basHarflerBuyuk',
      title: t('harf_donusumu_basharfler_baslik', 'İlk Harfleri Büyük'),
      description: t('uretici_kodu_basharfler_aciklama', 'Üretici kodundaki her kelimenin ilk harfi büyük, diğer harfleri küçük harfe dönüştürülür.'),
      example: 'Prd-Abc-01'
    },
    {
      id: 'hepsiKucuk',
      title: t('harf_donusumu_kucuk_baslik', 'Tümü Küçük Harf'),
      description: t('uretici_kodu_kucuk_aciklama', 'Üretici kodu girişinde tüm harfler otomatik olarak küçük harfe dönüştürülür.'),
      example: 'prd-abc-01'
    },
    {
      id: 'girildigiGibi',
      title: t('harf_donusumu_serbest_baslik', 'Serbest (Dönüşüm Yok)'),
      description: t('uretici_kodu_serbest_aciklama', 'Kullanıcının yazdığı karakterler olduğu gibi korunur.'),
      example: 'Prd-aBc-01'
    }
  ], [t]);

  return (
    <BaseCardPage
      id="urunHizmetModulAyarlariPage"
      title={t('urun_hizmet_modul_ayarlari_baslik', 'Ürün ve Hizmet Modülü Ayarları')}
      subtitleLeft={t('urun_hizmet_modul_ayarlari_aciklama', 'Faaliyet alanına özel ürün ve hizmet kartı davranışlarını ve üretici kodu tercihlerini yapılandırın.')}
      icon={<Package size={20} />}
      asForm={false}
      onSave={handleSave}
      isSaving={isSaving || localSaving}
      showBackButton={!!onClose}
      onClose={onClose}
    >
      <div className="flex flex-col gap-16 p-24">
        {/* AYAR KARTI: ÜRETİCİ KODU METİN GİRİŞ TERCİHLERİ */}
        <div className="faaliyet-setting-section">
          <div className="faaliyet-setting-section-header">
            <div className="faaliyet-setting-section-header-left">
              <div className="faaliyet-setting-section-icon">
                <Type size={20} />
              </div>
              <div>
                <h5 className="faaliyet-setting-section-title">
                  {t('uretici_kodu_metin_tercihleri_baslik', 'Üretici Kodu Metin Giriş Tercihleri')}
                </h5>
                <p className="faaliyet-setting-section-desc">
                  {t('uretici_kodu_metin_tercihleri_aciklama', 'Ürün kartı sayfasında Üretici Kodu alanında metinlerin otomatik nasıl dönüştürüleceğini belirleyin.')}
                </p>
              </div>
            </div>
          </div>

          {/* Seçenek Kartları Grid */}
          <div className="casing-options-grid mt-16">
            {casingOptions.map((opt) => {
              const isSelected = currentCasing === opt.id || (opt.id === 'girildigiGibi' && (currentCasing === 'none' || currentCasing === 'serbest'));
              return (
                <label
                  key={opt.id}
                  className={`casing-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="casing-card-header">
                    <input
                      type="radio"
                      name="ureticiKoduMetinTercihi"
                      className="casing-radio"
                      checked={isSelected}
                      disabled={readOnly}
                      onChange={() => handleCasingChange(opt.id)}
                    />
                    <span className="casing-card-title">{opt.title}</span>
                  </div>
                  <div className="casing-card-example">
                    {opt.description}
                  </div>
                  <div className="casing-card-example">
                    {t('ornek_etiketi', 'Örnek:')} <span className="casing-card-preview-value">{opt.example}</span>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Canlı Deneme Alanı (Live Sandbox) */}
          <div className="casing-test-box mt-16">
            <div className="casing-test-title">
              <Sparkles size={16} />
              <span>{t('canli_onizleme_ve_test_alani', 'Canlı Harf Dönüşüm Testi')}</span>
            </div>
            <BaseInput
              id="ureticiKoduTestInput"
              casing={currentCasing}
              placeholder={t('buraya_yazi_yazarak_test_edebilirsiniz', 'Buraya metin yazarak seçili kuralın anlık dönüşümünü deneyin...')}
              value={testMetni}
              onChange={(e) => setTestMetni(e.target.value)}
              disabled={readOnly}
            />
          </div>
        </div>
      </div>
    </BaseCardPage>
  );
};

export default UrunHizmetModulAyarlari;
