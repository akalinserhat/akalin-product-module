/**
 * @file UrunSeciciList.tsx
 * @description Webakus ERP - Ürün Yönetimi Modülü Seçici Liste Bileşeni (UrunSeciciList)
 * BaseSelectionList temel iskeletinden türetilmiş, zengin filtreleme, arama, klavye gezinimi ve
 * görsel standartlara (tür ikonu/görseli, stok durumu, fiyat, KDV vb.) sahip merkezi somut ürün ve hizmet seçim ekranı.
 */

import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Server, Box, Settings, Sparkles, Barcode } from 'lucide-react';
import { BaseSelectionList, ActionMenuItem, renderStokDurumu } from '@akalin/ui';
import { urunVeHizmetKartlariService } from '../services/UrunVeHizmetKartlariService';

export interface UrunSeciciListProps {
    isOpen?: boolean;
    onClose?: () => void;
    onSelect: (urun: any) => void;
    isMultiSelect?: boolean;
    onMultiSelect?: (urunler: any[]) => void;
    initialSearchText?: string;
    initialSearchTerm?: string;
    title?: string;
    subtitle?: string;
    inModal?: boolean;
    onAddNew?: (type?: string) => void;
    [key: string]: any;
}

// Geriye dönük uyumluluk alias'ı
export type UrunSeciciModalProps = UrunSeciciListProps;

const URUN_TURLERI_LIST = [
    { val: 'Urun', titleKey: 'auto_urun', defaultTitle: 'Ürün', icon: <Package size={14} /> },
    { val: 'Hizmet', titleKey: 'auto_hizmet_servis', defaultTitle: 'Hizmet / Servis', icon: <Server size={14} /> },
    { val: 'Hammadde', titleKey: 'auto_hammadde', defaultTitle: 'Hammadde', icon: <Settings size={14} /> },
    { val: 'Mamul', titleKey: 'auto_mamul', defaultTitle: 'Mamul', icon: <Sparkles size={14} /> },
    { val: 'YariMamul', titleKey: 'auto_yari_mamul', defaultTitle: 'Yarı Mamul', icon: <Box size={14} /> },
    { val: 'PaketSet', titleKey: 'auto_paket_set', defaultTitle: 'Paket / Set', icon: <Barcode size={14} /> }
];

const renderTurBadge = (tur: string, t: any) => {
    switch (tur) {
        case 'Hizmet':
            return (
                <span className="inline-flex items-center gap-4 text-warning text-11 font-medium">
                    <Server size={12} /> {t('auto_hizmet', 'Hizmet')}
                </span>
            );
        case 'Hammadde':
            return (
                <span className="inline-flex items-center gap-4 text-secondary text-11 font-medium">
                    <Settings size={12} /> {t('auto_hammadde', 'Hammadde')}
                </span>
            );
        case 'Mamul':
            return (
                <span className="inline-flex items-center gap-4 text-purple text-11 font-medium">
                    <Sparkles size={12} /> {t('auto_mamul', 'Mamul')}
                </span>
            );
        case 'YariMamul':
            return (
                <span className="inline-flex items-center gap-4 text-info text-11 font-medium">
                    <Box size={12} /> {t('auto_yari_mamul', 'Yarı Mamul')}
                </span>
            );
        case 'PaketSet':
            return (
                <span className="inline-flex items-center gap-4 text-success text-11 font-medium">
                    <Barcode size={12} /> {t('auto_paket_set', 'Paket / Set')}
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-4 text-accent-primary text-11 font-medium">
                    <Package size={12} /> {t('auto_urun', 'Ürün')}
                </span>
            );
    }
};

const UrunSeciciList: React.FC<UrunSeciciListProps> = ({
    isOpen = true,
    onClose,
    onSelect,
    isMultiSelect = false,
    onMultiSelect,
    initialSearchText = '',
    initialSearchTerm = '',
    title,
    subtitle,
    inModal = true,
    onAddNew,
    ...restProps
}) => {
    const { t } = useTranslation();
    const effectiveSearchText = initialSearchText || initialSearchTerm;

    // Seçim işlemi
    const handleSelect = useCallback((item: any) => {
        if (!item) return;
        onSelect(item);
        if (onClose) {
            onClose();
        }
    }, [onSelect, onClose]);

    // Yeni Kart Ekleme
    const handleAddNew = useCallback((customType: string = 'Urun') => {
        if (onAddNew) {
            onAddNew(customType);
        } else {
            window.open(`/urunVeHizmetler/yeni?type=${customType}`, '_blank');
        }
    }, [onAddNew]);

    // Arama Alanları Tanımı
    const urunSearchFields = useMemo(() => [
        { id: 'Tumu', label: t('auto_tumunde_ara', 'Tümünde Ara'), type: 'text', iconName: 'Search', placeholder: t('auto_urun_arama_placeholder', 'Kod, Ad, Barkod, Grup, Üretici Kodu...') },
        { id: 'Kod', label: t('auto_koda_gore', 'Ürün Koduna Göre'), type: 'text', iconName: 'Barcode', placeholder: t('auto_urun_kodu_girin', 'Ürün kodunu girin...') },
        { id: 'Ad', label: t('auto_ada_gore', 'Ürün Adına Göre'), type: 'text', iconName: 'Type', placeholder: t('auto_urun_adi_girin', 'Ürün adını girin...') },
        { id: 'Barkod', label: t('auto_barkoda_gore', 'Barkoda Göre'), type: 'text', iconName: 'Hash', placeholder: t('auto_barkod_girin', 'Barkod girin...') },
        { id: 'UreticiKodu', label: t('auto_uretici_koduna_gore', 'Üretici Koduna Göre'), type: 'text', iconName: 'Settings', placeholder: t('auto_uretici_kodu_girin', 'Üretici kodunu girin...') },
        { id: 'Grup', label: t('auto_gruba_gore', 'Ürün Grubuna Göre'), type: 'text', iconName: 'Tag', placeholder: t('auto_grup_adi_girin', 'Grup adını girin...') }
    ], [t]);

    // Tablo Kolonları
    const columns = useMemo(() => [
        {
            accessor: 'adUnvan',
            header: t('auto_urun_hizmet', 'Ürün / Hizmet'),
            sortable: true,
            render: (item: any) => (
                <div className="flex items-center gap-12 group">
                    {item.anaResimUrl ? (
                        <img 
                            src={item.anaResimUrl} 
                            alt={item.ad} 
                            className="w-36 h-36 rounded-8 object-cover border border-subtle flex-shrink-0" 
                        />
                    ) : (
                        <div className={`w-36 h-36 rounded-8 flex items-center justify-center flex-shrink-0 border border-subtle ${item.urunVeHizmetTuru === 'Hizmet' ? 'bg-warning-subtle text-warning' : 'bg-accent-subtle text-accent-primary'}`}>
                            {item.urunVeHizmetTuru === 'Hizmet' ? <Server size={18} /> : <Package size={18} />}
                        </div>
                    )}
                    <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-8 mb-4">
                            <div className="font-semibold text-primary text-14 group-hover:text-accent-primary transition-colors truncate">
                                {item.ad}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-8">
                            {renderTurBadge(item.urunVeHizmetTuru, t)}
                            <span className="text-secondary text-11">•</span>
                            <span className="code-badge">
                                {item.kod}
                            </span>
                            {item.birimAdi && (
                                <>
                                    <span className="text-secondary text-11">•</span>
                                    <span className="text-12 text-secondary">{item.birimAdi}</span>
                                </>
                            )}
                            {item.grupAdi && (
                                <>
                                    <span className="text-secondary text-11">•</span>
                                    <span className="text-11 text-secondary opacity-80">{item.grupAdi}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )
        },
        {
            accessor: 'fiyat',
            header: t('auto_satis_fiyati_kdv', 'Satış Fiyatı / KDV'),
            sortable: false,
            align: 'right' as const,
            render: (item: any) => (
                <div className="text-right">
                    <div className="font-semibold text-primary text-13">
                        ₺{(item.satisFiyati || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {item.kdvOrani !== undefined && (
                        <div className="text-11 text-secondary">
                            %{item.kdvOrani} {t('auto_kdv', 'KDV')}
                        </div>
                    )}
                </div>
            )
        },
        {
            accessor: 'envanterMiktari',
            header: t('auto_stok_durumu', 'Stok Durumu'),
            sortable: false,
            align: 'right' as const,
            render: (item: any) => renderStokDurumu(item)
        },
        {
            accessor: 'stok',
            header: t('auto_stok_turu', 'Stok Türü'),
            sortable: false,
            render: (item: any) => (
                <div>
                    <div className="text-12 text-primary">
                        {item.stokTakipTuru || '-'}
                    </div>
                    {item.tedarikDurumu && (
                        <div className="text-11 text-secondary">
                            {item.tedarikDurumu}
                        </div>
                    )}
                </div>
            )
        }
    ], [t]);

    // Mobil Kart Tasarımı
    const mobileCardRender = useCallback((item: any) => (
        <div 
            className="card p-12 flex flex-col gap-10 cursor-pointer hover:border-accent-primary transition-all"
            onClick={() => handleSelect(item)}
        >
            <div className="flex items-start gap-12">
                {item.anaResimUrl ? (
                    <img 
                        src={item.anaResimUrl} 
                        alt={item.ad} 
                        className="w-40 h-40 rounded-10 object-cover border border-subtle flex-shrink-0" 
                    />
                ) : (
                    <div className={`w-40 h-40 rounded-10 flex items-center justify-center flex-shrink-0 border border-subtle ${item.urunVeHizmetTuru === 'Hizmet' ? 'bg-warning-subtle text-warning' : 'bg-accent-subtle text-accent-primary'}`}>
                        {item.urunVeHizmetTuru === 'Hizmet' ? <Server size={20} /> : <Package size={20} />}
                    </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-8">
                        <div className="font-semibold text-primary text-14 break-words leading-tight">
                            {item.ad}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-6 items-center">
                        {renderTurBadge(item.urunVeHizmetTuru, t)}
                        <span className="code-badge">
                            {item.kod}
                        </span>
                        {item.birimAdi && (
                            <span className="text-12 text-secondary">{item.birimAdi}</span>
                        )}
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <div className="font-semibold text-primary text-14">
                        ₺{(item.satisFiyati || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {item.kdvOrani !== undefined && (
                        <div className="text-11 text-secondary">
                            %{item.kdvOrani} {t('auto_kdv', 'KDV')}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex justify-between items-center border-t-glass pt-8">
                <div className="text-12 text-secondary">{t('auto_stok_durumu', 'Stok Durumu')}</div>
                <div>{renderStokDurumu(item)}</div>
            </div>
        </div>
    ), [t, handleSelect]);

    // Header ActionMenu Aksiyonları
    const urunActionMenuItems: ActionMenuItem[] = useMemo(() => {
        return URUN_TURLERI_LIST.map((tur, idx) => ({
            label: t(`${tur.titleKey}_ekle`, `${tur.defaultTitle} Ekle`),
            icon: tur.icon,
            onClick: () => handleAddNew(tur.val),
            default: idx === 0,
            isDefault: idx === 0
        }));
    }, [handleAddNew, t]);

    // Veri Çekme Fonksiyonu
    const handleFetchData = useCallback(async (args: any) => {
        const page = args.page || 1;
        const size = args.pageSize || 50;
        const queryParams: Record<string, any> = {
            sayfa: page,
            sayfaBoyutu: size,
            page,
            pageSize: size,
            sirala: args.sortField || 'ad',
            yon: args.sortOrder || 'asc'
        };

        const activeSearch = (args.aramaData && args.aramaData.value !== undefined)
            ? args.aramaData.value
            : effectiveSearchText;

        if (activeSearch && typeof activeSearch === 'string' && activeSearch.trim().length > 0) {
            const cleanSearch = activeSearch.trim();
            const searchType = args.aramaData?.type || 'Tumu';

            if (searchType === 'Tumu') {
                queryParams.arama = cleanSearch;
            } else if (searchType === 'Kod') {
                queryParams.kod = cleanSearch;
            } else if (searchType === 'Ad') {
                queryParams.ad = cleanSearch;
            } else if (searchType === 'Barkod') {
                queryParams.barkod = cleanSearch;
            } else if (searchType === 'UreticiKodu') {
                queryParams.ureticiKodu = cleanSearch;
            } else if (searchType === 'Grup') {
                queryParams.grupAdi = cleanSearch;
            } else {
                queryParams.arama = cleanSearch;
            }
        }

        try {
            const res: any = await urunVeHizmetKartlariService.getAll(queryParams);
            const items = res?.data || res?.items || res?.veriler || (Array.isArray(res) ? res : []);
            const totalCount = res?.totalCount ?? res?.total ?? res?.toplam ?? items.length;
            return { data: items, totalCount };
        } catch (err) {
            return { data: [], totalCount: 0 };
        }
    }, [effectiveSearchText]);

    if (!isOpen) return null;

    return (
        <BaseSelectionList
            inModal={inModal}
            title={title || t('auto_urun_ve_hizmet_secimi', 'Ürün ve Hizmet Seçimi')}
            subtitle={subtitle || t('auto_urun_ve_hizmet_secimi_aciklama', 'İşlem yapmak istediğiniz ürün veya hizmet kartını seçin.')}
            icon={<Package size={22} />}
            breadcrumb={
                <div className="flex items-center gap-6 text-12 text-secondary">
                    <span>{t('auto_urun_yonetimi', 'Ürün Yönetimi')}</span>
                    <span>/</span>
                    <span className="text-primary font-medium">{t('auto_urun_ve_hizmet_secimi', 'Ürün ve Hizmet Seçimi')}</span>
                </div>
            }
            onClose={onClose}
            initialSearchText={effectiveSearchText}
            actionMenuItems={urunActionMenuItems}
            columns={columns}
            fetchData={handleFetchData}
            searchableFields={urunSearchFields}
            mobileCardRender={mobileCardRender}
            isMultiSelect={isMultiSelect}
            onSelect={handleSelect}
            onMultiSelect={onMultiSelect || handleSelect}
            onRowDoubleClick={handleSelect}
            defaultSortField="ad"
            defaultSortOrder="asc"
            emptyMessage={t('auto_urun_bulunamadi_mesaji', 'Arama kriterlerine uygun ürün veya hizmet bulunamadı.')}
            {...restProps}
        />
    );
};

export default UrunSeciciList;
export { UrunSeciciList as UrunSeciciModal };
