import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDocumentLayout } from '@akalin/ui';
import FiyatListesiForm from '../components/FiyatListesiForm';

const FiyatListesiPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    
    const [belgeNo, setBelgeNo] = React.useState<string>('');
    
    const isCloudRoute = location.pathname.endsWith('/bulut-dosyalari');
    const isExcelImportRoute = location.pathname.endsWith('/excel-import');
    const isCariSecimRoute = location.pathname.endsWith('/cari-secim');
    const parentPath = location.pathname.replace(/\/(bulut-dosyalari|excel-import|cari-secim)$/, '');

    const title = isCariSecimRoute
        ? (t('Cari Seçimi') || 'Cari Seçimi')
        : (isExcelImportRoute
            ? (t('ExcelImport_title') || "Excel'den Veri Al")
            : (isCloudRoute
                ? (t('FilesOnClouds_title') || 'Bulut Dosyaları')
                : (isEditMode 
                    ? (belgeNo || t('FiyatListesi_duzenleTitle') || 'Fiyat Listesi Düzenle') 
                    : (t('FiyatListesi_yeniTitle') || 'Yeni Fiyat Listesi'))));

    useDocumentLayout(title, () => (isCloudRoute || isExcelImportRoute || isCariSecimRoute) ? navigate(parentPath) : navigate('/fiyat-listeleri'));

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <FiyatListesiForm onDocumentLoaded={(data) => {
                if (data?.belgeNo) {
                    setBelgeNo(data.belgeNo);
                }
            }} />
        </div>
    );
};

export default FiyatListesiPage;
