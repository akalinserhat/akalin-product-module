import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BaseSystemPage, ActionMenu, EkleMenuButton, AlertDialog, BaseSystemCard } from '@akalin/ui';
import { Edit2, Trash2, Tag, Percent, Plus, RefreshCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fiyatListesiTanimlariService } from '../services/FiyatListesiTanimlariService';
import { FiyatListesiTanimlariDto } from '../dtos/FiyatListesiTanimlariDto';

export interface FiyatListeTanimlariCardViewProps {
  showBackButton?: boolean;
  backRoute?: string;
  onBack?: () => void;
  headerSync?: boolean;
}

const FiyatListeTanimlariCardView: React.FC<FiyatListeTanimlariCardViewProps> = ({
  showBackButton = true,
  backRoute = '/ayarlar/sistem-ayarlari',
  onBack,
  headerSync = true
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [items, setItems] = useState<FiyatListesiTanimlariDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteTarget, setDeleteTarget] = useState<FiyatListesiTanimlariDto | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fiyatListesiTanimlariService.getAll();
      if (Array.isArray(res)) {
        setItems(res);
      } else {
        setItems(res?.items || []);
      }
    } catch (err) {
      console.error('Fiyat listeleri yüklenemedi:', err);
      toast.error(t('FiyatListesi_yuklenemedi', 'Fiyat listeleri yüklenirken hata oluştu.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onAdd = (e?: React.MouseEvent) => {
    const url = `/ayarlar/sistem-ayarlari/fiyat-listesi-tanimlari/yeni`;
    if (e && e.shiftKey) {
      window.open(url, '_blank');
    } else {
      navigate(url, { state: { returnUrl: '/ayarlar/sistem-ayarlari/FiyatListesiTanimlari' } });
    }
  };

  const onEdit = (item: FiyatListesiTanimlariDto, e?: React.MouseEvent) => {
    const url = `/ayarlar/sistem-ayarlari/fiyat-listesi-tanimlari/duzenle/${item.id}`;
    if (e && e.shiftKey) {
      window.open(url, '_blank');
    } else {
      navigate(url, { state: { returnUrl: '/ayarlar/sistem-ayarlari/FiyatListesiTanimlari' } });
    }
  };

  const confirmDelete = (item: FiyatListesiTanimlariDto) => {
    setDeleteTarget(item);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await fiyatListesiTanimlariService.delete(deleteTarget.id);
      toast.success(t('FiyatListesi_silindi', 'Fiyat listesi başarıyla silindi.'));
      setItems((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Silme hatası:', err);
      toast.error(err?.response?.data?.message || t('FiyatListesi_silinemedi', 'Fiyat listesi silinirken bir hata oluştu.'));
    }
  };

  const searchableFields = useMemo(() => [
    { id: 'Tumu', label: t('tumu', 'Tümü'), type: 'text', placeholder: t('ph_fiyat_listelerinde_ara', 'Fiyat listelerinde ara...') },
    { id: 'Ad', label: t('FiyatListesi_ad', 'Liste Adı'), type: 'text' },
    { id: 'Kod', label: t('FiyatListesi_kod', 'Liste Kodu'), type: 'text' }
  ], [t]);

  const menuItems = [
    {
      id: '1',
      label: t('FiyatListesi_yeniListEkle', 'Yeni Fiyat Listesi'),
      icon: <Tag size={18} />,
      onClick: (e: React.MouseEvent) => onAdd(e)
    }
  ];

  const customAddButton = (
    <EkleMenuButton 
      items={menuItems}
      storageKey="pinnedDefaultCardType_fiyatListesi"
    />
  );

  return (
    <BaseSystemPage
      title={t('FiyatListesi_sayfaBasligi', 'Fiyat Listeleri')}
      subtitle={t('FiyatListesi_sayfaAltBasligi', 'Ürün ve hizmet satış/alış fiyat listelerinin yönetimi.')}
      icon={<Tag size={24} />}
      baseRoute="/ayarlar/sistem-ayarlari"
      backRoute={backRoute}
      showBackButton={showBackButton}
      onBack={onBack}
      headerSync={headerSync}
      searchPlaceholder={t('ph_fiyat_listelerinde_ara', 'Fiyat listelerinde ara...')}
      searchableFields={searchableFields}
      customHeaderActions={customAddButton}
    >
      {({ filterItems, searchTerm, isSearching }) => {
        const filteredData = filterItems(items, (item) => [
          item.ad,
          item.kod,
          item.aciklama,
          item.dovizCinsi
        ]);

        return (
          <div className="relative fade-in flex-1 flex flex-col min-h-0">
            {loading ? (
              <div className="glass-card loading-state flex flex-col items-center justify-center p-40">
                <RefreshCcw size={32} className="spinning loading-icon mb-12 text-secondary" />
                <p className="text-secondary m-0">{t('auto_yukleniyor_4deb', 'Yükleniyor...')}</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="surface-card p-40 text-center flex flex-col items-center justify-center rounded-16 my-16">
                <div className="icon-box-large mb-16 bg-surface-variant">
                  <Tag size={36} className="text-secondary" />
                </div>
                <h3 className="m-0 text-16 font-semibold text-primary mb-6">
                  {isSearching 
                    ? t('FiyatListesi_eslesenKayitYok', 'Eşleşen Fiyat Listesi Bulunamadı') 
                    : t('FiyatListesi_kayitBulunamadi', 'Kayıtlı fiyat listesi bulunamadı.')}
                </h3>
                <p className="text-13 text-secondary max-w-400 mb-16">
                  {isSearching 
                    ? t('auto_arama_kriterine_uygun_sonuc_yok', '"{{term}}" arama kriterine uygun fiyat listesi bulunamadı.', { term: searchTerm })
                    : t('FiyatListesi_kayitYokAciklama', 'Ürün veya hizmetleriniz için özel fiyat listeleri oluşturmak üzere yeni fiyat listesi ekleyebilirsiniz.')}
                </p>
                {!isSearching && (
                  <button 
                    type="button" 
                    className="btn btn-primary flex items-center gap-6"
                    onClick={(e) => onAdd(e)}
                  >
                    <Plus size={16} />
                    <span>{t('FiyatListesi_yeniListEkle', 'Yeni Fiyat Listesi')}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid-auto-320 gap-20 p-24 overflow-y-auto">
                {filteredData.map((liste) => (
                  <BaseSystemCard
                    key={liste.id}
                    icon={<Tag size={24} />}
                    title={liste.ad}
                    subtitle={liste.kod}
                    badge={
                      <div className="flex items-center gap-6 flex-wrap">
                        <span className="badge badge-secondary text-11">
                          {liste.fiyatTuru === 1 ? t('Toptan', 'Toptan') : liste.fiyatTuru === 2 ? t('Alış', 'Alış') : t('Perakende', 'Perakende')}
                        </span>
                        <span className="badge badge-primary text-11 flex items-center gap-4">
                          <Percent size={11} />
                          {liste.kdvDahilMi ? t('FiyatListesi_kdvDahil', 'KDV Dahil') : t('FiyatListesi_kdvHaric', 'KDV Hariç')}
                        </span>
                      </div>
                    }
                    actions={[
                      {
                        label: t('auto_duzenle', 'Düzenle'),
                        icon: <Edit2 size={15} />,
                        onClick: (e) => onEdit(liste, e)
                      },
                      {
                        label: t('auto_sil', 'Sil'),
                        icon: <Trash2 size={15} />,
                        danger: true,
                        onClick: () => confirmDelete(liste)
                      }
                    ]}
                    details={[
                      {
                        label: t('FiyatListesi_dovizCinsi', 'Para Birimi'),
                        value: liste.dovizCinsi || 'TRY'
                      },
                      ...(liste.aciklama ? [{
                        label: t('aciklama', 'Açıklama'),
                        value: liste.aciklama
                      }] : [])
                    ]}
                    status={{
                      active: liste.aktifMi !== false
                    }}
                    onClick={(e) => onEdit(liste, e)}
                  />
                ))}
              </div>
            )}

            <AlertDialog
              isOpen={Boolean(deleteTarget)}
              type="confirm"
              title={t('FiyatListesi_silmeOnayiBaslik', 'Fiyat Listesini Sil')}
              message={t('FiyatListesi_silmeOnayiMesaj', '"{{ad}}" isimli fiyat listesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.', { ad: deleteTarget?.ad || '' })}
              confirmText={t('Sil', 'Sil')}
              cancelText={t('İptal', 'İptal')}
              showCancel={true}
              onClose={() => setDeleteTarget(null)}
              onConfirm={handleDeleteConfirm}
            />
          </div>
        );
      }}
    </BaseSystemPage>
  );
};

export default FiyatListeTanimlariCardView;
