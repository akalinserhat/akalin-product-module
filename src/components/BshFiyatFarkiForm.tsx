/**
 * Webakus ERP - BSH Fiyat Farkı Belgesi Formu (BshFiyatFarkiForm)
 * BSH fiyat farkı listelerinin oluşturulması, düzenlenmesi, KDV dahil/hariç fiyat hesaplamaları ve Excel'den aktarım işlemlerini yönetir.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

import {
        BaseDocumentPage,
        DocumentHeaderPanel,
        DocumentHeaderField,
        DocumentResultPanel,
        DocumentResultPanelsGroup,
        CurrencyInput,
        KdvSecici,
        UrunSeciciModal,
        NotInput,
        BasitInput,
        DateRangeInput,
        UrunSeciciInput
    } from '@akalin/ui';
import ExcelImportPage, { type ExcelColumnDef } from './ExcelImportPage';
import { FileText, AlignLeft, Percent } from 'lucide-react';
import { useExcelProductImport } from '../hooks/useExcelProductImport';
import { useBshFiyatFarkiActionMenu } from '../hooks/useBshFiyatFarkiActionMenu';
import { validateBshFiyatFarkiForm, validateBshFiyatFarkiField } from '../validators/bshFiyatFarkiValidation';
import {
    getKdvOran,
    getMaxKdvGrubu,
    resolveKdvGrubuId,
    calculateBshKalemPrices,
    createEmptyBshFiyatFarkiKalem,
    getBshFiyatFarkiDefaultValues
} from '../defaults/bshFiyatFarkiDefaultValue';

const BshFiyatFarkiForm: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);

    const [urunModalOpen, setUrunModalOpen] = useState(false);
    const [urunAramaMetni, setUrunAramaMetni] = useState('');
    const [activeRowId, setActiveRowId] = useState<any>(null);

    const [kdvGruplari, setKdvGruplari] = useState<any[]>([]);

    const [formData, setFormData] = useState<any>(() => {
        if (location.state?.currentFormData) {
            return location.state.currentFormData;
        }
        return getBshFiyatFarkiDefaultValues({ isEditMode });
    });

    const formDataRef = React.useRef(formData);
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    const kdvGruplariRef = React.useRef<any[]>(kdvGruplari);
    useEffect(() => {
        kdvGruplariRef.current = kdvGruplari;
    }, [kdvGruplari]);

    useEffect(() => {
        let isMounted = true;
        axios
            .get('/api/KdvGruplari/aktif-oranlar')
            .catch(() => axios.get('/api/KdvGruplari'))
            .then((res) => {
                if (!isMounted) return;
                const list = Array.isArray(res.data) ? res.data : [];
                setKdvGruplari(list);
                kdvGruplariRef.current = list;

                const maxKdv = getMaxKdvGrubu(list);
                if (!maxKdv) return;

                setFormData((prev: any) => {
                    const hasExplicitHeaderOran =
                        prev.kdvOrani !== undefined && prev.kdvOrani !== null && Number(prev.kdvOrani) > 0;
                    const headerOran = hasExplicitHeaderOran ? Number(prev.kdvOrani) : maxKdv.oran;
                    const headerGrubuId =
                        resolveKdvGrubuId(list, prev.kdvGrubuId, headerOran) || maxKdv.id;

                    const updatedKalemler = (prev.kalemler || []).map((k: any) => {
                        if (k.urunVeHizmetKartiId) {
                            const rowGrubuId = resolveKdvGrubuId(list, k.kdvGrubuId, k.kdvOrani);
                            const prices = calculateBshKalemPrices({
                                fiyatGirisYonu: k.fiyatGirisYonu || 'dahil',
                                kdvHaricFiyat: k.kdvHaricFiyat,
                                fiyat: k.fiyat,
                                kdvOrani: k.kdvOrani
                            });
                            return {
                                ...k,
                                kdvGrubuId: rowGrubuId || k.kdvGrubuId,
                                ...prices
                            };
                        }

                        const isUnsetOrDefault =
                            k.kdvOrani === undefined ||
                            k.kdvOrani === null ||
                            (Number(k.kdvOrani) === 0 && !k.kdvGrubuId);
                        const nextRowOran = isUnsetOrDefault ? headerOran : Number(k.kdvOrani);
                        const nextRowGrubuId = isUnsetOrDefault
                            ? headerGrubuId
                            : resolveKdvGrubuId(list, k.kdvGrubuId, nextRowOran) || headerGrubuId;

                        const prices = calculateBshKalemPrices({
                            fiyatGirisYonu: k.fiyatGirisYonu || 'dahil',
                            kdvHaricFiyat: k.kdvHaricFiyat,
                            fiyat: k.fiyat,
                            kdvOrani: nextRowOran
                        });

                        return {
                            ...k,
                            kdvOrani: nextRowOran,
                            kdvGrubuId: nextRowGrubuId,
                            ...prices
                        };
                    });

                    const next = {
                        ...prev,
                        kdvOrani: headerOran,
                        kdvGrubuId: headerGrubuId,
                        kalemler: updatedKalemler
                    };
                    formDataRef.current = next;
                    return next;
                });
            })
            .catch((err) => console.error('KDV grupları yüklenirken hata oluştu:', err));

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (location.state?.currentFormData) {
            setFormData(location.state.currentFormData);
            formDataRef.current = location.state.currentFormData;
        }
    }, [location.state?.currentFormData]);

    useEffect(() => {
        if (isEditMode || !location.state?.initialAiData) return;

        const aiData = location.state.initialAiData;
        const parseAiDate = (raw?: any): string => {
            if (!raw) return '';
            const clean = String(raw).trim();
            if (/^\d{4}-\d{2}-\d{2}/.test(clean)) return clean.substring(0, 10);
            const parts = clean.split(/[./]/);
            if (parts.length === 3) {
                const [d, m, y] = parts;
                return `${y.substring(0, 4)}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
            return clean.substring(0, 10);
        };

        const rawItems: any[] =
            (Array.isArray(aiData.kalemler) && aiData.kalemler) ||
            (Array.isArray(aiData.items) && aiData.items) ||
            (Array.isArray(aiData.urunler) && aiData.urunler) ||
            (Array.isArray(aiData.fiyatFarklari) && aiData.fiyatFarklari) ||
            (Array.isArray(aiData.documentContent?.kalemler) && aiData.documentContent.kalemler) ||
            [];

        const aiHeaderKdv = aiData.kdvOrani ?? aiData.header?.kdvOrani;
        const currentHeaderOran =
            aiHeaderKdv !== undefined && aiHeaderKdv !== null
                ? Number(aiHeaderKdv)
                : Number(formDataRef.current?.kdvOrani) > 0
                    ? Number(formDataRef.current.kdvOrani)
                    : getMaxKdvGrubu(kdvGruplariRef.current)?.oran ?? 20;
        const currentHeaderGrubuId =
            resolveKdvGrubuId(kdvGruplariRef.current, null, currentHeaderOran) ||
            formDataRef.current?.kdvGrubuId;

        const parseAiKdvDahil = (val: any, fallback: boolean): boolean => {
            if (val === undefined || val === null) return fallback;
            if (typeof val === 'boolean') return val;
            const s = String(val).trim().toLowerCase();
            if (s === 'false' || s === '0' || s === 'hayir' || s === 'hayır' || s.includes('haric') || s.includes('hariç')) {
                return false;
            }
            if (s === 'true' || s === '1' || s === 'evet' || s.includes('dahil')) {
                return true;
            }
            return Boolean(val);
        };

        const defaultKdvDahil = parseAiKdvDahil(
            aiData.kdvDahilMi ?? aiData.header?.kdvDahilMi ?? aiData.kdvDurumu ?? aiData.header?.kdvDurumu,
            true
        );

        const mappedKalemler = rawItems
            .map((item: any, index: number) => {
                const code = String(
                    item.tedarikciUrunKodu ||
                    item.urunKodu ||
                    item.kod ||
                    item.kodu ||
                    item.modelKodu ||
                    item.code ||
                    ''
                ).trim();
                if (!code) return null;
                const rawFiyat = Number(item.fiyat ?? item.fiyatFarki ?? item.tutar ?? item.price ?? 0) || 0;
                const urunId = item.urunVeHizmetKartiId || item.urunVeHizmetId || null;
                const urunAdi = item.urunVeHizmetAdi || '';
                const kdvDahilMi = parseAiKdvDahil(item.kdvDahilMi ?? item.kdvDurumu, defaultKdvDahil);
                const itemKdvOrani =
                    item.kdvOrani !== undefined && item.kdvOrani !== null
                        ? Number(item.kdvOrani)
                        : currentHeaderOran;
                const itemKdvGrubuId = resolveKdvGrubuId(
                    kdvGruplariRef.current,
                    item.kdvGrubuId,
                    itemKdvOrani
                );

                const prices = calculateBshKalemPrices({
                    fiyatGirisYonu: kdvDahilMi ? 'dahil' : 'haric',
                    kdvHaricFiyat: kdvDahilMi ? undefined : rawFiyat,
                    fiyat: kdvDahilMi ? rawFiyat : undefined,
                    kdvOrani: itemKdvOrani
                });

                return {
                    id: Date.now() + index + Math.random(),
                    tedarikciUrunKodu: code,
                    kdvOrani: itemKdvOrani,
                    kdvGrubuId: itemKdvGrubuId || currentHeaderGrubuId,
                    kdvHaricFiyat: prices.kdvHaricFiyat,
                    fiyat: prices.fiyat,
                    fiyatGirisYonu: (kdvDahilMi ? 'dahil' : 'haric') as 'haric' | 'dahil',
                    kdvDahilMi,
                    urunVeHizmetKartiId: urunId,
                    urunVeHizmetAdi: urunAdi,
                    aramaMetni: urunAdi
                };
            })
            .filter(Boolean);

        const baslangic = parseAiDate(
            aiData.baslangicTarihi || aiData.header?.baslangicTarihi || aiData.startDate
        );
        const bitis = parseAiDate(aiData.bitisTarihi || aiData.header?.bitisTarihi || aiData.endDate);
        const aciklama =
            aiData.aciklama || aiData.header?.aciklama || aiData.adi || aiData.header?.adi || '';

        setFormData((prev: any) => {
            const next = {
                ...prev,
                baslangicTarihi: baslangic || prev.baslangicTarihi,
                bitisTarihi: bitis || prev.bitisTarihi,
                aciklama: aciklama || prev.aciklama,
                kdvOrani: currentHeaderOran,
                kdvGrubuId: currentHeaderGrubuId ?? prev.kdvGrubuId,
                kalemler: mappedKalemler.length > 0 ? mappedKalemler : prev.kalemler
            };
            formDataRef.current = next;
            return next;
        });

        const unmatchedCodes = mappedKalemler
            .filter((k: any) => !k.urunVeHizmetKartiId && k.tedarikciUrunKodu)
            .map((k: any) => k.tedarikciUrunKodu);

        if (unmatchedCodes.length > 0) {
            axios
                .post('/api/UrunVeHizmetKartlari/bulk-lookup', Array.from(new Set(unmatchedCodes)))
                .then((res) => {
                    const products = Array.isArray(res.data) ? res.data : [];
                    if (products.length === 0) return;

                    const productMap: Record<string, any> = {};
                    products.forEach((p: any) => {
                        const kod = p.kod || p.Kod;
                        const ureticiKodu = p.ureticiKodu || p.UreticiKodu;
                        const barkod = p.barkod || p.Barkod;
                        const entry = {
                            id: p.id || p.Id,
                            ad: p.ad || p.Ad || '',
                            kdvOrani: Number(p.kdvOrani ?? p.KdvOrani ?? 0),
                            kdvGrubuId: p.kdvGrubuId ?? p.KdvGrubuId ?? null
                        };
                        if (kod) productMap[String(kod).trim().toUpperCase()] = entry;
                        if (ureticiKodu) productMap[String(ureticiKodu).trim().toUpperCase()] = entry;
                        if (barkod) productMap[String(barkod).trim().toUpperCase()] = entry;
                    });

                    setFormData((prev: any) => {
                        const updatedKalemler = (prev.kalemler || []).map((k: any) => {
                            if (k.urunVeHizmetKartiId) return k;
                            const lookupKey = String(k.tedarikciUrunKodu || '').trim().toUpperCase();
                            const matched = lookupKey ? productMap[lookupKey] : null;
                            if (!matched) return k;

                            const nextKdvOrani = matched.kdvOrani;
                            const nextKdvGrubuId = resolveKdvGrubuId(
                                kdvGruplariRef.current,
                                matched.kdvGrubuId,
                                nextKdvOrani
                            );
                            const girisYonu: 'haric' | 'dahil' =
                                k.fiyatGirisYonu || (k.kdvDahilMi === false ? 'haric' : 'dahil');
                            const prices = calculateBshKalemPrices({
                                fiyatGirisYonu: girisYonu,
                                kdvHaricFiyat: k.kdvHaricFiyat,
                                fiyat: k.fiyat,
                                kdvOrani: nextKdvOrani
                            });

                            return {
                                ...k,
                                kdvOrani: nextKdvOrani,
                                kdvGrubuId: nextKdvGrubuId,
                                kdvHaricFiyat: prices.kdvHaricFiyat,
                                fiyat: prices.fiyat,
                                fiyatGirisYonu: girisYonu,
                                kdvDahilMi: k.kdvDahilMi ?? (girisYonu === 'dahil'),
                                urunVeHizmetKartiId: matched.id,
                                urunVeHizmetAdi: matched.ad,
                                aramaMetni: matched.ad
                            };
                        });
                        const next = { ...prev, kalemler: updatedKalemler };
                        formDataRef.current = next;
                        return next;
                    });
                })
                .catch((err) => console.error('AI draft product bulk lookup failed:', err));
        }

        toast.success(t('auto_ai_taslak_aktarildi', 'Yapay zeka fiyat farkı taslağı forma aktarıldı.'));
    }, [isEditMode, location.state?.initialAiData, t]);

    const isExcelImportRoute = location.pathname.endsWith('/excel-import');
    const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
    const showExcelImport = isExcelImportRoute || isExcelImportOpen;

    useEffect(() => {
        if (!location.pathname.endsWith('/excel-import')) {
            setIsExcelImportOpen(false);
        }
    }, [location.pathname]);

    const handleOpenExcelImport = useCallback(() => {
        const cleanPath = location.pathname
            .replace(/\/+$/, '')
            .replace(/\/(bulut-dosyalari|excel-import)$/, '');
        if (!isExcelImportRoute) {
            navigate(`${cleanPath}/excel-import`, {
                state: {
                    ...location.state,
                    currentFormData:
                        formDataRef.current || formData || location.state?.currentFormData
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
                replace: true,
                state: {
                    ...location.state,
                    currentFormData:
                        formDataRef.current || formData || location.state?.currentFormData
                }
            });
        }
    }, [location.pathname, location.state, formData, navigate]);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<string | number>(1);


    const tabs = [
        { id: 1, title: t('Genel', 'Genel'), icon: <FileText size={16} /> },
        { id: 2, title: t('auto_kdv_orani', 'KDV Oranı'), icon: <Percent size={16} /> },
        { id: 3, title: t('Açıklama', 'Açıklama'), icon: <AlignLeft size={16} /> }
    ];

    const excelColumns: ExcelColumnDef[] = [
        {
            key: 'tedarikciUrunKodu',
            label: t('auto_tedarikci_urun_kodu_sutunu', 'Tedarikçi Ürün Kodu Sütunu'),
            type: 'column',
            expectedType: 'string',
            required: true
        },
        {
            key: 'fiyat',
            label: t('auto_fiyat_sutunu', 'Fiyat Sütunu'),
            type: 'column',
            expectedType: 'number',
            required: true
        },
        {
            key: 'kdvDurumu',
            label: t('auto_kdv_durumu', 'KDV Durumu'),
            type: 'select',
            options: [
                { value: 'dahil', label: t('auto_fiyatlar_kdv_dahildir', 'Fiyatlar KDV Dahildir') },
                {
                    value: 'haric',
                    label: t('auto_fiyatlar_kdv_harictir', 'Fiyatlar KDV Hariçtir (KDV Eklenecek)')
                }
            ],
            defaultValue: 'dahil'
        }
    ];

    const handleHeaderKdvChange = useCallback(
        (selectedId: any, rawValue?: any) => {
            const selectedGroup =
                rawValue ||
                kdvGruplari.find((k: any) => String(k.id ?? k.Id) === String(selectedId));
            if (!selectedGroup) return;

            const newHeaderOran = getKdvOran(selectedGroup);
            const newHeaderGrubuId = selectedGroup.id ?? selectedGroup.Id;

            setFormData((prev: any) => {
                const oldHeaderOran = Number(prev.kdvOrani ?? 0);
                const oldHeaderGrubuId = prev.kdvGrubuId;

                const updatedKalemler = (prev.kalemler || []).map((k: any) => {
                    // Ürün veya hizmet kartı ile eşleşmiş satırların KDV'si ürün kartından gelir
                    if (k.urunVeHizmetKartiId) return k;

                    const rowOran =
                        k.kdvOrani !== undefined && k.kdvOrani !== null
                            ? Number(k.kdvOrani)
                            : oldHeaderOran;
                    const isMatchedWithOldHeader =
                        rowOran === oldHeaderOran ||
                        (oldHeaderGrubuId !== undefined &&
                            oldHeaderGrubuId !== null &&
                            oldHeaderGrubuId !== '' &&
                            String(k.kdvGrubuId) === String(oldHeaderGrubuId));

                    if (!isMatchedWithOldHeader) return k;

                    const prices = calculateBshKalemPrices({
                        fiyatGirisYonu: k.fiyatGirisYonu || 'dahil',
                        kdvHaricFiyat: k.kdvHaricFiyat,
                        fiyat: k.fiyat,
                        kdvOrani: newHeaderOran
                    });

                    return {
                        ...k,
                        kdvOrani: newHeaderOran,
                        kdvGrubuId: newHeaderGrubuId,
                        ...prices
                    };
                });

                const next = {
                    ...prev,
                    kdvOrani: newHeaderOran,
                    kdvGrubuId: newHeaderGrubuId,
                    kalemler: updatedKalemler
                };
                formDataRef.current = next;
                return next;
            });
        },
        [kdvGruplari]
    );

    const handleCodeLookup = async (kalem: any, code: string) => {
        if (!code || code.trim() === '') return;


        try {
            const res = await axios.post('/api/UrunVeHizmetKartlari/bulk-lookup', [code.trim()]);
            const matchedProducts = res.data;
            if (matchedProducts && matchedProducts.length > 0) {
                const p = matchedProducts[0];
                const matchedProduct = {
                    id: p.id || p.Id,
                    ad: p.ad || p.Ad,
                    kdvOrani: Number(p.kdvOrani ?? p.KdvOrani ?? 0),
                    kdvGrubuId: p.kdvGrubuId ?? p.KdvGrubuId ?? null
                };


                if (kalem.urunVeHizmetKartiId === matchedProduct.id) return;

                setFormData((prev: any) => {
                    const newKalemler = [...prev.kalemler];
                    const idx = newKalemler.findIndex((k: any) => k.id === kalem.id);
                    if (idx > -1) {
                        const currentRow = newKalemler[idx];
                        const resolvedGrubuId = resolveKdvGrubuId(
                            kdvGruplariRef.current,
                            matchedProduct.kdvGrubuId,
                            matchedProduct.kdvOrani
                        );
                        const prices = calculateBshKalemPrices({
                            fiyatGirisYonu: currentRow.fiyatGirisYonu || 'dahil',
                            kdvHaricFiyat: currentRow.kdvHaricFiyat,
                            fiyat: currentRow.fiyat,
                            kdvOrani: matchedProduct.kdvOrani
                        });

                        newKalemler[idx] = {
                            ...currentRow,
                            urunVeHizmetKartiId: matchedProduct.id,
                            urunVeHizmetAdi: matchedProduct.ad,
                            aramaMetni: matchedProduct.ad,
                            kdvOrani: matchedProduct.kdvOrani,
                            kdvGrubuId: resolvedGrubuId,
                            ...prices
                        };
                    }
                    const next = { ...prev, kalemler: newKalemler };
                    formDataRef.current = next;
                    return next;
                });
            }
        } catch (err) {
            console.error('Code lookup failed', err);
        }
    };

    const columns: any[] = [
        {
            id: 'tedarikciUrunKodu',
            header: t('auto_tedarikci_urun_kodu', 'Tedarikçi Ürün Kodu'),
            width: 180,
            type: 'text',
            render: (kalem: any) => (
                <BasitInput
                    textTransform="none"
                    className="form-input spreadsheet-cell-input"
                    value={kalem.tedarikciUrunKodu || ''}
                    onChange={(e) => {
                        const newKalemler = [...formData.kalemler];
                        const idx = newKalemler.findIndex((k) => k.id === kalem.id);
                        if (idx > -1) {
                            newKalemler[idx] = {
                                ...newKalemler[idx],
                                tedarikciUrunKodu: e.target.value
                            };
                            setFormData({ ...formData, kalemler: newKalemler });
                        }
                    }}
                    onBlur={(e) => {
                        if (e.target.value) {
                            handleCodeLookup(kalem, e.target.value);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Tab') {
                            if (e.currentTarget.value) {
                                handleCodeLookup(kalem, e.currentTarget.value);
                            }
                        }
                    }}
                />
            )
        },
        {
            id: 'urunVeHizmetKartiId',
            header: t('auto_urun_hizmet', 'Ürün / Hizmet'),
            width: 280,
            type: 'custom',
            render: (row: any) => (
                <UrunSeciciInput
                    inputClassName="form-input spreadsheet-cell-input"
                    value={row.aramaMetni || row.urunVeHizmetAdi || ''}
                    onChange={(e: any) => {
                        const newKalemler = [...formData.kalemler];
                        const idx = newKalemler.findIndex((k) => k.id === row.id);
                        if (idx > -1) {
                            newKalemler[idx] = { ...newKalemler[idx], aramaMetni: e.target.value };
                            setFormData({ ...formData, kalemler: newKalemler });
                        }
                    }}
                    onKeyDown={(e: any) => {
                        if ((e.key === 'Tab' || e.key === 'Enter') && row.aramaMetni && !e.shiftKey) {
                            if (!row.urunVeHizmetKartiId) {
                                e.preventDefault();
                                setUrunAramaMetni(row.aramaMetni);
                                setActiveRowId(row.id);
                                setUrunModalOpen(true);
                            }
                        }
                    }}
                    onMenuClick={() => {
                        setUrunAramaMetni(row.aramaMetni || row.urunVeHizmetAdi || '');
                        setActiveRowId(row.id);
                        setUrunModalOpen(true);
                    }}
                    hasSelection={!!row.urunVeHizmetKartiId}
                    onClear={() => {
                        const newKalemler = [...formData.kalemler];
                        const idx = newKalemler.findIndex((k) => k.id === row.id);
                        if (idx > -1) {
                            const headerOran = Number(formData.kdvOrani ?? 0);
                                const headerGrubuId = resolveKdvGrubuId(
                                    kdvGruplari,
                                    formData.kdvGrubuId,
                                    headerOran
                                );
                                const currentRow = newKalemler[idx];
                                const prices = calculateBshKalemPrices({
                                    fiyatGirisYonu: currentRow.fiyatGirisYonu || 'dahil',
                                    kdvHaricFiyat: currentRow.kdvHaricFiyat,
                                    fiyat: currentRow.fiyat,
                                    kdvOrani: headerOran
                                });
                                newKalemler[idx] = {
                                    ...currentRow,
                                    urunVeHizmetKartiId: null,
                                    urunVeHizmetAdi: '',
                                    aramaMetni: '',
                                    kdvOrani: headerOran,
                                    kdvGrubuId: headerGrubuId,
                                    ...prices
                                };
                                setFormData({ ...formData, kalemler: newKalemler });
                            }
                        }
                    }
                />
            )
        },
        {
            id: 'kdvOrani',
            header: t('auto_kdv_orani', 'KDV Oranı'),
            width: 170,
            type: 'custom',
            render: (kalem: any) => {
                const effectiveOran =
                    kalem.kdvOrani !== undefined && kalem.kdvOrani !== null
                        ? Number(kalem.kdvOrani)
                        : Number(formData.kdvOrani ?? 0);
                const selectedKdvId = resolveKdvGrubuId(
                    kdvGruplari,
                    kalem.kdvGrubuId,
                    effectiveOran
                );

                return (
                    <KdvSecici
                        id={`kdv-secici-row-${kalem.id}`}
                        kdvGruplari={kdvGruplari}
                        value={selectedKdvId}
                        disabled={Boolean(kalem.urunVeHizmetKartiId)}
                        clearable={false}
                        onChange={(selectedId, rawVal) => {
                            if (kalem.urunVeHizmetKartiId) return;
                            const selectedGroup =
                                rawVal ||
                                kdvGruplari.find(
                                    (k: any) => String(k.id ?? k.Id) === String(selectedId)
                                );
                            if (!selectedGroup) return;

                            const nextOran = getKdvOran(selectedGroup);
                            const nextGrubuId = selectedGroup.id ?? selectedGroup.Id;

                            const newKalemler = [...formData.kalemler];
                            const idx = newKalemler.findIndex((k) => k.id === kalem.id);
                            if (idx > -1) {
                                const currentRow = newKalemler[idx];
                                const prices = calculateBshKalemPrices({
                                    fiyatGirisYonu: currentRow.fiyatGirisYonu || 'dahil',
                                    kdvHaricFiyat: currentRow.kdvHaricFiyat,
                                    fiyat: currentRow.fiyat,
                                    kdvOrani: nextOran
                                });

                                newKalemler[idx] = {
                                    ...currentRow,
                                    kdvOrani: nextOran,
                                    kdvGrubuId: nextGrubuId,
                                    ...prices
                                };
                                setFormData({ ...formData, kalemler: newKalemler });
                            }
                        }}
                    />
                );
            }
        },
        {
            id: 'kdvHaricFiyat',
            header: t('auto_kdv_haric_fiyat', 'KDV Hariç Fiyat'),
            width: 150,
            type: 'number',
            align: 'right',
            render: (kalem: any) => (
                <CurrencyInput
                    className="form-input text-right spreadsheet-cell-input"
                    value={kalem.kdvHaricFiyat ?? 0}
                    onChange={(e: any) => {
                        const newKalemler = [...formData.kalemler];
                        const idx = newKalemler.findIndex((k) => k.id === kalem.id);
                        if (idx > -1) {
                            const currentRow = newKalemler[idx];
                            const oran = Number(
                                currentRow.kdvOrani ?? formData.kdvOrani ?? 0
                            );
                            const haricVal = Number(e.target.value || 0);
                            const prices = calculateBshKalemPrices({
                                fiyatGirisYonu: 'haric',
                                kdvHaricFiyat: haricVal,
                                kdvOrani: oran
                            });
                            newKalemler[idx] = {
                                ...currentRow,
                                kdvOrani: oran,
                                kdvHaricFiyat: prices.kdvHaricFiyat,
                                fiyat: prices.fiyat,
                                fiyatGirisYonu: 'haric'
                            };
                            setFormData({ ...formData, kalemler: newKalemler });
                        }
                    }}
                />
            )
        },
        {
            id: 'fiyat',
            header: t('auto_kdv_dahil_fiyat', 'KDV Dahil Fiyat'),
            width: 150,
            type: 'number',
            align: 'right',
            render: (kalem: any) => (
                <CurrencyInput
                    className="form-input text-right spreadsheet-cell-input"
                    value={kalem.fiyat ?? 0}
                    onChange={(e: any) => {
                        const newKalemler = [...formData.kalemler];
                        const idx = newKalemler.findIndex((k) => k.id === kalem.id);
                        if (idx > -1) {
                            const currentRow = newKalemler[idx];
                            const oran = Number(
                                currentRow.kdvOrani ?? formData.kdvOrani ?? 0
                            );
                            const dahilVal = Number(e.target.value || 0);
                            const prices = calculateBshKalemPrices({
                                fiyatGirisYonu: 'dahil',
                                fiyat: dahilVal,
                                kdvOrani: oran
                            });
                            newKalemler[idx] = {
                                ...currentRow,
                                kdvOrani: oran,
                                kdvHaricFiyat: prices.kdvHaricFiyat,
                                fiyat: prices.fiyat,
                                fiyatGirisYonu: 'dahil'
                            };
                            setFormData({ ...formData, kalemler: newKalemler });
                        }
                    }}
                />
            )
        }
    ];

    const fetchBelge = async () => {
        try {
            const res = await axios.get(`/api/BshFiyatFarki/${id}`);
            const data = res.data;
            const maxKdv = getMaxKdvGrubu(kdvGruplariRef.current);
            const headerOran =
                data.kdvOrani !== undefined && data.kdvOrani !== null && Number(data.kdvOrani) > 0
                    ? Number(data.kdvOrani)
                    : maxKdv?.oran ?? 20;
            const headerGrubuId = resolveKdvGrubuId(
                kdvGruplariRef.current,
                data.kdvGrubuId,
                headerOran
            );

            setFormData({
                ...data,
                kdvOrani: headerOran,
                kdvGrubuId: headerGrubuId,
                baslangicTarihi: data.baslangicTarihi ? data.baslangicTarihi.substring(0, 10) : '',
                bitisTarihi: data.bitisTarihi ? data.bitisTarihi.substring(0, 10) : '',
                kalemler:
                    data.kalemler?.map((k: any) => {
                        const satirOran =
                            k.kdvOrani !== undefined && k.kdvOrani !== null
                                ? Number(k.kdvOrani)
                                : headerOran;
                        const satirGrubuId = resolveKdvGrubuId(
                            kdvGruplariRef.current,
                            k.kdvGrubuId,
                            satirOran
                        );
                        const hasSavedHaric =
                            k.kdvHaricFiyat !== undefined &&
                            k.kdvHaricFiyat !== null &&
                            Number(k.kdvHaricFiyat) > 0;
                        const prices = hasSavedHaric
                            ? {
                                kdvHaricFiyat: Number(Number(k.kdvHaricFiyat).toFixed(2)),
                                fiyat: Number(Number(k.fiyat ?? 0).toFixed(2))
                            }
                            : calculateBshKalemPrices({
                                fiyatGirisYonu: 'dahil',
                                fiyat: k.fiyat ?? 0,
                                kdvOrani: satirOran
                            });

                        return {
                            ...k,
                            kdvOrani: satirOran,
                            kdvGrubuId: satirGrubuId,
                            kdvHaricFiyat: prices.kdvHaricFiyat,
                            fiyat: prices.fiyat,
                            fiyatGirisYonu: 'dahil' as const,
                            _gridId: Math.random().toString()
                        };
                    }) || []
            });
        } catch (error) {
            toast.error(t('auto_belge_yuklenirken_hata', 'Belge yüklenirken hata oluştu.'));
        }
    };

    useEffect(() => {
        if (isEditMode) {
            if (!location.state?.currentFormData) {
                fetchBelge();
            }
        } else {
            checkBelgeAyari();
                setFormData((prev: any) => {
                    if (!prev.kalemler || prev.kalemler.length === 0) {
                        return {
                            ...prev,
                        kalemler: [
                                createEmptyBshFiyatFarkiKalem(
                                    Number(prev.kdvOrani ?? 0),
                                    prev.kdvGrubuId
                                )
                            ]
                        };
                    }
                    return prev;
                });
            }
    }, [id]);

    useEffect(() => {
        const handleUrunCreated = (newUrun: any) => {
            if (!newUrun) return;

            setFormData((prev: any) => {
                let isUpdated = false;
                const newKalemler = prev.kalemler.map((kalem: any) => {
                    if (kalem.urunVeHizmetKartiId) return kalem;

                    const codeToSearch = (kalem.tedarikciUrunKodu || kalem.aramaMetni || '')
                        .trim()
                        .toLowerCase();
                    if (!codeToSearch) return kalem;

                    const matchKod = newUrun.kod && newUrun.kod.toLowerCase() === codeToSearch;
                    const matchUretici =
                        newUrun.ureticiKodu && newUrun.ureticiKodu.toLowerCase() === codeToSearch;
                    const matchBarkod =
                        newUrun.barkod && newUrun.barkod.toLowerCase() === codeToSearch;
                    const matchBarkodlar =
                        newUrun.barkodlar &&
                        newUrun.barkodlar.some((b: string) => b.toLowerCase() === codeToSearch);

                    if (matchKod || matchUretici || matchBarkod || matchBarkodlar) {
                        isUpdated = true;
                        const urunKdvOrani =
                            newUrun.kdvOrani !== undefined && newUrun.kdvOrani !== null
                                ? Number(newUrun.kdvOrani)
                                : Number(kalem.kdvOrani ?? prev.kdvOrani ?? 0);
                        const urunKdvGrubuId = resolveKdvGrubuId(
                            kdvGruplariRef.current,
                            newUrun.kdvGrubuId,
                            urunKdvOrani
                        );
                        const prices = calculateBshKalemPrices({
                            fiyatGirisYonu: kalem.fiyatGirisYonu || 'dahil',
                            kdvHaricFiyat: kalem.kdvHaricFiyat,
                            fiyat: kalem.fiyat,
                            kdvOrani: urunKdvOrani
                        });

                        return {
                            ...kalem,
                            urunVeHizmetKartiId: newUrun.id,
                            urunVeHizmetAdi: newUrun.ad,
                            aramaMetni: newUrun.ad,
                            kdvOrani: urunKdvOrani,
                            kdvGrubuId: urunKdvGrubuId,
                            ...prices
                        };
                    }
                    return kalem;
                });

                if (isUpdated) {
                    toast.success(
                        t(
                            'auto_yeni_olusturulan_urun_eslestirildi',
                            'Yeni oluşturulan ürün satırla otomatik eşleştirildi.'
                        )
                    );
                    return { ...prev, kalemler: newKalemler };
                }
                return prev;
            });
        };

        const handleUrunCreatedEvent = (e: any) => handleUrunCreated(e.detail);


        window.addEventListener('urun-created', handleUrunCreatedEvent);


        let bc: BroadcastChannel | null = null;
        try {
            bc = new BroadcastChannel('webakus_urun_channel');
            bc.onmessage = (event) => {
                if (event.data?.type === 'urun-created') {
                    handleUrunCreated(event.data.detail);
                }
            };
        } catch (e) {
            console.error('BroadcastChannel error:', e);
        }

        return () => {
            window.removeEventListener('urun-created', handleUrunCreatedEvent);
            if (bc) bc.close();
        };
    }, [t]);

    const addKalem = () => {
            setFormData((prev: any) => ({
                ...prev,
                kalemler: [
                    ...(prev.kalemler || []),
                createEmptyBshFiyatFarkiKalem(Number(prev.kdvOrani ?? 0), prev.kdvGrubuId)
                ]
            }));
    };

const removeKalem = (rowId: any) => {
        setFormData((prev: any) => ({
            ...prev,
            kalemler: prev.kalemler.filter((k: any) => k.id !== rowId)
        }));
    };

const isEmptyRow = (row: any) => !row.urunVeHizmetKartiId && !row.tedarikciUrunKodu;

const { handleImport } = useExcelProductImport();

const handleExcelImport = async (rawImportedData: any[]) => {
    const currentData = formDataRef.current || formData;
    const headerOran = Number(currentData.kdvOrani ?? 0);
    const headerGrubuId = currentData.kdvGrubuId;

    const newKalemler = await handleImport(rawImportedData, {
        currentRows: currentData.kalemler,
        onUpdateRows: (newRows) => {
            setFormData((prev: any) => ({ ...prev, kalemler: newRows }));
            formDataRef.current = { ...formDataRef.current, kalemler: newRows };
        },
        rowMapper: (importedRow, matchedProduct) => {
            const isMatched = Boolean(matchedProduct);
            const kdvOrani = isMatched
                ? Number(matchedProduct.KdvOrani ?? matchedProduct.kdvOrani ?? 0)
                : headerOran;
            const kdvGrubuId = isMatched
                ? resolveKdvGrubuId(
                    kdvGruplariRef.current,
                    matchedProduct.kdvGrubuId ?? matchedProduct.KdvGrubuId,
                    kdvOrani
                )
                : headerGrubuId;

            const rawFiyat = Number(importedRow.fiyat || 0);
            const isHaric = importedRow.kdvDurumu === 'haric';
            const prices = calculateBshKalemPrices({
                fiyatGirisYonu: isHaric ? 'haric' : 'dahil',
                kdvHaricFiyat: isHaric ? rawFiyat : undefined,
                fiyat: isHaric ? undefined : rawFiyat,
                kdvOrani
            });

            return {
                tedarikciUrunKodu: importedRow.tedarikciUrunKodu,
                    kdvOrani,
                kdvGrubuId,
                kdvHaricFiyat: prices.kdvHaricFiyat,
                fiyat: prices.fiyat,
                fiyatGirisYonu: isHaric ? ('haric' as const) : ('dahil' as const),
                urunVeHizmetKartiId: matchedProduct
                    ? matchedProduct.Id || matchedProduct.id
                    : null,
                urunVeHizmetAdi: matchedProduct
                    ? matchedProduct.ad || matchedProduct.Ad
                    : '',
                aramaMetni: matchedProduct ? matchedProduct.ad || matchedProduct.Ad : ''
            };
        }
    });

    if (newKalemler && newKalemler.length > 0) {
        const updated = {
            ...formDataRef.current,
            kalemler: newKalemler
        };
        formDataRef.current = updated;
        setFormData(updated);
    }
};

const checkBelgeAyari = async () => {
    try {
        const res = await axios.get(`/api/BelgeAyarlari/BshFiyatFarki`);
        if (res.data?.otomatikNumaraVerilsinMi) {
            setFormData((prev: any) => ({ ...prev, belgeNo: '[OTOMATİK]' }));
        }
    } catch (e) {
        console.log('Belge ayarı okunamadı', e);
    }
};

const handleSave = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }


    const { isValid, errors: validationErrors } = validateBshFiyatFarkiForm(formData, t);


    if (!isValid) {
        setErrors(validationErrors || {});
        return;
    }

    setLoading(true);
    try {
        const headerOran = Number(formData.kdvOrani ?? 0);
        const payload = {
            ...formData,
            kdvOrani: headerOran,
            baslangicTarihi: formData.baslangicTarihi || null,
            bitisTarihi: formData.bitisTarihi || null,
            belgeNo: formData.belgeNo === '[OTOMATİK]' ? '' : formData.belgeNo,
            kalemler: formData.kalemler
                .filter((k: any) => k.urunVeHizmetKartiId || k.tedarikciUrunKodu)
                .map((k: any) => {
                    const satirOran =
                        k.kdvOrani !== undefined && k.kdvOrani !== null
                            ? Number(k.kdvOrani)
                            : headerOran;
                    const prices = calculateBshKalemPrices({
                        fiyatGirisYonu: k.fiyatGirisYonu || 'dahil',
                        kdvHaricFiyat: k.kdvHaricFiyat,
                        fiyat: k.fiyat,
                        kdvOrani: satirOran
                    });
                    return {
                        ...k,
                        id: typeof k.id === 'number' && k.id > 2000000000 ? 0 : k.id,
                        kdvOrani: satirOran,
                        kdvHaricFiyat: k.kdvHaricFiyat ?? prices.kdvHaricFiyat,
                        fiyat: k.fiyat ?? prices.fiyat
                    };
                })
        };

        if (isEditMode) {
            await axios.put(`/api/BshFiyatFarki/${id}`, payload);
            toast.success(t('auto_kayit_guncellendi', 'Kayıt güncellendi.'));
        } else {
            await axios.post('/api/BshFiyatFarki', payload);
            toast.success(
                t('auto_kayit_basariyla_olusturuldu', 'Kayıt başarıyla oluşturuldu.')
            );
            navigate('/bsh-fiyat-farki');
        }
    } catch (error: any) {
        toast.error(
            error.response?.data?.message ||
            t('auto_kayit_basarisiz', 'Kayıt işlemi başarısız oldu.')
        );
    } finally {
        setLoading(false);
    }
};

const bshActionMenu = useBshFiyatFarkiActionMenu({
    onExcelImportClick: handleOpenExcelImport
});

const selectedHeaderKdvId = resolveKdvGrubuId(
    kdvGruplari,
    formData.kdvGrubuId,
    formData.kdvOrani
);

const headerContent = (
        <>
        {activeTab === 1 && (
            <DocumentHeaderPanel columns={2}>
                    <DocumentHeaderField
                        name="baslangicTarihi"
                        label={t('TarihAraligi_label', 'Tarih Aralığı')}
                        required
                    >
                        <DateRangeInput
                            baslangicTarihi={formData.baslangicTarihi}
                            bitisTarihi={formData.bitisTarihi}
                            onChange={(baslangic, bitis) => {
                                setFormData({
                                    ...formData,
                                    baslangicTarihi: baslangic,
                                    bitisTarihi: bitis
                                });
                                formDataRef.current = {
                                    ...formDataRef.current,
                                    baslangicTarihi: baslangic,
                                    bitisTarihi: bitis
                                };
                                if (errors.baslangicTarihi) {
                                        setErrors((prev) => {
                                            const next = { ...prev };
                                            delete next.baslangicTarihi;
                                            return next;
                                        });
                                    }
                                if (errors.bitisTarihi) {
                                            setErrors((prev) => {
                                                const next = { ...prev };
                                                delete next.bitisTarihi;
                                                return next;
                                            });
                                        }
                            }
                                }
                        />
                    </DocumentHeaderField>

                        <DocumentHeaderField
                            name="belgeNo"
                            label={t('auto_belge_no', 'Belge No')}
                            required
                        >
                            <BasitInput
                                id="belgeNoInput"
                                value={formData.belgeNo}
                                disabled={formData.belgeNo === '[OTOMATİK]'}
                                    onChange = {(e) => {
                                setFormData({ ...formData, belgeNo: e.target.value });
                            if (errors.belgeNo) {
                                    setErrors((prev) => {
                                        const next = { ...prev };
                                        delete next.belgeNo;
                                        return next;
                                    });
                                }
                            }}
                                onBlur = {(e) => {
                                const err = validateBshFiyatFarkiField('belgeNo', e.target.value);
                            if (err) {
                                    setErrors((prev) => ({...prev, belgeNo: err }));
                                }
                            }}
                        />
                        </DocumentHeaderField>
                    </DocumentHeaderPanel>
            )}

                    {activeTab === 2 && (
                        <DocumentHeaderPanel columns={2}>
                            <DocumentHeaderField
                                name="kdvOrani"
                                label={t('auto_kdv_orani', 'KDV Oranı')}
                            >
                                <KdvSecici
                                    id="bshHeaderKdvSecici"
                                    kdvGruplari={kdvGruplari}
                                    value={selectedHeaderKdvId}
                                    clearable={false}
                                    onChange={handleHeaderKdvChange}
                                />
                            </DocumentHeaderField>
                        </DocumentHeaderPanel>
                    )}

                    {activeTab === 3 && (
                        <DocumentHeaderPanel columns={1}>
                                <DocumentHeaderField
                                    name="aciklama"
                                    label={t('auto_aciklama', 'Açıklama')}
                                >
                                    <NotInput
                                        rows={3}
                                        value={formData.aciklama || ''}
                                        onChange={(e) =>
                                            setFormData({ ...formData, aciklama: e.target.value })
                                        }
                                    />
                                </DocumentHeaderField>
                        </DocumentHeaderPanel>
                    )}
                </>
                );

                const validRows =
        formData.kalemler?.filter((k: any) => k.urunVeHizmetKartiId || k.tedarikciUrunKodu) || [];
    const linkedRowsCount = validRows.filter((k: any) => k.urunVeHizmetKartiId).length;

                const footerContent = (
                <DocumentResultPanelsGroup align="end">
                    <DocumentResultPanel
                        title={t('auto_ozet', 'Özet')}
                        readOnly={true}
                        hideAddButton={true}
                        onSave={() => { }}
                        items={[
                            {
                                id: 'satirSayisi',
                                label: t('Satır Sayısı', 'Satır Sayısı'),
                                value: validRows.length.toString(),
                                visibilityRule: 'p4',
                                isEditable: false
                            },
                            {
                                id: 'iliskilendirilmis',
                                label: t('İlişkilendirilmiş Satır Sayısı', 'İlişkilendirilmiş Satır Sayısı'),
                                value: linkedRowsCount.toString(),
                                visibilityRule: 'p4',
                                isPrimary: true,
                                isAccent: true,
                                isEditable: false
                            }
                        ]}
                    />
                </DocumentResultPanelsGroup>
                );

                return (
                <>
                    <BaseDocumentPage
                        formId="bshFiyatFarkiForm"
                        onSubmit={handleSave as any}
                        onSave={handleSave}
                        isSaving={loading}
                        onValidate={() => validateBshFiyatFarkiForm(formData, t)}
                        errors={errors}
                        documentId={id ? parseInt(id) : undefined}
                        documentType="BshFiyatFarki"
                        documentNo={formData.belgeNo}
                        formData={formData}
                        pageTitle={
                            isEditMode
                                ? t('BshFiyatFarki_duzenleTitle', 'BSH Fiyat Farkı Düzenle')
                                : t('BshFiyatFarki_yeniTitle', 'Yeni BSH Fiyat Farkı')
                        }
                        onBack={() => navigate('/bsh-fiyat-farki')}
                        tabs={tabs}
                        activeTabId={activeTab}
                        onTabChange={setActiveTab}
                        extraDropdownActions={bshActionMenu.extraDropdownActions}
                        headerContent={headerContent}
                        footerContent={footerContent}
                        gridProps={{
                            columns: columns,
                            data: formData.kalemler,
                            onChange: (newData: any) => setFormData({ ...formData, kalemler: newData }),
                            onAddRow: addKalem,
                            onRemoveRow: (index: number) => removeKalem(formData.kalemler[index]?.id),
                            isEmptyRow: isEmptyRow,
                            maxOneEmptyRow: true,
                            minRows: 10
                        }}
                    />


                    <UrunSeciciModal
                        isOpen={urunModalOpen}
                        onClose={() => setUrunModalOpen(false)}
                        initialSearchText={urunAramaMetni}
                        onSelect={(urun) => {
                            const newKalemler = [...formData.kalemler];
                            const idx = newKalemler.findIndex((k: any) => k.id === activeRowId);
                            if (idx > -1) {
                                const currentRow = newKalemler[idx];
                                const urunKdvOrani = Number(
                                    urun.kdvOrani ?? urun.KdvOrani ?? currentRow.kdvOrani ?? formData.kdvOrani ?? 0
                                );
                                const urunKdvGrubuId = resolveKdvGrubuId(
                                    kdvGruplari,
                                    urun.kdvGrubuId ?? urun.KdvGrubuId,
                                    urunKdvOrani
                                );
                                const prices = calculateBshKalemPrices({
                                    fiyatGirisYonu: currentRow.fiyatGirisYonu || 'dahil',
                                    kdvHaricFiyat: currentRow.kdvHaricFiyat,
                                    fiyat: currentRow.fiyat,
                                    kdvOrani: urunKdvOrani
                                });

                                newKalemler[idx] = {
                                    ...currentRow,
                                    urunVeHizmetKartiId: urun.id,
                                    urunVeHizmetAdi: urun.ad,
                                    aramaMetni: urun.ad,
                            tedarikciUrunKodu: urun.kod || currentRow.tedarikciUrunKodu || '',
                                    kdvOrani: urunKdvOrani,
                                    kdvGrubuId: urunKdvGrubuId,
                                    ...prices
                                };
                                setFormData({ ...formData, kalemler: newKalemler });
                            }
                            setUrunModalOpen(false);
                        }}
                    />

                    <ExcelImportPage
                        isOpen={showExcelImport}
                        onClose={handleCloseExcelImport}
                        onImport={handleExcelImport}
                        documentId={id ? parseInt(id) : undefined}
                        documentType="BshFiyatFarki"
                        columns={excelColumns}
                    />
                </>
                );
};

                export default BshFiyatFarkiForm;
