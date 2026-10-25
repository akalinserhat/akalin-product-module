import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { urunVeHizmetKartlariService } from '../services/UrunVeHizmetKartlariService';
import UrunVeHizmetForm from '../components/UrunVeHizmetForm';
import { AlertDialog, useHeaderApi } from '@akalin/ui';
import { useTranslation } from 'react-i18next';

const UrunVeHizmetFormPage: React.FC = () => {
    const { t } = useTranslation();
    const { id: paramId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { setHeaderBreadcrumbOptions } = useHeaderApi() || {};
    
    const queryId = searchParams.get('id');
    const id = paramId || queryId;
    const isNew = !id || id === 'yeni';

    const returnTo = location.state?.returnTo || '/urunVeHizmetler';
    const isPopupMode = !!window.opener || location.pathname.startsWith('/popup');
    
    // type & barkod query parameters
    const typeQuery = searchParams.get('type');
    const barkodQuery = searchParams.get('barkod');
    
    let initialObj: any = null;
    if (typeQuery || barkodQuery) {
        initialObj = {};
        if (typeQuery) {
            initialObj.urunVeHizmetTuru = isNaN(Number(typeQuery)) ? typeQuery : parseInt(typeQuery, 10);
        }
        if (barkodQuery) {
            initialObj.barkod = barkodQuery;
        }
    }

    const stateItem = location.state?.currentFormData || location.state?.item;
    const [initialData, setInitialData] = useState<any>(() => {
        if (stateItem && (!id || String(stateItem.id ?? stateItem.Id) === String(id))) {
            return stateItem;
        }
        return id ? null : initialObj;
    });
    const [loading, setLoading] = useState(!!id && (!stateItem || String(stateItem.id ?? stateItem.Id) !== String(id)));
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [formTitle, setFormTitle] = useState('');
    const [alertDialog, setAlertDialog] = useState({ 
        isOpen: false, 
        type: 'info' as "info" | "error" | "warning" | "confirm" | "success", 
        title: '', 
        message: '', 
        onConfirm: null as any, 
        confirmText: t('Tamam') 
    });

    // Breadcrumb Başlığı: Üretici Kodu öncelikli, yoksa ürün adı veya id
    useEffect(() => {
        if (setHeaderBreadcrumbOptions) {
            const ureticiKodu = (formTitle || initialData?.ureticiKodu || initialData?.UreticiKodu || '').toString().trim();
            const ad = (initialData?.ad || initialData?.Ad || '').toString().trim();
            const effectiveRecordTitle = ureticiKodu || ad || (!isNew ? (id ? `#${id}` : t('Ürün/Hizmet Düzenle')) : t('Yeni Ürün/Hizmet'));

            setHeaderBreadcrumbOptions({ recordTitle: effectiveRecordTitle });
            return () => {
                setHeaderBreadcrumbOptions(null);
            };
        }
    }, [setHeaderBreadcrumbOptions, formTitle, initialData, id, isNew, t]);

    // Sayfadan ayrılma koruması
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isFormDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isFormDirty]);

    const handleFormClose = () => {
        const doNavigateBack = () => {
            sessionStorage.removeItem('draft_urunvehizmet');
            if (isPopupMode && window.opener) {
                window.close();
            } else if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
            } else {
                navigate(returnTo, { replace: true });
            }
        };

        if (isFormDirty) {
            setAlertDialog({
                isOpen: true,
                type: 'confirm',
                title: t('Kaydedilmemiş Değişiklikler'),
                message: t('Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinize emin misiniz?'),
                confirmText: t('Evet, Çık'),
                onConfirm: doNavigateBack
            });
        } else {
            doNavigateBack();
        }
    };

    const handleSuccess = (returnedId?: string | number) => {
        setIsFormDirty(false);
        if (isPopupMode && window.opener) {
            window.opener.postMessage({ type: 'FORM_SUCCESS', entity: 'urunVeHizmetler', id: returnedId }, '*');
            window.close();
        } else if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate(returnTo, { state: { newlyAddedUrunId: returnedId }, replace: true });
        }
    };

    useEffect(() => {
        if (id) {
            urunVeHizmetKartlariService.getById(id)
                .then(data => {
                    setInitialData(data);
                    setLoading(false);
                })
                .catch(() => {
                    setAlertDialog({
                        isOpen: true,
                        type: 'error',
                        title: t('Hata'),
                        message: t('Kayıt detayları yüklenemedi.'),
                        onConfirm: () => {
                            if (isPopupMode && window.opener) {
                                window.close();
                            } else {
                                navigate('/urunVeHizmetler');
                            }
                        },
                        confirmText: t('Tamam')
                    });
                    setLoading(false);
                });
        }
    }, [id, navigate, isPopupMode, t]);

    if (loading) {
        return <div className="p-24 flex justify-center text-secondary">{t('Yükleniyor...')}</div>;
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <UrunVeHizmetForm 
                initialData={initialData} 
                onSuccess={handleSuccess} 
                onCancel={handleFormClose}
                onDirtyChange={setIsFormDirty}
                onTitleChange={setFormTitle}
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

export default UrunVeHizmetFormPage;
