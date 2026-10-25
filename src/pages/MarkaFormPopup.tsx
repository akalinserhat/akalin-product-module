import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { BaseInput, BaseSwitch } from '@akalin/ui';

const MarkaFormPopup = ({ initialData, onSuccess, onCancel, onDirtyChange, setIsSaving }: any) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    kod: '',
    ad: '',
    aktifMi: true
  });
  const [kodLoading, setKodLoading] = useState(false);
  
  const editingId = initialData?.id;

  useEffect(() => {
    if (initialData) {
      setFormData({
        kod: initialData.kod || '',
        ad: initialData.ad || '',
        aktifMi: initialData.aktifMi !== undefined ? initialData.aktifMi : true
      });
    }
  }, [initialData]);

  const isDirty = formData.kod !== (initialData?.kod || '') || 
                  formData.ad !== (initialData?.ad || '') || 
                  formData.aktifMi !== (initialData?.aktifMi !== undefined ? initialData.aktifMi : true);

  useEffect(() => {
    if (onDirtyChange) onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const generateKod = async (ad: string) => {
    if (!ad || ad.length < 2) return;
    setKodLoading(true);
    try {
      const res = await axios.get(`/api/Markalar/kod-uret?ad=${encodeURIComponent(ad)}`);
      if (res.data && res.data.kod) {
        setFormData(prev => ({ ...prev, kod: res.data.kod }));
      }
    } catch (err) {
      console.error('Kod üretme hatası:', err);
    } finally {
      setKodLoading(false);
    }
  };

  const handleNameBlur = () => {
    if (!editingId && !formData.kod && formData.ad) {
      generateKod(formData.ad);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (setIsSaving) setIsSaving(true);
    try {
      let res;
      if (editingId) {
        res = await axios.put(`/api/Markalar/${editingId}`, formData);
        onSuccess(editingId);
      } else {
        res = await axios.post('/api/Markalar', formData);
        onSuccess(res.data.id);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.mesaj || 'İşlem başarısız oldu.');
    } finally {
      if (setIsSaving) setIsSaving(false);
    }
  };

  return (
    <form id="base-popup-form" onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>{t('auto_marka_adi__405b')}</label>
          <BaseInput 
            autoFocus
            required
            type="text" 
            value={formData.ad}
            onChange={(e: any) => setFormData({...formData, ad: e.target.value})}
            onBlur={handleNameBlur}
            placeholder="Örn: Samsung"
          />
        </div>
        <div>
          <label style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500', display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('auto_kisa_kod_3_karakter__a063')}</span>
            {kodLoading && <RefreshCw size={14} className="spin" style={{ color: 'var(--accent-primary)' }} />}
          </label>
          <div className="flex-row gap-8">
            <div style={{ flex: 1 }}>
              <BaseInput 
                required
                maxLength={10}
                type="text" 
                value={formData.kod}
                onChange={(e: any) => setFormData({...formData, kod: e.target.value.toUpperCase()})}
                inputStyle={{ textTransform: 'uppercase' }}
                placeholder="Örn: SAM"
              />
            </div>
            {!editingId && (
              <button type="button" className="btn btn-outline" onClick={() => generateKod(formData.ad)} title="Otomatik Üret">
                <RefreshCw size={16} />
              </button>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
          <BaseSwitch
            label={t('auto_aktif_kullanimda_8970')}
            checked={formData.aktifMi}
            onChange={(e: any) => setFormData({...formData, aktifMi: e.target.checked})}
          />
        </div>
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </form>
  );
};

export default MarkaFormPopup;
