/**
 * Webakus ERP - Kampanya Belgesi Tanımlama ve Yönetim Formu (KampanyaForm).
 * BSH, Arçelik, Vestel vb. üretici kampanya bültenlerini ve şirket içi satış kampanyalarını,
 * hakediş kurallarını, ürün kısıtlarını ve yapay zeka taslaklarını yönetir.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { BaseDocumentPage, DocumentHeaderField, SpreadsheetGrid, DocumentResultPanel, BasePopup, BaseInput, DateRangeInput } from '@akalin/ui';

import { useMetadata } from '../context/MetadataContext';
import toast from 'react-hot-toast';
import { KampanyaBelgesiCreateDto, KampanyaDto } from '../dtos/KampanyalarDto';
import { kampanyalarService } from '../services/KampanyalarService';
import { useProductService } from '../adapters/ProductServiceContext';
import { Edit2, Trash2, Plus, FileSpreadsheet } from 'lucide-react';
import KampanyaKuralWizard from './KampanyaKuralWizard';
import { getKampanyaDefaultDates } from '../defaults/kampanyaDefaultValue';
import { validateKampanyaBelgesiForm } from '../validators/kampanyaValidation';
import ExcelImportPage, { ExcelColumnDef } from '../pages/ExcelImportPage';

const KampanyaForm: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const { enums } = useMetadata();
    const productService = useProductService();
    const [isLoading, setIsLoading] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const [belgeAyar, setBelgeAyar] = useState<any>(null);

    const draftKey = `webakus_kampanya_belgesi_draft_${id || 'yeni'}`;

    const basePath = location.pathname.includes('/kural')
        ? location.pathname.replace(/\/kural.*$/, '')
        : (id ? (location.pathname.includes('/duzenle/') ? `/kampanyalar/duzenle/${id}` : `/kampanyalar/${id}`) : '/kampanyalar/yeni');

    const isKuralRoute = location.pathname.includes('/kural');
    const kuralIndexMatch = location.pathname.match(/\/kural\/(\d+)$/);
    const routeKuralIndex = kuralIndexMatch 
        ? parseInt(kuralIndexMatch[1], 10) 
        : ((location.pathname.endsWith('/kural/yeni') || location.pathname.endsWith('/kural')) ? -1 : null);

    const isExcelImportRoute = location.pathname.endsWith('/excel-import');
    const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
    const showExcelImport = isExcelImportRoute || isExcelImportOpen;

    const excelColumns: ExcelColumnDef[] = [
        { key: 'urunKodu', label: t('Ürün Kodu Sütunu'), type: 'column', expectedType: 'string', required: true },
        { key: 'kampanyaAdi', label: t('Kampanya Adı Sütunu'), type: 'column', expectedType: 'string' },
        { key: 'aksiyonDegeri', label: t('Hakediş Tutarı / Oranı Sütunu'), type: 'column', expectedType: 'number' },
        { key: 'gerekliMiktar', label: t('Gerekli Miktar Sütunu'), type: 'column', expectedType: 'number' }
    ];

    // Kampanya Belgesi Data
    const [formData, setFormData] = useState<KampanyaBelgesiCreateDto>(() => {
        if (location.state?.formData) {
            return location.state.formData;
        }
        try {
            const saved = sessionStorage.getItem(draftKey);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {}
        return {
            belgeNo: '[OTOMATIK]', // Varsayılan olarak otomatik
            adi: '',
            baslangicTarihi: new Date().toISOString().split('T')[0],
            bitisTarihi: new Date().toISOString().split('T')[0],
            hakedisSonTarihi: undefined,
            aktifMi: true,
            kampanyalar: []
        };
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBulutDosyaId, setSelectedBulutDosyaId] = useState<number | null>(null);
    const [selectedKampanya, setSelectedKampanya] = useState<Partial<KampanyaDto> | null>(null);
    const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

    useEffect(() => {
        try {
            sessionStorage.setItem(draftKey, JSON.stringify(formData));
        } catch (e) {}
    }, [formData, draftKey]);

    useEffect(() => {
        if (!isKuralRoute && isModalOpen) {
            setIsModalOpen(false);
            setSelectedKampanya(null);
            setSelectedRowIndex(null);
        }
    }, [isKuralRoute, isModalOpen]);

    useEffect(() => {
        if (!location.pathname.endsWith('/excel-import')) {
            setIsExcelImportOpen(false);
        }
    }, [location.pathname]);

    const handleOpenExcelImport = useCallback(() => {
        const cleanPath = location.pathname.replace(/\/+$/, '').replace(/\/(bulut-dosyalari|excel-import|kural.*)$/, '');
        if (!isExcelImportRoute) {
            navigate(`${cleanPath}/excel-import`, {
                state: {
                    ...location.state,
                    formData: formData || location.state?.formData
                }
            });
        }
        setIsExcelImportOpen(true);
    }, [isExcelImportRoute, location.pathname, location.state, formData, navigate]);

    const handleCloseExcelImport = useCallback(() => {
        setIsExcelImportOpen(false);
        if (location.pathname.endsWith('/excel-import')) {
            const parentPath = location.pathname.replace(/\/excel-import$/, '');
            navigate(parentPath, {
                state: {
                    ...location.state,
                    formData: formData || location.state?.formData
                }
            });
        }
    }, [location.pathname, location.state, formData, navigate]);

    const handleExcelImport = (importedRows: any[]) => {
        if (!importedRows || importedRows.length === 0) return;
        
        const newKampanyalar = [...(formData.kampanyalar || [])];
        
        importedRows.forEach((row) => {
            const code = String(row.urunKodu || '').trim();
            if (!code) return;
            const kmpName = row.kampanyaAdi ? String(row.kampanyaAdi).trim() : `${formData.adi || t('Kampanya')} - Kural ${newKampanyalar.length + 1}`;
            const aksiyonDegeri = Number(row.aksiyonDegeri) || 0;
            const miktar = Number(row.gerekliMiktar) || 1;

            newKampanyalar.push({
                id: undefined,
                kodu: `KMP-${newKampanyalar.length + 1 < 10 ? '0' : ''}${newKampanyalar.length + 1}`,
                adi: kmpName,
                birlesmeKurali: 1,
                oncelik: 50,
                cakismaStratejisi: 1,
                matrahTuru: 1,
                aksiyonTipi: aksiyonDegeri > 0 && aksiyonDegeri <= 100 ? 1 : 2,
                aksiyonDegeri: aksiyonDegeri,
                kdvDahilMi: false,
                firmaHakEdisOrani: 100,
                cariKatilimSiniriTuru: 3,
                kurallar: [
                    {
                        kuralAlani: 1,
                        kuralOperatoru: 1,
                        kuralDegeri: code,
                        gerekliMiktar: miktar
                    }
                ]
            });
        });

        setFormData(prev => ({
            ...prev,
            kampanyalar: newKampanyalar
        }));

        toast.success(t(`${importedRows.length} adet kampanya kuralı Excel'den başarıyla aktarıldı.`));
        handleCloseExcelImport();
    };

    useEffect(() => {
        if (id) {
            if (!location.state?.formData) {
                loadData(Number(id));
            }
        } else {
            if (!location.state?.formData) {
                loadDefaultDates();
                if (productService.getBelgeAyarlari) {
                    productService.getBelgeAyarlari('KampanyaBelgesi').then(ayar => {
                        setBelgeAyar(ayar);
                        if (ayar && ayar.otomatikNumaraVerilsinMi) {
                            setFormData(prev => ({ ...prev, belgeNo: prev.belgeNo || '[OTOMATIK]' }));
                        } else {
                            setFormData(prev => ({ ...prev, belgeNo: prev.belgeNo === '[OTOMATIK]' ? '' : prev.belgeNo }));
                        }
                    }).catch(err => console.error("Belge ayarları alınamadı", err));
                }
            }
        }
    }, [id]);

const normalizeKampanyaAiData = (aiData: any) => {
    if (!aiData) return null;

    const parseAiDate = (raw?: any): string => {
        if (!raw) return '';
        const clean = String(raw).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(clean)) return clean.substring(0, 10);
        const parts = clean.split('.');
        if (parts.length === 3) {
            const [d, m, y] = parts;
            return `${y.substring(0, 4)}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        const slashParts = clean.split('/');
        if (slashParts.length === 3) {
            const [d, m, y] = slashParts;
            return `${y.substring(0, 4)}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        return clean.substring(0, 10);
    };

    // 1. Raw list of campaigns from all possible AI formats
    const rawList: any[] = 
        (Array.isArray(aiData.documentContent?.campaigns) && aiData.documentContent.campaigns) ||
        (Array.isArray(aiData.documentContent?.details) && aiData.documentContent.details) ||
        (Array.isArray(aiData.content?.campaigns) && aiData.content.campaigns) ||
        (Array.isArray(aiData.content?.details) && aiData.content.details) ||
        (Array.isArray(aiData.campaigns) && aiData.campaigns) ||
        (Array.isArray(aiData.sections) && aiData.sections) ||
        (Array.isArray(aiData.campaignDetails) && aiData.campaignDetails) ||
        (Array.isArray(aiData.kampanyalar) && aiData.kampanyalar) ||
        (Array.isArray(aiData.details) && aiData.details) ||
        (Array.isArray(aiData.items) && aiData.items) ||
        [];

    // 2. Title
    const finalAdi = 
        (typeof aiData.documentSummary === 'string' ? aiData.documentSummary : '') ||
        (typeof aiData.documentName === 'string' ? aiData.documentName : '') ||
        (typeof aiData.adi === 'string' ? aiData.adi : '') ||
        (typeof aiData.header?.adi === 'string' ? aiData.header.adi : '') ||
        (typeof aiData.header?.aciklama === 'string' ? aiData.header.aciklama : '') ||
        (typeof aiData.title === 'string' ? aiData.title : '') ||
        (typeof aiData.baslik === 'string' ? aiData.baslik : '') ||
        (typeof aiData.documentTitle === 'string' ? aiData.documentTitle : '') ||
        (rawList.length > 0 && typeof rawList[0]?.name === 'string' ? rawList[0].name : '') ||
        (rawList.length > 0 && typeof rawList[0]?.kampanyaAdi === 'string' ? rawList[0].kampanyaAdi : '') ||
        t('Yeni Kampanya Belgesi');

    // 3. Dates
    let baslangic = parseAiDate(aiData.baslangicTarihi || aiData.startDate || aiData.gecerlilikBaslangic || aiData.campaignPeriod?.startDate);
    let bitis = parseAiDate(aiData.bitisTarihi || aiData.endDate || aiData.gecerlilikBitis || aiData.campaignPeriod?.endDate);
    let hakedis = parseAiDate(aiData.hakedisSonTarihi || aiData.hakEdisSonTarih || aiData.settlementDate || aiData.settlementDeadline || aiData.claimDeadline);

    if (rawList.length > 0) {
        for (const item of rawList) {
            const itemStart = item.startDate || item.baslangicTarihi || item.gecerlilikBaslangic;
            const itemEnd = item.endDate || item.bitisTarihi || item.gecerlilikBitis;
            const itemRange = item.tarih || item.date || item.dateRange || item.campaignValidity || item.validity;
            const itemHak = item.hakEdisSonTarih || item.hakedisSonTarihi || item.settlementDate || item.settlementDeadline || item.claimDeadline;

            if (!baslangic && itemStart) baslangic = parseAiDate(itemStart);
            if (!bitis && itemEnd) bitis = parseAiDate(itemEnd);
            if (!hakedis && itemHak) hakedis = parseAiDate(itemHak);

            if ((!baslangic || !bitis) && typeof itemRange === 'string') {
                const parts = itemRange.includes('–') ? itemRange.split('–') : itemRange.split('-');
                if (parts.length === 2) {
                    if (!baslangic) baslangic = parseAiDate(parts[0]);
                    if (!bitis) bitis = parseAiDate(parts[1]);
                }
            }
        }
    }

    // Helper: Extract models from an item
    const extractModels = (item: any): string[] => {
        const models: string[] = [];
        const addModel = (val: any) => {
            if (!val) return;
            if (typeof val === 'string') {
                const trimmed = val.trim();
                if (trimmed && !models.includes(trimmed)) models.push(trimmed);
            } else if (typeof val === 'object') {
                const code = val.kod || val.code || val.stokKodu || val.model || val.name || val.adi;
                if (typeof code === 'string' && code.trim() && !models.includes(code.trim())) {
                    models.push(code.trim());
                }
                if (Array.isArray(val.kodlar)) {
                    val.kodlar.forEach((k: any) => addModel(k));
                }
                if (Array.isArray(val.models)) {
                    val.models.forEach((m: any) => addModel(m));
                }
            }
        };

        if (Array.isArray(item.modeller)) item.modeller.forEach(addModel);
        if (Array.isArray(item.models)) item.models.forEach(addModel);
        if (Array.isArray(item.kodlar)) item.kodlar.forEach(addModel);
        if (Array.isArray(item.codes)) item.codes.forEach(addModel);
        if (Array.isArray(item.items)) item.items.forEach(addModel);
        if (Array.isArray(item.products)) item.products.forEach(addModel);
        if (Array.isArray(item.productGroups)) item.productGroups.forEach(addModel);
        if (Array.isArray(item.groups)) item.groups.forEach(addModel);

        return models;
    };

    // 4. Map campaigns to DTO
    const mappedKampanyalar = rawList.map((item: any, index: number) => {
        const name = item.name || item.kampanyaAdi || item.adi || item.title || item.campaignName || `${t('Kampanya')} ${index + 1}`;
        const quotaVal = item.limitedQuantity ?? item.toplamAdetSiniri ?? item.limit ?? item.quota ?? item.quantity ?? item.adetSiniri;
        let quotaNumber: number | undefined = undefined;
        if (typeof quotaVal === 'number') {
            quotaNumber = quotaVal;
        } else if (typeof quotaVal === 'string') {
            const match = quotaVal.match(/\d+/);
            if (match) quotaNumber = parseInt(match[0], 10);
        } else {
            const quotaText = item.kampanyaSınırları || item.kampanyaSinirlari || item.sinir || '';
            const match = String(quotaText).match(/\d+/);
            if (match) quotaNumber = parseInt(match[0], 10);
        }

        const itemHakDate = item.hakEdisSonTarih || item.hakedisSonTarihi || item.settlementDate || item.settlementDeadline || item.claimDeadline;
        const parsedHakDate = itemHakDate ? parseAiDate(itemHakDate) : undefined;

        // Determine action type
        let aksiyonTipi = item.aksiyonTipi || 4; // Default: Hakediş / Fiyat Farkı
        const typeStr = String(item.type || item.actionType || '').toLowerCase();
        const hasGift = item.gift || item.hediye || (Array.isArray(item.hediyeler) && item.hediyeler.length > 0);
        if (typeStr.includes('hediye') || hasGift) {
            aksiyonTipi = 3; // Hediye Ürün
        } else if (aksiyonTipi === 1 || aksiyonTipi === 2) {
            aksiyonTipi = item.aksiyonTipi;
        }

        // Build rules
        let kurallar: any[] = [];
        if (Array.isArray(item.kurallar) && item.kurallar.length > 0) {
            kurallar = item.kurallar.map((r: any) => {
                const ids = (r.kuralDegeri || '').split(',').map((id: string) => id.trim()).filter((id: string) => id);
                return {
                    ...r,
                    _uid: r._uid || Math.random().toString(36).substring(7),
                    _selectedItems: r._selectedItems || ids.map((id: string) => ({ id, name: id }))
                };
            });
        } else {
            // Extract from models
            const extractedModels = extractModels(item);
            if (extractedModels.length > 0) {
                kurallar = extractedModels.map(modelCode => ({
                    _uid: Math.random().toString(36).substring(7),
                    kuralAlani: 1, // Ürün Kodu / Açıklama
                    kuralOperatoru: 1, // Eşittir
                    kuralDegeri: modelCode,
                    gerekliMiktar: 1,
                    _selectedItems: [{ id: modelCode, name: modelCode }]
                }));
            }
        }

        const hasOran = typeof item.firmaHakEdisOrani === 'number' && item.firmaHakEdisOrani > 0;
        const hasTutar = typeof item.firmaHakEdisTutari === 'number' && item.firmaHakEdisTutari > 0;

        return {
            kodu: item.kodu || item.code || item.campaignId || item.kampanyaKodu || `KMP-${String(index + 1).padStart(2, '0')}`,
            adi: name,
            toplamAdetSiniri: quotaNumber,
            hakedisSonTarihi: parsedHakDate,
            birlesmeKurali: typeof item.birlesmeKurali === 'number' ? item.birlesmeKurali : 1,
            oncelik: typeof item.oncelik === 'number' ? item.oncelik : 10,
            cakismaStratejisi: typeof item.cakismaStratejisi === 'number' ? item.cakismaStratejisi : 1,
            matrahTuru: typeof item.matrahTuru === 'number' ? item.matrahTuru : 1,
            maksimumToplamIskontoOrani: typeof item.maksimumToplamIskontoOrani === 'number' ? item.maksimumToplamIskontoOrani : undefined,
            kampanyaGrupId: typeof item.kampanyaGrupId === 'number' ? item.kampanyaGrupId : undefined,
            birlestirilebilirKampanyaIdleri: item.birlestirilebilirKampanyaIdleri || undefined,
            birlestirilemezKampanyaIdleri: item.birlestirilemezKampanyaIdleri || undefined,
            aksiyonTipi: aksiyonTipi,
            aksiyonDegeri: typeof item.aksiyonDegeri === 'number' ? item.aksiyonDegeri : 0,
            kdvDahilMi: item.kdvDahilMi !== false,
            firmaHakEdisOrani: hasOran ? item.firmaHakEdisOrani : 0,
            firmaHakEdisTutari: hasTutar ? item.firmaHakEdisTutari : 0,
            firmaHakEdisKdvDahilMi: item.firmaHakEdisKdvDahilMi !== false,
            indirimTuru: (aksiyonTipi === 1 || aksiyonTipi === 2) ? aksiyonTipi : undefined,
            hakedisTuru: item.hakedisTuru || (hasOran ? 1 : (hasTutar ? 2 : (aksiyonTipi === 4 ? 3 : undefined))),
            cariKatilimSiniriTuru: item.cariKatilimSiniriTuru || 3, // Sınırsız
            kurallar: kurallar
        };
    });

    return {
        adi: finalAdi,
        baslangicTarihi: baslangic,
        bitisTarihi: bitis,
        hakedisSonTarihi: hakedis,
        kampanyalar: mappedKampanyalar
    };
};

    // Yapay Zeka Eylem Kartından gelen kampanya taslağını forma yükle
    useEffect(() => {
        if (!id && location?.state?.initialAiData) {
            const normalized = normalizeKampanyaAiData(location.state.initialAiData);
            if (normalized) {
                setFormData(prev => ({
                    ...prev,
                    adi: normalized.adi || prev.adi,
                    baslangicTarihi: normalized.baslangicTarihi || prev.baslangicTarihi,
                    bitisTarihi: normalized.bitisTarihi || prev.bitisTarihi,
                    hakedisSonTarihi: normalized.hakedisSonTarihi || prev.hakedisSonTarihi,
                    kampanyalar: normalized.kampanyalar.length > 0 ? normalized.kampanyalar : prev.kampanyalar
                }));

                if (location.state.bulutDosyaId || location.state.initialAiData.bulutDosyaId) {
                    setSelectedBulutDosyaId(location.state.bulutDosyaId || location.state.initialAiData.bulutDosyaId);
                }

                toast.success(t('Yapay zeka kampanya taslağı forma aktarıldı.'));
            }
        }
    }, [id, location?.state]);

    const loadDefaultDates = async () => {
        try {
            setIsLoading(true);
            const defaultDates = await getKampanyaDefaultDates();
            setFormData(prev => {
                // Eğer yapay zeka tarafından veriler yüklendiyse varsayılan tarihlerin üzerine yazmayalım
                if (location?.state?.initialAiData) {
                    return prev;
                }
                return {
                    ...prev,
                    baslangicTarihi: defaultDates.baslangicTarihi,
                    bitisTarihi: defaultDates.bitisTarihi
                };
            });
        } finally {
            setIsLoading(false);
        }
    };

    const loadData = async (belgeId: number) => {
        try {
            setIsLoading(true);
            const data = await kampanyalarService.getById(belgeId);
            if (data) {
                const mappedKampanyalar = (data.kampanyalar || []).map((k: any) => ({
                    ...k,
                    indirimTuru: (k.aksiyonTipi === 1 || k.aksiyonTipi === 2) ? k.aksiyonTipi : undefined,
                    hakedisTuru: k.firmaHakEdisOrani ? 1 : (k.firmaHakEdisTutari ? 2 : (k.aksiyonTipi === 4 ? 3 : undefined))
                }));
                
                setFormData({
                    ...(data.id ? { id: data.id } : {}),
                    belgeNo: data.belgeNo,
                    adi: data.adi,
                    baslangicTarihi: data.baslangicTarihi ? data.baslangicTarihi.substring(0, 10) : '',
                    bitisTarihi: data.bitisTarihi ? data.bitisTarihi.substring(0, 10) : '',
                    hakedisSonTarihi: data.hakedisSonTarihi,
                    aktifMi: data.aktifMi,
                    kampanyalar: mappedKampanyalar
                } as any);
            }
        } catch (error: any) {
            toast.error(error.message || t('Kayıt yüklenirken hata oluştu.'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: keyof KampanyaBelgesiCreateDto, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleDateRangeChange = (startDate: string, endDate: string) => {
        setFormData(prev => ({ ...prev, baslangicTarihi: startDate, bitisTarihi: endDate }));
        if (errors.baslangicTarihi || errors.bitisTarihi || errors.tarihAraligi) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.baslangicTarihi;
                delete newErrors.bitisTarihi;
                delete newErrors.tarihAraligi;
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors = validateKampanyaBelgesiForm(formData, t);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error(t('Lütfen zorunlu alanları doldurunuz.'));
            return;
        }

        try {
            setIsLoading(true);
            let savedBelge: any = null;
            if (id) {
                savedBelge = await kampanyalarService.update(Number(id), formData as any);
            } else {
                savedBelge = await kampanyalarService.create(formData);
            }

            const savedId = savedBelge?.id || id;
            const savedBelgeNo = savedBelge?.belgeNo || formData.belgeNo;

            if (selectedBulutDosyaId && savedId) {
                try {
                    await kampanyalarService.bulutDosyaIliskilendir(selectedBulutDosyaId, Number(savedId), savedBelgeNo);
                } catch (linkError) {
                    console.error('Bulut dosyası ilişkilendirilemedi', linkError);
                }
            }

            toast.success(t('İşlem başarılı.'));
            try {
                sessionStorage.removeItem(draftKey);
            } catch (e) {}
            navigate('/kampanyalar');
        } catch (error: any) {
            toast.error(error.message || t('Bir hata oluştu.'));
        } finally {
            setIsLoading(false);
        }
    };

    const openKampanyaModal = (kampanya: any, index: number) => {
        setSelectedKampanya(kampanya);
        setSelectedRowIndex(index);
        setIsModalOpen(true);

        try {
            sessionStorage.setItem(draftKey, JSON.stringify(formData));
        } catch (e) {}

        const targetUrl = index >= 0 
            ? `${basePath}/kural/${index}` 
            : `${basePath}/kural/yeni`;

        navigate(targetUrl, {
            state: {
                formData,
                selectedKampanya: kampanya,
                selectedRowIndex: index
            }
        });
    };

    const closeKampanyaModal = () => {
        setIsModalOpen(false);
        setSelectedKampanya(null);
        setSelectedRowIndex(null);
        navigate(basePath, {
            state: { formData }
        });
    };

    const handleSaveKampanyaDetay = (updatedKampanya: Partial<KampanyaDto>) => {
        const activeIndex = selectedRowIndex !== null ? selectedRowIndex : (routeKuralIndex ?? -1);
        const newKampanyalar = [...(formData.kampanyalar || [])];
        if (activeIndex !== null && activeIndex >= 0 && activeIndex < newKampanyalar.length) {
            newKampanyalar[activeIndex] = updatedKampanya as any;
        } else {
            newKampanyalar.push(updatedKampanya as any);
        }
        const updatedFormData = { ...formData, kampanyalar: newKampanyalar };
        setFormData(updatedFormData);
        try {
            sessionStorage.setItem(draftKey, JSON.stringify(updatedFormData));
        } catch (e) {}

        setIsModalOpen(false);
        setSelectedKampanya(null);
        setSelectedRowIndex(null);
        navigate(basePath, {
            state: { formData: updatedFormData }
        });
    };

    const headerContent = (
        <div className="form-grid">
            <DocumentHeaderField name="belgeNo" label={t('Belge No')} required>
                <BaseInput
                    value={formData.belgeNo || ''}
                    onChange={(e) => handleInputChange('belgeNo', e.target.value)}
                    placeholder={t('Belge No')}
                    disabled={!!id || (belgeAyar && belgeAyar.otomatikNumaraVerilsinMi !== false)}
                />
            </DocumentHeaderField>

            <DocumentHeaderField name="adi" label={t('Kampanya Genel İsmi')} required>
                <BaseInput
                    value={formData.adi || ''}
                    onChange={(e) => handleInputChange('adi', e.target.value)}
                    placeholder={t('Örn: Yılbaşı Kampanyaları')}
                    autoFocus
                />
            </DocumentHeaderField>

            <DocumentHeaderField name="baslangicTarihi" label={t('Geçerlilik Tarihi')} required>
                <DateRangeInput 
                    baslangicTarihi={formData.baslangicTarihi || ''}
                    bitisTarihi={formData.bitisTarihi || ''}
                    onChange={handleDateRangeChange}
                />
            </DocumentHeaderField>

            <DocumentHeaderField name="hakedisSonTarihi" label={t('Son Hakediş Tarihi')}>
                <BaseInput
                    type="date"
                    value={formData.hakedisSonTarihi ? formData.hakedisSonTarihi.substring(0, 10) : ''}
                    onChange={(e) => handleInputChange('hakedisSonTarihi', e.target.value || undefined)}
                />
            </DocumentHeaderField>
        </div>
    );

    const gridProps = {
        columns: [
            { 
                id: 'kodu', 
                header: t('Kampanya Kodu'), 
                width: 155,
                render: (row: any) => (
                    <div className="kampanya-grid-cell">
                        {row?.kodu ? (
                            <span className="kampanya-code-badge">{row.kodu}</span>
                        ) : (
                            <span className="kampanya-empty-dash">—</span>
                        )}
                    </div>
                )
            },
            { 
                id: 'adi', 
                header: t('Kampanya İsmi'), 
                width: 360,
                render: (row: any) => (
                    <div className="kampanya-grid-cell" title={row?.adi || ''}>
                        {row?.adi ? (
                            <span className="kampanya-name-text">{row.adi}</span>
                        ) : (
                            <span className="kampanya-name-empty">{t('İsimsiz Kampanya')}</span>
                        )}
                    </div>
                )
            },
            {
                id: 'kurallar',
                header: t('Koşul / Kurallar'),
                width: 165,
                render: (row: any) => {
                    const count = (row?.kurallar || []).length;
                    if (count === 0) {
                        return (
                            <div className="kampanya-grid-cell">
                                <span className="kampanya-rule-empty">{t('auto_kosulsuz', 'Tüm Sepet / Koşulsuz')}</span>
                            </div>
                        );
                    }
                    return (
                        <div className="kampanya-grid-cell">
                            <span className="kampanya-rule-badge">
                                {count} {t('Kural')}
                            </span>
                        </div>
                    );
                }
            },
            { 
                id: 'indirim', 
                header: t('Müşteri İndirimi'), 
                width: 190, 
                render: (row: any) => {
                    if (!row || !row.aksiyonDegeri) {
                        return (
                            <div className="kampanya-grid-cell">
                                <span className="kampanya-empty-dash">—</span>
                            </div>
                        );
                    }
                    if (row.indirimTuru === 1) {
                        return (
                            <div className="kampanya-grid-cell">
                                <span className="kampanya-amount-value is-discount">%{row.aksiyonDegeri ?? 0}</span>
                            </div>
                        );
                    }
                    if (row.indirimTuru === 2) {
                        const kdvLabel = row.kdvDahilMi ? t('KDV Dahil') : t('KDV Hariç');
                        const val = Number(row.aksiyonDegeri ?? 0);
                        const formatted = `${isNaN(val) ? '0,00' : val.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
                        return (
                            <div className="kampanya-grid-cell">
                                <div className="kampanya-amount-group">
                                    <span className="kampanya-amount-value is-discount">{formatted}</span>
                                    <span className="kampanya-kdv-tag is-discount">{kdvLabel}</span>
                                </div>
                            </div>
                        );
                    }
                    return (
                        <div className="kampanya-grid-cell">
                            <span className="kampanya-empty-dash">—</span>
                        </div>
                    );
                }
            },
            { 
                id: 'hakedis', 
                header: t('Bayi Hakedişi'), 
                width: 190, 
                render: (row: any) => {
                    if (!row || (!row.firmaHakEdisOrani && !row.firmaHakEdisTutari && row.hakedisTuru !== 3)) {
                        return (
                            <div className="kampanya-grid-cell">
                                <span className="kampanya-empty-dash">—</span>
                            </div>
                        );
                    }
                    if (row.hakedisTuru === 1) {
                        return (
                            <div className="kampanya-grid-cell">
                                <span className="kampanya-amount-value is-hakedis">%{row.firmaHakEdisOrani ?? row.firmaHakEdisTutari ?? 0}</span>
                            </div>
                        );
                    }
                    if (row.hakedisTuru === 2) {
                        const kdvLabel = row.firmaHakEdisKdvDahilMi ? t('KDV Dahil') : t('KDV Hariç');
                        const val = Number(row.firmaHakEdisTutari ?? 0);
                        const formatted = `${isNaN(val) ? '0,00' : val.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
                        return (
                            <div className="kampanya-grid-cell">
                                <div className="kampanya-amount-group">
                                    <span className="kampanya-amount-value is-hakedis">{formatted}</span>
                                    <span className="kampanya-kdv-tag is-hakedis">{kdvLabel}</span>
                                </div>
                            </div>
                        );
                    }
                    if (row.hakedisTuru === 3) {
                        return (
                            <div className="kampanya-grid-cell">
                                <span className="kampanya-doc-type-badge">{t('Fiyat Farkı Belgesi')}</span>
                            </div>
                        );
                    }
                    return (
                        <div className="kampanya-grid-cell">
                            <span className="kampanya-empty-dash">—</span>
                        </div>
                    );
                }
            },
            {
                id: 'katilim',
                header: t('Katılım Sınırı'),
                width: 155,
                render: (row: any) => {
                    const sinir = row?.cariKatilimSiniriTuru;
                    const isLimited = sinir === 1 || sinir === 2;
                    const label = sinir === 1 ? t('Tek Sefer') : (sinir === 2 ? `${row?.cariKatilimSayisi || 1} ${t('Kez')}` : t('Sınırsız'));
                    return (
                        <div className="kampanya-grid-cell">
                            <span className={`kampanya-limit-badge ${isLimited ? 'is-limited' : ''}`}>
                                {label}
                            </span>
                        </div>
                    );
                }
            }
        ],
        data: formData.kampanyalar || [],
        onDataChange: (newData: any) => handleInputChange('kampanyalar', newData),
        autoAddRow: false,
        autoAddRowWhenEmpty: false,
        onRemoveRow: (index: number) => {
            const newKampanyalar = [...(formData.kampanyalar || [])];
            newKampanyalar.splice(index, 1);
            handleInputChange('kampanyalar', newKampanyalar);
        },
        onRowDoubleClick: (row: any, index: number) => openKampanyaModal(row, index),
        rowActions: [
            {
                label: t('Düzenle'),
                icon: <Edit2 size={16} />,
                onClick: (row: any, index: number) => openKampanyaModal(row, index)
            },
            {
                label: t('Sil'),
                icon: <Trash2 size={16} />,
                danger: true,
                onClick: (_row: any, index: number) => {
                    const newKampanyalar = [...(formData.kampanyalar || [])];
                    newKampanyalar.splice(index, 1);
                    handleInputChange('kampanyalar', newKampanyalar);
                }
            }
        ],
        showActionMenu: true,
        onAddRow: () => {
            const yeniKampanya = { kodu: '', adi: '', birlesmeKurali: 1, hakedisSonTarihi: null, firmaHakEdisTutari: 0, cariKatilimSiniriTuru: 3, kurallar: [], indirimTuru: 2, kdvDahilMi: false, firmaHakEdisKdvDahilMi: false };
            openKampanyaModal(yeniKampanya, -1);
        },
        useFloatAddButton: true
    };

    const footerContent = (
        <div className="flex w-full justify-end">
            <DocumentResultPanel 
                title={t('Kampanya Özeti')}
                readOnly={true}
                items={[
                    { id: 'toplam', label: t('Toplam Kampanya Sayısı'), value: (formData.kampanyalar || []).length, visibilityRule: 'p4' }
                ]}
                onSave={() => {}}
            />
        </div>
    );

    const handleApplyAiData = useCallback((aiData: any, bulutDosyaId?: number | null) => {
        if (!aiData) return;
        if (bulutDosyaId) {
            setSelectedBulutDosyaId(bulutDosyaId);
        }

        try {
            const normalized = normalizeKampanyaAiData(aiData);
            if (normalized) {
                setFormData(prev => ({
                    ...prev,
                    adi: normalized.adi || prev.adi,
                    baslangicTarihi: normalized.baslangicTarihi || prev.baslangicTarihi,
                    bitisTarihi: normalized.bitisTarihi || prev.bitisTarihi,
                    hakedisSonTarihi: normalized.hakedisSonTarihi || prev.hakedisSonTarihi,
                    kampanyalar: normalized.kampanyalar.length > 0 ? normalized.kampanyalar : (prev.kampanyalar || [])
                }));

                toast.success(t('Kampanya belgesi ve kuralları yapay zeka tarafından başarıyla aktarıldı.'));
            }
        } catch (aiErr) {
            console.error('Yapay zeka taslak verisi yüklenirken hata:', aiErr);
        }
    }, [t]);

    const isShowingKuralWizard = isModalOpen || isKuralRoute;

    if (isShowingKuralWizard) {
        const activeIndex = selectedRowIndex !== null ? selectedRowIndex : (routeKuralIndex ?? -1);
        const activeKampanya = selectedKampanya || location.state?.selectedKampanya || (activeIndex >= 0 && formData.kampanyalar?.[activeIndex]) || {
            kodu: '',
            adi: '',
            birlesmeKurali: 1,
            oncelik: 50,
            cakismaStratejisi: 1,
            matrahTuru: 1,
            kurallar: [],
            indirimTuru: 2,
            kdvDahilMi: false,
            firmaHakEdisKdvDahilMi: false
        };

        const isEdit = activeIndex !== null && activeIndex >= 0;

        return (
            <KampanyaKuralWizard 
                onClose={closeKampanyaModal}
                kampanya={activeKampanya}
                onSave={handleSaveKampanyaDetay}
                isEditMode={isEdit}
            />
        );
    }

    return (
        <>
            <BaseDocumentPage
                formId="kampanyaBelgesiForm"
                pageTitle={id ? t('Kampanya Belgesi Düzenle') : t('Yeni Kampanya Belgesi')}
                onSubmit={handleSubmit}
                onBack={() => {
                    try {
                        sessionStorage.removeItem(draftKey);
                    } catch (e) {}
                    navigate('/kampanyalar');
                }}
                documentId={id ? parseInt(id) : undefined}
                documentType="KampanyaBelgesi"
                documentNo={formData.belgeNo}
                formData={formData}
                isSaving={isLoading}
                enableAiAssistant={false}
                extraDropdownActions={[
                    {
                        label: t("auto_excel_den_veri_al", "Excel'den Veri Al"),
                        icon: <FileSpreadsheet size={16} />,
                        onClick: handleOpenExcelImport
                    },
                    {
                        label: t('auto_yeni_kampanya_tanimla', 'Yeni Kampanya Tanımla'),
                        icon: <Plus size={16} />,
                        onClick: () => {
                            const yeniKampanya = { 
                                kodu: '', 
                                adi: '', 
                                birlesmeKurali: 1, 
                                oncelik: 50, 
                                cakismaStratejisi: 1, 
                                matrahTuru: 1, 
                                kurallar: [], 
                                indirimTuru: 2, 
                                kdvDahilMi: false, 
                                firmaHakEdisKdvDahilMi: false 
                            };
                            openKampanyaModal(yeniKampanya, -1);
                        }
                    }
                ]}
                errors={errors}
                headerContent={headerContent}
                gridProps={gridProps}
                footerContent={footerContent}
            />

            <ExcelImportPage
                isOpen={showExcelImport}
                onClose={handleCloseExcelImport}
                onImport={handleExcelImport}
                documentId={id ? parseInt(id) : undefined}
                documentType="KampanyaBelgesi"
                columns={excelColumns}
            />
        </>
    );
};

export default KampanyaForm;
