import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { BaseListPage } from '@akalin/ui';

const FiyatListeleri: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const onEdit = (row: any, e?: any) => {
        if (row._isDraftTemplate) {
            navigate('/fiyat-listeleri/yeni', {
                state: {
                    isDraftTemplate: true,
                    currentFormData: row._draftData || row,
                    returnUrl: '/fiyat-listeleri'
                }
            });
            return;
        }
        const url = `/fiyat-listeleri/${row.id}`;
        if (e && e.shiftKey) window.open(url, '_blank');
        else navigate(url, { state: { returnUrl: '/fiyat-listeleri' } });
    };

    const searchFields = useMemo(() => [
        { id: 'Tumu', label: t('Tümünde Ara'), type: 'text', iconName: 'Search', placeholder: t('Belge No, Cari, Fiyat Tanımı...') },
        { id: 'BelgeNo', label: t('Belge No'), type: 'text', iconName: 'Barcode', placeholder: t('Belge no girin...') },
        { id: 'Cari', label: t('Cari'), type: 'text', iconName: 'User', placeholder: t('Cari ünvanı girin...') }
    ], [t]);

    const columns = useMemo(() => [
        { accessor: 'baslangicTarihi', header: t('Başlangıç Tarihi'), width: '150px', sortable: true, render: (row: any) => row.baslangicTarihi ? new Date(row.baslangicTarihi).toLocaleDateString() : '-' },
        { accessor: 'bitisTarihi', header: t('Bitiş Tarihi'), width: '150px', sortable: true, render: (row: any) => row.bitisTarihi ? new Date(row.bitisTarihi).toLocaleDateString() : '-' },
        { accessor: 'belgeNo', header: t('Belge No'), width: '120px', sortable: true },
        { accessor: 'cariUnvani', header: t('Cari'), width: '200px', sortable: true, render: (row: any) => row.cariUnvani || t('Tümü') },
        { accessor: 'fiyatTanimAdi', header: t('Fiyat Tanım Bilgisi'), width: '200px', sortable: true, render: (row: any) => row.fiyatListesiTanimi?.ad || '' },
        {
            accessor: 'fiyatTuru',
            header: t('Fiyat Türü'),
            width: '120px',
            sortable: true,
            render: (row: any) => {
                const tur = row.fiyatListesiTanimi?.fiyatTuru;
                if (tur === 1) return t('Toptan');
                if (tur === 2) return t('Alış');
                if (tur === 3) return t('Perakende');
                return '-';
            }
        }
    ], [t]);

    return (
        <BaseListPage
            title={t('Fiyat Listeleri')}
            subtitle={t('auto_fiyat_listeleri_alt_baslik', 'Müşteri ve tedarikçi fiyat listeleri, kampanyalar ve geçerlilik tarihleri.')}
            icon={<FileText size={24} />}
            apiEndpoint="/api/FiyatListeleri"
            baseRoute="/fiyat-listeleri"
            columns={columns}
            searchableFields={searchFields}
            itemNameResolver={(item: any) => item?.belgeNo || t('auto_fiyat_listesi', 'Fiyat Listesi')}
            enableViewModeToggle={true}
            aiDocumentType="FiyatListesi"
            aiPromptSuggestions={[
                'Tüm beyaz eşya ürünlerine %15 zamlı toptan fiyat listesi hazırla',
                'Seçili cari için 30 gün geçerli özel perakende fiyat listesi oluştur',
                'Klima ve soğutma grubu için kampanya fiyat listesi taslağı çıkar'
            ]}
            onAddNew={() => {
                const url = '/fiyat-listeleri/yeni';
                navigate(url, { state: { returnUrl: '/fiyat-listeleri', isNewFresh: true } });
            }}
            onEdit={onEdit}
            enableColumnManagement={true}
        />
    );
};

export default FiyatListeleri;
