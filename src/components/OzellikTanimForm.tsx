import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, X, Hash, Type, AlignLeft, Calendar, ToggleLeft, ShieldAlert, Check, Layers, AlertCircle, Barcode, Tag, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const OzellikTanimForm = ({ initialData, preselectedGroupId, onSuccess, onCancel, onDirtyChange }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<any>({
    kod: '',
    ad: '',
    veriTipi: 1, // 1: Metin, 2: Sayi, 3: Liste, 4: Tarih, 5: EvetHayir
    secenekler: '',
    ozellikTanimiGrubuId: '',
    varyantIcinKullanilirMi: false,
    aktifMi: true,
    tumUrunlerdeZorunluMu: false,
    varsayilanDeger: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Gruplar ve Yeni Grup Ekleme State'leri
  const [gruplar, setGruplar] = useState([]);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);

  useEffect(() => {
    fetchGruplar();
  }, []);

  const fetchGruplar = async () => {
    try {
      const res = await axios.get('/api/OzellikTanimlariGruplari');
      setGruplar(res.data || []);
    } catch (err) {
      console.error('Gruplar yüklenemedi:', err);
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        kod: initialData.kod || '',
        ad: initialData.ad || '',
        veriTipi: initialData.veriTipi || 1,
        secenekler: initialData.secenekler || '',
        ozellikTanimiGrubuId: initialData.ozellikTanimiGrubuId || '',
        varyantIcinKullanilirMi: initialData.varyantIcinKullanilirMi || false,
        aktifMi: initialData.aktifMi ?? true,
        tumUrunlerdeZorunluMu: initialData.tumUrunlerdeZorunluMu || false,
        varsayilanDeger: initialData.varsayilanDeger || ''
      });
    } else if (preselectedGroupId) {
      setFormData(prev => ({...prev, ozellikTanimiGrubuId: preselectedGroupId}));
    }
  }, [initialData, preselectedGroupId]);

  const markDirty = () => {
    if (onDirtyChange) onDirtyChange(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    markDirty();
  };

  const handleTypeSelect = (typeId) => {
    setFormData(prev => ({ ...prev, veriTipi: typeId }));
    markDirty();
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setSavingGroup(true);
    try {
      const res = await axios.post('/api/OzellikTanimlariGruplari', { ad: newGroupName });
      await fetchGruplar();
      setFormData(prev => ({ ...prev, ozellikTanimiGrubuId: res.data.id }));
      setIsAddingGroup(false);
      setNewGroupName('');
      markDirty();
    } catch (err) {
      console.error("Grup oluşturma hatası:", err);
      let errorMessage = 'Grup oluşturulamadı.';
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'Sunucuya ulaşılamadı (404). Lütfen backend servisini yeniden başlattığınızdan emin olun.';
        } else if (err.response.data?.mesaj) {
          errorMessage = err.response.data.mesaj;
        } else if (err.response.data?.errors) {
          const validationErrors = Object.values(err.response.data.errors).flat().join('\n');
          errorMessage = 'Doğrulama hatası:\n' + validationErrors;
        } else {
          errorMessage = `Sunucu hatası: ${err.response.status}`;
        }
      } else {
        errorMessage = err.message || 'Ağ hatası oluştu.';
      }
      alert(errorMessage);
    } finally {
      setSavingGroup(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!formData.ad.trim() || !formData.kod.trim()) {
      setError('Özellik Adı ve Sistem Kodu alanları zorunludur.');
      return;
    }
    if (parseInt(formData.veriTipi) === 3 && !formData.secenekler?.trim()) {
      setError('Liste Tipi seçildiğinde seçenekler zorunludur.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        ozellikTanimiGrubuId: formData.ozellikTanimiGrubuId ? parseInt(formData.ozellikTanimiGrubuId) : null,
        veriTipi: parseInt(formData.veriTipi)
      };

      if (payload.veriTipi !== 3) {
        payload.secenekler = null; // Sadece liste seçiliyse seçenekleri gönder
      }

      if (formData.id) {
        await axios.put(`/api/OzellikTanimlari/${formData.id}`, payload);
      } else {
        await axios.post('/api/OzellikTanimlari', payload);
      }

      if (onDirtyChange) onDirtyChange(false);
      onSuccess(formData.id);
    } catch (err) {
      console.error("Kayıt hatası:", err);
      let errorMessage = 'Kayıt sırasında bir hata oluştu.';
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'Sunucuya ulaşılamadı (404). Lütfen backend servisini yeniden başlattığınızdan emin olun.';
        } else if (err.response.data?.mesaj) {
          errorMessage = err.response.data.mesaj;
        } else if (err.response.data?.errors) {
          const validationErrors = Object.values(err.response.data.errors).flat().join('\n');
          errorMessage = 'Doğrulama hatası:\n' + validationErrors;
        } else {
          errorMessage = `Sunucu hatası: ${err.response.status}`;
        }
      } else {
        errorMessage = err.message || 'Ağ hatası oluştu.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const dataTypes = [
    { id: 1, label: 'Serbest Metin', icon: <Type size={18} />, desc: 'Kısa yazılar (Örn: Model No)' },
    { id: 2, label: 'Sayısal Değer', icon: <Hash size={18} />, desc: 'Sadece rakam (Örn: 1200)' },
    { id: 3, label: 'Çoktan Seçmeli Liste', icon: <AlignLeft size={18} />, desc: 'Ön tanımlı değerler (Örn: S, M, L)' },
    { id: 4, label: 'Tarih', icon: <Calendar size={18} />, desc: 'Takvim seçimi' },
    { id: 5, label: 'Evet / Hayır', icon: <ToggleLeft size={18} />, desc: 'Sadece Onay (Mantıksal)' }
  ];

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Group Selection - En Başa Taşındı */}
      <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>{t('auto_ozellik_grubu_09c1')}</label>
        
        {isAddingGroup ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input 
              autoFocus
              type="text" 
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              placeholder="Yeni Grup Adı"
              style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--accent-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateGroup())}
            />
            <button type="button" onClick={handleCreateGroup} disabled={savingGroup || !newGroupName.trim()} className="btn btn-primary" style={{ padding: '10px 16px' }}>
              {savingGroup ? '...' : 'Ekle'}
            </button>
            <button type="button" onClick={() => setIsAddingGroup(false)} className="btn btn-outline" style={{ padding: '10px 16px' }}>
              İptal
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              name="ozellikTanimiGrubuId"
              value={formData.ozellikTanimiGrubuId}
              onChange={handleChange}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', appearance: 'auto' }}
            >
              <option value="">{t('auto__grup_seciniz__91df')}</option>
              {gruplar.map(g => (
                <option key={g.id} value={g.id}>{g.ad}</option>
              ))}
              <option value="none" disabled>────────────────</option>
            </select>
            <button type="button" onClick={() => setIsAddingGroup(true)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px' }} title="Yeni Grup Oluştur">
              <Plus size={16} /> Yeni
            </button>
          </div>
        )}
      </div>

      {/* Identity Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>{t('auto_ozellik_adi_gorunen__02a3')}</label>
          <input 
            maxLength={100}
            type="text" 
            name="ad"
            value={formData.ad}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            placeholder="Örn: Renk, Beden"
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>{t('auto_ozellik_sistem_kodu__b5d1')}</label>
          <input 
            maxLength={50}
            type="text" 
            name="kod"
            value={formData.kod}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
              handleChange(e);
            }}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', textTransform: 'uppercase' }}
            placeholder="Örn: RENK"
          />
        </div>
      </div>

      {/* Data Type Selection */}
      <div className="mb-24">
        <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '500' }}>Veri Tipi *</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
          {dataTypes.map(type => (
            <div
              key={type.id}
              onClick={() => handleTypeSelect(type.id)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: `1px solid ${parseInt(formData.veriTipi) === type.id ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                background: parseInt(formData.veriTipi) === type.id ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ color: parseInt(formData.veriTipi) === type.id ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                {type.icon}
              </div>
              <div style={{ fontWeight: parseInt(formData.veriTipi) === type.id ? '600' : '400', color: parseInt(formData.veriTipi) === type.id ? 'var(--accent-primary)' : 'var(--text-primary)', fontSize: '13px' }}>
                {type.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* List Options Textarea */}
      {parseInt(formData.veriTipi) === 3 && (
        <div className="mb-24">
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>{t('auto_liste_secenekleri_vi_7d7c')}</label>
          <textarea
            name="secenekler"
            value={formData.secenekler || ''}
            onChange={handleChange}
            placeholder="Örn: Kırmızı, Mavi, Siyah, Yeşil"
            rows={3}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }}
          />
        </div>
      )}

      {/* Checkboxes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            name="varyantIcinKullanilirMi"
            checked={formData.varyantIcinKullanilirMi}
            onChange={handleChange}
            style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
          />
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>Varyant (SKU) Boyutu Olarak Kullan</span>
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            name="aktifMi"
            checked={formData.aktifMi}
            onChange={handleChange}
            style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
          />
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{t('auto_aktif_kullanimda_8970')}</span>
        </label>
        
        <div style={{ borderTop: '1px solid var(--glass-border)', margin: '8px 0' }}></div>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            name="tumUrunlerdeZorunluMu"
            checked={formData.tumUrunlerdeZorunluMu}
            onChange={handleChange}
            style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
          />
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Tüm Ürün Kartlarında Zorunlu Kıl</span>
        </label>
        
        {formData.tumUrunlerdeZorunluMu && (
          <div style={{ paddingLeft: '26px', marginTop: '4px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Varsayılan Değer (Girilmediğinde otomatik atanacak değer)
            </label>
            <input 
              type="text" 
              name="varsayilanDeger"
              value={formData.varsayilanDeger}
              onChange={handleChange}
              style={{ width: '100%', maxWidth: '300px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              placeholder="Örn: Belirtilmedi, Yok"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
        {onCancel && (
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={loading}>
            İptal
          </button>
        )}
        <button type="submit" className="btn btn-primary flex-row items-center gap-8"  disabled={loading}>
          <Check size={18} /> {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
};

export default OzellikTanimForm;
