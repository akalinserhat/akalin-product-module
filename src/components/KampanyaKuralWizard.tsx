/**
 * @file KampanyaKuralWizard.tsx
 * @description 
 * Kampanya ve Promosyon Kuralları Sihirbazı (Wizard) bileşeni.
 * BaseWizardPage yapısı kullanılarak kampanya kurallarını oluşturan maddeleri
 * 5 aşamalı temiz, ergonomik ve kurumsal ERP standartlarında sunar:
 * 1. Genel Bilgiler (Kampanya Kodu, Adı, Kampanya Grubu ve Kota)
 * 2. Birleşim & Öncelik Matrisi (Whitelist, Blacklist, Öncelik Sıralaması, Matrah ve İskonto Tavanı)
 * 3. Cari Katılım Koşulları
 * 4. Sepet ve Ürün Kuralları
 * 5. Kampanya Avantajları & Aksiyonlar
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    BasitInput, 
    BaseWizardPage, 
    WizardStep,
    BasePopup, 
    Modal,
    KampanyaRuleViewPanel, 
    CurrencyInput, 
    BaseSwitch, 
    FieldError, 
    FiyatFarkiSecici, 
    BaseDropdownSecici, 
    useAdminValidation 
} from '@akalin/ui';
import toast from 'react-hot-toast';
import { validateKampanya } from '../validators/kampanyaValidation';
import { useMetadata } from '../context/MetadataContext';
import { KampanyaDto, KampanyaGrupDto, KampanyaSecimItemDto } from '../dtos/KampanyalarDto';
import { kampanyalarService } from '../services/KampanyalarService';
import KampanyaKuralPopup from './KampanyaKuralPopup';
import { 
    Megaphone, 
    Info, 
    Plus, 
    Percent, 
    Banknote,
    Save,
    Layers,
    ShieldAlert,
    X
} from 'lucide-react';

interface KampanyaKuralWizardProps {
    onClose: () => void;
    kampanya: Partial<KampanyaDto>;
    onSave: (kampanya: Partial<KampanyaDto>) => void;
    isEditMode?: boolean;
    asTabs?: boolean;
    navigationMode?: 'wizard' | 'tabs';
    hideActionMenu?: boolean;
}

const KampanyaKuralWizard: React.FC<KampanyaKuralWizardProps> = ({ 
    onClose, 
    kampanya, 
    onSave, 
    isEditMode,
    asTabs,
    navigationMode,
    hideActionMenu: customHideActionMenu
}) => {
    const { t } = useTranslation();
    const { enums } = useMetadata();
    const effectiveIsEditMode = isEditMode !== undefined
        ? isEditMode
        : Boolean(kampanya?.id || kampanya?.kodu?.trim() || kampanya?.adi?.trim());

    const isTabMode = Boolean(asTabs !== undefined ? asTabs : (navigationMode ? navigationMode === 'tabs' : effectiveIsEditMode));
    const isWizardMode = !isTabMode;
    const shouldHideActionMenu = customHideActionMenu !== undefined ? customHideActionMenu : isWizardMode;

    const [localKampanya, setLocalKampanya] = useState<Partial<KampanyaDto>>({
        kodu: kampanya?.kodu || '',
        adi: kampanya?.adi || '',
        birlesmeKurali: kampanya?.birlesmeKurali || 1,
        oncelik: kampanya?.oncelik || 50,
        cakismaStratejisi: kampanya?.cakismaStratejisi || 1,
        matrahTuru: kampanya?.matrahTuru || 1,
        maksimumToplamIskontoOrani: kampanya?.maksimumToplamIskontoOrani,
        kampanyaGrupId: kampanya?.kampanyaGrupId,
        birlestirilebilirKampanyaIdleri: kampanya?.birlestirilebilirKampanyaIdleri || [],
        birlestirilemezKampanyaIdleri: kampanya?.birlestirilemezKampanyaIdleri || [],
        toplamAdetSiniri: kampanya?.toplamAdetSiniri,
        cariKatilimZamanAraligi: kampanya?.cariKatilimZamanAraligi || 5, // Varsayılan: Kampanya Süresince
        cariKatilimSiniriTuru: kampanya?.cariKatilimSiniriTuru || 3,     // Varsayılan: Sınırsız
        indirimTuru: kampanya?.indirimTuru !== undefined ? kampanya.indirimTuru : (kampanya?.aksiyonTipi === 1 || kampanya?.aksiyonTipi === 2 ? kampanya.aksiyonTipi : 2),
        kdvDahilMi: kampanya?.kdvDahilMi ?? false,
        firmaHakEdisKdvDahilMi: kampanya?.firmaHakEdisKdvDahilMi ?? false,
        ...(kampanya || {})
    });

    const [kampanyaGruplari, setKampanyaGruplari] = useState<KampanyaGrupDto[]>([]);
    const [secimListesi, setSecimListesi] = useState<KampanyaSecimItemDto[]>([]);
    const [selectedWhitelistId, setSelectedWhitelistId] = useState<string>('');
    const [selectedBlacklistId, setSelectedBlacklistId] = useState<string>('');

    const [isCustomGrupModalOpen, setIsCustomGrupModalOpen] = useState(false);
    const [customGrupAdi, setCustomGrupAdi] = useState('');
    const [customGrupKodu, setCustomGrupKodu] = useState('');
    const [customGrupTekilMi, setCustomGrupTekilMi] = useState(true);
    const [isAddingGrup, setIsAddingGrup] = useState(false);

    const [isKuralPopupOpen, setIsKuralPopupOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<any>(null);
    const [isIndirimActive, setIsIndirimActive] = useState<boolean>(
        kampanya?.indirimTuru !== undefined 
            ? !!kampanya?.indirimTuru 
            : (kampanya?.aksiyonTipi ? (kampanya.aksiyonTipi === 1 || kampanya.aksiyonTipi === 2) : true)
    );
    const [isHakedisActive, setIsHakedisActive] = useState<boolean>(!!kampanya?.hakedisTuru);
    const { errors, clearError, validate } = useAdminValidation();

    const katilimSiniriOptions = useMemo(() => (enums?.CariKatilimSiniriTuru || [
        { value: 3, label: 'Sınırsız' },
        { value: 1, label: 'Tek Sefer' },
        { value: 2, label: 'Belirli Sayıda' }
    ]).map((e: any) => ({
        id: e.value.toString(),
        label: t(e.label) || e.label,
        rawValue: e
    })), [enums?.CariKatilimSiniriTuru, t]);

    const zamanAraligiOptions = useMemo(() => (enums?.CariKatilimZamanAraligi || [
        { value: 5, label: 'Kampanya Süresince' },
        { value: 1, label: 'Günde' },
        { value: 2, label: 'Haftada' },
        { value: 3, label: 'Ayda' },
        { value: 4, label: 'Yılda' },
        { value: 6, label: 'Belirli Bir Sürede (Gün)' }
    ]).map((e: any) => ({
        id: e.value.toString(),
        label: t(e.label) || e.label,
        rawValue: e
    })), [enums?.CariKatilimZamanAraligi, t]);

    const birlesmeKuraliOptions = useMemo(() => [
        { id: '1', label: t('auto_birlesme_kurali_1', 'Serbestçe Birleştirilebilir (Tüm kampanyalarla birlikte uygulanabilir)') },
        { id: '4', label: t('auto_birlesme_kurali_4', 'Aynı Gruptakiler Hariç Birleştirilebilir (Farklı gruplarla birleşir, gruptan en fazla 1)') },
        { id: '5', label: t('auto_birlesme_kurali_5', 'Yalnızca Seçilenlerle Birleştirilebilir (Beyaz Liste / Whitelist)') },
        { id: '6', label: t('auto_birlesme_kurali_6', 'Seçilenler Hariç Birleştirilebilir (Kara Liste / Blacklist)') },
        { id: '3', label: t('auto_birlesme_kurali_3', 'Hiçbiri İle Birleştirilemez (Tek Başına Geçerli / Standalone)') },
        { id: '2', label: t('auto_birlesme_kurali_2', 'Sadece Tekil Kampanyalar İle Birleştirilebilir') }
    ], [t]);

    const cakismaStratejisiOptions = useMemo(() => [
        { id: '1', label: t('auto_cakisma_1', 'Müşteri Lehine (En yüksek toplam indirim)') },
        { id: '2', label: t('auto_cakisma_2', 'Firma Lehine (Firma kârını koruyan en düşük indirim)') },
        { id: '3', label: t('auto_cakisma_3', 'Öncelik Sırasına Göre (Öncelik puanı üstün olan)') },
        { id: '4', label: t('auto_cakisma_4', 'Kullanıcı / Kasiyer Seçimi (Manuel seçim)') }
    ], [t]);

    const matrahTuruOptions = useMemo(() => [
        { id: '1', label: t('auto_matrah_1', 'Brüt Liste Fiyatı Üzerinden (Bağımsız Matrah)') },
        { id: '2', label: t('auto_matrah_2', 'Kademeli Net Fiyat Üzerinden (Önceki İndirim Sonrası Kalan Matrah)') }
    ], [t]);

    const grupOptions = useMemo(() => [
        { id: '', label: t('auto_grup_yok', 'Grup Yok / Bağımsız Kampanya') },
        ...kampanyaGruplari.map(g => ({
            id: g.id.toString(),
            label: `${g.ad}${g.ayniGruptanSadeceBiriMi ? ` (${t('auto_gruptan_en_fazla_bir', 'Aynı gruptan en fazla 1')})` : ''}`
        }))
    ], [kampanyaGruplari, t]);

    const availableWhitelistOptions = useMemo(() => {
        const selected = localKampanya.birlestirilebilirKampanyaIdleri || [];
        return [
            { id: '', label: t('auto_kampanya_ekle_placeholder', 'Listeden kampanya seçip ekleyiniz...') },
            ...secimListesi
                .filter(item => !selected.includes(item.id))
                .map(item => ({
                    id: item.id.toString(),
                    label: `[${item.kodu}] ${item.adi}${item.grupAdi ? ` (${item.grupAdi})` : ''}`
                }))
        ];
    }, [secimListesi, localKampanya.birlestirilebilirKampanyaIdleri, t]);

    const availableBlacklistOptions = useMemo(() => {
        const selected = localKampanya.birlestirilemezKampanyaIdleri || [];
        return [
            { id: '', label: t('auto_kampanya_ekle_placeholder', 'Listeden kampanya seçip ekleyiniz...') },
            ...secimListesi
                .filter(item => !selected.includes(item.id))
                .map(item => ({
                    id: item.id.toString(),
                    label: `[${item.kodu}] ${item.adi}${item.grupAdi ? ` (${item.grupAdi})` : ''}`
                }))
        ];
    }, [secimListesi, localKampanya.birlestirilemezKampanyaIdleri, t]);

    const handleAddWhitelist = useCallback((idStr: string) => {
        const id = parseInt(idStr);
        if (!id) return;
        const current = localKampanya.birlestirilebilirKampanyaIdleri || [];
        if (!current.includes(id)) {
            setLocalKampanya(prev => ({
                ...prev,
                birlestirilebilirKampanyaIdleri: [...current, id]
            }));
            clearError('birlestirilebilirKampanyaIdleri');
        }
        setSelectedWhitelistId('');
    }, [localKampanya.birlestirilebilirKampanyaIdleri, clearError]);

    const handleRemoveWhitelist = useCallback((id: number) => {
        setLocalKampanya(prev => ({
            ...prev,
            birlestirilebilirKampanyaIdleri: (prev.birlestirilebilirKampanyaIdleri || []).filter(x => x !== id)
        }));
    }, []);

    const handleAddBlacklist = useCallback((idStr: string) => {
        const id = parseInt(idStr);
        if (!id) return;
        const current = localKampanya.birlestirilemezKampanyaIdleri || [];
        if (!current.includes(id)) {
            setLocalKampanya(prev => ({
                ...prev,
                birlestirilemezKampanyaIdleri: [...current, id]
            }));
            clearError('birlestirilemezKampanyaIdleri');
        }
        setSelectedBlacklistId('');
    }, [localKampanya.birlestirilemezKampanyaIdleri, clearError]);

    const handleRemoveBlacklist = useCallback((id: number) => {
        setLocalKampanya(prev => ({
            ...prev,
            birlestirilemezKampanyaIdleri: (prev.birlestirilemezKampanyaIdleri || []).filter(x => x !== id)
        }));
    }, []);

    const handleCreateCustomGrup = useCallback(async () => {
        const ad = customGrupAdi.trim();
        if (!ad) return;
        setIsAddingGrup(true);
        try {
            const kod = (customGrupKodu.trim() || ad.toUpperCase().replace(/[^A-Z0-9]/g, '')).substring(0, 10) || 'GRP';
            const created = await kampanyalarService.createKampanyaGrup({
                kod,
                ad,
                ayniGruptanSadeceBiriMi: customGrupTekilMi
            });
            toast.success(t('auto_grup_olusturuldu', 'Kampanya grubu başarıyla oluşturuldu.'));
            setKampanyaGruplari(prev => [...prev, created]);
            setLocalKampanya(prev => ({ ...prev, kampanyaGrupId: created.id }));
            setCustomGrupAdi('');
            setCustomGrupKodu('');
            setCustomGrupTekilMi(true);
            setIsCustomGrupModalOpen(false);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || t('auto_grup_olusturma_hata', 'Kampanya grubu eklenirken bir hata oluştu.'));
        } finally {
            setIsAddingGrup(false);
        }
    }, [customGrupAdi, customGrupKodu, customGrupTekilMi, t]);

    useEffect(() => {
        kampanyalarService.getKampanyaGruplari().then(res => {
            setKampanyaGruplari(res || []);
        }).catch(err => console.error("Kampanya grupları alınamadı:", err));

        kampanyalarService.getKampanyaSecimListesi(kampanya?.id).then(res => {
            setSecimListesi(res || []);
        }).catch(err => console.error("Kampanya seçim listesi alınamadı:", err));
    }, [kampanya?.id]);

    useEffect(() => {
        setLocalKampanya({
            kodu: kampanya?.kodu || '',
            adi: kampanya?.adi || '',
            birlesmeKurali: kampanya?.birlesmeKurali || 1,
            oncelik: kampanya?.oncelik || 50,
            cakismaStratejisi: kampanya?.cakismaStratejisi || 1,
            matrahTuru: kampanya?.matrahTuru || 1,
            maksimumToplamIskontoOrani: kampanya?.maksimumToplamIskontoOrani,
            kampanyaGrupId: kampanya?.kampanyaGrupId,
            birlestirilebilirKampanyaIdleri: kampanya?.birlestirilebilirKampanyaIdleri || [],
            birlestirilemezKampanyaIdleri: kampanya?.birlestirilemezKampanyaIdleri || [],
            toplamAdetSiniri: kampanya?.toplamAdetSiniri,
            cariKatilimZamanAraligi: kampanya?.cariKatilimZamanAraligi || 5,
            cariKatilimSiniriTuru: kampanya?.cariKatilimSiniriTuru || 3,
            indirimTuru: kampanya?.indirimTuru !== undefined ? kampanya.indirimTuru : (kampanya?.aksiyonTipi === 1 || kampanya?.aksiyonTipi === 2 ? kampanya.aksiyonTipi : 2),
            kdvDahilMi: kampanya?.kdvDahilMi ?? false,
            firmaHakEdisKdvDahilMi: kampanya?.firmaHakEdisKdvDahilMi ?? false,
            ...(kampanya || {})
        });

        if (kampanya && kampanya.kurallar && kampanya.kurallar.length > 0) {
            const rulesToFetch = kampanya.kurallar.filter((r: any) => r.kuralDegeri && (!r._selectedItems || r._selectedItems.length === 0));
            
            if (rulesToFetch.length > 0) {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const fetchPromises = rulesToFetch.map(async (r: any) => {
                    const ids = r.kuralDegeri.split(',').map((id: string) => id.trim()).filter((id: string) => id);
                    if (ids.length === 0) return r;

                    let basePath = '';
                    switch (Number(r.kuralAlani)) {
                        case 1: basePath = '/api/UrunVeHizmetKartlari'; break;
                        case 2: basePath = '/api/UrunVeHizmetGruplari'; break;
                        case 9: basePath = '/api/OzellikTanimlari'; break;
                    }

                    const resolvedItems = await Promise.all(ids.map(async (id: string) => {
                        if (!/^\d+$/.test(id)) {
                            return { id, name: id };
                        }

                        if (basePath) {
                            try {
                                const res = await fetch(`${basePath}/${id}`, {
                                    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
                                });
                                if (res.ok) {
                                    const item = await res.json();
                                    return {
                                        id: item.id,
                                        name: item.ad || item.Ad || item.tanim || item.Tanim || item.adi || item.Adi || `Kayıt #${item.id}`
                                    };
                                }
                            } catch {}
                        }
                        return { id, name: `Kayıt #${id}` };
                    }));

                    return { ...r, _selectedItems: resolvedItems };
                });

                Promise.all(fetchPromises).then(updatedRules => {
                    setLocalKampanya(prev => {
                        const newRules = prev.kurallar?.map((prevRule: any) => {
                            const updated = updatedRules.find(u => 
                                (u._uid && prevRule._uid && u._uid === prevRule._uid) || 
                                (u.id && prevRule.id && u.id === prevRule.id) || 
                                (u.kuralDegeri === prevRule.kuralDegeri && u.kuralAlani === prevRule.kuralAlani)
                            );
                            return updated || prevRule;
                        });
                        return { ...prev, kurallar: newRules };
                    });
                });
            }
        }
    }, [kampanya]);

    const handleSaveRule = useCallback((updatedRule: any) => {
        let currentRules = [...(localKampanya.kurallar || [])] as any[];
        
        const existingIndex = currentRules.findIndex(r => r._uid === updatedRule._uid);
        if (existingIndex >= 0) {
            currentRules[existingIndex] = updatedRule;
        } else {
            currentRules.push(updatedRule);
        }
        
        setLocalKampanya(prev => ({ ...prev, kurallar: currentRules }));
        clearError('kurallar');
        setIsKuralPopupOpen(false);
    }, [localKampanya.kurallar, clearError]);

    const deleteRule = useCallback((uid: string) => {
        const currentRules = (localKampanya.kurallar || []).filter((r: any) => r._uid !== uid);
        setLocalKampanya(prev => ({ ...prev, kurallar: currentRules }));
    }, [localKampanya.kurallar]);

    const getKuralAlaniAdi = useCallback((val: number) => {
        if (val === 2) return t('Ürün Grubu');
        if (val === 1) return t('Ürün Açıklama');
        if (val === 9) return t('Ürün Özelliği');
        if (val === 6) return t('Sepet Toplamı');
        if (val === 8) return t('Marka');
        return String(val);
    }, [t]);

    const getOperatorAdi = useCallback((val: number) => {
        if (val === 1) return t('Eşittir');
        if (val === 2) return t('Eşit Değildir');
        if (val === 3) return t('Büyüktür');
        if (val === 5) return t('Büyük Eşittir');
        if (val === 7) return t('Tümünü İçerir (Her Birinden)');
        if (val === 9) return t('Herhangi Birini İçerir (Toplamda)');
        if (val === 8) return t('İçermez');
        return String(val);
    }, [t]);

    const getDeger = useCallback((row: any) => {
        if (row._selectedItems && row._selectedItems.length > 0) {
            return row._selectedItems.map((i: any) => i.name).join(', ');
        }
        if (!row.kuralDegeri) return '-';
        const items = row.kuralDegeri.split(',').map((s: string) => s.trim()).filter(Boolean);
        if (items.length <= 3) return items.join(', ');
        return `${items.length} Model (${items.slice(0, 2).join(', ')}...)`;
    }, []);

    const getKatilimOzetMetni = useCallback(() => {
        const periyotId = localKampanya.cariKatilimZamanAraligi || 5;
        const sinirId = localKampanya.cariKatilimSiniriTuru || 3;
        const gun = localKampanya.cariKatilimPeriyotSuresiGun || 1;
        const sayi = localKampanya.cariKatilimSayisi || 1;

        const zamanOption = zamanAraligiOptions.find((z: any) => z.id === periyotId.toString());
        const periyotLabel = zamanOption?.label?.toLowerCase() || (
            periyotId === 1 ? t('günde') :
            periyotId === 2 ? t('haftada') :
            periyotId === 3 ? t('ayda') :
            periyotId === 4 ? t('yılda') : t('kampanya süresince')
        );

        if (sinirId === 3) {
            if (periyotId === 5) {
                return t('Cari bu kampanyadan kampanya süresince sınırsız kez yararlanabilir.');
            }
            if (periyotId === 6) {
                return t('Cari bu kampanyadan her {{gun}} günde sınırsız kez yararlanabilir.', { gun });
            }
            return t('Cari bu kampanyadan {{periyot}} sınırsız kez yararlanabilir.', { periyot: periyotLabel });
        }

        if (sinirId === 1) {
            if (periyotId === 5) {
                return t('Cari bu kampanyadan kampanya süresince sadece 1 kez yararlanabilir.');
            }
            if (periyotId === 6) {
                return t('Cari bu kampanyadan her {{gun}} günde 1 kez yararlanabilir.', { gun });
            }
            return t('Cari bu kampanyadan {{periyot}} 1 kez yararlanabilir.', { periyot: periyotLabel });
        }

        if (sinirId === 2) {
            if (periyotId === 5) {
                return t('Cari bu kampanyadan kampanya süresince {{sayi}} kez yararlanabilir.', { sayi });
            }
            if (periyotId === 6) {
                return t('Cari bu kampanyadan her {{gun}} günde {{sayi}} kez yararlanabilir.', { gun, sayi });
            }
            return t('Cari bu kampanyadan {{periyot}} {{sayi}} kez yararlanabilir.', { periyot: periyotLabel, sayi });
        }

        return null;
    }, [localKampanya, zamanAraligiOptions, t]);

    // Adım 1 Doğrulama Kontrolü (Genel Bilgiler: Kampanya Kodu ve Adı zorunlu)
    const validateStep1 = useCallback(() => {
        const stepErrors: Record<string, string> = {};
        if (!localKampanya.kodu?.trim()) {
            stepErrors.kodu = t('Kampanya kodu zorunludur.');
        }
        if (!localKampanya.adi?.trim()) {
            stepErrors.adi = t('Kampanya adı zorunludur.');
        }

        if (Object.keys(stepErrors).length > 0) {
            validate(() => stepErrors, localKampanya);
            if (stepErrors.kodu && stepErrors.adi) {
                toast.error(t('auto_lutfen_kampanya_kodu_adi', 'Lütfen kampanya kodu ve adını doldurunuz.'));
            } else if (stepErrors.kodu) {
                toast.error(t('Lütfen kampanya kodunu giriniz.'));
            } else {
                toast.error(t('Lütfen kampanya adını giriniz.'));
            }
            return false;
        }

        clearError('kodu');
        clearError('adi');
        return true;
    }, [localKampanya.kodu, localKampanya.adi, validate, clearError, t]);

    // Adım 2 Doğrulama Kontrolü (Birleşim & Öncelik Matrisi)
    const validateStepBirlesim = useCallback(() => {
        const stepErrors: Record<string, string> = {};
        if (localKampanya.birlesmeKurali === 5) {
            if (!localKampanya.birlestirilebilirKampanyaIdleri || localKampanya.birlestirilebilirKampanyaIdleri.length === 0) {
                stepErrors.birlestirilebilirKampanyaIdleri = t('auto_whitelist_en_az_bir_secim', 'Yalnızca seçilenlerle birleştirilebilir kuralı için en az bir kampanya seçmelisiniz.');
            }
        }
        if (localKampanya.birlesmeKurali === 6) {
            if (!localKampanya.birlestirilemezKampanyaIdleri || localKampanya.birlestirilemezKampanyaIdleri.length === 0) {
                stepErrors.birlestirilemezKampanyaIdleri = t('auto_blacklist_en_az_bir_secim', 'Seçilenler hariç birleştirilebilir kuralı için hariç tutulacak en az bir kampanya seçmelisiniz.');
            }
        }
        if (localKampanya.oncelik !== undefined && (Number(localKampanya.oncelik) < 1 || Number(localKampanya.oncelik) > 100)) {
            stepErrors.oncelik = t('auto_oncelik_araligi_hata', 'Öncelik değeri 1 ile 100 arasında olmalıdır.');
        }
        if (localKampanya.maksimumToplamIskontoOrani !== undefined && localKampanya.maksimumToplamIskontoOrani !== null && String(localKampanya.maksimumToplamIskontoOrani) !== '') {
            const oran = Number(localKampanya.maksimumToplamIskontoOrani);
            if (oran < 0 || oran > 100) {
                stepErrors.maksimumToplamIskontoOrani = t('auto_maksimum_iskonto_hata', 'Maksimum iskonto tavanı %0 ile %100 arasında olmalıdır.');
            }
        }

        if (Object.keys(stepErrors).length > 0) {
            validate(() => stepErrors, localKampanya);
            const firstError = Object.values(stepErrors)[0];
            toast.error(firstError);
            return false;
        }

        clearError('birlestirilebilirKampanyaIdleri');
        clearError('birlestirilemezKampanyaIdleri');
        clearError('oncelik');
        clearError('maksimumToplamIskontoOrani');
        return true;
    }, [localKampanya.birlesmeKurali, localKampanya.birlestirilebilirKampanyaIdleri, localKampanya.birlestirilemezKampanyaIdleri, localKampanya.oncelik, localKampanya.maksimumToplamIskontoOrani, validate, clearError, t]);

    // Adım 3 Doğrulama Kontrolü (Cari Katılım Koşulları)
    const validateStep2 = useCallback(() => {
        if (localKampanya.cariKatilimZamanAraligi === 6) {
            if (!localKampanya.cariKatilimPeriyotSuresiGun || Number(localKampanya.cariKatilimPeriyotSuresiGun) <= 0) {
                toast.error(t('Periyot süresi 0\'dan büyük olmalıdır.'));
                return false;
            }
        }
        if (localKampanya.cariKatilimSiniriTuru === 2) {
            if (!localKampanya.cariKatilimSayisi || Number(localKampanya.cariKatilimSayisi) <= 0) {
                toast.error(t('Katılım sayısı 0\'dan büyük olmalıdır.'));
                return false;
            }
        }
        return true;
    }, [localKampanya.cariKatilimZamanAraligi, localKampanya.cariKatilimPeriyotSuresiGun, localKampanya.cariKatilimSiniriTuru, localKampanya.cariKatilimSayisi, t]);

    // Adım 4 Doğrulama Kontrolü (Sepet ve Ürün Kuralları)
    const validateStep3 = useCallback(() => {
        // Kurallar opsiyoneldir (tüm sepet / koşulsuz kampanya desteklenir)
        return true;
    }, []);

    // Adım 5 Doğrulama Kontrolü (Avantajlar ve Aksiyonlar)
    const validateStep4 = useCallback(() => {
        if (!isIndirimActive && !isHakedisActive) {
            toast.error(t('İndirim veya Hakedişten en az birini aktif etmelisiniz.'));
            return false;
        }

        if (isIndirimActive) {
            if (!localKampanya.indirimTuru) {
                toast.error(t('İndirim türü seçmelisiniz.'));
                return false;
            }
            if (!localKampanya.aksiyonDegeri || Number(localKampanya.aksiyonDegeri) <= 0) {
                toast.error(t('Lütfen geçerli bir indirim değeri giriniz.'));
                return false;
            }
        }

        if (isHakedisActive) {
            if (!localKampanya.hakedisTuru) {
                toast.error(t('Hakediş türü seçmelisiniz.'));
                return false;
            }
            if (localKampanya.hakedisTuru === 3) {
                if (!localKampanya.fiyatFarkiBelgesiId) {
                    toast.error(t('Lütfen bir fiyat farkı belgesi seçiniz.'));
                    return false;
                }
            } else {
                if (!localKampanya.firmaHakEdisTutari || Number(localKampanya.firmaHakEdisTutari) <= 0) {
                    toast.error(t('Lütfen geçerli bir hakediş tutarı veya oranı giriniz.'));
                    return false;
                }
            }
        }

        return true;
    }, [isIndirimActive, isHakedisActive, localKampanya.indirimTuru, localKampanya.aksiyonDegeri, localKampanya.hakedisTuru, localKampanya.fiyatFarkiBelgesiId, localKampanya.firmaHakEdisTutari, t]);

    const handleSaveAction = useCallback(async () => {
        const isValid = validate((data) => validateKampanya(data, isIndirimActive, isHakedisActive, t), localKampanya);

        if (!isValid) {
            toast.error(t('Lütfen zorunlu alanları doldurunuz.'));
            return;
        }

        const cleanedRules = (localKampanya.kurallar || []).map((r: any) => {
            const { _uid, _selectedItems, ...rest } = r;
            return rest;
        });
        
        const finalKampanya: Partial<KampanyaDto> = { 
            ...localKampanya, 
            kodu: localKampanya.kodu || '',
            adi: localKampanya.adi || '',
            birlesmeKurali: localKampanya.birlesmeKurali || 1,
            oncelik: localKampanya.oncelik !== undefined && localKampanya.oncelik !== null ? Number(localKampanya.oncelik) : 50,
            cakismaStratejisi: localKampanya.cakismaStratejisi || 1,
            matrahTuru: localKampanya.matrahTuru || 1,
            maksimumToplamIskontoOrani: localKampanya.maksimumToplamIskontoOrani !== undefined && localKampanya.maksimumToplamIskontoOrani !== null && String(localKampanya.maksimumToplamIskontoOrani) !== '' ? Number(localKampanya.maksimumToplamIskontoOrani) : undefined,
            kampanyaGrupId: localKampanya.kampanyaGrupId ? Number(localKampanya.kampanyaGrupId) : undefined,
            birlestirilebilirKampanyaIdleri: localKampanya.birlesmeKurali === 5 ? (localKampanya.birlestirilebilirKampanyaIdleri || []) : [],
            birlestirilemezKampanyaIdleri: localKampanya.birlesmeKurali === 6 ? (localKampanya.birlestirilemezKampanyaIdleri || []) : [],
            toplamAdetSiniri: localKampanya.toplamAdetSiniri,
            kurallar: cleanedRules,
            cariKatilimZamanAraligi: localKampanya.cariKatilimZamanAraligi || 5,
            cariKatilimPeriyotSuresiGun: localKampanya.cariKatilimZamanAraligi === 6 ? localKampanya.cariKatilimPeriyotSuresiGun : undefined,
            cariKatilimSiniriTuru: localKampanya.cariKatilimSiniriTuru || 3,
            cariKatilimSayisi: localKampanya.cariKatilimSiniriTuru === 2 ? localKampanya.cariKatilimSayisi : (localKampanya.cariKatilimSiniriTuru === 1 ? 1 : undefined),
            kdvDahilMi: isIndirimActive && localKampanya.indirimTuru === 2 ? (localKampanya.kdvDahilMi ?? false) : false,
            firmaHakEdisKdvDahilMi: isHakedisActive && localKampanya.hakedisTuru === 2 ? (localKampanya.firmaHakEdisKdvDahilMi ?? false) : false
        };

        if (!isIndirimActive) {
            finalKampanya.indirimTuru = undefined;
            finalKampanya.aksiyonDegeri = undefined;
            finalKampanya.kdvDahilMi = false;
        }
        if (!isHakedisActive) {
            finalKampanya.hakedisTuru = undefined;
            finalKampanya.firmaHakEdisTutari = undefined;
            finalKampanya.fiyatFarkiBelgesiId = undefined;
            finalKampanya.firmaHakEdisKdvDahilMi = false;
        }

        if (isIndirimActive) {
            finalKampanya.aksiyonTipi = finalKampanya.indirimTuru;
        } else if (isHakedisActive) {
            finalKampanya.aksiyonTipi = 4; // HakedisTutar
        } else {
            finalKampanya.aksiyonTipi = undefined;
        }
        
        onSave(finalKampanya);
        onClose();
    }, [validate, localKampanya, isIndirimActive, isHakedisActive, onSave, onClose, t]);

    const subtitleSummary = useMemo(() => {
        if (isIndirimActive && localKampanya.aksiyonDegeri) {
            return localKampanya.indirimTuru === 1 
                ? `%${localKampanya.aksiyonDegeri} ${t('İndirim')}` 
                : `${Number(localKampanya.aksiyonDegeri).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ ${t('İndirim')}`;
        }
        return undefined;
    }, [isIndirimActive, localKampanya.aksiyonDegeri, localKampanya.indirimTuru, t]);

    return (
        <>
            <BaseWizardPage
                id="kampanyaKuralWizard"
                title={localKampanya.adi?.trim() ? localKampanya.adi : t('auto_kampanya_detayi', 'Kampanya Kuralları ve Detaylar')}
                pageTitle={t('auto_kampanya_kurallari', 'Kampanya Kuralları')}
                subtitleLeft={t('auto_kampanya_kural_alt_baslik', 'Sepet koşulları, cari katılım sınırları, indirim ve bayi hakediş parametreleri.')}
                subtitleRight={subtitleSummary}
                icon={<Megaphone size={22} />}
                showBackButton={true}
                onClose={onClose}
                onFinish={handleSaveAction}
                finishText={t('auto_kampanyayi_kaydet', 'Kampanyayı Kaydet')}
                actions={!shouldHideActionMenu ? [
                    {
                        label: t('Kaydet'),
                        icon: <Save size={15} />,
                        onClick: handleSaveAction,
                        isDefault: true,
                        variant: 'primary',
                        title: t('auto_hizli_kaydet', 'Değişiklikleri Kaydet')
                    }
                ] : undefined}
                hideActionMenu={shouldHideActionMenu}
                className={isTabMode ? 'wizard-hide-footer' : ''}
                size="xl"
                asForm={true}
                persistStep={false}
                asTabs={isTabMode}
            >
                {/* 1. ADIM: Genel Kampanya Bilgileri */}
                <WizardStep 
                    id="genel-bilgiler" 
                    title={t('auto_genel_bilgiler', 'Genel Bilgiler')}
                    onValidate={validateStep1}
                >
                    <div className="wizard-step-body flex flex-col flex-1 w-full gap-20">
                        <div className="text-secondary text-13">
                            {t('auto_genel_bilgiler_aciklama', 'Kampanyanın genel tanımlayıcı kodunu, adını, birleşme önceliğini ve varsa kota sınırını belirleyiniz.')}
                        </div>

                        <div className="form-grid">
                            <div>
                                <label className="form-field-label">
                                    {t('auto_kampanya_kodu', 'Kampanya Kodu')} <span className="text-danger">*</span>
                                </label>
                                <BasitInput
                                    value={localKampanya.kodu || ''}
                                    onChange={(e) => {
                                        setLocalKampanya({ ...localKampanya, kodu: e.target.value });
                                        clearError('kodu');
                                    }}
                                    placeholder={t('auto_ornek_kod', 'Örn: KMP-001')}
                                    className={errors.kodu ? 'is-invalid' : ''}
                                    autoFocus
                                />
                                <FieldError error={errors.kodu} />
                            </div>

                            <div>
                                <label className="form-field-label">
                                    {t('Kampanya Adı')} <span className="text-danger">*</span>
                                </label>
                                <BasitInput
                                    value={localKampanya.adi || ''}
                                    onChange={(e) => {
                                        setLocalKampanya({ ...localKampanya, adi: e.target.value });
                                        clearError('adi');
                                    }}
                                    placeholder={t('auto_ornek_kampanya_adi', 'Örn: Beyaz Eşya 2. Ürüne %50 İndirim')}
                                    className={errors.adi ? 'is-invalid' : ''}
                                />
                                <FieldError error={errors.adi} />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <label className="form-field-label m-0">
                                        {t('auto_kampanya_grubu', 'Kampanya Grubu / Ailesi')}
                                    </label>
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-xs flex items-center gap-4 text-11"
                                        onClick={() => {
                                            setCustomGrupAdi('');
                                            setCustomGrupKodu('');
                                            setCustomGrupTekilMi(true);
                                            setIsCustomGrupModalOpen(true);
                                        }}
                                        title={t('auto_yeni_ozel_grup_olustur', 'Yeni Özel Grup Oluştur')}
                                    >
                                        <Plus size={12} className="text-primary" />
                                        <span>{t('auto_ozel_grup_ekle', 'Özel Grup Ekle')}</span>
                                    </button>
                                </div>
                                <BaseDropdownSecici
                                    value={localKampanya.kampanyaGrupId?.toString() || ''}
                                    onChange={(id: string) => {
                                        const val = id ? parseInt(id) : undefined;
                                        setLocalKampanya({ ...localKampanya, kampanyaGrupId: val });
                                    }}
                                    options={grupOptions}
                                    placeholder={t('auto_kampanya_grubu_sec', 'Kampanya Grubu Seçiniz')}
                                    clearable={true}
                                    extraAction={{
                                        icon: <Plus size={14} />,
                                        label: t('auto_yeni_ozel_grup_olustur', 'Yeni Özel Grup Oluştur...'),
                                        onClick: () => {
                                            setCustomGrupAdi('');
                                            setCustomGrupKodu('');
                                            setCustomGrupTekilMi(true);
                                            setIsCustomGrupModalOpen(true);
                                        }
                                    }}
                                />
                                <div className="text-secondary text-11 pt-4 leading-normal">
                                    {t('auto_kampanya_grubu_yardim', 'Aynı gruptaki paket kampanyalarından sepette yalnızca en avantajlı olan uygulanır. Tekil indirimler için \'Grup Yok\' seçebilirsiniz.')}
                                </div>
                            </div>

                            <div>
                                <label className="form-field-label">
                                    {t('auto_toplam_adet_siniri', 'Toplam Kampanya Kotası / Adet Sınırı')}
                                </label>
                                <input
                                    type="number"
                                    className="form-input w-full"
                                    value={localKampanya.toplamAdetSiniri ?? ''}
                                    onChange={(e) => {
                                        const val = e.target.value ? parseInt(e.target.value) : undefined;
                                        setLocalKampanya({ ...localKampanya, toplamAdetSiniri: val });
                                    }}
                                    placeholder={t('auto_sinirsiz_kota_placeholder', 'Sınırsız (Kota sınırı yoksa boş bırakın)')}
                                    min="1"
                                />
                            </div>
                        </div>
                    </div>
                </WizardStep>

                {/* 2. ADIM: Birleşim & Öncelik Matrisi */}
                <WizardStep 
                    id="birlesim-kurallari" 
                    title={t('auto_birlesim_ve_oncelik', 'Birleşim & Öncelik')}
                    onValidate={validateStepBirlesim}
                >
                    <div className="wizard-step-body flex flex-col flex-1 w-full gap-20">
                        <div className="text-secondary text-13">
                            {t('auto_birlesim_ve_oncelik_aciklama', 'Kampanyanın diğer kampanyalarla birleşme serbestliğini, izinli/yasaklı ilişkilerini, uygulama önceliğini ve kâr marjı korumasını belirleyiniz.')}
                        </div>

                        <div className="flex flex-col gap-16">
                            <div>
                                <label className="form-field-label">
                                    {t('auto_birlesme_kurali', 'Birleşme Kuralı')}
                                </label>
                                <BaseDropdownSecici
                                    value={localKampanya.birlesmeKurali?.toString() || '1'}
                                    onChange={(id: string) => {
                                        setLocalKampanya({ ...localKampanya, birlesmeKurali: parseInt(id) || 1 });
                                        clearError('birlestirilebilirKampanyaIdleri');
                                        clearError('birlestirilemezKampanyaIdleri');
                                    }}
                                    options={birlesmeKuraliOptions}
                                    placeholder={t('auto_birlesme_kurali_sec', 'Birleşme Kuralı Seçiniz')}
                                />
                            </div>

                            {localKampanya.birlesmeKurali === 5 && (
                                <div className="campaign-relation-box flex flex-col gap-12">
                                    <div className="flex items-center gap-8">
                                        <Layers size={16} className="text-primary flex-shrink-0" />
                                        <span className="font-semibold text-13 text-primary">
                                            {t('auto_secilen_kampanyalar', 'İzin Verilen Kampanyalar (Whitelist)')}
                                        </span>
                                    </div>
                                    <div className="text-secondary text-12">
                                        {t('auto_whitelist_aciklama', 'Bu kampanya sepet değerlendirmesinde YALNIZCA aşağıda seçilen kampanyalarla aynı anda geçerli olabilir. Listede olmayan diğer tüm kampanyalar engellenir.')}
                                    </div>
                                    <BaseDropdownSecici
                                        value={selectedWhitelistId}
                                        onChange={handleAddWhitelist}
                                        options={availableWhitelistOptions}
                                        placeholder={t('auto_kampanya_ekle_placeholder', 'Listeden kampanya seçip ekleyiniz...')}
                                        className={errors.birlestirilebilirKampanyaIdleri ? 'is-invalid' : ''}
                                    />
                                    <FieldError error={errors.birlestirilebilirKampanyaIdleri} />
                                    {(localKampanya.birlestirilebilirKampanyaIdleri || []).length > 0 && (
                                        <div className="flex flex-wrap gap-8 pt-4">
                                            {localKampanya.birlestirilebilirKampanyaIdleri!.map(cid => {
                                                const found = secimListesi.find(x => x.id === cid);
                                                const label = found ? `[${found.kodu}] ${found.adi}` : `ID: ${cid}`;
                                                return (
                                                    <span key={cid} className="campaign-tag-chip">
                                                        <span>{label}</span>
                                                        <button
                                                            type="button"
                                                            className="campaign-tag-chip-remove"
                                                            onClick={() => handleRemoveWhitelist(cid)}
                                                            title={t('Sil')}
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {localKampanya.birlesmeKurali === 6 && (
                                <div className="campaign-relation-box flex flex-col gap-12">
                                    <div className="flex items-center gap-8">
                                        <ShieldAlert size={16} className="text-danger flex-shrink-0" />
                                        <span className="font-semibold text-13 text-danger">
                                            {t('auto_secilen_haric_kampanyalar', 'Birlikte Uygulanamaz Kampanyalar (Blacklist)')}
                                        </span>
                                    </div>
                                    <div className="text-secondary text-12">
                                        {t('auto_blacklist_aciklama', 'Bu kampanya sepet değerlendirmesinde aşağıda seçilen kampanyalar hariç tüm kampanyalarla birleştirilebilir. Seçilen kampanyalarla aynı sepete giremez.')}
                                    </div>
                                    <BaseDropdownSecici
                                        value={selectedBlacklistId}
                                        onChange={handleAddBlacklist}
                                        options={availableBlacklistOptions}
                                        placeholder={t('auto_kampanya_ekle_placeholder', 'Listeden kampanya seçip ekleyiniz...')}
                                        className={errors.birlestirilemezKampanyaIdleri ? 'is-invalid' : ''}
                                    />
                                    <FieldError error={errors.birlestirilemezKampanyaIdleri} />
                                    {(localKampanya.birlestirilemezKampanyaIdleri || []).length > 0 && (
                                        <div className="flex flex-wrap gap-8 pt-4">
                                            {localKampanya.birlestirilemezKampanyaIdleri!.map(cid => {
                                                const found = secimListesi.find(x => x.id === cid);
                                                const label = found ? `[${found.kodu}] ${found.adi}` : `ID: ${cid}`;
                                                return (
                                                    <span key={cid} className="campaign-tag-chip">
                                                        <span>{label}</span>
                                                        <button
                                                            type="button"
                                                            className="campaign-tag-chip-remove"
                                                            onClick={() => handleRemoveBlacklist(cid)}
                                                            title={t('Sil')}
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="form-grid">
                                <div>
                                    <label className="form-field-label">
                                        {t('auto_oncelik_etiketi', 'Uygulama Önceliği (1: En Yüksek - 100: En Düşük)')}
                                    </label>
                                    <input
                                        type="number"
                                        className={`form-input w-full ${errors.oncelik ? 'is-invalid' : ''}`}
                                        value={localKampanya.oncelik ?? 50}
                                        onChange={(e) => {
                                            const val = e.target.value ? parseInt(e.target.value) : undefined;
                                            setLocalKampanya({ ...localKampanya, oncelik: val });
                                            clearError('oncelik');
                                        }}
                                        placeholder="50"
                                        min="1"
                                        max="100"
                                    />
                                    <FieldError error={errors.oncelik} />
                                </div>

                                <div>
                                    <label className="form-field-label">
                                        {t('auto_cakisma_stratejisi', 'Çakışma Çözüm Stratejisi')}
                                    </label>
                                    <BaseDropdownSecici
                                        value={localKampanya.cakismaStratejisi?.toString() || '1'}
                                        onChange={(id: string) => {
                                            setLocalKampanya({ ...localKampanya, cakismaStratejisi: parseInt(id) || 1 });
                                        }}
                                        options={cakismaStratejisiOptions}
                                        placeholder={t('auto_cakisma_stratejisi', 'Çakışma Çözüm Stratejisi')}
                                    />
                                </div>

                                <div>
                                    <label className="form-field-label">
                                        {t('auto_matrah_turu', 'Matrah Hesaplama Yöntemi')}
                                    </label>
                                    <BaseDropdownSecici
                                        value={localKampanya.matrahTuru?.toString() || '1'}
                                        onChange={(id: string) => {
                                            setLocalKampanya({ ...localKampanya, matrahTuru: parseInt(id) || 1 });
                                        }}
                                        options={matrahTuruOptions}
                                        placeholder={t('auto_matrah_turu', 'Matrah Hesaplama Yöntemi')}
                                    />
                                </div>

                                <div>
                                    <label className="form-field-label">
                                        {t('auto_maksimum_toplam_iskonto', 'Maksimum Toplam İskonto Tavanı (%)')}
                                    </label>
                                    <input
                                        type="number"
                                        className={`form-input w-full ${errors.maksimumToplamIskontoOrani ? 'is-invalid' : ''}`}
                                        value={localKampanya.maksimumToplamIskontoOrani ?? ''}
                                        onChange={(e) => {
                                            const val = e.target.value ? parseFloat(e.target.value) : undefined;
                                            setLocalKampanya({ ...localKampanya, maksimumToplamIskontoOrani: val });
                                            clearError('maksimumToplamIskontoOrani');
                                        }}
                                        placeholder={t('auto_maksimum_toplam_iskonto_placeholder', 'Örn: %40 (Kâr marjı koruması, boş bırakılırsa sınırsız)')}
                                        min="0"
                                        max="100"
                                    />
                                    <FieldError error={errors.maksimumToplamIskontoOrani} />
                                </div>
                            </div>

                            <div className="katilim-ozet-box">
                                <Info size={16} className="text-primary flex-shrink-0" />
                                <span className="katilim-ozet-text">
                                    {t('auto_oncelik_ve_matrah_bilgisi', 'Öncelik puanı küçük olan (örn: 10), puanı büyük olandan (örn: 50) daha önce uygulanır. Kademeli matrahta önceki indirimin düşürdüğü net tutar sonraki kampanyaya girdi olur.')}
                                </span>
                            </div>
                        </div>
                    </div>
                </WizardStep>

                {/* 3. ADIM: Cari Katılım Koşulları */}
                <WizardStep 
                    id="katilim-kosullari" 
                    title={t('Cari Katılım Koşulları')}
                    onValidate={validateStep2}
                >
                    <div className="wizard-step-body flex flex-col flex-1 w-full gap-20">
                        <div className="text-secondary text-13">
                            {t('auto_cari_katilim_aciklama', 'Cari hesapların bu kampanyadan hangi periyotlarda ve kaç kez yararlanabileceğini belirleyiniz.')}
                        </div>

                        <div className="form-grid">
                            <div>
                                <label className="form-field-label">
                                    {t('Yararlanma Periyodu')}
                                </label>
                                <BaseDropdownSecici
                                    value={localKampanya.cariKatilimZamanAraligi?.toString() || '5'}
                                    onChange={(id: string) => {
                                        const val = id ? parseInt(id) : 5;
                                        setLocalKampanya({
                                            ...localKampanya,
                                            cariKatilimZamanAraligi: val,
                                            cariKatilimPeriyotSuresiGun: val === 6 ? (localKampanya.cariKatilimPeriyotSuresiGun || 15) : undefined
                                        });
                                        clearError('cariKatilimZamanAraligi');
                                        clearError('cariKatilimPeriyotSuresiGun');
                                    }}
                                    options={zamanAraligiOptions}
                                    placeholder={t('Yararlanma Periyodu Seçiniz')}
                                    className={errors.cariKatilimZamanAraligi ? 'is-invalid' : ''}
                                />
                                <FieldError error={errors.cariKatilimZamanAraligi} />
                            </div>

                            {localKampanya.cariKatilimZamanAraligi === 6 && (
                                <div>
                                    <label className="form-field-label">
                                        {t('Periyot Süresi (Gün)')}
                                    </label>
                                    <input
                                        type="number"
                                        className={`form-input w-full ${errors.cariKatilimPeriyotSuresiGun ? 'is-invalid' : ''}`}
                                        value={localKampanya.cariKatilimPeriyotSuresiGun ?? ''}
                                        onChange={(e) => {
                                            const gun = parseInt(e.target.value) || 0;
                                            setLocalKampanya({
                                                ...localKampanya,
                                                cariKatilimPeriyotSuresiGun: gun
                                            });
                                            clearError('cariKatilimPeriyotSuresiGun');
                                        }}
                                        placeholder={t('Örn: 15')}
                                        min="1"
                                    />
                                    <FieldError error={errors.cariKatilimPeriyotSuresiGun} />
                                </div>
                            )}

                            <div>
                                <label className="form-field-label">
                                    {t('Katılım Sınırı')}
                                </label>
                                <BaseDropdownSecici
                                    value={localKampanya.cariKatilimSiniriTuru?.toString() || '3'}
                                    onChange={(id: string) => {
                                        const val = id ? parseInt(id) : 3;
                                        setLocalKampanya({
                                            ...localKampanya,
                                            cariKatilimSiniriTuru: val,
                                            cariKatilimSayisi: val === 1 ? 1 : (val === 2 ? (localKampanya.cariKatilimSayisi || 1) : undefined)
                                        });
                                        clearError('cariKatilimSiniriTuru');
                                        clearError('cariKatilimSayisi');
                                    }}
                                    options={katilimSiniriOptions}
                                    placeholder={t('Katılım Sınırı Seçiniz')}
                                    className={errors.cariKatilimSiniriTuru ? 'is-invalid' : ''}
                                />
                                <FieldError error={errors.cariKatilimSiniriTuru} />
                            </div>

                            {localKampanya.cariKatilimSiniriTuru === 2 && (
                                <div>
                                    <label className="form-field-label">
                                        {t('Katılım Sayısı (Kez)')}
                                    </label>
                                    <input
                                        type="number"
                                        className={`form-input w-full ${errors.cariKatilimSayisi ? 'is-invalid' : ''}`}
                                        value={localKampanya.cariKatilimSayisi ?? ''}
                                        onChange={(e) => {
                                            const count = parseInt(e.target.value) || 0;
                                            setLocalKampanya({
                                                ...localKampanya,
                                                cariKatilimSayisi: count
                                            });
                                            clearError('cariKatilimSayisi');
                                        }}
                                        placeholder={t('Örn: 3')}
                                        min="1"
                                    />
                                    <FieldError error={errors.cariKatilimSayisi} />
                                </div>
                            )}
                        </div>

                        {getKatilimOzetMetni() && (
                            <div className="katilim-ozet-box">
                                <Info size={16} className="text-primary flex-shrink-0" />
                                <span className="katilim-ozet-text">
                                    {getKatilimOzetMetni()}
                                </span>
                            </div>
                        )}
                    </div>
                </WizardStep>

                {/* 3. ADIM: Sepet ve Ürün Kuralları */}
                <WizardStep 
                    id="sepet-kurallari" 
                    title={t('Sepet ve Ürün Kuralları')}
                    onValidate={validateStep3}
                >
                    <div className="wizard-step-body flex flex-col flex-1 w-full gap-16">
                        <div className="flex justify-between items-center">
                            <div className="text-secondary text-13">
                                {t('auto_sepet_kurallari_aciklama', 'Bu kampanyanın uygulanabilmesi için sepette aranacak ürün, kategori veya sepet tutarı kurallarını tanımlayınız.')}
                            </div>
                            <div className="flex items-center gap-8 flex-shrink-0">
                                {(localKampanya.kurallar || []).length > 0 && (
                                    <span className="chip-primary text-12 font-medium">
                                        {(localKampanya.kurallar || []).length} {t('Kural')}
                                    </span>
                                )}
                                <button 
                                    type="button" 
                                    className="btn btn-secondary btn-sm flex items-center gap-6"
                                    onClick={() => { setEditingRule(null); setIsKuralPopupOpen(true); }}
                                >
                                    <Plus size={15} />
                                    <span>{t('auto_yeni_kural_ekle', 'Yeni Kural Ekle')}</span>
                                </button>
                            </div>
                        </div>

                        <FieldError error={errors.kurallar} />
                        <KampanyaRuleViewPanel 
                            rules={localKampanya.kurallar || []}
                            onEdit={(rule) => { setEditingRule(rule); setIsKuralPopupOpen(true); }}
                            onDelete={(ruleUid) => deleteRule(ruleUid)}
                            onAdd={() => { setEditingRule(null); setIsKuralPopupOpen(true); }}
                            getKuralAlaniAdi={getKuralAlaniAdi}
                            getOperatorAdi={getOperatorAdi}
                            getDeger={getDeger}
                            emptyMessage={t('auto_kural_bulunamadi', 'Bu kampanya için henüz bir koşul veya ürün kuralı tanımlanmadı. Kural tanımlanmadığında kampanya tüm ürünler için koşulsuz geçerli olur.')}
                            addRuleText={t('auto_yeni_kural_ekle', 'Yeni Kural Ekle')}
                        />
                    </div>
                </WizardStep>

                {/* 4. ADIM: Kampanya Avantajları & Aksiyonlar */}
                <WizardStep 
                    id="avantajlar-aksiyonlar" 
                    title={t('auto_kampanya_avantajlari', 'Kampanya Avantajları & Aksiyonlar')}
                    onValidate={validateStep4}
                >
                    <div className="wizard-step-body flex flex-col flex-1 w-full gap-20">
                        <div className="text-secondary text-13">
                            {t('auto_avantajlar_aciklama', 'Müşteriye uygulanacak indirim avantajlarını ve üretici/dağıtıcıdan talep edilecek bayi hakedişini tanımlayınız.')}
                        </div>

                        <FieldError error={errors.indirimHakedis} />

                        {/* 4.1 Müşteri İndirimi */}
                        <div className={`kampanya-action-block ${isIndirimActive ? 'active' : ''}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-8">
                                    <Percent size={18} className="text-primary" />
                                    <div>
                                        <span className="font-semibold text-14 text-primary">{t('auto_musteri_indirimi', 'Müşteri İndirimi')}</span>
                                        <div className="text-secondary text-12">{t('auto_musteri_indirimi_aciklama', 'Sepette veya kalem bazında müşteriye yansıtılacak indirim.')}</div>
                                    </div>
                                </div>
                                <BaseSwitch 
                                    label={t('İndirim Uygula')}
                                    checked={isIndirimActive}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        if (!checked && !isHakedisActive) {
                                            toast.error(t('İndirim veya Hakedişten en az biri aktif olmalıdır.'));
                                            return;
                                        }
                                        setIsIndirimActive(checked);
                                        if (checked) {
                                            clearError('indirimHakedis');
                                        }
                                    }}
                                />
                            </div>

                            {isIndirimActive && (
                                <div className="form-grid pt-12 border-t">
                                    <div>
                                        <label className="form-field-label">
                                            {t('İndirim Türü')}
                                        </label>
                                        <BaseDropdownSecici
                                            value={localKampanya.indirimTuru?.toString() || '2'}
                                            onChange={(id: string) => {
                                                const val = parseInt(id);
                                                setLocalKampanya({ 
                                                    ...localKampanya, 
                                                    indirimTuru: val,
                                                    kdvDahilMi: val === 2 ? (localKampanya.kdvDahilMi ?? false) : false
                                                });
                                                clearError('indirimTuru');
                                            }}
                                            options={[
                                                { id: '2', label: t('Tutar (₺)') },
                                                { id: '1', label: t('Yüzdesel (%)') }
                                            ]}
                                            placeholder={t('İndirim Türü Seçiniz')}
                                            className={errors.indirimTuru ? 'is-invalid' : ''}
                                        />
                                        <FieldError error={errors.indirimTuru} />
                                    </div>

                                    <div>
                                        <label className="form-field-label">
                                            {localKampanya.indirimTuru === 1 ? t('İndirim Oranı') : t('İndirim Tutarı')}
                                        </label>
                                        <div className="flex items-center gap-12">
                                            <div className="flex-1">
                                                {localKampanya.indirimTuru === 1 ? (
                                                    <input 
                                                        type="number"
                                                        className={`form-input w-full ${errors.aksiyonDegeri ? 'is-invalid' : ''}`}
                                                        value={localKampanya.aksiyonDegeri || ''}
                                                        onChange={(e) => {
                                                            setLocalKampanya({ ...localKampanya, aksiyonDegeri: parseFloat(e.target.value) || 0 });
                                                            clearError('aksiyonDegeri');
                                                        }}
                                                        placeholder={t('Örn: 10')}
                                                        min="0"
                                                        max="100"
                                                    />
                                                ) : (
                                                    <CurrencyInput 
                                                        value={localKampanya.aksiyonDegeri || 0}
                                                        onChange={(e) => {
                                                            setLocalKampanya({ ...localKampanya, aksiyonDegeri: e.target.value });
                                                            clearError('aksiyonDegeri');
                                                        }}
                                                        suffix=" ₺"
                                                        className={errors.aksiyonDegeri ? 'is-invalid' : ''}
                                                    />
                                                )}
                                            </div>
                                            {localKampanya.indirimTuru === 2 && (
                                                <div className="flex-shrink-0">
                                                    <BaseSwitch 
                                                        label={t('KDV Dahil')}
                                                        checked={localKampanya.kdvDahilMi || false}
                                                        onChange={(e) => {
                                                            setLocalKampanya({ ...localKampanya, kdvDahilMi: e.target.checked });
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <FieldError error={errors.aksiyonDegeri} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4.2 Bayi Hakedişi / Üretici Katkısı */}
                        <div className={`kampanya-action-block ${isHakedisActive ? 'active' : ''}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-8">
                                    <Banknote size={18} className="text-primary" />
                                    <div>
                                        <span className="font-semibold text-14 text-primary">{t('auto_bayi_hakedisi', 'Bayi Hakedişi / Üretici Katkısı')}</span>
                                        <div className="text-secondary text-12">{t('auto_bayi_hakedisi_aciklama', 'Üretici veya ana dağıtıcının karşıladığı kampanya teşviki.')}</div>
                                    </div>
                                </div>
                                <BaseSwitch 
                                    label={t('Hakediş Uygula')}
                                    checked={isHakedisActive}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        if (!checked && !isIndirimActive) {
                                            toast.error(t('İndirim veya Hakedişten en az biri aktif olmalıdır.'));
                                            return;
                                        }
                                        setIsHakedisActive(checked);
                                        if (checked) {
                                            clearError('indirimHakedis');
                                            if (!localKampanya.hakedisTuru) {
                                                setLocalKampanya(prev => ({ ...prev, hakedisTuru: 1 }));
                                            }
                                        }
                                    }}
                                />
                            </div>

                            {isHakedisActive && (
                                <div className="form-grid pt-12 border-t">
                                    <div>
                                        <label className="form-field-label">
                                            {t('Hakediş Türü')}
                                        </label>
                                        <BaseDropdownSecici
                                            value={localKampanya.hakedisTuru?.toString() || '1'}
                                            onChange={(id: string) => {
                                                const val = parseInt(id);
                                                setLocalKampanya({ 
                                                    ...localKampanya, 
                                                    hakedisTuru: val,
                                                    firmaHakEdisKdvDahilMi: val === 2 ? (localKampanya.firmaHakEdisKdvDahilMi ?? false) : false
                                                });
                                                clearError('hakedisTuru');
                                            }}
                                            options={[
                                                { id: '1', label: t('Oransal (%)') },
                                                { id: '2', label: t('Sabit Tutar (₺)') },
                                                { id: '3', label: t('Fiyat Farkı Belgesi') }
                                            ]}
                                            placeholder={t('Hakediş Türü Seçiniz')}
                                            className={errors.hakedisTuru ? 'is-invalid' : ''}
                                        />
                                        <FieldError error={errors.hakedisTuru} />
                                    </div>

                                    <div>
                                        <label className="form-field-label">
                                            {localKampanya.hakedisTuru === 1 
                                                ? t('Hakediş Oranı') 
                                                : localKampanya.hakedisTuru === 2 
                                                ? t('Hakediş Tutarı') 
                                                : t('Fiyat Farkı Belgesi')}
                                        </label>
                                        <div className="flex items-center gap-12">
                                            <div className="flex-1">
                                                {localKampanya.hakedisTuru === 3 ? (
                                                    <FiyatFarkiSecici 
                                                        value={localKampanya.fiyatFarkiBelgesiId}
                                                        onChange={(belgeId) => {
                                                            setLocalKampanya({ ...localKampanya, fiyatFarkiBelgesiId: belgeId });
                                                            clearError('fiyatFarkiBelgesiId');
                                                        }}
                                                        className={errors.fiyatFarkiBelgesiId ? 'is-invalid' : ''}
                                                    />
                                                ) : (
                                                    localKampanya.hakedisTuru === 1 ? (
                                                        <input 
                                                            type="number"
                                                            className={`form-input w-full ${errors.firmaHakEdisTutari ? 'is-invalid' : ''}`}
                                                            value={localKampanya.firmaHakEdisTutari || ''}
                                                            onChange={(e) => {
                                                                setLocalKampanya({ ...localKampanya, firmaHakEdisTutari: parseFloat(e.target.value) || 0 });
                                                                clearError('firmaHakEdisTutari');
                                                            }}
                                                            placeholder={t('Örn: 5')}
                                                            min="0"
                                                            max="100"
                                                        />
                                                    ) : (
                                                        <CurrencyInput 
                                                            value={localKampanya.firmaHakEdisTutari || 0}
                                                            onChange={(e) => {
                                                                setLocalKampanya({ ...localKampanya, firmaHakEdisTutari: e.target.value });
                                                                clearError('firmaHakEdisTutari');
                                                            }}
                                                            suffix=" ₺"
                                                            className={errors.firmaHakEdisTutari ? 'is-invalid' : ''}
                                                        />
                                                    )
                                                )}
                                            </div>
                                            {localKampanya.hakedisTuru === 2 && (
                                                <div className="flex-shrink-0">
                                                    <BaseSwitch 
                                                        label={t('KDV Dahil')}
                                                        checked={localKampanya.firmaHakEdisKdvDahilMi || false}
                                                        onChange={(e) => {
                                                            setLocalKampanya({ ...localKampanya, firmaHakEdisKdvDahilMi: e.target.checked });
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <FieldError error={localKampanya.hakedisTuru === 3 ? errors.fiyatFarkiBelgesiId : errors.firmaHakEdisTutari} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </WizardStep>
            </BaseWizardPage>

            <BasePopup
                isOpen={isKuralPopupOpen}
                onClose={() => setIsKuralPopupOpen(false)}
                title={editingRule ? t('Kural Düzenle') : t('Yeni Kural')}
                formComponent={KampanyaKuralPopup as any}
                initialData={editingRule}
                onSuccess={handleSaveRule}
            />

            {/* Özel Kampanya Grubu Ekleme Modalı */}
            {isCustomGrupModalOpen && (
                <Modal
                    isOpen={isCustomGrupModalOpen}
                    onClose={() => {
                        if (!isAddingGrup) {
                            setIsCustomGrupModalOpen(false);
                            setCustomGrupAdi('');
                            setCustomGrupKodu('');
                        }
                    }}
                    title={
                        <div className="flex items-center gap-8">
                            <Layers size={18} className="text-primary" />
                            <span>{t('auto_yeni_kampanya_grubu', 'Yeni Kampanya Grubu / Ailesi')}</span>
                        </div>
                    }
                    size="md"
                    hideMaximize={true}
                >
                    <div className="flex flex-col p-20 gap-16">
                        <div className="text-secondary text-12">
                            {t('auto_ozel_grup_modal_aciklama', 'Benzer sepet veya paket kampanyalarını gruplayarak sepette yalnızca en avantajlı olanın uygulanmasını sağlayabilirsiniz.')}
                        </div>

                        <div className="flex flex-col gap-6">
                            <label className="form-field-label m-0">
                                {t('auto_grup_adi', 'Grup Adı')} <span className="text-danger">*</span>
                            </label>
                            <BasitInput
                                value={customGrupAdi}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setCustomGrupAdi(val);
                                    if (!customGrupKodu || customGrupKodu === customGrupAdi.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10)) {
                                        setCustomGrupKodu(val.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10));
                                    }
                                }}
                                placeholder={t('auto_ozel_grup_placeholder', 'Yeni grup adı (örn: Çeyiz Seti)...')}
                                autoFocus
                            />
                        </div>

                        <div className="flex flex-col gap-6">
                            <label className="form-field-label m-0">
                                {t('auto_grup_kodu', 'Grup Kodu')}
                            </label>
                            <BasitInput
                                value={customGrupKodu}
                                onChange={(e) => setCustomGrupKodu(e.target.value.toUpperCase())}
                                placeholder={t('auto_grup_kodu_placeholder', 'Örn: CEYIZ, BEYAZESYA...')}
                            />
                        </div>

                        <div className="flex items-center justify-between p-12 bg-surface rounded border border-border">
                            <div className="flex flex-col gap-2">
                                <span className="text-13 font-medium text-primary">
                                    {t('auto_ayni_gruptan_tek_kampanya', 'Sepette Sadece Biri Geçerli Olsun')}
                                </span>
                                <span className="text-11 text-secondary">
                                    {t('auto_ayni_gruptan_tek_kampanya_aciklama', 'Bu gruptaki kampanyalar birbiriyle çakışırsa yalnızca en avantajlı olan işletilir.')}
                                </span>
                            </div>
                            <BaseSwitch
                                checked={customGrupTekilMi}
                                onChange={(e: any) => setCustomGrupTekilMi(typeof e === 'boolean' ? e : !!e?.target?.checked)}
                            />
                        </div>

                        <div className="flex justify-end items-center gap-8 pt-12 border-t border-border mt-4">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                disabled={isAddingGrup}
                                onClick={() => {
                                    setIsCustomGrupModalOpen(false);
                                    setCustomGrupAdi('');
                                    setCustomGrupKodu('');
                                }}
                            >
                                {t('İptal')}
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary flex items-center gap-6"
                                disabled={isAddingGrup || !customGrupAdi.trim()}
                                onClick={handleCreateCustomGrup}
                            >
                                <Plus size={15} />
                                <span>{isAddingGrup ? t('Kaydediliyor...') : t('auto_grubu_olustur', 'Grubu Oluştur')}</span>
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default KampanyaKuralWizard;
