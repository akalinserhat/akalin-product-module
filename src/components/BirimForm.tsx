import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BirimForm = ({ initialData, onSuccess, onCancel, onDirtyChange, inMemoryMode = false, onSaveMemory }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    ad: '',
    tip: 1, // Sayilabilir default
    carpan: 1,
    anaBirimMi: false,
    aktifMi: true
  });
  const [birimTipleri, setBirimTipleri] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData?.id;

  useEffect(() => {
    // Component yüklendiğinde birim tiplerini çek
    axios.get('/api/Tanimlar/birim-tipleri')
      .then(res => setBirimTipleri(res.data.map(t => ({ value: t.id, label: t.ad }))))
      .catch(err => console.error('Birim tipleri yüklenemedi:', err));
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ad: initialData.ad || '',
        tip: initialData.tip || 1,
        carpan: initialData.carpan || 1,
        anaBirimMi: initialData.anaBirimMi || false,
        aktifMi: initialData.aktifMi ?? true
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'tip' || name === 'carpan' ? Number(value) : value)
    }));
    if (onDirtyChange) onDirtyChange(true);
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLoading(true);
    try {
      if (inMemoryMode) {
        const itemToSave = {
          ...initialData,
          ...formData,
          id: initialData?.id || Date.now()
        };
        if (onSaveMemory) {
          onSaveMemory(itemToSave);
        }
        if (onDirtyChange) onDirtyChange(false);
        if (onSuccess) onSuccess(itemToSave.id);
      } else {
        let res;
        if (isEditing) {
          res = await axios.put(`/api/Birimler/${initialData.id}`, formData);
        } else {
          res = await axios.post('/api/Birimler', formData);
        }
        if (onDirtyChange) onDirtyChange(false);
        
        const returnedData = res.data;
        if (onSuccess) {
          // Yeni eklenen kaydın ID'sini bulup seçebilmek için
          onSuccess(returnedData?.id || (isEditing ? initialData.id : null));
        }
      }
    } catch (err) {
      alert(err.response?.data?.mesaj || 'Kaydetme işlemi başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div>
          <label className="form-label">Tipi</label>
          <select 
            name="tip"
            className="form-input"
            value={formData.tip}
            onChange={handleChange}
          >
            {birimTipleri.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">{t('auto_birim_adi_4187')}</label>
          <input 
            type="text" 
            name="ad"
            className="form-input" 
            value={formData.ad}
            onChange={handleChange}
            placeholder="Örn: Kutu, Metre"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="form-label">{t('auto_carpan_592f')}</label>
          <input 
            type="number" 
            name="carpan"
            step="0.0001"
            className="form-input" 
            value={formData.carpan}
            onChange={handleChange}
            placeholder="Ana birime göre katı"
            required
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', marginBottom: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            name="anaBirimMi"
            checked={formData.anaBirimMi}
            onChange={handleChange}
            style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
          />
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{t('auto_bu_bir_ana_birimdir__6bb3')}</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            name="aktifMi"
            checked={formData.aktifMi}
            onChange={handleChange}
            style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
          />
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{t('auto_aktif_olarak_kullani_6965')}</span>
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button type="button" className="btn" onClick={onCancel} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
          İptal
        </button>
        <button type="submit" className="btn btn-primary flex-row items-center gap-8" disabled={loading} >
          <Check size={18} /> {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
};

export default BirimForm;
