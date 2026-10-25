/**
 * Webakus ERP - Ürün ve Hizmet Kartı Formu (UrunVeHizmetForm.tsx)
 * 
 * Başlıca Sorumlulukları:
 * - Ürün ve Hizmet kartlarının (Ürün, Hizmet, Sarf Malzemesi, Hammadde, Demirbaş, Yarı Mamul, Mamul, Paket/Set)
 *   oluşturulması ve düzenlenmesini yönetir.
 * - Kart Türü'nü (UrunVeHizmetTuruSeciciInput) form içerisinden dinamik olarak seçtirir ve form stratejisini
 *   (FormStrategyFactory) seçilen türe göre anında günceller.
 * - Temel bilgiler, fiyatlar, birimler, varyantlar, stok takibi ve barkod yönetimini sağlar.
 * - Material Design 3 standartlarına, modüler validasyona ve i18n altyapısına tam uyumludur.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Info, Layers, Barcode, Plus, Trash2, Edit2, Package, RefreshCw, 
  Save as SaveIcon, Check, X, ChevronDown as ChevronDownIcon
} from 'lucide-react';

import { 
  BaseCardPage, 
  UrunGrupSecici, 
  HizmetGrupSecici, 
  KdvSecici, 
  MarkaSecici, 
  StokTakipYontemiSecici, 
  TedarikDurumuSecici, 
  BirimSecici, 
  UrunVeHizmetTuruSeciciInput,
  ParaBirimiSecici,
  AlertDialog, 
  BarcodeScannerInput, 
  BarcodeScannerModal, 
  BaseButton, 
  DataTable, 
  BasePopup, 
  Breadcrumb,
  CancelButton,
  useDocumentDraft,
  BaseInput,
  HarfDonusumu,
  replaceTemplateTag,
  applyCasing
} from '@akalin/ui';
import DynamicFormRenderer, { getIcon } from '../forms/DynamicFormRenderer';
import httpClient from '../services/httpClient';
import { urunVeHizmetKartlariService } from '../services/UrunVeHizmetKartlariService';
import FormStrategyFactory from './urunVeHizmetStrategies/FormStrategyFactory';
import { getUrunVeHizmetDefaultValues } from '../defaults/urunVeHizmetDefaultValue';
import { validateUrunVeHizmetField, validateUrunVeHizmetForm } from '../validators/urunVeHizmetValidation';
import { useAppBreadcrumbs } from '../hooks/useAppBreadcrumbs';

export interface UrunVeHizmetFormProps {
  initialData?: any;
  onSuccess?: (id?: number | string) => void;
  onCancel?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onTitleChange?: (title: string) => void;
}

const UrunVeHizmetForm: React.FC<UrunVeHizmetFormProps> = ({ 
  initialData, 
  onSuccess, 
  onCancel, 
  onDirtyChange, 
  onTitleChange 
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const id = initialData?.id;
  const isEditing = !!id;

  const defaultValues = useMemo(() => {
    return getUrunVeHizmetDefaultValues({ initialData });
  }, [initialData]);

  const [formData, setFormData] = useState<any>(() => getUrunVeHizmetDefaultValues({ initialData }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modül & Lookup Verileri
  const [barkodlar, setBarkodlar] = useState<any[]>([]);
  const [gruplar, setGruplar] = useState<any[]>([]);
  const [kdvGruplari, setKdvGruplari] = useState<any[]>([]);
  const [birimler, setBirimler] = useState<any[]>([]);
  const [firmaAyarlari, setFirmaAyarlari] = useState<any>({});
  const [markalar, setMarkalar] = useState<any[]>([]);
  const [ozellikSablonlari, setOzellikSablonlari] = useState<any[]>([]);
  const [ozellikDegerleri, setOzellikDegerleri] = useState<any>({});
  const [aktifModuller, setAktifModuller] = useState<any[]>([]);

  // Barkod / Ambalaj Popupları
  const [isBarkodFormOpen, setIsBarkodFormOpen] = useState(false);
  const [editBarkodIdx, setEditBarkodIdx] = useState<number | null>(null);
  const [yeniBarkod, setYeniBarkod] = useState({ barkod: '', tip: '', birimId: '', birimTipi: '' });
  const [isAmbalajBirimDropdownOpen, setIsAmbalajBirimDropdownOpen] = useState(false);
  const ambalajBirimDropdownRef = useRef<HTMLDivElement>(null);

  // Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<string | null>(null);

  // Dialog & Alert State
  const [alertConfig, setAlertConfig] = useState<any>({ isOpen: false, type: 'info', title: '', message: null });

  const ureticiKoduRef = useRef<HTMLInputElement>(null);

  const hasBarkodModulu = aktifModuller.includes('barkod_yonetimi');
  const turId = typeof formData.urunVeHizmetTuru === 'number' ? formData.urunVeHizmetTuru : parseInt(formData.urunVeHizmetTuru, 10) || 1;
  const isUrunType = [1, 3, 4, 5, 6, 7, 8].includes(turId);

  // Strategy Pattern
  const strategy = useMemo(() => {
    return FormStrategyFactory.getStrategy(formData.urunVeHizmetTuru, hasBarkodModulu);
  }, [formData.urunVeHizmetTuru, hasBarkodModulu]);

  const rawTabs = useMemo(() => strategy.getTabs(), [strategy]);
  const [activeTabId, setActiveTabId] = useState<string>(rawTabs[0]?.id || 'genel');

  // Tür değiştiğinde sekme geçerliliğini koru
  useEffect(() => {
    const currentTabs = strategy.getTabs();
    if (currentTabs.length > 0 && !currentTabs.find(t => t.id === activeTabId)) {
      setActiveTabId(currentTabs[0].id);
    }
  }, [strategy, activeTabId]);

  // Başlık / Ürün Açıklaması Düzenleme State'i
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [isAdManuallyEdited, setIsAdManuallyEdited] = useState(false);

  const handleStartEditTitle = useCallback(() => {
    setTempTitle(formData.ad || '');
    setIsEditingTitle(true);
  }, [formData.ad]);

  const handleSaveTitle = useCallback(() => {
    const trimmed = tempTitle.trim();
    if (!trimmed) {
      toast.error(t('auto_urun_adi_zorunlu', 'Ürün/Hizmet Adı zorunludur'));
      return;
    }
    setFormData((prev: any) => ({ ...prev, ad: trimmed }));
    setIsAdManuallyEdited(true);
    setIsEditingTitle(false);
    if (onDirtyChange) onDirtyChange(true);
    if (errors.ad) {
      setErrors((prev: any) => {
        const next = { ...prev };
        delete next.ad;
        return next;
      });
    }
  }, [tempTitle, t, onDirtyChange, errors.ad]);

  const handleCancelTitle = useCallback(() => {
    setTempTitle(formData.ad || '');
    setIsEditingTitle(false);
  }, [formData.ad]);

  // Sayfa başlığı hesaplama
  const productRecordTitle = formData.ad || (isEditing ? t('Ürün/Hizmet Düzenle') : t('Yeni Ürün/Hizmet'));

  const headerTitleNode = useMemo(() => {
    if (isEditingTitle) {
      return (
        <div className="title-edit-box">
          <input
            type="text"
            className="title-edit-input"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveTitle();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancelTitle();
              }
            }}
            placeholder={t('auto_urun_aciklamasi_giriniz', 'Ürün açıklaması / adı giriniz...')}
            autoFocus
          />
          <button
            type="button"
            onClick={handleSaveTitle}
            className="title-edit-action-btn btn-save"
            title={t('Kaydet')}
            aria-label={t('Kaydet')}
          >
            <Check size={16} />
          </button>
          <button
            type="button"
            onClick={handleCancelTitle}
            className="title-edit-action-btn btn-cancel"
            title={t('Vazgeç')}
            aria-label={t('Vazgeç')}
          >
            <X size={16} />
          </button>
        </div>
      );
    }
    return productRecordTitle;
  }, [isEditingTitle, tempTitle, handleSaveTitle, handleCancelTitle, t, productRecordTitle]);

  // Alt Başlık / Kart Açıklaması Düzenleme State'i
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [tempSubtitle, setTempSubtitle] = useState('');

  const handleStartEditSubtitle = useCallback(() => {
    setTempSubtitle(formData.aciklama || '');
    setIsEditingSubtitle(true);
  }, [formData.aciklama]);

  const handleSaveSubtitle = useCallback(() => {
    const trimmed = tempSubtitle.trim();
    setFormData((prev: any) => ({ ...prev, aciklama: trimmed }));
    setIsEditingSubtitle(false);
    if (onDirtyChange) onDirtyChange(true);
  }, [tempSubtitle, onDirtyChange]);

  const handleCancelSubtitle = useCallback(() => {
    setTempSubtitle(formData.aciklama || '');
    setIsEditingSubtitle(false);
  }, [formData.aciklama]);

  const stockSubtitleText = t(
    'auto_urun_stock_aciklama',
    'Ürün kartı detayları, fiyatlandırma, barkod ve stok takip yönetimi'
  );

  const headerSubtitleNode = useMemo(() => {
    if (isEditingSubtitle) {
      return (
        <div className="title-edit-box subtitle-edit-box">
          <input
            type="text"
            className="title-edit-input subtitle-edit-input"
            value={tempSubtitle}
            onChange={(e) => setTempSubtitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveSubtitle();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancelSubtitle();
              }
            }}
            placeholder={t('auto_urun_aciklamasi_giriniz_sub', 'Ürün açıklaması / alt başlığı giriniz...')}
            autoFocus
          />
          <button
            type="button"
            onClick={handleSaveSubtitle}
            className="title-edit-action-btn subtitle-edit-action-btn btn-save"
            title={t('Kaydet')}
            aria-label={t('Kaydet')}
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            onClick={handleCancelSubtitle}
            className="title-edit-action-btn subtitle-edit-action-btn btn-cancel"
            title={t('Vazgeç')}
            aria-label={t('Vazgeç')}
          >
            <X size={14} />
          </button>
        </div>
      );
    }

    if (formData.aciklama && formData.aciklama.trim()) {
      return <span>{formData.aciklama}</span>;
    }

    return <span className="text-muted opacity-75 italic">{stockSubtitleText}</span>;
  }, [isEditingSubtitle, tempSubtitle, handleSaveSubtitle, handleCancelSubtitle, formData.aciklama, stockSubtitleText, t]);

  // Breadcrumb başlığı: Üretici Kodu öncelikli, yoksa ürün adı veya varsayılan başlık
  const productBreadcrumbTitle = useMemo(() => {
    const ureticiKodu = (formData.ureticiKodu || formData.UreticiKodu || '').toString().trim();
    if (ureticiKodu) return ureticiKodu;
    const ad = (formData.ad || formData.Ad || '').toString().trim();
    if (ad) return ad;
    return isEditing ? (id ? `#${id}` : t('Ürün/Hizmet Düzenle')) : t('Yeni Ürün/Hizmet');
  }, [formData.ureticiKodu, formData.UreticiKodu, formData.ad, formData.Ad, isEditing, id, t]);

  useEffect(() => {
    if (onTitleChange) {
      onTitleChange(productBreadcrumbTitle);
    }
  }, [productBreadcrumbTitle, onTitleChange]);

  // Draft Koruması
  const { clearDraft } = useDocumentDraft(
    `draft_urunvehizmet`,
    { formData, barkodlar, ozellikDegerleri },
    (draft) => {
      if (draft.formData) {
        const nextData = { ...draft.formData };
        if (location.state?.newlyAddedUrunGrupId) {
          nextData.urunVeHizmetGrubuId = location.state.newlyAddedUrunGrupId;
        }
        setFormData(nextData);
      } else if (location.state?.newlyAddedUrunGrupId) {
        setFormData(prev => ({ ...prev, urunVeHizmetGrubuId: location.state.newlyAddedUrunGrupId }));
      }
      
      if (draft.barkodlar) setBarkodlar(draft.barkodlar);
      if (draft.ozellikDegerleri) setOzellikDegerleri(draft.ozellikDegerleri);
    },
    !id
  );

  // Lookup Verilerini Yükle
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gruplarRes, kdvRes, birimlerRes, ayarlarRes, markalarRes, modullerRes] = await Promise.all([
          httpClient.get('/api/UrunVeHizmetGruplari'),
          httpClient.get('/api/KdvGruplari/aktif-oranlar'),
          httpClient.get('/api/Birimler'),
          httpClient.get('/api/FirmaAyarlari/UrunVeHizmetler').catch(() => ({ data: {} })),
          httpClient.get('/api/Markalar').catch(() => ({ data: [] })),
          httpClient.get('/api/Moduller/aktif').catch(() => ({ data: [] }))
        ]);
        setGruplar(gruplarRes.data || []);
        setKdvGruplari(kdvRes.data || []);
        setBirimler(birimlerRes.data || []);
        setFirmaAyarlari(ayarlarRes.data || {});
        setMarkalar(markalarRes.data || []);
        setAktifModuller(modullerRes.data || []);
      } catch (err) {
        console.error('Lookup verileri yüklenemedi:', err);
      }
    };
    fetchData();
  }, []);

  // initialData veya Parametreler Yüklendiğinde State Güncelle
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (id) {
        setLoading(true);
        try {
          const data = await urunVeHizmetKartlariService.getById(id);
          if (isMounted) {
            setFormData(getUrunVeHizmetDefaultValues({ initialData: data }));
            
            if (data.ozellikler) {
              const initialVals: Record<string, string> = {};
              data.ozellikler.forEach((o: any) => {
                initialVals[o.ozellikTanimiId] = o.deger;
              });
              setOzellikDegerleri(initialVals);
            }
            setBarkodlar(data.barkodlar || []);
          }
        } catch (err) {
          console.error('Kayıt detayları getirilemedi:', err);
        } finally {
          if (isMounted) setLoading(false);
        }
      } else if (initialData && Object.keys(initialData).length > 0) {
        setFormData(getUrunVeHizmetDefaultValues({ initialData }));
        const ozelliklerList = initialData.ozellikler || initialData.ozellikDegerleri;
        if (ozelliklerList && Array.isArray(ozelliklerList)) {
          const initialVals: Record<string, string> = {};
          ozelliklerList.forEach((o: any) => {
            initialVals[o.ozellikTanimiId] = o.deger;
          });
          setOzellikDegerleri(initialVals);
        }
        setBarkodlar(initialData.barkodlar || []);
      }
    };
    
    loadData();
    return () => { isMounted = false; };
  }, [id, initialData]);

  // Yeni grup eklendikten sonra gelen state yönetimi
  useEffect(() => {
    if (location.state?.newlyAddedUrunGrupId) {
      const newId = location.state.newlyAddedUrunGrupId;
      window.history.replaceState({}, document.title);
      
      setFormData(prev => ({ ...prev, urunVeHizmetGrubuId: newId }));
      
      httpClient.get(`/api/UrunVeHizmetGruplari/${newId}`).then(res => {
        if (res.data) {
          setFormData(prev => ({
            ...prev,
            kdvGrubuId: prev.kdvGrubuId || res.data.kdvGrubuId || '',
            birimId: prev.birimId || res.data.varsayilanBirimId || '',
            stokTakipTuru: prev.stokTakipTuru === 'MiktarBazli' ? (res.data.varsayilanStokTakipTuru === 2 ? 'SeriNoBazli' : (res.data.varsayilanStokTakipTuru === 3 ? 'LotNoBazli' : 'MiktarBazli')) : prev.stokTakipTuru
          }));
          
          setTimeout(() => {
            if (ureticiKoduRef.current) {
              ureticiKoduRef.current.focus();
            }
          }, 100);
        }
      }).catch(() => {});
    }
  }, [location.state?.newlyAddedUrunGrupId]);

  // Özellik Şablonlarını Yükle
  useEffect(() => {
    let isMounted = true;
    const fetchSablonlar = async () => {
      if (!formData.urunVeHizmetGrubuId) {
        if (isMounted) setOzellikSablonlari([]);
        return;
      }
      try {
        const data = await urunVeHizmetKartlariService.getSablonlar(formData.urunVeHizmetGrubuId);
        if (isMounted) {
          const fetchedSablonlar = Array.isArray(data) ? data : (data?.data || data?.veriler || []);
          setOzellikSablonlari(fetchedSablonlar);

          setOzellikDegerleri(prev => {
            const nextDegerler = { ...prev };
            let changed = false;
            fetchedSablonlar.forEach((s: any) => {
              if (s.varsayilanDeger && !nextDegerler[s.id]) {
                nextDegerler[s.id] = s.varsayilanDeger;
                changed = true;
              }
            });
            if (changed) {
              setTimeout(() => {
                setFormData(fd => regenerateCodeAndDesc({ ...fd }, nextDegerler, fetchedSablonlar));
              }, 0);
              return nextDegerler;
            }
            return prev;
          });

          setFormData(prev => regenerateCodeAndDesc({ ...prev }, ozellikDegerleri, fetchedSablonlar));
        }
      } catch (err) {
        console.error('Özellik şablonları çekilemedi:', err);
      }
    };
    fetchSablonlar();
    return () => { isMounted = false; };
  }, [formData.urunVeHizmetGrubuId]);

  // Kod ve Açıklama Şablonunu Otomatik Üret
  const regenerateCodeAndDesc = (
    nextData: any, 
    currentOzellikDegerleri = ozellikDegerleri, 
    currentSablonlar = ozellikSablonlari, 
    explicitGroup: any = null, 
    explicitMarka: any = null
  ) => {
    const selectedGroup = explicitGroup || gruplar.find(g => String(g.id) === String(nextData.urunVeHizmetGrubuId));
    const selectedMarka = explicitMarka || markalar.find(m => String(m.id) === String(nextData.markaId));

    const applyOzellikler = (metin: string) => {
      return metin.replace(/\[Özellik (\d+)(?::([^\]]+))?\]/g, (match, p1, modifier) => {
        const index = parseInt(p1, 10) - 1;
        if (index >= 0 && index < currentSablonlar.length) {
          const sablonId = currentSablonlar[index].id;
          const val = currentOzellikDegerleri[sablonId] || '';
          return modifier ? applyCasing(val, modifier as HarfDonusumu) : val;
        }
        return '';
      });
    };

    if (!isEditing) {
      const kodSablonu = firmaAyarlari.KodSablonu || firmaAyarlari.kodSablonu || '[Ürün Grubu Kısa Kod]-[Sayaç]';
      let yeniKod = kodSablonu;
      yeniKod = replaceTemplateTag(yeniKod, 'Ürün Grubu Kısa Kod', selectedGroup?.kod || '');
      yeniKod = replaceTemplateTag(yeniKod, 'Ürün Grubu Tekil', selectedGroup?.tekilAd || selectedGroup?.ad || '');
      yeniKod = replaceTemplateTag(yeniKod, 'Ürün Grubu', selectedGroup?.ad || '');
      yeniKod = replaceTemplateTag(yeniKod, 'Üretici Kodu', nextData.ureticiKodu || '');
      yeniKod = replaceTemplateTag(yeniKod, 'Marka Kısa Kod', selectedMarka?.kod || '');
      yeniKod = replaceTemplateTag(yeniKod, 'Marka', selectedMarka?.ad || '');
      yeniKod = replaceTemplateTag(yeniKod, 'Ürün Türü Kısa Kod', firmaAyarlari.UrunTuru_1_KisaKod || firmaAyarlari.urunTuru_1_KisaKod || 'ÜR'); 
      yeniKod = replaceTemplateTag(yeniKod, 'Sayaç', '????');
      yeniKod = applyOzellikler(yeniKod);
      nextData.kod = yeniKod.replace(/-+/g, '-').replace(/^-|-$/g, '');
    }

    if (!isEditing && !isAdManuallyEdited) {
      const aciklamaSablonu = firmaAyarlari.AciklamaSablonu || firmaAyarlari.aciklamaSablonu || '[Marka] [Ürün Grubu Tekil]';
      let yeniAciklama = aciklamaSablonu;
      yeniAciklama = replaceTemplateTag(yeniAciklama, 'Ürün Grubu Kısa Kod', selectedGroup?.kod || '');
      yeniAciklama = replaceTemplateTag(yeniAciklama, 'Ürün Grubu Tekil', selectedGroup?.tekilAd || selectedGroup?.ad || '');
      yeniAciklama = replaceTemplateTag(yeniAciklama, 'Ürün Grubu', selectedGroup?.ad || '');
      yeniAciklama = replaceTemplateTag(yeniAciklama, 'Üretici Kodu', nextData.ureticiKodu || '');
      yeniAciklama = replaceTemplateTag(yeniAciklama, 'Marka Kısa Kod', selectedMarka?.kod || '');
      yeniAciklama = replaceTemplateTag(yeniAciklama, 'Marka', selectedMarka?.ad || '');
      yeniAciklama = replaceTemplateTag(yeniAciklama, 'Ürün Türü Kısa Kod', firmaAyarlari.UrunTuru_1_KisaKod || firmaAyarlari.urunTuru_1_KisaKod || 'ÜR'); 
      yeniAciklama = applyOzellikler(yeniAciklama);
      nextData.ad = yeniAciklama.replace(/\s+/g, ' ').trim();
    }

    return nextData;
  };

  const handleOzellikChange = (sablonId: number | string, deger: any) => {
    const nextDegerleri = { ...ozellikDegerleri, [sablonId]: deger };
    setOzellikDegerleri(nextDegerleri);
    setFormData(prev => regenerateCodeAndDesc({ ...prev }, nextDegerleri));
    if (onDirtyChange) onDirtyChange(true);
  };

  const validateField = (name: string, value: any) => validateUrunVeHizmetField(name, value, formData, t);

  const handleBlur = (name: string, value: any) => {
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error || '' }));
  };

  const handleChange = (name: string, value: any) => {
    setFormData(prev => {
      let next = { ...prev, [name]: value };
      if (['ureticiKodu', 'markaId'].includes(name)) {
        next = regenerateCodeAndDesc(next);
      }
      return next;
    });

    if (errors[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error || '' }));
    }

    if (onDirtyChange) onDirtyChange(true);
  };

  const handleScanResult = (text: string) => {
    if (scannerTarget === 'barkod') {
      handleChange('barkod', text);
    } else if (scannerTarget === 'yeniBarkod') {
      setYeniBarkod(prev => ({ ...prev, barkod: text }));
    }
  };

  // Barkod / Ambalaj İşlemleri
  const generateGtin14 = (baseBarkod: string, indicator: number) => {
    if (!baseBarkod || baseBarkod.length !== 13) return null;
    const base = indicator.toString() + baseBarkod.substring(0, 12);
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      const digit = parseInt(base[i], 10);
      sum += digit * (i % 2 === 0 ? 3 : 1);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return base + checkDigit;
  };

  const handleOpenBarkodForm = (idx: number | null = null) => {
    if (idx !== null) {
      setEditBarkodIdx(idx);
      setYeniBarkod(barkodlar[idx]);
    } else {
      if (!formData.barkod || formData.barkod.length !== 13) {
        toast.error(t("Lütfen önce 'Genel' sekmesinde 13 haneli bir ana barkod tanımlayın."));
        return;
      }
      const baseCore = formData.barkod.substring(0, 12);
      const existingIndicators = barkodlar
        .filter((b: any) => b.barkod && b.barkod.length === 14 && b.barkod.substring(1, 13) === baseCore)
        .map((b: any) => parseInt(b.barkod[0], 10));
        
      let indicator = 1;
      while(existingIndicators.includes(indicator) && indicator <= 8) {
        indicator++;
      }
      if (indicator > 8) {
        toast.error(t('Bu ana barkod için maksimum sayıda (8) GTIN-14 türetilmiştir.'));
        return;
      }
      const newBarcode = generateGtin14(formData.barkod, indicator);

      setEditBarkodIdx(null);
      const usedBirimIds = barkodlar.map((bk: any) => parseInt(bk.birimId, 10)).filter((idNum: number) => !isNaN(idNum));
      
      const selectedBirim = birimler.find((b: any) => b.id === parseInt(formData.birimId, 10));
      const localSubBirimler = selectedBirim ? birimler.filter((b: any) => b.tipAdi === selectedBirim.tipAdi && b.id !== selectedBirim.id) : [];
      const availableSubBirimler = localSubBirimler.filter((b: any) => !usedBirimIds.includes(b.id));
      
      const nextBirimId = availableSubBirimler.length > 0 ? availableSubBirimler[0].id : '';
      setYeniBarkod({ barkod: newBarcode || '', tip: 'GTIN-14', birimId: nextBirimId, birimTipi: '' });
    }
    setIsBarkodFormOpen(true);
  };

  const handleAddBarkod = () => {
    if (!yeniBarkod.barkod) return;
    
    if (editBarkodIdx !== null) {
      const updated = [...barkodlar];
      updated[editBarkodIdx] = { ...yeniBarkod };
      setBarkodlar(updated);
    } else {
      setBarkodlar([...barkodlar, { ...yeniBarkod }]);
    }
    setIsBarkodFormOpen(false);
    if (onDirtyChange) onDirtyChange(true);
  };

  const handleRemoveBarkod = (idx: number) => {
    setBarkodlar(barkodlar.filter((_, i) => i !== idx));
    if (onDirtyChange) onDirtyChange(true);
  };

  const handleFetchHareketler = useCallback(async ({ page, pageSize }: any) => {
    try {
      const data = await urunVeHizmetKartlariService.getHareketler(id, {
        sayfaNo: page,
        sayfaBoyutu: pageSize,
        sirala: 'id',
        yon: 'desc'
      });
      return { data: data.veriler || [] };
    } catch (err) {
      console.error(err);
      return { data: [] };
    }
  }, [id]);

  // Form Gönderme
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();

    const formValidation = validateUrunVeHizmetForm(formData, t);
    if (!formValidation.isValid) {
      setErrors(formValidation.errors);
      toast.error(t('Lütfen zorunlu alanları eksiksiz doldurunuz.'));
      return;
    }

    setSaving(true);

    const getTedarikDurumuId = (tStr: any) => {
      switch(tStr) {
        case 'Satista': return 1;
        case 'TedarikAsamasinda': return 2;
        case 'StoktaYok': return 3;
        case 'UretimdenKalkti': return 4;
        default: return parseInt(tStr, 10) || 1;
      }
    };

    const getStokTakipTuruId = (tStr: any) => {
      switch(tStr) {
        case 'MiktarBazli': return 1;
        case 'SeriNoBazli': return 2;
        case 'LotNoBazli': return 3;
        case 'Takipsiz': return 4;
        default: return parseInt(tStr, 10) || 1;
      }
    };

    const ozellikListesi = Object.keys(ozellikDegerleri)
      .map(key => ({ ozellikTanimiId: parseInt(key, 10), deger: String(ozellikDegerleri[key]) }))
      .filter(o => o.deger && o.deger.trim() !== '');

    const payload = {
      ...formData,
      aciklama: formData.aciklama ? String(formData.aciklama).trim() : null,
      barkod: formData.barkod ? String(formData.barkod).trim() : null,
      urunVeHizmetTuru: turId,
      urunVeHizmetGrubuId: formData.urunVeHizmetGrubuId ? parseInt(formData.urunVeHizmetGrubuId, 10) : null,
      kdvGrubuId: formData.kdvGrubuId ? parseInt(formData.kdvGrubuId, 10) : null,
      birimId: formData.birimId ? parseInt(formData.birimId, 10) : 0,
      markaId: formData.markaId ? parseInt(formData.markaId, 10) : null,
      satisFiyati: formData.satisFiyati ? parseFloat(formData.satisFiyati) : 0,
      toptanFiyati: formData.toptanFiyati ? parseFloat(formData.toptanFiyati) : 0,
      alisFiyati: formData.alisFiyati ? parseFloat(formData.alisFiyati) : 0,
      dovizCinsi: formData.dovizCinsi || 'TRY',
      karMarji: formData.karMarji ? parseFloat(formData.karMarji) : null,
      olusturulmaTarihi: formData.tarih ? new Date(formData.tarih).toISOString() : new Date().toISOString(),
      tedarikDurumu: getTedarikDurumuId(formData.tedarikDurumu),
      stokTakipTuru: getStokTakipTuruId(formData.stokTakipTuru),
      ozellikDegerleri: ozellikListesi,
      Barkodlar: barkodlar.map(b => ({
        ...b,
        birimId: b.birimId ? parseInt(b.birimId, 10) : null
      }))
    };

    try {
      let resultId;
      if (isEditing) {
        const result = await urunVeHizmetKartlariService.update(id, payload);
        resultId = result.id;
      } else {
        const result = await urunVeHizmetKartlariService.create(payload);
        resultId = result.id;
      }
      
      setSaving(false);
      clearDraft();
      toast.success(isEditing ? t('Ürün başarıyla güncellendi.') : t('Ürün başarıyla oluşturuldu.'));

      if (!isEditing && resultId) {
        const createdProduct = {
          id: resultId,
          ad: payload.ad,
          kod: payload.kod,
          ureticiKodu: payload.ureticiKodu,
          barkod: payload.barkod,
          barkodlar: barkodlar.map(b => b.barkod).filter(Boolean)
        };
        
        window.dispatchEvent(new CustomEvent('urun-created', { detail: createdProduct }));
        try {
          const bc = new BroadcastChannel('webakus_urun_channel');
          bc.postMessage({ type: 'urun-created', detail: createdProduct });
          bc.close();
        } catch(e) {}
      }

      if (onSuccess) onSuccess(resultId || id);
    } catch (err: any) {
      console.error('Kaydetme hatası:', err);
      setSaving(false);
      
      const title = err.response?.data?.title || t('Kayıt Hatası');
      const msg = err.response?.data?.mesaj || (err.message || t('İşlem gerçekleştirilirken bir hata oluştu.'));
      
      setAlertConfig({
        isOpen: true,
        type: (err.response?.status === 409 ? 'warning' : 'error'),
        title: title,
        message: msg
      });
    }
  };

  // Özel Alan Render Motoru (renderCustomField)
  const renderCustomField = (field: any, currentFormData: any, onFieldChange: any) => {
    // Kart Türü Seçici
    if (field.type === 'custom-urun-turu-select' || field.name === 'urunVeHizmetTuru') {
      return (
        <div className="form-group flex-1 flex-col relative" style={{ gridColumn: field.gridColumn }} key={field.id || field.name}>
          <label className="form-label">{typeof field.label === 'string' ? t(field.label) : field.label} {field.required && <span className="text-danger">*</span>}</label>
          <UrunVeHizmetTuruSeciciInput 
            value={currentFormData.urunVeHizmetTuru}
            onChange={(selectedTurId) => {
              handleChange('urunVeHizmetTuru', selectedTurId);
            }}
            error={errors.urunVeHizmetTuru}
          />
          {errors.urunVeHizmetTuru && <div className="error-text text-12 text-danger mt-4">{errors.urunVeHizmetTuru}</div>}
        </div>
      );
    }

    // Marka Seçici
    if (field.type === 'custom-marka-select' || field.name === 'markaId') {
      return (
        <div className="form-group flex-1 flex-col relative" style={{ gridColumn: field.gridColumn }} key={field.id || field.name}>
          <label className="form-label">{typeof field.label === 'string' ? t(field.label) : field.label}</label>
          <MarkaSecici 
            value={currentFormData.markaId} 
            onChange={(val: any, selectedMarka: any) => {
              onFieldChange(val);
              if (selectedMarka) {
                setMarkalar(prev => {
                  if (!prev.find(m => String(m.id) === String(selectedMarka.id))) {
                    return [...prev, selectedMarka];
                  }
                  return prev;
                });
                setFormData(prev => {
                  let next = { ...prev, markaId: val };
                  next = regenerateCodeAndDesc(next, ozellikDegerleri, ozellikSablonlari, null, selectedMarka);
                  return next;
                });
              }
            }} 
          />
        </div>
      );
    }

    // Grup Seçici (UrunGrupSecici veya HizmetGrupSecici)
    if (field.type === 'custom-tree' || field.name === 'urunVeHizmetGrubuId') {
      const GrupSeciciComponent = isUrunType ? UrunGrupSecici : HizmetGrupSecici;
      return (
        <div className="form-group flex-1 flex-col relative" style={{ gridColumn: field.gridColumn }} key={field.id || field.name}>
          <label className="form-label">{typeof field.label === 'string' ? t(field.label) : field.label} {field.required && <span className="text-danger">*</span>}</label>
          <GrupSeciciComponent 
            value={currentFormData.urunVeHizmetGrubuId} 
            onChange={(val: any, selectedGroup: any, keepOpen?: boolean) => {
              onFieldChange(val);
              if (!selectedGroup) return;
              
              setGruplar(prevGruplar => {
                if (!prevGruplar.find(g => String(g.id) === String(selectedGroup.id))) {
                  return [...prevGruplar, selectedGroup];
                }
                return prevGruplar;
              });

              setFormData(prev => {
                let next = { ...prev, urunVeHizmetGrubuId: parseInt(val, 10) };
                if (selectedGroup.kdvGrubuId) next.kdvGrubuId = selectedGroup.kdvGrubuId;
                if (selectedGroup.varsayilanBirimId) next.birimId = selectedGroup.varsayilanBirimId;
                if (selectedGroup.varsayilanStokTakipTuru) {
                  const valStk = selectedGroup.varsayilanStokTakipTuru;
                  next.stokTakipTuru = valStk === 2 ? 'SeriNoBazli' : (valStk === 3 ? 'LotNoBazli' : 'MiktarBazli');
                }
                
                next = regenerateCodeAndDesc(next, ozellikDegerleri, ozellikSablonlari, selectedGroup);
                return next;
              });
              if (onDirtyChange) onDirtyChange(true);
              if (!keepOpen) {
                setTimeout(() => {
                  if (ureticiKoduRef.current) {
                    ureticiKoduRef.current.focus();
                  }
                }, 100);
              }
            }} 
          />
          {errors.urunVeHizmetGrubuId && <div className="error-text text-12 text-danger mt-4">{errors.urunVeHizmetGrubuId}</div>}
        </div>
      );
    }

    // Birim Seçici
    if (field.type === 'custom-birim-select' || field.name === 'birimId') {
      return (
        <div className="form-group flex-1 flex-col relative" style={{ gridColumn: field.gridColumn }} key={field.id || field.name}>
          <label className="form-label">
            {typeof field.label === 'string' ? t(field.label) : field.label} {field.required && <span className="text-danger">*</span>}
          </label>
          <BirimSecici 
            value={currentFormData.birimId}
            onChange={(birimIdVal) => {
              onFieldChange(birimIdVal);
              if (onDirtyChange) onDirtyChange(true);
            }}
            placeholder={t('Seçiniz...')}
          />
          {errors.birimId && <div className="error-text text-12 text-danger mt-4">{errors.birimId}</div>}
        </div>
      );
    }

    // Stok Takip Yöntemi Seçici
    if (field.type === 'custom-stoktakip-select' || field.name === 'stokTakipTuru') {
      return (
        <div className="form-group flex-1 flex-col relative" style={{ gridColumn: field.gridColumn }} key={field.id || field.name}>
          <label className="form-label">{typeof field.label === 'string' ? t(field.label) : field.label}</label>
          <StokTakipYontemiSecici 
            value={currentFormData.stokTakipTuru}
            onChange={(val) => {
              onFieldChange(val);
              if (onDirtyChange) onDirtyChange(true);
            }}
          />
        </div>
      );
    }

    // Seri No Alanları
    if (field.type === 'custom-serino-uzunluk' || field.name === 'seriNoUzunlugu') {
      if (currentFormData.stokTakipTuru !== 'SeriNoBazli') return null;
      return (
        <div className="form-group flex-1 flex-col relative" style={{ gridColumn: field.gridColumn }} key={field.id || field.name}>
          <label className="form-label">{typeof field.label === 'string' ? t(field.label) : field.label}</label>
          <input 
            type="number" 
            className="form-input" 
            name={field.name} 
            value={currentFormData.seriNoUzunlugu !== undefined ? currentFormData.seriNoUzunlugu : ''} 
            onChange={(e) => handleChange(field.name, e.target.value)} 
            placeholder={t('Örn: 10')}
          />
        </div>
      );
    }

    if (field.type === 'custom-serino-onek' || field.name === 'seriNoOneki') {
      if (currentFormData.stokTakipTuru !== 'SeriNoBazli') return null;
      return (
        <div className="form-group flex-1 flex-col relative" style={{ gridColumn: field.gridColumn }} key={field.id || field.name}>
          <label className="form-label">{typeof field.label === 'string' ? t(field.label) : field.label}</label>
          <input 
            type="text" 
            className="form-input" 
            name={field.name} 
            value={currentFormData.seriNoOneki !== undefined ? currentFormData.seriNoOneki : ''} 
            onChange={(e) => handleChange(field.name, e.target.value)} 
            placeholder={t('Örn: SN-')}
          />
        </div>
      );
    }

    // Tedarik Durumu Seçici
    if (field.type === 'custom-tedarik-select' || field.name === 'tedarikDurumu') {
      return (
        <div className="form-group flex-1 flex-col relative" style={{ gridColumn: field.gridColumn }} key={field.id || field.name}>
          <label className="form-label">{typeof field.label === 'string' ? t(field.label) : field.label}</label>
          <TedarikDurumuSecici 
            value={currentFormData.tedarikDurumu}
            onChange={(val) => {
              onFieldChange(val);
              if (onDirtyChange) onDirtyChange(true);
            }}
          />
        </div>
      );
    }

    // Barkod Tarayıcı Input
    if (field.type === 'barcode-input' || field.name === 'barkod') {
      return (
        <div className="form-group flex-1 flex-col relative" style={{ gridColumn: field.gridColumn }} key={field.id || field.name}>
          <label className="form-label">{typeof field.label === 'string' ? t(field.label) : field.label}</label>
          <BarcodeScannerInput
            value={currentFormData.barkod || ''}
            onChange={(e) => handleChange('barkod', e.target.value)}
            placeholder={field.placeholder || t('Barkod giriniz veya okutunuz...')}
            className="form-input"
            name={field.name}
          />
        </div>
      );
    }

    // KDV Oranı Seçici
    if (field.type === 'custom-kdv-selector' || field.name === 'kdvGrubuId') {
      return (
        <div className="form-group flex-1 flex-col relative" style={{ gridColumn: field.gridColumn }} key={field.id || field.name}>
          <label className="form-label">
            {typeof field.label === 'string' ? t(field.label) : field.label} {field.required && <span className="text-danger">*</span>}
          </label>
          <KdvSecici
            value={currentFormData.kdvGrubuId}
            onChange={(val) => onFieldChange(val)}
            kdvGruplari={kdvGruplari}
          />
          {errors.kdvGrubuId && <div className="error-text text-12 text-danger mt-4">{errors.kdvGrubuId}</div>}
        </div>
      );
    }

    // Para Birimi Seçici
    if (field.type === 'custom-doviz-select' || field.name === 'dovizCinsi') {
      return (
        <div className="form-group flex-1 flex-col relative" style={{ gridColumn: field.gridColumn }} key={field.id || field.name}>
          <label className="form-label">{typeof field.label === 'string' ? t(field.label) : field.label}</label>
          <ParaBirimiSecici 
            value={currentFormData.dovizCinsi || 'TRY'}
            onChange={(val) => onFieldChange(val)}
          />
        </div>
      );
    }

    // Üretici / Hizmet Kodu
    if (field.type === 'custom-ureticiKodu' || field.name === 'ureticiKodu') {
      const ureticiKoduCasing = (firmaAyarlari?.UreticiKoduMetinTercihi || firmaAyarlari?.ureticiKoduMetinTercihi || 'hepsiBuyuk') as HarfDonusumu;
      return (
        <div className="form-group flex-1 flex-col relative" style={{ gridColumn: field.gridColumn }} key={field.id || field.name}>
          <label className="form-label">{typeof field.label === 'string' ? t(field.label) : field.label}</label>
          <BaseInput 
            id="ureticiKoduInput"
            name={field.name} 
            value={currentFormData.ureticiKodu || ''} 
            onChange={(e) => handleChange('ureticiKodu', e.target.value)} 
            placeholder={field.placeholder || t('Örn: MNF-001')} 
            ref={ureticiKoduRef}
            casing={ureticiKoduCasing}
          />
        </div>
      );
    }

    // Özel Şablonlu Ürün Özellikleri Tabı
    if (field.name === 'ozellikler') {
      return (
        <div className="form-group-fill-height relative" style={{ gridColumn: field.gridColumn }} key={field.name}>
          {!formData.urunVeHizmetGrubuId ? (
            <div className="p-40 text-center text-secondary">
              {t('Lütfen önce Genel sekmesinden bir Ürün Grubu seçiniz.')}
            </div>
          ) : ozellikSablonlari.length === 0 ? (
            <div className="p-40 text-center text-secondary">
              {t('Seçilen ürün grubuna atanmış özellik bulunmamaktadır.')}
            </div>
          ) : (
            <div className="form-grid">
              {ozellikSablonlari.map((sablon: any) => {
                const tipStr = String(sablon.tip).toLocaleLowerCase('tr-TR');
                const isText = tipStr === 'metin' || tipStr === '1';
                const isNumber = tipStr === 'sayi' || tipStr === '2';
                const isList = tipStr === 'liste' || tipStr === '3';
                const isDate = tipStr === 'tarih' || tipStr === '4';
                const isBool = tipStr === 'evethayir' || tipStr === '5';

                const val = ozellikDegerleri[sablon.id] || '';
                
                let inputEl;
                if (isText) {
                  inputEl = <input type="text" className="form-input" value={val} onChange={e => handleOzellikChange(sablon.id, e.target.value)} />;
                } else if (isNumber) {
                  inputEl = <input type="number" className="form-input" value={val} onChange={e => handleOzellikChange(sablon.id, e.target.value)} />;
                } else if (isList) {
                  const secenekler = sablon.secenekler ? sablon.secenekler.split(',').map((s: string) => s.trim()) : [];
                  inputEl = (
                    <select className="form-input" value={val} onChange={e => handleOzellikChange(sablon.id, e.target.value)}>
                      <option value="">{t('Seçiniz...')}</option>
                      {secenekler.map((s: string, idx: number) => <option key={idx} value={s}>{s}</option>)}
                    </select>
                  );
                } else if (isDate) {
                  inputEl = <input type="date" className="form-input" value={val} onChange={e => handleOzellikChange(sablon.id, e.target.value)} />;
                } else if (isBool) {
                  inputEl = (
                    <select className="form-input" value={val} onChange={e => handleOzellikChange(sablon.id, e.target.value)}>
                      <option value="">{t('Seçiniz...')}</option>
                      <option value="Evet">{t('Evet')}</option>
                      <option value="Hayır">{t('Hayır')}</option>
                    </select>
                  );
                }

                return (
                  <div className="form-group flex-1 flex-col" key={sablon.id}>
                    <label className="form-label">{sablon.ad} {sablon.zorunluMu ? '*' : ''}</label>
                    {inputEl}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Barkodlar & Ambalaj Tabı
    if (field.name === 'barkodlar') {
      const selectedBirim = birimler.find((b: any) => b.id === parseInt(formData.birimId, 10));
      const subBirimler = selectedBirim ? birimler.filter((b: any) => b.tipAdi === selectedBirim.tipAdi && b.id !== selectedBirim.id) : [];

      return (
        <div className="form-group-fill-height relative flex-1 flex-col" style={{ gridColumn: field.gridColumn }} key={field.name}>
          <div className="flex justify-between items-center mb-24">
            <div>
              <h3 className="text-18 font-semibold text-primary mb-4">{t('Ambalaj & Koli/Kasa Barkodları')}</h3>
              <p className="text-13 text-secondary">
                {t('Ürüne ait ambalaj tipleri için alt barkodları buradan türetebilir ve tanımlayabilirsiniz.')}
              </p>
            </div>
            <button 
              type="button" 
              className="btn btn-primary flex items-center gap-8" 
              onClick={() => handleOpenBarkodForm()} 
            >
              <Plus size={18} /> {t('Yeni Barkod Ekle')}
            </button>
          </div>

          {barkodlar.length === 0 ? (
            <div className="empty-state-container p-40 text-center flex-col items-center gap-16">
              <div className="avatar-box neutral">
                <Barcode size={32} />
              </div>
              <div>
                <h4 className="text-16 font-semibold text-primary mb-8">{t('Ambalaj Barkodu Bulunmuyor')}</h4>
                <p className="text-14 text-secondary max-w-400">
                  {t('Bu ürün için henüz koli, kasa veya palet gibi bir ambalaj barkodu tanımlamadınız.')}
                </p>
              </div>
              <button 
                type="button" 
                className="btn btn-outline flex items-center gap-8 mt-8" 
                onClick={() => handleOpenBarkodForm()} 
              >
                <Plus size={16} /> {t('İlk Ambalaj Barkodunu Ekle')}
              </button>
            </div>
          ) : (
            <div className="flex-col gap-12">
              {barkodlar.map((item, idx) => {
                const birimAd = item.birimId ? birimler.find(br => br.id === parseInt(item.birimId, 10))?.ad : item.birimTipi || t('Belirtilmedi');
                
                return (
                  <div key={idx} className="surface-card flex items-center justify-between p-16">
                    <div className="flex items-center gap-16">
                      <div className="avatar-box">
                        <Barcode size={24} />
                      </div>
                      <div>
                        <div className="text-16 font-bold text-primary flex items-center gap-8 mb-4">
                          {item.barkod}
                          {item.tip && (
                            <span className="chip chip-secondary text-11 font-semibold">
                              {item.tip}
                            </span>
                          )}
                        </div>
                        <div className="text-13 text-secondary flex items-center gap-6">
                          <Package size={14} /> {t('Ambalaj Birimi')}: <span className="font-semibold text-primary">{birimAd}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <button type="button" className="btn-icon" onClick={() => handleOpenBarkodForm(idx)} title={t('Düzenle')}>
                        <Edit2 size={16} />
                      </button>
                      <button type="button" className="btn-icon text-danger" onClick={() => handleRemoveBarkod(idx)} title={t('Sil')}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <BasePopup
            isOpen={isBarkodFormOpen}
            onClose={() => setIsBarkodFormOpen(false)}
            title={editBarkodIdx !== null ? t('Ambalaj Barkodu Düzenle') : t('Yeni Ambalaj Barkodu Türet')}
            modalSize="md"
            hideFooter={true}
          >
            <div className="flex-col gap-20">
              <div className="form-group">
                <label className="form-label flex justify-between mb-8">
                  <span>{t('Otomatik Üretilecek Barkod (GTIN-14)')}</span>
                  {yeniBarkod.tip && (
                    <span className="text-12 text-accent-primary font-semibold flex items-center gap-4">
                      <Check size={14} /> {yeniBarkod.tip}
                    </span>
                  )}
                </label>
                <div className="surface-card p-12 flex items-center gap-12">
                  <Barcode size={20} className="text-secondary" />
                  <span className="text-18 font-bold text-primary tracking-wide">
                    {yeniBarkod.barkod}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label mb-8">{t('Ambalaj Tipi (Koli, Kasa vb.)')}</label>
                <div className="relative" ref={ambalajBirimDropdownRef}>
                  <div 
                    className="form-input custom-select-trigger pl-40" 
                    onClick={() => setIsAmbalajBirimDropdownOpen(!isAmbalajBirimDropdownOpen)}
                    tabIndex={0}
                  >
                    <Package size={18} className="text-secondary absolute left-14 top-half -translate-y-half z-1" />
                    <span className={!yeniBarkod.birimId ? 'placeholder' : ''}>
                      {yeniBarkod.birimId ? birimler.find(b => b.id === parseInt(yeniBarkod.birimId, 10))?.ad : t('Seçiniz...')}
                    </span>
                    <ChevronDownIcon size={16} className="text-secondary" />
                  </div>
                  {isAmbalajBirimDropdownOpen && (
                    <div className="custom-tree-dropdown fade-in-fast max-h-200 overflow-y-auto">
                      {subBirimler.filter(b => {
                        const usedBirimIds = barkodlar.map(bk => parseInt(bk.birimId, 10)).filter(idNum => !isNaN(idNum));
                        if (editBarkodIdx === null && usedBirimIds.includes(b.id)) return false;
                        if (editBarkodIdx !== null && b.id !== parseInt(yeniBarkod.birimId, 10) && usedBirimIds.includes(b.id)) return false;
                        return true;
                      }).map(b => (
                        <div 
                          key={b.id} 
                          className={`tree-node leaf ${yeniBarkod.birimId == b.id ? 'selected' : ''} pl-12`} 
                          onClick={() => {
                            setYeniBarkod({ ...yeniBarkod, birimId: String(b.id) });
                            setIsAmbalajBirimDropdownOpen(false);
                          }}
                        >
                          <span className="tree-node-label font-medium">{b.ad}</span>
                          {yeniBarkod.birimId == b.id && <Check size={14} className="tree-check-icon" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-12 mt-32 pt-20 border-t-glass">
              <CancelButton onClick={() => setIsBarkodFormOpen(false)} />
              <BaseButton 
                onClick={handleAddBarkod} 
                disabled={!yeniBarkod.barkod} 
                text={editBarkodIdx !== null ? t('Değişiklikleri Kaydet') : t('Barkodu Türet/Ekle')} 
                icon={<SaveIcon size={18} />}
                type="button" 
              />
            </div>
          </BasePopup>
        </div>
      );
    }

    return null;
  };

  // Dinamik Sekmeler
  const tabs: any[] = rawTabs.map((tTab: any) => {
    const rawLabel = tTab.name || tTab.label || tTab.title;
    return {
      ...tTab,
      label: typeof rawLabel === 'string' ? t(rawLabel) : rawLabel,
      icon: typeof tTab.icon === 'string' ? getIcon(tTab.icon, { size: 18 }) : tTab.icon,
      content: (
        <DynamicFormRenderer 
          strategy={strategy} 
          formData={formData} 
          onChange={handleChange}
          onBlur={handleBlur}
          errors={errors}
          renderCustomField={renderCustomField}
          hideTabs={true}
          activeTabId={tTab.id}
          optionsMap={{ kdvGruplari, markalar }}
        />
      )
    };
  });

  // Düzenleme modunda Hareketler sekmesi ekle
  if (isEditing) {
    tabs.push({
      id: 'hareketler',
      label: t('Hareketler'),
      icon: <Layers size={18} />,
      content: (
        <div className="flex-1 flex-col">
          <DataTable
            columns={[
              { accessor: 'hareketNo', header: t('Fiş No'), render: (row: any) => <span>{row.hareketNo} {row.belgeNo ? <span className="text-muted text-12">({row.belgeNo})</span> : ''}</span> },
              { accessor: 'hareketTarihi', header: t('Tarih'), render: (row: any) => new Date(row.hareketTarihi).toLocaleDateString('tr-TR') },
              { accessor: 'hareketTipi', header: t('Hareket Tipi'), render: (row: any) => <span className={`chip ${row.hareketTipi.includes('Giris') ? 'chip-success' : 'chip-danger'}`}>{row.hareketTipi}</span> },
              { accessor: 'depoAdi', header: t('Depo') },
              { accessor: 'cariUnvani', header: t('Cari') },
              { accessor: 'miktar', header: t('Miktar'), render: (row: any) => <span className="font-semibold">{row.miktar}</span> },
              { accessor: 'durum', header: t('Durum'), render: (row: any) => {
                if (row.durum === 'Taslak') return <span className="chip chip-secondary">{t('Taslak')}</span>;
                if (row.durum === 'Onaylandi') return <span className="chip chip-primary">{t('Onaylandı')}</span>;
                if (row.durum === 'Iptal') return <span className="chip chip-danger">{t('İptal Edildi')}</span>;
                return <span className="chip chip-secondary">{row.durum}</span>;
              }}
            ]}
            fetchData={handleFetchHareketler}
            pageSize={20}
            emptyMessage={t('Bu ürüne ait hareket bulunamadı.')}
          />
        </div>
      )
    });
  }

  if (loading) {
    return (
      <div className="p-60 text-center text-secondary flex-col items-center justify-center">
        <RefreshCw className="spin-icon mb-12" size={24} />
        <div>{t('Yükleniyor...')}</div>
      </div>
    );
  }

  return (
    <>
      <BaseCardPage
        id="redesignForm"
        onSubmit={handleSubmit}
        title={headerTitleNode}
        onTitleEdit={isEditingTitle ? undefined : handleStartEditTitle}
        titleEditTooltip={t('auto_aciklamayi_duzenle', 'Açıklamayı Düzenle')}
        subtitle={headerSubtitleNode}
        onSubtitleEdit={isEditingSubtitle ? undefined : handleStartEditSubtitle}
        subtitleEditTooltip={t('auto_alt_baslik_duzenle', 'Alt Başlığı / Açıklamayı Düzenle')}
        hideBreadcrumb={true}
        isSaving={saving}
        onSave={handleSubmit}
        onClose={onCancel}
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={(id) => setActiveTabId(String(id))}
      />

      <BarcodeScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScanResult} 
      />

      <AlertDialog
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig((prev: any) => ({ ...prev, isOpen: false }))}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </>
  );
};

export default UrunVeHizmetForm;
