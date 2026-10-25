import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AlertDialog } from '@akalin/ui';
import { useTranslation } from 'react-i18next';
import FiyatListesiTanimForm from '../components/FiyatListesiTanimForm';
import { fiyatListesiTanimlariService } from '../services/FiyatListesiTanimlariService';

const FiyatListesiTanimFormPage: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    
    const returnTo = location.state?.returnUrl || '/ayarlar/sistem-ayarlari/FiyatListesiTanimlari';
    
    const [initialData, setInitialData] = useState<any>(() => location.state?.item || null);
    const [loading, setLoading] = useState(id ? !location.state?.item : false);
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [alertDialog, setAlertDialog] = useState({ 
        isOpen: false, 
        type: 'info' as "info" | "error" | "warning" | "confirm" | "success", 
        title: '', 
        message: '', 
        onConfirm: null as any, 
        confirmText: t('Tamam', 'Tamam') 
    });

    const doNavigateBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate(returnTo, { replace: true });
        }
    };

    const handleFormClose = () => {
        if (isFormDirty) {
            setAlertDialog({
                isOpen: true,
                type: 'confirm',
                title: t('Kaydedilmemiş Değişiklikler', 'Kaydedilmemiş Değişiklikler'),
                message: t('auto_degisiklikler_kaydedilmedi_onay', 'Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinize emin misiniz?'),
                confirmText: t('Evet, Çık', 'Evet, Çık'),
                onConfirm: doNavigateBack
            });
        } else {
            doNavigateBack();
        }
    };

    useEffect(() => {
        if (id) {
            fiyatListesiTanimlariService.getById(Number(id))
                .then(data => {
                    setInitialData(data);
                    setLoading(false);
                })
                .catch(() => {
                    setAlertDialog({
                        isOpen: true,
                        type: 'error',
                        title: t('Hata', 'Hata'),
                        message: t('Hata_kayitYuklenemedi', 'Kayıt detayları yüklenemedi.'),
                        onConfirm: doNavigateBack,
                        confirmText: t('Tamam', 'Tamam')
                    });
                    setLoading(false);
                });
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-24">
                {t('auto_yukleniyor_4deb', 'Yükleniyor...')}
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <FiyatListesiTanimForm 
                initialData={initialData} 
                onSuccess={doNavigateBack} 
                onCancel={handleFormClose}
                onDirtyChange={setIsFormDirty}
            />
            
            <AlertDialog 
                isOpen={alertDialog.isOpen}
                onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
                type={alertDialog.type}
                title={alertDialog.title}
                message={alertDialog.message}
                onConfirm={alertDialog.onConfirm}
                confirmText={alertDialog.confirmText}
            />
        </div>
    );
};

export default FiyatListesiTanimFormPage;
