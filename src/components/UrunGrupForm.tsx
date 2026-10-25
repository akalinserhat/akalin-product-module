/**
 * @file UrunGrupForm.tsx
 * @description 
 * Ürün ve Hizmet Grupları Tanımlama ve Düzenleme Formu.
 * Hiyerarşik ağaç yapısı, üst grup, KDV grubu ve varsayılan birim seçimini yönetir.
 */

// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Check, RefreshCw, X, Search, Plus, Save, User, Sliders, Tags, Layers } from 'lucide-react';
import { SaveButton, CancelButton, KdvSecici, StokTakipYontemiSecici, UrunGrupSecici, BirimSecici, AlertDialog, BasePopup, FieldError, useAdminValidation, BaseSwitch, BaseCardPage, Breadcrumb } from '@akalin/ui';
import { toast } from 'react-hot-toast';
import GrupFormStrategyFactory from './grupStrategies/GrupFormStrategyFactory';
import { useTranslation } from 'react-i18next';
import { validateUrunGrupField, validateUrunGrupForm } from '../validators/urunGrupValidation';
import { useAppBreadcrumbs } from '../hooks/useAppBreadcrumbs';

const UrunGrupForm = ({ initialData, onSuccess, onCancel, onDirtyChange, hideFooterButtons = false, onSavingChange }: any) => {
  const { t } = useTranslation();
  const { errors, setErrors, clearError, setFieldError, clearErrors } = useAdminValidation();
  // Yardımcı fonksiyon: enum -> string
  const getStokTakipTuruStr = (val: any) => {
    if (val === 1 || val === '1') return 'MiktarBazli';
    if (val === 2 || val === '2') return 'SeriNoBazli';
    if (val === 3 || val === '3') return 'LotNoBazli';
    if (val === 4 || val === '4') return 'Takipsiz';
    return val || '';
  };

  const editingId = initialData?.id;

  const parseUstGrupId = (val: any) => {
    if (val === undefined || val === null || val === '') return '';
    const num = Number(val);
    return isNaN(num) ? '' : num;
  };

  const [formData, setFormData] = useState<any>(() => ({
    kod: initialData?.kod || '',
    ad: initialData?.ad || '',
    tekilAd: initialData?.tekilAd || '',
    ustGrupId: parseUstGrupId(initialData?.ustGrupId),
    kdvGrubuId: initialData?.kdvGrubuId || '',
    varsayilanBirimId: initialData?.varsayilanBirimId || '',
    webdeGosterilsinMi: initialData?.webdeGosterilsinMi !== undefined ? initialData.webdeGosterilsinMi : true,
    aktifMi: initialData?.aktifMi !== undefined ? initialData.aktifMi : true,
    ozellikTanimiIds: initialData?.ozellikTanimiIds || [],
    tur: initialData?.tur || 1,
    varsayilanStokTakipTuru: initialData?.varsayilanStokTakipTuru ? getStokTakipTuruStr(initialData.varsayilanStokTakipTuru) : ''
  }));

  const [gruplar, setGruplar] = useState<any[]>([]);
  const [ozellikler, setOzellikler] = useState<any[]>([]);
  const [kdvGruplari, setKdvGruplari] = useState<any[]>([]);
  const [kodLoading, setKodLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keepOpenForChild, setKeepOpenForChild] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const adInputRef = useRef<HTMLInputElement>(null);
  
  const [isOzellikModalOpen, setIsOzellikModalOpen] = useState(false);
  const [ozellikSearchText, setOzellikSearchText] = useState('');
  
  const [errorDialog, setErrorDialog] = useState({ isOpen: false, title: '', message: null as any });
  const [descendantConfirmDialog, setDescendantConfirmDialog] = useState({ isOpen: false, payload: null as any });

  const hasInitialized = useRef(false);
  const initialFormStateRef = useRef<any>(null);

  // Form dışından gelen veriyle ilklendir
  useEffect(() => {
    if (initialData) {
      const initObj = {
        kod: initialData.kod ?? '',
        ad: initialData.ad ?? '',
        tekilAd: initialData.tekilAd ?? '',
        ustGrupId: ('ustGrupId' in initialData && initialData.ustGrupId !== undefined) ? parseUstGrupId(initialData.ustGrupId) : '',
        kdvGrubuId: initialData.kdvGrubuId ?? '',
        varsayilanBirimId: initialData.varsayilanBirimId ?? '',
        webdeGosterilsinMi: initialData.webdeGosterilsinMi !== undefined ? initialData.webdeGosterilsinMi : true,
        aktifMi: initialData.aktifMi !== undefined ? initialData.aktifMi : true,
        ozellikTanimiIds: initialData.ozellikTanimiIds || [],
        tur: initialData.tur || 1,
        varsayilanStokTakipTuru: initialData.varsayilanStokTakipTuru ? getStokTakipTuruStr(initialData.varsayilanStokTakipTuru) : ''
      };

      setFormData(initObj);
      initialFormStateRef.current = initObj;
      hasInitialized.current = true;
    }
  }, [initialData]);

  // Grupları getir (Açılır liste için)
  useEffect(() => {
    const fetchGruplar = async () => {
      try {
        const turQuery = initialData?.tur || formData.tur || 1;
        const res = await axios.get('/api/UrunVeHizmetGruplari', { params: { tur: turQuery } });
        setGruplar(res.data);
      } catch (err) {
        console.error('Gruplar çekilemedi:', err);
      }
    };
    fetchGruplar();
  }, [initialData?.tur]);

  useEffect(() => {
    const fetchKdvGruplari = async () => {
      try {
        const res = await axios.get('/api/KdvGruplari/aktif-oranlar');
        setKdvGruplari(res.data || []);
      } catch (err) {
        console.error('KDV Grupları çekilemedi:', err);
      }
    };
    fetchKdvGruplari();
  }, []);

  // Özellikleri getir
  useEffect(() => {
    const fetchOzellikler = async () => {
      try {
        const res = await axios.get('/api/OzellikTanimlari');
        setOzellikler(res.data || []);
      } catch (err) {
        console.error('Özellikler çekilemedi:', err);
      }
    };
    fetchOzellikler();
  }, []);

  // Üst Grup seçildiğinde varsayılan değerlerini (KDV, Birim, Stok Takip) getir ve otomatik doldur
  useEffect(() => {
    // Sadece yeni ekleme durumunda veya üst grup değiştiğinde çalışsın
    if (formData.ustGrupId && !editingId) {
      const fetchUstGrupDefaults = async () => {
        try {
          const res = await axios.get(`/api/UrunVeHizmetGruplari/${formData.ustGrupId}`);
          if (res.data) {
            const autoKdv = res.data.kdvGrubuId || '';
            const autoBirim = res.data.varsayilanBirimId || '';
            const autoStokTakip = getStokTakipTuruStr(res.data.varsayilanStokTakipTuru) || '';

            setFormData(prev => ({
              ...prev,
              kdvGrubuId: prev.kdvGrubuId || autoKdv,
              varsayilanBirimId: prev.varsayilanBirimId || autoBirim,
              varsayilanStokTakipTuru: prev.varsayilanStokTakipTuru || autoStokTakip
            }));

            // Otomatik yüklenen üst grup varsayılanlarını baseline state'e işleyerek formun kullanıcı tarafından kirletildiğini (isDirty) düşünmesini engelle
            if (initialFormStateRef.current) {
              initialFormStateRef.current = {
                ...initialFormStateRef.current,
                kdvGrubuId: initialFormStateRef.current.kdvGrubuId || autoKdv,
                varsayilanBirimId: initialFormStateRef.current.varsayilanBirimId || autoBirim,
                varsayilanStokTakipTuru: initialFormStateRef.current.varsayilanStokTakipTuru || autoStokTakip
              };
            }

            if (res.data.kdvGrubuId) clearError('kdvGrubuId');
            if (res.data.varsayilanBirimId) clearError('varsayilanBirimId');
            if (res.data.varsayilanStokTakipTuru) clearError('varsayilanStokTakipTuru');
          }
        } catch (err) {
          console.error('Üst grup detayları çekilemedi:', err);
        }
      };
      fetchUstGrupDefaults();
    }
  }, [formData.ustGrupId, editingId]);

  const baseState = initialFormStateRef.current || {};
  const isDirty = (formData.kod || '') !== (baseState.kod || '') || 
                  (formData.ad || '') !== (baseState.ad || '') || 
                  (formData.tekilAd || '') !== (baseState.tekilAd || '') || 
                  (formData.ustGrupId || '') !== (baseState.ustGrupId || '') || 
                  (formData.kdvGrubuId || '') !== (baseState.kdvGrubuId || '') ||
                  (formData.varsayilanBirimId || '') !== (baseState.varsayilanBirimId || '') ||
                  formData.webdeGosterilsinMi !== (baseState.webdeGosterilsinMi !== undefined ? baseState.webdeGosterilsinMi : true) ||
                  formData.aktifMi !== (baseState.aktifMi !== undefined ? baseState.aktifMi : true) ||
                  (formData.varsayilanStokTakipTuru || '') !== (baseState.varsayilanStokTakipTuru || '') ||
                  JSON.stringify([...(formData.ozellikTanimiIds || [])].sort()) !== JSON.stringify([...(baseState.ozellikTanimiIds || [])].sort());

  useEffect(() => {
    if (onDirtyChange) onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const generateKod = async (ad) => {
    if (!ad || ad.length < 2) return;
    setKodLoading(true);
    try {
      const res = await axios.get(`/api/UrunVeHizmetGruplari/kod-uret?ad=${encodeURIComponent(ad)}`);
      if (res.data && res.data.kod) {
        setFormData(prev => ({ ...prev, kod: res.data.kod }));
        clearError('kod');
      }
    } catch (err) {
      console.error('Kod üretme hatası:', err);
    } finally {
      setKodLoading(false);
    }
  };

  const handleFieldBlur = (name: string, value: any) => {
    const errorMsg = validateUrunGrupField(name, value, formData, t);
    if (errorMsg) {
      setFieldError(name, errorMsg);
    } else {
      clearError(name);
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      const errorMsg = validateUrunGrupField(name, value, { ...formData, [name]: value }, t);
      if (errorMsg) {
        setFieldError(name, errorMsg);
      } else {
        clearError(name);
      }
    }
  };

  const handleNameBlur = () => {
    if (!editingId && !formData.kod && formData.ad) {
      generateKod(formData.ad);
    }
    handleFieldBlur('ad', formData.ad);
  };

  const executeSave = async (payload: any, altGruplariDaGuncelle = false) => {
    setSaving(true);
    if (onSavingChange) onSavingChange(true);
    payload.altGruplariDaGuncelle = altGruplariDaGuncelle;
    
    try {
      let res;
      if (editingId) {
        res = await axios.put(`/api/UrunVeHizmetGruplari/${editingId}`, payload);
        onSuccess(editingId);
      } else {
        res = await axios.post('/api/UrunVeHizmetGruplari', payload);
        if (keepOpenForChild) {
          toast.success(t('auto_kayit_basariyla_eklendi', 'Kayıt başarıyla eklendi. Şimdi alt kayıt ekleyebilirsiniz.'));
          setFormData(prev => ({
            ...prev,
            kod: '',
            ad: '',
            tekilAd: '',
            ustGrupId: res.data.id
          }));
          setSaveCount(prev => prev + 1);
          clearErrors();
          setTimeout(() => {
            adInputRef.current?.focus();
          }, 100);
          onSuccess(res.data.id, true);
        } else {
          onSuccess(res.data.id);
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.errors) {
        const errorNodes = Object.entries(err.response.data.errors).map(([key, msgs]: [string, any], index) => (
          <li key={index}>
            <strong>{key}:</strong> {Array.isArray(msgs) ? msgs.join(', ') : msgs}
          </li>
        ));
        
        setErrorDialog({
          isOpen: true,
          title: 'Doğrulama Hatası',
          message: (
            <div>
              <p>{t('auto_lutfen_asagidaki_hat_e2d2')}</p>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                {errorNodes}
              </ul>
            </div>
          )
        });
      } else {
        const errorDetail = err.response?.data?.detail || err.response?.data?.mesaj || err.response?.data?.title;
        const fallbackMsg = err.message || String(err);
        const fullDump = err.response?.data ? JSON.stringify(err.response.data, null, 2) : '';

        setErrorDialog({
          isOpen: true,
          title: 'İşlem Başarısız',
          message: (
            <div>
              <p>{t('auto_beklenmeyen_bir_hata_7cd9')}</p>
              <div style={{ marginTop: '10px', padding: '10px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '13px', overflowX: 'auto' }}>
                <strong>Mesaj:</strong> {errorDetail || fallbackMsg}
                {fullDump && (
                  <pre style={{ marginTop: '8px', fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                    {fullDump}
                  </pre>
                )}
                {!err.response && err.stack && (
                  <pre style={{ marginTop: '8px', fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                    {err.stack}
                  </pre>
                )}
              </div>
            </div>
          )
        });
      }
    } finally {
      setSaving(false);
      if (onSavingChange) onSavingChange(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const formValidation = validateUrunGrupForm(formData, t);
    if (!formValidation.isValid) {
      setErrors(formValidation.errors);
      toast.error(t('auto_lutfen_zorunlu_alanlari_doldurun', 'Lütfen zorunlu alanları doldurun.'));
      return;
    }

    const getStokTakipTuruId = (tStr) => {
      switch(tStr) {
        case 'MiktarBazli': return 1;
        case 'SeriNoBazli': return 2;
        case 'LotNoBazli': return 3;
        case 'Takipsiz': return 4;
        default: return parseInt(tStr, 10) || 1;
      }
    };

    const payload = {
      ...formData,
      ustGrupId: formData.ustGrupId ? Number(formData.ustGrupId) : null,
      kdvGrubuId: formData.kdvGrubuId ? Number(formData.kdvGrubuId) : null,
      varsayilanBirimId: formData.varsayilanBirimId ? Number(formData.varsayilanBirimId) : null,
      tur: Number(formData.tur) || 1,
      varsayilanStokTakipTuru: getStokTakipTuruId(formData.varsayilanStokTakipTuru)
    };

    if (editingId) {
      const initialKdv = initialData?.kdvGrubuId ? String(initialData.kdvGrubuId) : '';
      const formKdv = formData.kdvGrubuId ? String(formData.kdvGrubuId) : '';
      const initialBirim = initialData?.varsayilanBirimId ? String(initialData.varsayilanBirimId) : '';
      const formBirim = formData.varsayilanBirimId ? String(formData.varsayilanBirimId) : '';
      
      const kdvChanged = formKdv !== initialKdv;
      const birimChanged = formBirim !== initialBirim;
      const stokTakipChanged = formData.varsayilanStokTakipTuru !== getStokTakipTuruStr(initialData?.varsayilanStokTakipTuru);

      if (kdvChanged || birimChanged || stokTakipChanged) {
        setDescendantConfirmDialog({
          isOpen: true,
          payload: payload
        });
        return;
      }
    }

    executeSave(payload, false);
  };

  const [activeTabId, setActiveTabId] = useState<string>('genel');

  const tabs = [
    {
      id: 'genel',
      label: t('auto_genel_bilgiler', 'Genel Bilgiler'),
      icon: <User size={18} />,
      content: (
        <div>
          <div className="form-grid">
            {GrupFormStrategyFactory.getStrategy(formData.tur || 1).getFields().filter((f: any) => f.type !== 'checkbox' && f.type !== 'custom-ozellik').map((field: any) => {
              if (field.type === 'select-grup') {
                return (
                  <div className="form-group" key={field.id}>
                    <label>{t(field.label, field.label)}</label>
                    <UrunGrupSecici 
                        key={`grup-secici-${saveCount}`}
                        value={formData[field.name]}
                        onChange={(val: any) => handleFieldChange(field.name, val)}
                        tur={formData.tur || 1}
                        editingId={editingId}
                        disabled={!!(editingId && gruplar.find((g: any) => g.id === editingId)?.altGrupSayisi > 0)}
                        hideExtraAction={true}
                    />
                    <FieldError error={errors[field.name]} />
                  </div>
                );
              }

              if (field.type === 'select-kdv') {
                return (
                  <div className="form-group" key={field.id}>
                    <label>
                      {t(field.label, field.label)}
                    </label>
                    <KdvSecici
                      value={formData[field.name]}
                      onChange={(id) => handleFieldChange(field.name, id)}
                      kdvGruplari={kdvGruplari}
                      error={errors[field.name]}
                    />
                    <FieldError error={errors[field.name]} />
                  </div>
                );
              }

              if (field.type === 'select') {
                return (
                  <div className="form-group" key={field.id}>
                    <label>{t(field.label, field.label)}</label>
                    <select 
                      className={`form-input ${errors[field.name] ? 'is-invalid' : ''}`}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      onBlur={() => handleFieldBlur(field.name, formData[field.name])}
                    >
                      {field.options && field.options.map((opt, idx) => (
                        <option key={idx} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <FieldError error={errors[field.name]} />
                  </div>
                );
              }

              if (field.type === 'custom-kod') {
                return (
                  <div className="form-group" key={field.id}>
                    <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t(field.label, field.label)}</span>
                      {kodLoading && <RefreshCw size={14} className="spin" style={{ color: 'var(--accent-primary)' }} />}
                    </label>
                    <div className="flex-row gap-8">
                      <input 
                        className={`form-input ${errors[field.name] ? 'is-invalid' : ''}`}
                        maxLength={20}
                        type="text" 
                        value={formData[field.name]}
                        onChange={(e) => handleFieldChange(field.name, e.target.value.toUpperCase())}
                        onBlur={() => handleFieldBlur(field.name, formData[field.name])}
                        style={{ flex: 1, textTransform: 'uppercase' }}
                        placeholder={t(field.placeholder, field.placeholder)}
                      />
                      {!editingId && (
                        <button type="button" className="btn btn-outline" onClick={() => generateKod(formData.ad)} title={t('auto_otomatik_uret', 'Otomatik Üret')} disabled={saving}>
                          <RefreshCw size={16} />
                        </button>
                      )}
                    </div>
                    <FieldError error={errors[field.name]} />
                  </div>
                );
              }

              if (field.type === 'custom-birim-tree') {
                return (
                  <div className="form-group" key={field.id}>
                    <label>{t(field.label, field.label)}</label>
                    <BirimSecici
                      value={formData[field.name]}
                      onChange={(id) => handleFieldChange(field.name, id)}
                      placeholder={t('auto_birim_seciniz', '-- Birim Seçiniz --')}
                    />
                    <FieldError error={errors[field.name]} />
                  </div>
                );
              }

              if (field.type === 'custom-stoktakip-select') {
                return (
                  <div className="form-group" key={field.id}>
                    <label>{t(field.label, field.label)}</label>
                    <StokTakipYontemiSecici
                      value={formData[field.name]}
                      onChange={(val) => handleFieldChange(field.name, val)}
                      error={errors[field.name]}
                    />
                    <FieldError error={errors[field.name]} />
                  </div>
                );
              }

              if (field.type === 'text') {
                return (
                  <div className="form-group" key={field.id}>
                    <label>{t(field.label, field.label)}</label>
                    <input 
                      ref={field.name === 'ad' ? adInputRef : undefined}
                      className={`form-input ${errors[field.name] ? 'is-invalid' : ''}`}
                      autoFocus={field.autoFocus}
                      type="text" 
                      value={formData[field.name]}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      onBlur={() => {
                        if (field.name === 'ad') handleNameBlur();
                        else handleFieldBlur(field.name, formData[field.name]);
                      }}
                      placeholder={t(field.placeholder, field.placeholder)}
                    />
                    <FieldError error={errors[field.name]} />
                  </div>
                );
              }

              return null;
            })}
          </div>

          <div style={{ display: 'flex', gap: '24px', marginTop: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
            {GrupFormStrategyFactory.getStrategy(formData.tur || 1).getFields().filter((f: any) => f.type === 'checkbox').map((field: any) => (
              <BaseSwitch 
                key={field.id}
                label={field.label}
                checked={!!formData[field.name]}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
              />
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'ozellikler',
      label: t('auto_kategori_ozellikleri', 'Kategori Özellikleri'),
      icon: <Sliders size={18} />,
      content: (
        <div className="flex flex-col flex-1">
          {GrupFormStrategyFactory.getStrategy(formData.tur || 1).getFields().filter((f: any) => f.type === 'custom-ozellik').map((field: any) => (
            <div className="form-group flex flex-col flex-1" key={field.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ margin: 0, fontWeight: '600' }}>{t(field.label, field.label)}</label>
                <button 
                  type="button" 
                  className="chip-primary" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setOzellikSearchText('');
                    setIsOzellikModalOpen(true);
                  }}
                >
                  <Plus size={14} /> {t('auto_ozellik_ekle', 'Özellik Ekle')}
                </button>
              </div>
              <div className="tab-card-container">
                {formData.ozellikTanimiIds.length === 0 ? (
                  <div className="tab-card-empty-state">
                    {t('auto_henuz_ozellik_secilmedi', 'Henüz özellik seçilmedi. "Özellik Ekle" butonunu kullanabilirsiniz.')}
                  </div>
                ) : (
                  formData.ozellikTanimiIds.map(id => {
                    const o = ozellikler.find(x => x.id === id);
                    if (!o) return null;
                    return (
                      <div key={id} className="chip-primary" style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{o.ad}</span>
                        <span style={{ fontSize: '11px', opacity: 0.8 }}>({o.varyantIcinKullanilirMi ? t('auto_varyant', 'Varyant') : t('auto_teknik', 'Teknik')})</span>
                        <button 
                          type="button" 
                          onClick={() => setFormData(prev => ({...prev, ozellikTanimiIds: prev.ozellikTanimiIds.filter(x => x !== id)}))}
                          style={{ 
                            background: 'none', border: 'none', padding: 0, 
                            display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'inherit', opacity: 0.7 
                          }}
                          title={t('auto_kaldir', 'Kaldır')}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )
    }
  ];

  const pageTitle = editingId 
    ? (formData.tur === 2 ? t('auto_hizmet_grubu_duzenle', 'Hizmet Grubu Düzenle') : t('auto_urun_grubu_duzenle', 'Ürün Grubu Düzenle')) 
    : (formData.tur === 2 ? t('auto_yeni_hizmet_grubu', 'Yeni Hizmet Grubu') : t('auto_yeni_urun_grubu', 'Yeni Ürün Grubu'));

  const recordTitle = formData.ad || pageTitle;
  const formBreadcrumbItems = useAppBreadcrumbs({ recordTitle });

  return (
    <>
      <BaseCardPage
        id="urunGrupForm"
        onSubmit={handleSubmit}
        title={pageTitle}
        breadcrumb={<Breadcrumb items={formBreadcrumbItems} size="sm" />}
        isSaving={saving}
        onSave={handleSubmit}
        onClose={onCancel}
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
        footerExtra={
          !editingId ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
              <input 
                type="checkbox" 
                checked={keepOpenForChild}
                onChange={(e) => setKeepOpenForChild(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
              />
              {t('auto_kaydettikten_sonra_alt_grup', 'Kaydettikten sonra bu kayda alt grup ekle')}
            </label>
          ) : null
        }
      />
      
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .tree-node { display: flex; align-items: center; padding: 8px 12px; cursor: pointer; font-size: 13px; color: var(--text-primary); transition: background 0.15s; }
        .tree-node:hover { background: var(--hover-bg, rgba(0,0,0,0.02)); }
        .tree-node.branch { color: var(--text-secondary); }
        .tree-node.leaf:hover { background: var(--accent-light); color: var(--accent-primary); }
        .tree-node.selected { background: var(--accent-light); color: var(--accent-primary); font-weight: 500; }
        .tree-icon-wrapper { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; margin-right: 4px; border-radius: 4px; color: var(--text-secondary); }
        .tree-icon-wrapper:hover { background: rgba(0,0,0,0.05); }
        .tree-node-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tree-check-icon { color: var(--accent-primary); margin-left: 8px; }
        .fade-in-fast { animation: fadeInFast 0.2s ease-out; }
        @keyframes fadeInFast { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <BasePopup 
        isOpen={isOzellikModalOpen} 
        onClose={() => setIsOzellikModalOpen(false)} 
        title={t('auto_kategori_ozellikleri_sablonlar_secimi', 'Kategori Özellikleri (Şablonlar) Seçimi')}
        modalSize="md"
        hideFooter={true}
      >
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder={t('auto_ozelliklerde_ara', 'Özelliklerde ara...')} 
            value={ozellikSearchText}
            onChange={(e) => setOzellikSearchText(e.target.value)}
            style={{ 
              width: '100%', padding: '10px 14px 10px 38px', 
              borderRadius: '8px', border: '1px solid var(--glass-border)', 
              background: 'var(--bg-primary)', color: 'var(--text-primary)' 
            }}
          />
        </div>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '2px', 
          maxHeight: '350px',
          overflowY: 'auto',
          border: '1px solid var(--glass-border)',
          borderRadius: '8px',
          background: 'var(--bg-primary)'
        }}>
          {ozellikler
            .filter(o => o.ad.toLocaleLowerCase('tr-TR').includes(ozellikSearchText.toLocaleLowerCase('tr-TR')))
            .map(o => (
            <label key={o.id} style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', 
              fontSize: '14px', padding: '10px 16px', borderBottom: '1px solid var(--glass-border)',
              transition: 'background 0.2s', margin: 0
            }} className="tree-node">
              <input 
                type="checkbox" 
                checked={formData.ozellikTanimiIds.includes(o.id)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData(prev => ({
                    ...prev,
                    ozellikTanimiIds: checked 
                      ? [...prev.ozellikTanimiIds, o.id]
                      : prev.ozellikTanimiIds.filter(id => id !== o.id)
                  }));
                }}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', margin: 0 }}
              />
              <span style={{ flex: 1 }}>{o.ad}</span>
              <span style={{ 
                background: o.varyantIcinKullanilirMi ? 'var(--accent-light)' : 'var(--bg-secondary)', 
                color: o.varyantIcinKullanilirMi ? 'var(--accent-primary)' : 'var(--text-secondary)', 
                padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' 
              }}>
                {o.varyantIcinKullanilirMi ? t('auto_varyant', 'Varyant') : t('auto_teknik', 'Teknik')}
              </span>
            </label>
          ))}
          {ozellikler.filter(o => o.ad.toLocaleLowerCase('tr-TR').includes(ozellikSearchText.toLocaleLowerCase('tr-TR'))).length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              {t('auto_arama_kriterlerine_uygun_ozellik_bulunamadi', 'Arama kriterlerine uygun özellik bulununamadı.')}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button type="button" className="btn btn-primary" onClick={() => setIsOzellikModalOpen(false)}>
            {t('auto_tamamlandi', 'Tamamlandı')}
          </button>
        </div>
      </BasePopup>

      <AlertDialog
        isOpen={errorDialog.isOpen}
        onClose={() => setErrorDialog(prev => ({ ...prev, isOpen: false }))}
        type="error"
        title={errorDialog.title}
        message={errorDialog.message}
      />
      
      <AlertDialog
        isOpen={descendantConfirmDialog.isOpen}
        onClose={() => setDescendantConfirmDialog({ isOpen: false, payload: null })}
        type="confirm"
        showCancel={true}
        title={t('auto_alt_gruplari_guncelle', 'Alt Grupları Güncelle')}
        message={t('auto_alt_gruplari_guncelle_soru', 'KDV Grubu, Varsayılan Birim veya Stok Takip Türü ayarlarında değişiklik yaptınız. Bu değişikliğin, eski değerinizle aynı ayara sahip olan alt gruplara da yansıtılmasını ister misiniz?')}
        confirmText={t('auto_evet_alt_gruplara_da_uygula', 'Evet, Alt Gruplara da Uygula')}
        cancelText={t('auto_iptal', 'İptal')}
        onConfirm={() => {
          const payload = descendantConfirmDialog.payload;
          setDescendantConfirmDialog({ isOpen: false, payload: null });
          executeSave(payload, true);
        }}
        extraActions={
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={() => {
              const payload = descendantConfirmDialog.payload;
              setDescendantConfirmDialog({ isOpen: false, payload: null });
              executeSave(payload, false);
            }}
          >
            {t('auto_hayir_sadece_bu_grubu_guncelle', 'Hayır, Sadece Bu Grubu Güncelle')}
          </button>
        }
      />
    </>
  );
};

export default UrunGrupForm;
