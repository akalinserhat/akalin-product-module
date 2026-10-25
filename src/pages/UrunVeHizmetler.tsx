// @ts-nocheck
import React, { useState, useCallback, useMemo } from 'react';
import { Box, Layers, Tag, Edit2, Trash2, Settings, Sparkles, Package, Barcode, Info, RotateCcw, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { ActionMenu, BaseListPage } from '@akalin/ui';
import UrunMiktarBilgileriDialog from '../components/dialogs/UrunMiktarBilgileriDialog';
import { renderStokDurumu } from '../utils/stokUtils';
import { urunVeHizmetKartlariService } from '../services/UrunVeHizmetKartlariService';

const UrunVeHizmetler: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Filters & State
  const [seciliUrunStok, setSeciliUrunStok] = useState<any>(null);

  const urunSearchFields = useMemo(() => [
    { id: 'Tumu', label: t('Tümünde Ara'), type: 'text', iconName: 'Search', placeholder: t('Kod, Ad, Barkod, Grup...') },
    { id: 'Kod', label: t('Ürün Koduna Göre'), type: 'text', iconName: 'Barcode', placeholder: t('Ürün kodu giriniz...') },
    { id: 'Ad', label: t('Açıklama/Ada Göre'), type: 'text', iconName: 'Type', placeholder: t('Ürün açıklaması giriniz...') },
    { id: 'Grup', label: t('Ürün Grubuna Göre'), type: 'text', iconName: 'Tag', placeholder: t('Grup adı giriniz...') },
    { id: 'Barkod', label: t('Barkoda Göre'), type: 'text', iconName: 'Hash', placeholder: t('Barkod giriniz...') },
    { id: 'UreticiKodu', label: t('Üretici Koduna Göre'), type: 'text', iconName: 'Settings', placeholder: t('Üretici kodu giriniz...') }
  ], [t]);

  const handleAddNew = useCallback((isShift = false) => {
    const url = '/urunVeHizmetler/yeni';
    if (isShift) {
      window.open(url, '_blank');
    } else {
      navigate(url);
    }
  }, [navigate]);

  const handleEditPopup = useCallback((item: any) => {
    const urunId = item?.id ?? item?.Id;
    window.open(`/urunVeHizmetler/${urunId}`, '_blank');
  }, []);

  const onEdit = useCallback((item: any, e?: any) => {
    const urunId = item?.id ?? item?.Id;
    if (urunId) {
      try {
        sessionStorage.setItem('webakus_active_row_/urunVeHizmetler', String(urunId));
      } catch (err) {}
    }
    if (e && e.shiftKey) {
      handleEditPopup(item);
    } else {
      navigate(`/urunVeHizmetler/${urunId}`, { state: { item } });
    }
  }, [navigate, handleEditPopup]);

  const handleRestore = useCallback(async (item: any) => {
    const urunId = item?.id ?? item?.Id;
    if (!urunId) return;
    try {
      await urunVeHizmetKartlariService.restore(urunId);
      toast.success(t('auto_urun_geri_yuklendi', 'Ürün/Hizmet başarıyla geri yüklendi.'));
      window.dispatchEvent(new CustomEvent('refresh-list'));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('auto_hata_olustu', 'Geri yüklenirken hata oluştu.'));
    }
  }, [t]);

  const handleArchive = useCallback(async (item: any) => {
    const urunId = item?.id ?? item?.Id;
    if (!urunId) return;
    try {
      await urunVeHizmetKartlariService.archive(urunId);
      toast.success(t('auto_kayit_arsivlendi', 'Ürün/Hizmet başarıyla arşive alındı.'));
      window.dispatchEvent(new CustomEvent('refresh-list'));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('auto_hata_olustu', 'İşlem sırasında hata oluştu.'));
    }
  }, [t]);

  const handleUnarchive = useCallback(async (item: any) => {
    const urunId = item?.id ?? item?.Id;
    if (!urunId) return;
    try {
      await urunVeHizmetKartlariService.unarchive(urunId);
      toast.success(t('auto_kayit_arsivden_cikarildi', 'Ürün/Hizmet arşivden çıkarıldı.'));
      window.dispatchEvent(new CustomEvent('refresh-list'));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('auto_hata_olustu', 'İşlem sırasında hata oluştu.'));
    }
  }, [t]);

  const columns = useMemo(() => [
    {
      accessor: 'resim',
      header: t('Görsel'),
      align: 'center',
      sortable: false,
      width: '60px',
      render: (item: any) => (
        item.anaResimUrl ? (
          <img src={item.anaResimUrl} alt={item.ad} className="table-image-thumb" />
        ) : (
          <div className="table-image-placeholder">
            <Box size={20} className="text-secondary opacity-50" />
          </div>
        )
      )
    },
    {
      accessor: 'ad',
      header: t('Ürün Bilgisi'),
      sortable: true,
      render: (item: any) => (
        <div>
          <div className="flex items-center gap-8 mb-4 flex-wrap">
            <div className="font-semibold text-primary text-14">
              {item.ad}
            </div>
            {item.silindiMi && (
              <span className="chip-danger text-11 font-medium">
                {t('auto_silindi', 'Silindi')}
              </span>
            )}
            {item.arsivlendiMi && (
              <span className="chip-warning text-11 font-medium">
                {t('auto_arsivlendi', 'Arşivlendi')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-8">
            {item.urunVeHizmetTuru === 'Hizmet' ? (
              <span className="inline-flex items-center gap-4 text-warning text-11 font-medium">
                <Layers size={12}/> {t('Hizmet')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-4 text-info text-11 font-medium">
                <Box size={12}/> {t('Ürün')}
              </span>
            )}
            <span className="text-secondary text-11">•</span>
            <span className="code-badge">
              {item.kod}
            </span>
          </div>
        </div>
      )
    },
    {
      accessor: 'urunVeHizmetGrubuAdi',
      header: t('Kategori'),
      sortable: true,
      render: (item: any) => (
        item.urunVeHizmetGrubuAdi && item.urunVeHizmetGrubuAdi !== '-' ? (
          <span className="chip chip-primary inline-flex items-center gap-4 text-13">
            <Tag size={13} className="opacity-70" /> {item.urunVeHizmetGrubuAdi}
          </span>
        ) : <span className="text-muted">-</span>
      )
    },
    {
      accessor: 'envanterMiktari',
      header: t('Stok Durumu'),
      sortable: true,
      align: 'right',
      render: (item: any) => renderStokDurumu(item, {
        onClick: (e) => { e.stopPropagation(); setSeciliUrunStok(item); },
        isClickable: true
      })
    },
    {
      accessor: 'satisFiyati',
      header: t('Satış Fiyatı'),
      sortable: true,
      align: 'right',
      render: (item: any) => (
        <div>
          <div className="font-semibold text-14 text-primary">
            {(item.satisFiyati ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
          </div>
          <div className="text-11 text-secondary mt-2">
            +{item.kdvOrani}% {t('KDV')}
          </div>
        </div>
      )
    },
    {
      id: 'actions',
      header: '',
      width: '60px',
      align: 'center' as const,
      sortable: false,
      render: (row: any, index: number, tableActions: any) => {
        if (row.silindiMi) {
          return (
            <ActionMenu
              actions={[
                {
                  label: t('auto_geri_yukle', 'Geri Yükle'),
                  icon: <RotateCcw size={16} />,
                  isDefault: true,
                  default: true,
                  onClick: () => handleRestore(row)
                }
              ]}
            />
          );
        }

        if (row.arsivlendiMi) {
          return (
            <ActionMenu
              actions={[
                {
                  label: t('auto_arsivden_cikar', 'Arşivden Çıkar'),
                  icon: <RotateCcw size={16} />,
                  isDefault: true,
                  default: true,
                  onClick: () => handleUnarchive(row)
                },
                {
                  label: t('Sil'),
                  icon: <Trash2 size={16} />,
                  danger: true,
                  onClick: () => {
                    if (tableActions?.handleDelete) {
                      tableActions.handleDelete(row);
                    }
                  }
                }
              ]}
            />
          );
        }

        return (
          <ActionMenu
            actions={[
              {
                label: t('Düzenle'),
                icon: <Edit2 size={16} />,
                isDefault: true,
                default: true,
                onClick: (e: any) => {
                  if (e?.shiftKey) {
                    handleEditPopup(row);
                  } else if (tableActions?.handleEdit) {
                    tableActions.handleEdit(row, e);
                  } else {
                    onEdit(row, e);
                  }
                }
              },
              {
                label: t('auto_arsive_al', 'Arşive Al'),
                icon: <Archive size={16} />,
                onClick: () => handleArchive(row)
              },
              {
                label: t('Sil'),
                icon: <Trash2 size={16} />,
                onClick: () => {
                  if (tableActions?.handleDelete) {
                    tableActions.handleDelete(row);
                  }
                },
                danger: true
              }
            ]}
          />
        );
      }
    }
  ], [t, onEdit, handleEditPopup, handleRestore, handleArchive, handleUnarchive]);

  const itemNameResolver = useCallback((item: any) => item?.ad || item?.unvan || '', []);

  const mobileCardRender = useCallback((item: any, index: number, { handleEdit, handleDelete }: any) => (
    <div className="flex-col p-12 gap-12 relative">
      <div className="flex gap-12 items-start">
        {item.anaResimUrl ? (
          <img src={item.anaResimUrl} alt={item.ad} className="mobile-card-thumb" />
        ) : (
          <div className="mobile-card-thumb-placeholder">
            <Box size={24} className="text-secondary opacity-50" />
          </div>
        )}
        
        <div className="flex-1 min-w-0 flex-col gap-6">
          <div className="flex items-start justify-between gap-8">
            <div className="flex items-start gap-6 flex-wrap">
              <div className="font-semibold text-primary text-15 break-word leading-1-4">
                {item.ad}
              </div>
              {item.silindiMi && (
                <span className="chip-danger text-11 font-medium">
                  {t('auto_silindi', 'Silindi')}
                </span>
              )}
              {item.arsivlendiMi && (
                <span className="chip-warning text-11 font-medium">
                  {t('auto_arsivlendi', 'Arşivlendi')}
                </span>
              )}
            </div>
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              {item.silindiMi ? (
                <ActionMenu 
                  actions={[
                    {
                      label: t('auto_geri_yukle', 'Geri Yükle'),
                      icon: <RotateCcw size={15} />,
                      isDefault: true,
                      default: true,
                      onClick: () => handleRestore(item)
                    }
                  ]} 
                />
              ) : item.arsivlendiMi ? (
                <ActionMenu 
                  actions={[
                    {
                      label: t('auto_arsivden_cikar', 'Arşivden Çıkar'),
                      icon: <RotateCcw size={15} />,
                      isDefault: true,
                      default: true,
                      onClick: () => handleUnarchive(item)
                    },
                    {
                      label: t('Sil'),
                      icon: <Trash2 size={15} />,
                      danger: true,
                      onClick: () => handleDelete && handleDelete(item)
                    }
                  ]} 
                />
              ) : (
                <ActionMenu 
                  actions={[
                    {
                      label: t('Düzenle'),
                      icon: <Edit2 size={15} />,
                      onClick: (e) => {
                        if (e.shiftKey) { handleEditPopup(item); } else { handleEdit && handleEdit(item); }
                      }
                    },
                    {
                      label: t('auto_arsive_al', 'Arşive Al'),
                      icon: <Archive size={15} />,
                      onClick: () => handleArchive(item)
                    },
                    {
                      label: t('Sil'),
                      icon: <Trash2 size={15} />,
                      danger: true,
                      onClick: () => handleDelete && handleDelete(item)
                    }
                  ]} 
                />
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-8">
            {item.urunVeHizmetTuru === 'Hizmet' ? (
              <span className="inline-flex items-center gap-4 text-warning text-12 font-medium">
                <Layers size={13}/> {t('Hizmet')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-4 text-info text-12 font-medium">
                <Box size={13}/> {t('Ürün')}
              </span>
            )}
            <span className="text-secondary text-11">•</span>
            <span className="code-badge">
              {item.kod}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between border-t-glass pt-12">
        <div className="flex-col gap-6">
          <div className="chip chip-primary inline-flex items-center gap-4 text-12 self-start">
            <Tag size={12} className="opacity-70" /> 
            {item.urunVeHizmetGrubuAdi && item.urunVeHizmetGrubuAdi !== '-' ? item.urunVeHizmetGrubuAdi : t('Kategorisiz')}
          </div>
          {item.urunVeHizmetTuru !== 'Hizmet' && (
            <div className="flex-col">
              <div className={`text-12 ${item.satilabilirStokMiktari > 0 ? 'text-success' : 'text-danger'}`}>
                <span className="font-semibold">{(item.satilabilirStokMiktari ?? 0).toLocaleString('tr-TR')} {item.birimAdi}</span> {t('stok')}
              </div>
              <div className="flex items-center gap-6 text-secondary text-11 mt-2">
                <span>
                  {t('Depo')}: {(item.toplamDepoMiktari ?? 0).toLocaleString('tr-TR')} | {t('A.Sipariş')}: {((item.toplamDepoMiktari ?? 0) - (item.satilabilirStokMiktari ?? 0)).toLocaleString('tr-TR')} | {t('V.Sipariş')}: {(item.verilenSiparisMiktari || 0).toLocaleString('tr-TR')}
                </span>
                <div 
                  onClick={(e) => { e.stopPropagation(); setSeciliUrunStok(item); }} 
                  className="stock-info-btn"
                  title={t('Stok Bilgileri')}
                >
                  <Info size={13} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="font-bold text-16 text-primary">
            {(item.satisFiyati ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
          </div>
          <div className="text-11 text-secondary mt-2">
            +{item.kdvOrani}% {t('KDV')}
          </div>
        </div>
      </div>
    </div>
  ), [t, handleEditPopup, handleRestore, handleArchive, handleUnarchive]);

  return (
    <>
      <BaseListPage
        title={t('Ürün ve Hizmetler')}
        subtitle={t('Sistemdeki tüm ürün ve hizmetleri yönetin')}
        icon={<Package size={24} />}
        service={urunVeHizmetKartlariService}
        canDelete={(item: any) => urunVeHizmetKartlariService.canDelete(item?.id ?? item?.Id)}
        baseRoute="/urunVeHizmetler"
        addNewText={t('Yeni Ürün/Hizmet')}
        onAddNew={handleAddNew}
        columns={columns}
        searchableFields={urunSearchFields}
        itemNameResolver={itemNameResolver}
        onEdit={onEdit}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
        mobileCardRender={mobileCardRender}
        enableColumnManagement={true}
        enableViewModeToggle={true}
      />

      <UrunMiktarBilgileriDialog 
        isOpen={!!seciliUrunStok} 
        onClose={() => setSeciliUrunStok(null)} 
        urun={seciliUrunStok} 
      />
    </>
  );
};

export default UrunVeHizmetler;
