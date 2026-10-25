import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ActionMenu } from '@akalin/ui';
import { BaseListPage } from '@akalin/ui';

const BshFiyatFarkiList: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const columns = useMemo(() => [
        { accessor: 'belgeNo', header: t('Belge No'), width: '150px' },
        { 
            accessor: 'baslangicTarihi', 
            header: t('Başlangıç Tarihi'), 
            width: '120px',
            render: (row: any) => row.baslangicTarihi ? new Date(row.baslangicTarihi).toLocaleDateString() : '-'
        },
        { 
            accessor: 'bitisTarihi', 
            header: t('Bitiş Tarihi'), 
            width: '120px',
            render: (row: any) => row.bitisTarihi ? new Date(row.bitisTarihi).toLocaleDateString() : '-'
        },
        { accessor: 'aciklama', header: t('Açıklama') },
        { accessor: 'satirSayisi', header: t('Satır Sayısı'), width: '100px', render: (row: any) => <div className="text-right w-100">{row.satirSayisi}</div> },
        { accessor: 'iliskilendirilmisSatirSayisi', header: t('İlişkilendirilmiş Satır Sayısı'), width: '150px', render: (row: any) => <div className="text-right w-100">{row.iliskilendirilmisSatirSayisi}</div> }
    ], [t]);

    return (
        <BaseListPage
            title={t('nav.bsh_fiyat_farki') || 'BSH Fiyat Farkı'}
            apiEndpoint="/api/BshFiyatFarki"
            columns={columns}
            onAddNew={() => navigate('/bsh-fiyat-farki/yeni')}
            onEdit={(row: any) => navigate(`/bsh-fiyat-farki/duzenle/${row.id}`)}
        />
    );
};

export default BshFiyatFarkiList;
