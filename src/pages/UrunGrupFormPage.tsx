import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import UrunGrupForm from '../components/UrunGrupForm';
import { useTranslation } from 'react-i18next';
import { AlertDialog } from '@akalin/ui';

const UrunGrupFormPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [isFormDirty, setIsFormDirty] = useState(false);
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    type?: 'info' | 'error' | 'warning' | 'success' | 'confirm';
    title: string;
    message: string;
    onConfirm?: (() => void) | null;
  }>({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    onConfirm: null
  });

  const parseOptionalInt = (val: string | null) => {
    if (!val) return null;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? null : parsed;
  };

  const searchParams = new URLSearchParams(location.search);
  const ustGrupIdParam = searchParams.get('ustGrupId') || searchParams.get('UstGrupId');
  const turParam = searchParams.get('tur');

  const ustGrupId = parseOptionalInt(ustGrupIdParam);
  const tur = parseOptionalInt(turParam) || 1;

  const [initialData, setInitialData] = useState<any>(() => {
    if (ustGrupId !== null || tur !== null) {
      return { ustGrupId, tur };
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => !!(id && id !== 'yeni'));
  const [isSaving, setIsSaving] = useState(false);

  const defaultReturnTo = (tur === 2 || initialData?.tur === 2) ? '/ayarlar/sistem-ayarlari/HizmetGruplari' : '/ayarlar/sistem-ayarlari/UrunGruplari';
  const returnTo = (location.state as any)?.returnTo || defaultReturnTo;

  useEffect(() => {
    if (id && id !== 'yeni') {
      setLoading(true);
      axios.get(`/api/UrunVeHizmetGruplari/${id}`)
        .then(res => setInitialData(res.data))
        .catch(() => {
          setAlertDialog({
            isOpen: true,
            type: 'error',
            title: t('auto_hata', 'Hata'),
            message: t('auto_grup_detaylari_alinamadi', 'Grup detayları alınamadı.')
          });
        })
        .finally(() => setLoading(false));
    } else if (ustGrupId !== null || tur !== null) {
      setInitialData({ ustGrupId, tur });
    }
  }, [id, ustGrupIdParam, turParam]);

  const doNavigateBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(returnTo, { replace: true });
    }
  };

  const handleSuccess = (newId?: any, keepOpen = false) => {
    if (!keepOpen) {
      doNavigateBack();
    }
  };

  const closeWindow = () => {
    if (isFormDirty) {
      setAlertDialog({
        isOpen: true,
        type: 'confirm',
        title: t('auto_kaydedilmemis_degisiklikler', 'Kaydedilmemiş Değişiklikler'),
        message: t('auto_kaydedilmemis_degisiklikler_var', 'Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinize emin misiniz?'),
        onConfirm: () => {
          setAlertDialog(prev => ({ ...prev, isOpen: false }));
          doNavigateBack();
        }
      });
    } else {
      doNavigateBack();
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>{t('auto_yukleniyor_4deb')}</div>;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <UrunGrupForm 
        initialData={initialData} 
        onSuccess={handleSuccess} 
        onCancel={closeWindow} 
        onDirtyChange={setIsFormDirty} 
        onSavingChange={setIsSaving}
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
        type={alertDialog.type || 'confirm'}
        title={alertDialog.title}
        message={alertDialog.message}
        onConfirm={() => {
          if (alertDialog.onConfirm) alertDialog.onConfirm();
          setAlertDialog(prev => ({ ...prev, isOpen: false }));
        }}
        confirmText={t('auto_evet_cik', 'Evet, Çık')}
        cancelText={t('auto_iptal', 'İptal')}
      />
    </div>
  );
};

export default UrunGrupFormPage;
