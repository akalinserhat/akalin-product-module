/**
 * Fiyat Listesi Formu (FiyatListesiForm) Bileşeni.
 * Alış, satış veya kampanya fiyat listesi belgelerinin oluşturulması, düzenlenmesi,
 * Excel'den veri aktarımı ve bulut döküman yönetimi işlemlerini gerçekleştirir.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

import { 
    BaseDocumentPage,
    DocumentHeaderPanel,
    DocumentHeaderField,
    SpreadsheetGrid,
    CurrencyInput, 
    DocumentResultPanel, 
    CariSeciciInput, 
    FiyatTanimSecici, 
    UrunSeciciModal, 
    NotInput, 
    BasitInput,
    DateRangeInput,
    DateInput,
    UrunSeciciInput,
    useHeaderApi,
    DocumentDraftManager,
    useDocumentRowSearch,
    formatCurrency
} from '@akalin/ui';
import ExcelImportPage, { type ExcelColumnDef } from './ExcelImportPage';
import { Save, FileText, AlignLeft, FileSpreadsheet } from 'lucide-react';
import { useExcelProductImport } from '../hooks/useExcelProductImport';
import { useFiyatListesiActionMenu } from '../hooks/useFiyatListesiActionMenu';
import { 
    validateFiyatListesiForm, 
    isKalemFieldInvalid, 
    isKalemActive, 
    isKalemComplete, 
    validateKalemlerBeforeAdd 
} from '../validators/fiyatListesiValidation';

export interface FiyatListesiFormProps {
    onDocumentLoaded?: (data: any) => void;
}

const FiyatListesiForm: React.FC<FiyatListesiFormProps> = ({ onDocumentLoaded }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const { setIsDocumentDirty } = useHeaderApi() || {};

    const [cariAramaMetni, setCariAramaMetni] = useState('');
    const [urunModalOpen, setUrunModalOpen] = useState(false);
    const [urunAramaMetni, setUrunAramaMetni] = useState('');
    const [activeRowId, setActiveRowId] = useState<any>(null);
    const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

    const [formData, setFormData] = useState<any>(() => {
        if (location.state?.currentFormData) {
            return location.state.currentFormData;
        }
        // Yalnızca kullanıcı listedeki "Şablon" satırına tıklayarak geldiyse taslağı yükle!
        if (location.state?.isDraftTemplate) {
            try {
                const draft = DocumentDraftManager.getDocumentDraft('/fiyat-listeleri', 'FiyatListesi');
                if (draft) {
                    return draft.formData || draft;
                }
            } catch (e) {}
        }
        return {
            belgeGuid: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
            belgeNo: isEditMode ? '' : '[OTOMATİK]',
            baslangicTarihi: new Date().toISOString().substring(0, 10),
            bitisTarihi: '',
            cariId: null,
            cariUnvani: '',
            fiyatListesiTanimiId: null,
            aciklama: '',
            kampanyaMi: false,
            kalemler: isEditMode ? [] : [{ id: Date.now(), urunVeHizmetKartiId: null, tedarikciUrunKodu: '', fiyat: 0, valorTarihi: '' }]
        };
    });

    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (!id && formData) {
            DocumentDraftManager.saveDocumentDraft('/fiyat-listeleri', 'FiyatListesi', formData);
        }
    }, [id, formData]);

    const isExcelImportRoute = location.pathname.endsWith('/excel-import');
    const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
    const showExcelImport = isExcelImportRoute || isExcelImportOpen;

    useEffect(() => {
        if (!location.pathname.endsWith('/excel-import')) {
            setIsExcelImportOpen(false);
        }
    }, [location.pathname]);

    const handleOpenExcelImport = useCallback(() => {
        const cleanPath = location.pathname.replace(/\/+$/, '').replace(/\/(bulut-dosyalari|excel-import)$/, '');
        if (!isExcelImportRoute) {
            navigate(`${cleanPath}/excel-import`, {
                state: {
                    ...location.state,
                    currentFormData: formData || location.state?.currentFormData
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
                    currentFormData: formData || location.state?.currentFormData
                }
            });
        }
    }, [location.pathname, location.state, formData, navigate]);

    const fiyatListesiActionMenu = useFiyatListesiActionMenu({
        onExcelImportClick: handleOpenExcelImport,
        kampanyaMi: formData.kampanyaMi,
        onKampanyaChange: (val) => setFormData((prev: any) => ({ ...prev, kampanyaMi: val }))
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<string | number>(1);

    useEffect(() => {
        if (errors.kalemler) {
            const validation = validateFiyatListesiForm(formData);
            const gridValidation = validateKalemlerBeforeAdd(formData.kalemler);
            if (!validation.errors.kalemler && gridValidation.canAdd) {
                setErrors(prev => {
                    if (!prev.kalemler) return prev;
                    const next = { ...prev };
                    delete next.kalemler;
                    return next;
                });
            } else if (validation.errors.kalemler && validation.errors.kalemler !== errors.kalemler) {
                setErrors(prev => ({ ...prev, kalemler: validation.errors.kalemler }));
            }
        }
    }, [formData.kalemler, errors.kalemler]);
    const tabs = [
        { id: 1, title: t('Genel'), icon: <FileText size={16} /> },
        { id: 2, title: t('Açıklama'), icon: <AlignLeft size={16} /> }
    ];

    const excelColumns: ExcelColumnDef[] = [
        { key: 'tedarikciUrunKodu', label: t('Tedarikçi Ürün Kodu Sütunu'), type: 'column', expectedType: 'string', required: true },
        { key: 'fiyat', label: t('Fiyat Sütunu'), type: 'column', expectedType: 'number', required: true },
        { key: 'valorTarihiTuru', label: t('Valör Tarihi Türü'), type: 'select', options: [{value: 'sutun', label: t('Sütundan Al')}, {value: 'manuel', label: t('Manuel Belirle')}], defaultValue: 'sutun' },
        { key: 'valorTarihiSutun', label: t('Valör Tarihi'), type: 'column', expectedType: 'date', visibleIf: { key: 'valorTarihiTuru', value: 'sutun' } },
        { key: 'valorTarihiManuel', label: t('Valör Tarihi'), type: 'date', visibleIf: { key: 'valorTarihiTuru', value: 'manuel' } }
    ];

    const handleCodeLookup = async (kalem: any, code: string) => {
        if (!code || code.trim() === '') return;
        
        try {
            const res = await axios.post('/api/UrunVeHizmetKartlari/bulk-lookup', [code.trim()]);
            const matchedProducts = res.data;
            if (matchedProducts && matchedProducts.length > 0) {
                const p = matchedProducts[0];
                const matchedProduct = {
                    id: p.id || p.Id,
                    ad: p.ad || p.Ad
                };
                
                // If it already matches the current product, do nothing
                if (kalem.urunVeHizmetKartiId === matchedProduct.id) return;

                setFormData((prev: any) => {
                    const newKalemler = [...prev.kalemler];
                    const idx = newKalemler.findIndex((k: any) => k.id === kalem.id);
                    if (idx > -1) {
                        newKalemler[idx] = {
                            ...newKalemler[idx],
                            urunVeHizmetKartiId: matchedProduct.id,
                            urunVeHizmetAdi: matchedProduct.ad,
                            aramaMetni: matchedProduct.ad
                        };
                    }
                    return { ...prev, kalemler: newKalemler };
                });
            }
        } catch (err) {
            console.error("Code lookup failed", err);
        }
    };


    const hasKalemlerError = Boolean(errors.kalemler);

    // Grid Columns
    const columns: any[] = [
        {
            id: 'tedarikciUrunKodu',
            header: `${t('auto_tedarikci_urun_kodu', 'Tedarikçi Ürün Kodu')} *`,
            width: 200,
            type: 'text',
            isInvalid: (kalem: any) => isKalemFieldInvalid(kalem, 'tedarikciUrunKodu', hasKalemlerError),
            render: (kalem: any) => {
                const isInvalid = isKalemFieldInvalid(kalem, 'tedarikciUrunKodu', hasKalemlerError);
                return (
                    <input
                        type="text"
                        className={`form-input spreadsheet-cell-input ${isInvalid ? 'is-invalid' : ''}`}
                        value={kalem.tedarikciUrunKodu || ''}
                        onChange={(e) => {
                            const newKalemler = [...formData.kalemler];
                            const idx = newKalemler.findIndex(k => k.id === kalem.id);
                            if (idx > -1) {
                                newKalemler[idx] = { ...newKalemler[idx], tedarikciUrunKodu: e.target.value };
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
                );
            }
        },
        {
            id: 'urunVeHizmetKartiId',
            header: t('auto_urun_hizmet', 'Ürün / Hizmet'),
            width: 300,
            type: 'custom',
            isInvalid: (row: any) => isKalemFieldInvalid(row, 'urunVeHizmetKartiId', hasKalemlerError),
            render: (row: any) => {
                const isInvalid = isKalemFieldInvalid(row, 'urunVeHizmetKartiId', hasKalemlerError);
                return (
                    <UrunSeciciInput
                        error={isInvalid}
                        inputClassName={`form-input spreadsheet-cell-input ${isInvalid ? 'is-invalid' : ''}`}
                        value={row.aramaMetni || row.urunVeHizmetAdi || ''}
                        onChange={(e: any) => {
                            const newKalemler = [...formData.kalemler];
                            const idx = newKalemler.findIndex(k => k.id === row.id);
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
                            const idx = newKalemler.findIndex(k => k.id === row.id);
                            if (idx > -1) {
                                newKalemler[idx] = { 
                                    ...newKalemler[idx], 
                                    urunVeHizmetKartiId: null, 
                                    urunVeHizmetAdi: '', 
                                    aramaMetni: '' 
                                };
                                setFormData({ ...formData, kalemler: newKalemler });
                            }
                        }}
                    />
                );
            }
        },
        {
            id: 'fiyat',
            header: `${t('Fiyat', 'Fiyat')} *`,
            width: 150,
            type: 'number',
            align: 'right',
            isInvalid: (kalem: any) => isKalemFieldInvalid(kalem, 'fiyat', hasKalemlerError),
            render: (kalem: any) => {
                const isInvalid = isKalemFieldInvalid(kalem, 'fiyat', hasKalemlerError);
                return (
                    <CurrencyInput
                        className={`form-input text-right spreadsheet-cell-input ${isInvalid ? 'is-invalid' : ''}`}
                        value={kalem.fiyat ?? 0}
                        onChange={(e: any) => {
                            const newKalemler = [...formData.kalemler];
                            const idx = newKalemler.findIndex(k => k.id === kalem.id);
                            if (idx > -1) {
                                newKalemler[idx] = { ...newKalemler[idx], fiyat: e.target.value || 0 };
                                setFormData({ ...formData, kalemler: newKalemler });
                            }
                        }}
                    />
                );
            }
        },
        {
            id: 'valorTarihi',
            header: `${t('auto_valor_tarihi', 'Valör Tarihi')} *`,
            width: 150,
            type: 'date',
            isInvalid: (kalem: any) => isKalemFieldInvalid(kalem, 'valorTarihi', hasKalemlerError),
            render: (kalem: any) => {
                const isInvalid = isKalemFieldInvalid(kalem, 'valorTarihi', hasKalemlerError);
                return (
                    <DateInput
                        className={`form-input spreadsheet-cell-input ${isInvalid ? 'is-invalid' : ''}`}
                        value={kalem.valorTarihi ? kalem.valorTarihi.substring(0, 10) : ''}
                        onChange={(e: any) => {
                            const val = e.target ? e.target.value : e;
                            const newKalemler = [...formData.kalemler];
                            const idx = newKalemler.findIndex(k => k.id === kalem.id);
                            if (idx > -1) {
                                newKalemler[idx] = { 
                                    ...newKalemler[idx], 
                                    valorTarihi: val || '' 
                                };
                            }
                            setFormData({ ...formData, kalemler: newKalemler });
                        }}
                    />
                );
            }
        }
    ];

    const fetchFiyatListesi = async () => {
        try {
            const res = await axios.get(`/api/FiyatListeleri/${id}`);
            const data = res.data;
            const cariUnvani = data.cariUnvani || data.cariUnvan || (data.cari ? (data.cari.unvan || `${data.cari.ad || ''} ${data.cari.soyad || ''}`.trim()) : '');
            setFormData({
                ...data,
                cariUnvani: cariUnvani,
                baslangicTarihi: data.baslangicTarihi ? data.baslangicTarihi.substring(0, 10) : '',
                bitisTarihi: data.bitisTarihi ? data.bitisTarihi.substring(0, 10) : '',
                kalemler: data.kalemler?.map((k: any) => ({ ...k, _gridId: Math.random().toString() })) || []
            });
            setCariAramaMetni(cariUnvani);
            if (onDocumentLoaded) {
                onDocumentLoaded(data);
            }
        } catch (error) {
            toast.error(t('Fiyat listesi belgesi yüklenirken hata oluştu.'));
        }
    };

    useEffect(() => {
        if (location.state?.currentFormData && onDocumentLoaded) {
            onDocumentLoaded(location.state.currentFormData);
        }
    }, [location.state?.currentFormData, onDocumentLoaded]);

    useEffect(() => {
        if (isEditMode) {
            if (!location.state?.currentFormData) {
                fetchFiyatListesi();
            }
        } else {
            checkBelgeAyari();
            setFormData((prev: any) => {
                if (!prev.kalemler || prev.kalemler.length === 0) {
                    return {
                        ...prev,
                        kalemler: [{ id: Date.now(), urunVeHizmetKartiId: null, tedarikciUrunKodu: '', fiyat: 0, valorTarihi: '' }]
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
                    
                    const codeToSearch = (kalem.tedarikciUrunKodu || kalem.aramaMetni || '').trim().toLowerCase();
                    if (!codeToSearch) return kalem;

                    const matchKod = newUrun.kod && newUrun.kod.toLowerCase() === codeToSearch;
                    const matchUretici = newUrun.ureticiKodu && newUrun.ureticiKodu.toLowerCase() === codeToSearch;
                    const matchBarkod = newUrun.barkod && newUrun.barkod.toLowerCase() === codeToSearch;
                    const matchBarkodlar = newUrun.barkodlar && newUrun.barkodlar.some((b: string) => b.toLowerCase() === codeToSearch);

                    if (matchKod || matchUretici || matchBarkod || matchBarkodlar) {
                        isUpdated = true;
                        return {
                            ...kalem,
                            urunVeHizmetKartiId: newUrun.id,
                            urunVeHizmetAdi: newUrun.ad,
                            aramaMetni: newUrun.ad
                        };
                    }
                    return kalem;
                });

                if (isUpdated) {
                    toast.success(t('Yeni oluşturulan ürün satırla otomatik eşleştirildi.'));
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
        } catch(e) {
            console.error("BroadcastChannel error:", e);
        }

        return () => {
            window.removeEventListener('urun-created', handleUrunCreatedEvent);
            if (bc) bc.close();
        };
    }, [t]);

    const validateGridBeforeAdd = useCallback((dataRows?: any[]) => {
        const rows = dataRows || formData.kalemler || [];
        const result = validateKalemlerBeforeAdd(rows);
        if (!result.canAdd) {
            setErrors(prev => ({
                ...prev,
                kalemler: result.errorMessage || t('auto_en_az_bir_satir_girilmeli', 'En az bir satır bilgi girilmelidir.')
            }));
            const hasAnyActive = rows.some((k: any) => isKalemActive(k));
            if (!hasAnyActive) {
                toast.error(t('auto_en_az_bir_satir_girilmeli', 'En az bir satır bilgi girilmelidir.'));
            } else {
                toast.error(t('auto_onceki_satiri_tamamlayiniz', 'Yeni satır eklemeden önce lütfen mevcut satırdaki tüm zorunlu alanları doldurun.'));
            }
        }
        return result;
    }, [formData.kalemler, t]);

    const addKalem = () => {
        const validation = validateGridBeforeAdd(formData.kalemler);
        if (!validation.canAdd) {
            return;
        }
        setFormData(prev => ({
            ...prev,
            kalemler: [
                ...(prev.kalemler || []),
                { id: Date.now(), urunVeHizmetKartiId: null, tedarikciUrunKodu: '', fiyat: 0, valorTarihi: '' }
            ]
        }));
    };

    const removeKalem = (rowId: any) => {
        setFormData(prev => ({
            ...prev,
            kalemler: prev.kalemler.filter((k: any) => k.id !== rowId)
        }));
    };

    const isEmptyRow = (row: any) => !isKalemActive(row);

    const handleSelectSearchedRow = useCallback((row: any, index: number) => {
        setSelectedRowIndex(index);
        setActiveRowId(row?.id || null);

        // Satırı DOM'da bul, görünür alana kaydır, odaklan ve parlatma efekti ver
        setTimeout(() => {
            const rowEl = document.querySelector(`[data-row-index="${index}"]`) as HTMLElement;
            if (rowEl) {
                rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                rowEl.classList.remove('search-target-highlight');
                void rowEl.offsetWidth; // reflow tetikle
                rowEl.classList.add('search-target-highlight');

                const firstInput = rowEl.querySelector('input:not([disabled]), select:not([disabled])') as HTMLElement;
                if (firstInput) {
                    firstInput.focus();
                }
            }
        }, 60);
    }, []);

    useDocumentRowSearch({
        rows: formData.kalemler || [],
        searchCriteria: [
            { id: 'Tumu', label: t('Genel', 'Genel'), iconName: 'Search', type: 'text', placeholder: t('auto_fiyat_listesi_ara', 'Fiyat listesi satırlarında ara...') },
            { id: 'tedarikciUrunKodu', label: t('auto_tedarikci_urun_kodu', 'Ürün Kodu'), iconName: 'Tag', type: 'text', placeholder: t('auto_urun_kodu_ara', 'Ürün kodu ile ara...') },
            { id: 'urunVeHizmetAdi', label: t('auto_urun_hizmet', 'Ürün / Hizmet'), iconName: 'FileText', type: 'text', placeholder: t('auto_urun_adi_ara', 'Ürün adı ile ara...') },
            { id: 'fiyat', label: t('Fiyat', 'Fiyat'), iconName: 'CreditCard', type: 'text', placeholder: t('auto_fiyat_ara', 'Fiyata göre ara...') }
        ],
        searchFields: ['tedarikciUrunKodu', 'urunVeHizmetAdi', 'aramaMetni', 'fiyat', 'valorTarihi'],
        isEmptyRow: isEmptyRow,
        getRowBadge: (_row, index) => t('search_row_number', 'Satır {{num}}', { num: index + 1 }),
        getRowTitle: (row) => {
            const kod = row.tedarikciUrunKodu ? `[${row.tedarikciUrunKodu}] ` : '';
            const ad = row.urunVeHizmetAdi || row.aramaMetni || t('auto_isimsiz_urun', 'İsimsiz Ürün');
            return `${kod}${ad}`;
        },
        getRowSubtitle: (row) => {
            const parts: string[] = [];
            if (row.fiyat !== undefined && row.fiyat !== null && row.fiyat !== '') {
                parts.push(`${t('Fiyat', 'Fiyat')}: ${formatCurrency(row.fiyat)} ₺`);
            }
            if (row.valorTarihi) {
                parts.push(`${t('auto_valor_tarihi', 'Valör')}: ${row.valorTarihi.substring(0, 10)}`);
            }
            return parts.length > 0 ? parts.join(' | ') : undefined;
        },
        onSelectRow: handleSelectSearchedRow
    });

    const checkBelgeAyari = async () => {
        try {
            const res = await axios.get(`/api/BelgeAyarlari/FiyatListesi`);
            if (res.data?.otomatikNumaraVerilsinMi) {
                setFormData(prev => ({ ...prev, belgeNo: '[OTOMATİK]' }));
            }
        } catch (e) {
            console.log("Belge ayarı okunamadı", e);
        }
    };


    const { handleImport } = useExcelProductImport();

    const handleExcelImport = async (rawImportedData: any[]) => {
        await handleImport(rawImportedData, {
            currentRows: formData.kalemler,
            onUpdateRows: (newRows) => setFormData(prev => ({ ...prev, kalemler: newRows })),
            rowMapper: (importedRow, matchedProduct) => {
                const valorTarihi = importedRow.valorTarihiTuru === 'manuel' ? importedRow.valorTarihiManuel : importedRow.valorTarihiSutun;
                
                return {
                    tedarikciUrunKodu: importedRow.tedarikciUrunKodu,
                    fiyat: importedRow.fiyat,
                    valorTarihi: valorTarihi || '',
                    ...(matchedProduct ? {
                        urunVeHizmetKartiId: matchedProduct.Id,
                        urunVeHizmetAdi: matchedProduct.ad || matchedProduct.Ad,
                        aramaMetni: matchedProduct.ad || matchedProduct.Ad
                    } : {})
                };
            }
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const { isValid, errors: newErrors } = validateFiyatListesiForm(formData);
        
        if (!isValid) {
            setErrors(newErrors || {});
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                cariId: formData.cariId ? Number(formData.cariId) : null,
                baslangicTarihi: formData.baslangicTarihi || null,
                bitisTarihi: formData.bitisTarihi || null,
                belgeNo: formData.belgeNo === '[OTOMATİK]' ? '' : formData.belgeNo,
                kalemler: formData.kalemler
                    .filter((k: any) => isKalemActive(k))
                    .map((k: any) => ({
                        ...k,
                        id: (typeof k.id === 'number' && k.id > 2000000000) ? 0 : k.id,
                        fiyat: k.fiyat ?? 0,
                        iskontoOrani: k.iskontoOrani ?? 0,
                        minMiktar: k.minMiktar ?? 0
                    }))
            };

            if (isEditMode) {
                await axios.put(`/api/FiyatListeleri/${id}`, payload);
                if (formData.belgeGuid) {
                    await axios.post('/api/Storage/Dosyalar/BelgeIliskilendir', {
                        belgeGuid: formData.belgeGuid,
                        belgeTuru: 'FiyatListesi',
                        belgeId: parseInt(id!),
                        belgeNo: payload.belgeNo
                    }).catch(() => {});
                }
                DocumentDraftManager.clearDocumentDraft('/fiyat-listeleri', 'FiyatListesi');
                if (setIsDocumentDirty) setIsDocumentDirty(false);
                toast.success(t('Fiyat listesi güncellendi.'));
            } else {
                const res = await axios.post('/api/FiyatListeleri', payload);
                const createdId = res.data?.id || res.data?.Id;
                const createdNo = res.data?.belgeNo || res.data?.BelgeNo || payload.belgeNo;
                if (formData.belgeGuid && createdId) {
                    await axios.post('/api/Storage/Dosyalar/BelgeIliskilendir', {
                        belgeGuid: formData.belgeGuid,
                        belgeTuru: 'FiyatListesi',
                        belgeId: createdId,
                        belgeNo: createdNo
                    }).catch(() => {});
                }
                DocumentDraftManager.clearDocumentDraft('/fiyat-listeleri', 'FiyatListesi');
                if (setIsDocumentDirty) setIsDocumentDirty(false);
                navigate('/fiyat-listeleri');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('Kayıt işlemi başarısız oldu.'));
        } finally {
            setLoading(false);
        }
    };

    const headerContent = (
        <>
            {activeTab === 1 && (
                <DocumentHeaderPanel columns={2}>
                    <DocumentHeaderField name="baslangicTarihi" label={t('TarihAraligi_label') || 'Tarih Aralığı'} required>
                        <DateRangeInput
                            baslangicTarihi={formData.baslangicTarihi}
                            bitisTarihi={formData.bitisTarihi}
                            onChange={(baslangic, bitis) => {
                                setFormData((prev: any) => ({ ...prev, baslangicTarihi: baslangic, bitisTarihi: bitis }));
                                setErrors((prev: any) => {
                                    if (!prev.baslangicTarihi && !prev.bitisTarihi) return prev;
                                    const next = { ...prev };
                                    if (baslangic) delete next.baslangicTarihi;
                                    if (bitis) delete next.bitisTarihi;
                                    return next;
                                });
                            }}
                        />
                    </DocumentHeaderField>

                    <DocumentHeaderField name="belgeNo" label={t('Belge No')} required>
                        <BasitInput
                            id="belgeNoInput"
                            value={formData.belgeNo}
                            disabled={formData.belgeNo === '[OTOMATİK]'}
                            onChange={e => {
                                const val = e.target.value;
                                setFormData((prev: any) => ({ ...prev, belgeNo: val }));
                                if (val) {
                                    setErrors((prev: any) => {
                                        if (!prev.belgeNo) return prev;
                                        const next = { ...prev };
                                        delete next.belgeNo;
                                        return next;
                                    });
                                }
                            }}
                        />
                    </DocumentHeaderField>

                    <DocumentHeaderField name="cariId" label={t('Cari Seçimi')} required>
                        <CariSeciciInput
                            id="cariId"
                            value={formData.cariUnvani || ''}
                            onChange={(e: any, rawVal?: any, selectedCari?: any) => {
                                if (selectedCari) return;
                                const val = typeof rawVal === 'string' 
                                    ? rawVal 
                                    : (typeof e === 'string' ? e : (e?.target?.value ?? ''));
                                setFormData((prev: any) => ({ 
                                    ...prev, 
                                    cariUnvani: val,
                                    cariId: null 
                                }));
                                setCariAramaMetni(val);
                            }}
                            hasSelection={Boolean(formData.cariId)}
                            error={Boolean(errors.cariId)}
                            onClear={() => {
                                setFormData((prev: any) => ({ ...prev, cariId: null, cariUnvani: '' }));
                                setCariAramaMetni('');
                            }}
                            onSelect={(cari: any) => {
                                const cariId = cari.id ?? cari.Id;
                                const cariUnvan = cari.tipi === 1 
                                    ? (cari.unvan || cari.kod || '')
                                    : (cari.unvan || `${cari.ad || ''} ${cari.soyad || ''}`.trim() || cari.kod || '');

                                setFormData((prev: any) => ({ 
                                    ...prev, 
                                    cariId: cariId, 
                                    cariUnvani: cariUnvan 
                                }));
                                setCariAramaMetni(cariUnvan);
                                setErrors((prev: any) => {
                                    if (!prev.cariId) return prev;
                                    const next = { ...prev };
                                    delete next.cariId;
                                    return next;
                                });
                            }}
                            detailsUrl={formData.cariId ? `/cariler?id=${formData.cariId}` : null}
                            placeholder={t('auto_cari_seciniz', 'Cari Seçiniz...')}
                        />
                    </DocumentHeaderField>

                    <DocumentHeaderField name="fiyatListesiTanimiId" label={t('Fiyat Tanımı')} required>
                        <FiyatTanimSecici
                            value={formData.fiyatListesiTanimiId}
                            onChange={(val) => {
                                setFormData({ ...formData, fiyatListesiTanimiId: val });
                                if (errors.fiyatListesiTanimiId) {
                                    setErrors(prev => {
                                        const next = { ...prev };
                                        delete next.fiyatListesiTanimiId;
                                        return next;
                                    });
                                }
                            }}
                            error={!!errors.fiyatListesiTanimiId}
                        />
                    </DocumentHeaderField>
                </DocumentHeaderPanel>
            )}

            {activeTab === 2 && (
                <DocumentHeaderPanel columns={1}>
                    <DocumentHeaderField name="aciklama" label={t('Açıklama')}>
                        <NotInput
                            rows={3}
                            value={formData.aciklama || ''}
                            onChange={e => setFormData({ ...formData, aciklama: e.target.value })}
                        />
                    </DocumentHeaderField>
                </DocumentHeaderPanel>
            )}
        </>
    );

    const validRows = formData.kalemler?.filter((k: any) => k.urunVeHizmetKartiId || k.tedarikciUrunKodu) || [];
    const linkedRowsCount = validRows.filter((k: any) => k.urunVeHizmetKartiId).length;

    const footerContent = (
        <div className="w-full h-full flex justify-end items-start">
            <div className="w-full h-full max-w-300">
                <DocumentResultPanel
                    title={t('Özet')}
                    readOnly={true}
                    hideAddButton={true}
                    onSave={() => {}}
                    items={[
                        {
                            id: 'satirSayisi',
                            label: t('Satır Sayısı'),
                            value: validRows.length.toString(),
                            visibilityRule: 'p4',
                            isEditable: false
                        },
                        {
                            id: 'iliskilendirilmis',
                            label: t('İlişkilendirilmiş Satır Sayısı'),
                            value: linkedRowsCount.toString(),
                            visibilityRule: 'p4',
                            isPrimary: true,
                            isAccent: true,
                            isEditable: false
                        }
                    ]}
                />
            </div>
        </div>
    );

    const documentNo = formData.belgeNo && formData.belgeNo !== '[OTOMATİK]' ? formData.belgeNo : undefined;
    const pageTitle = !isEditMode
        ? (t('FiyatListesi_yeniTitle') || t('auto_yeni_fiyat_listesi', 'Yeni Fiyat Listesi'))
        : (documentNo || t('FiyatListesi_duzenleTitle') || t('auto_fiyat_listesi_duzenle', 'Fiyat Listesi Düzenle'));

    return (
        <>
            <BaseDocumentPage
                onSubmit={handleSave as any}
                isSaving={loading}
                onValidate={() => validateFiyatListesiForm(formData)}
                errors={errors}
                documentId={id ? parseInt(id) : undefined}
                documentGuid={formData.belgeGuid}
                documentType="FiyatListesi"
                documentNo={documentNo}
                pageTitle={pageTitle}
                formData={formData}
                tabs={tabs}
                activeTabId={activeTab}
                onTabChange={setActiveTab}
                onAiApply={(aiData) => {
                    if (aiData?.header) {
                        setFormData((prev: any) => ({
                            ...prev,
                            ...aiData.header,
                            kalemler: aiData.kalemler && aiData.kalemler.length > 0 ? aiData.kalemler : prev.kalemler
                        }));
                    } else if (Array.isArray(aiData?.kalemler)) {
                        setFormData((prev: any) => ({
                            ...prev,
                            kalemler: aiData.kalemler
                        }));
                    }
                }}
                actionMenuTrigger={fiyatListesiActionMenu.actionMenuTrigger as any}
                onActionMenuTriggerClick={fiyatListesiActionMenu.onActionMenuTriggerClick}
                extraDropdownActions={fiyatListesiActionMenu.extraDropdownActions}
                headerContent={headerContent}
                footerContent={footerContent}
                gridProps={{
                    columns: columns,
                    data: formData.kalemler,
                    selectedRowIndex: selectedRowIndex !== null ? selectedRowIndex : undefined,
                    onRowClick: (_row: any, index: number) => setSelectedRowIndex(index),
                    onChange: (newData) => setFormData({ ...formData, kalemler: newData }),
                    onAddRow: addKalem,
                    onRemoveRow: (index) => removeKalem(formData.kalemler[index]?.id),
                    isEmptyRow: isEmptyRow,
                    validateBeforeAdd: validateGridBeforeAdd,
                    maxOneEmptyRow: true,
                    minRows: 10,
                    isInvalid: Boolean(errors.kalemler)
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
                        newKalemler[idx] = {
                            ...newKalemler[idx],
                            urunVeHizmetKartiId: urun.id,
                            urunVeHizmetAdi: urun.ad,
                            aramaMetni: urun.ad,
                            tedarikciUrunKodu: urun.kod || ''
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
                documentGuid={formData.belgeGuid}
                documentType="FiyatListesi"
                columns={excelColumns}
            />
        </>
    );
};

export default FiyatListesiForm;
