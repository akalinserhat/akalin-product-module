/**
 * Webakus ERP - BSH Fiyat Farkı Belgesi Formu (BshFiyatFarkiForm)
 * BSH fiyat farkı listelerinin oluşturulması, düzenlenmesi ve Excel'den aktarım işlemlerini yönetir.
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
    CurrencyInput, 
    UrunSeciciModal, 
    NotInput, 
    BasitInput,
    DateRangeInput,
    UrunSeciciInput
} from '@akalin/ui';
import ExcelImportPage, { type ExcelColumnDef } from './ExcelImportPage';
import { FileText, AlignLeft } from 'lucide-react';
import { useExcelProductImport } from '../hooks/useExcelProductImport';
import { useBshFiyatFarkiActionMenu } from '../hooks/useBshFiyatFarkiActionMenu';
import { validateBshFiyatFarkiForm, validateBshFiyatFarkiField } from '../validators/bshFiyatFarkiValidation';

const BshFiyatFarkiForm: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);

    const [urunModalOpen, setUrunModalOpen] = useState(false);
    const [urunAramaMetni, setUrunAramaMetni] = useState('');
    const [activeRowId, setActiveRowId] = useState<any>(null);
    
    const [formData, setFormData] = useState<any>({
        belgeNo: '[OTOMATİK]',
        baslangicTarihi: new Date().toISOString().substring(0, 10),
        bitisTarihi: '',
        aciklama: '',
        kalemler: []
    });

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

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<string | number>(1);
    
    const tabs = [
        { id: 1, title: t('Genel', 'Genel'), icon: <FileText size={16} /> },
        { id: 2, title: t('Açıklama', 'Açıklama'), icon: <AlignLeft size={16} /> }
    ];

    const excelColumns: ExcelColumnDef[] = [
        { key: 'tedarikciUrunKodu', label: t('auto_tedarikci_urun_kodu_sutunu', 'Tedarikçi Ürün Kodu Sütunu'), type: 'column', expectedType: 'string', required: true },
        { key: 'fiyat', label: t('auto_fiyat_sutunu', 'Fiyat Sütunu'), type: 'column', expectedType: 'number', required: true },
        { key: 'kdvDurumu', label: t('auto_kdv_durumu', 'KDV Durumu'), type: 'select', options: [{value: 'dahil', label: t('auto_fiyatlar_kdv_dahildir', 'Fiyatlar KDV Dahildir')}, {value: 'haric', label: t('auto_fiyatlar_kdv_harictir', 'Fiyatlar KDV Hariçtir (KDV Eklenecek)')}], defaultValue: 'dahil' }
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

    const columns: any[] = [
        {
            id: 'tedarikciUrunKodu',
            header: t('auto_tedarikci_urun_kodu', 'Tedarikçi Ürün Kodu'),
            width: 200,
            type: 'text',
            render: (kalem: any) => (
                <input
                    type="text"
                    className="form-input spreadsheet-cell-input"
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
            )
        },
        {
            id: 'urunVeHizmetKartiId',
            header: t('auto_urun_hizmet', 'Ürün / Hizmet'),
            width: 300,
            type: 'custom',
            render: (row: any) => (
                <UrunSeciciInput
                    inputClassName="form-input spreadsheet-cell-input"
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
            )
        },
        {
            id: 'fiyat',
            header: t('auto_fiyat', 'Fiyat'),
            width: 150,
            type: 'number',
            align: 'right',
            render: (kalem: any) => (
                <CurrencyInput
                    className="form-input text-right spreadsheet-cell-input"
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
            )
        }
    ];

    const fetchBelge = async () => {
        try {
            const res = await axios.get(`/api/BshFiyatFarki/${id}`);
            const data = res.data;
            setFormData({
                ...data,
                baslangicTarihi: data.baslangicTarihi ? data.baslangicTarihi.substring(0, 10) : '',
                bitisTarihi: data.bitisTarihi ? data.bitisTarihi.substring(0, 10) : '',
                kalemler: data.kalemler?.map((k: any) => ({ ...k, _gridId: Math.random().toString() })) || []
            });
        } catch (error) {
            toast.error(t('auto_belge_yuklenirken_hata', 'Belge yüklenirken hata oluştu.'));
        }
    };

    useEffect(() => {
        if (isEditMode) {
            fetchBelge();
        } else {
            checkBelgeAyari();
            setFormData(prev => {
                if (!prev.kalemler || prev.kalemler.length === 0) {
                    return {
                        ...prev,
                        kalemler: [{ id: Date.now(), urunVeHizmetKartiId: null, tedarikciUrunKodu: '', fiyat: 0 }]
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
                    toast.success(t('auto_yeni_olusturulan_urun_eslestirildi', 'Yeni oluşturulan ürün satırla otomatik eşleştirildi.'));
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

    const addKalem = () => {
        setFormData(prev => ({
            ...prev,
            kalemler: [
                ...(prev.kalemler || []),
                { id: Date.now(), urunVeHizmetKartiId: null, tedarikciUrunKodu: '', fiyat: 0 }
            ]
        }));
    };

    const removeKalem = (rowId: any) => {
        setFormData(prev => ({
            ...prev,
            kalemler: prev.kalemler.filter((k: any) => k.id !== rowId)
        }));
    };

    const isEmptyRow = (row: any) => !row.urunVeHizmetKartiId && !row.tedarikciUrunKodu;

    const { handleImport } = useExcelProductImport();

    const handleExcelImport = async (rawImportedData: any[]) => {
        await handleImport(rawImportedData, {
            currentRows: formData.kalemler,
            onUpdateRows: (newRows) => setFormData(prev => ({ ...prev, kalemler: newRows })),
            rowMapper: (importedRow, matchedProduct) => {
                const kdvOrani = matchedProduct?.KdvOrani || 0;
                let finalFiyat = importedRow.fiyat || 0;
                
                // Eğer Excel'den KDV Hariç geldiyse ürünün KDV'sini fiyata ekle
                if (importedRow.kdvDurumu === 'haric' && kdvOrani > 0) {
                    finalFiyat = finalFiyat * (1 + (kdvOrani / 100));
                }

                return {
                    tedarikciUrunKodu: importedRow.tedarikciUrunKodu,
                    fiyat: finalFiyat,
                    ...(matchedProduct ? {
                        urunVeHizmetKartiId: matchedProduct.Id,
                        urunVeHizmetAdi: matchedProduct.ad || matchedProduct.Ad,
                        aramaMetni: matchedProduct.ad || matchedProduct.Ad
                    } : {})
                };
            }
        });
    };

    const checkBelgeAyari = async () => {
        try {
            const res = await axios.get(`/api/BelgeAyarlari/BshFiyatFarki`);
            if (res.data?.otomatikNumaraVerilsinMi) {
                setFormData(prev => ({ ...prev, belgeNo: '[OTOMATİK]' }));
            }
        } catch (e) {
            console.log("Belge ayarı okunamadı", e);
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
            const payload = {
                ...formData,
                baslangicTarihi: formData.baslangicTarihi || null,
                bitisTarihi: formData.bitisTarihi || null,
                belgeNo: formData.belgeNo === '[OTOMATİK]' ? '' : formData.belgeNo,
                kalemler: formData.kalemler
                    .filter((k: any) => k.urunVeHizmetKartiId || k.tedarikciUrunKodu)
                    .map((k: any) => ({
                        ...k,
                        id: (typeof k.id === 'number' && k.id > 2000000000) ? 0 : k.id,
                        fiyat: k.fiyat ?? 0
                    }))
            };

            if (isEditMode) {
                await axios.put(`/api/BshFiyatFarki/${id}`, payload);
                toast.success(t('auto_kayit_guncellendi', 'Kayıt güncellendi.'));
            } else {
                await axios.post('/api/BshFiyatFarki', payload);
                toast.success(t('auto_kayit_basariyla_olusturuldu', 'Kayıt başarıyla oluşturuldu.'));
                navigate('/bsh-fiyat-farki');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('auto_kayit_basarisiz', 'Kayıt işlemi başarısız oldu.'));
        } finally {
            setLoading(false);
        }
    };

    const bshActionMenu = useBshFiyatFarkiActionMenu({
        onExcelImportClick: handleOpenExcelImport
    });

    const headerContent = (
        <>
            {activeTab === 1 && (
                <DocumentHeaderPanel columns={2}>
                    <DocumentHeaderField name="baslangicTarihi" label={t('TarihAraligi_label', 'Tarih Aralığı')} required>
                        <DateRangeInput
                            baslangicTarihi={formData.baslangicTarihi}
                            bitisTarihi={formData.bitisTarihi}
                            onChange={(baslangic, bitis) => {
                                setFormData({ ...formData, baslangicTarihi: baslangic, bitisTarihi: bitis });
                                if (errors.baslangicTarihi) {
                                    setErrors(prev => {
                                        const next = { ...prev };
                                        delete next.baslangicTarihi;
                                        return next;
                                    });
                                }
                                if (errors.bitisTarihi) {
                                    setErrors(prev => {
                                        const next = { ...prev };
                                        delete next.bitisTarihi;
                                        return next;
                                    });
                                }
                            }}
                        />
                    </DocumentHeaderField>

                    <DocumentHeaderField name="belgeNo" label={t('auto_belge_no', 'Belge No')} required>
                        <BasitInput
                            id="belgeNoInput"
                            value={formData.belgeNo}
                            disabled={formData.belgeNo === '[OTOMATİK]'}
                            onChange={e => {
                                setFormData({ ...formData, belgeNo: e.target.value });
                                if (errors.belgeNo) {
                                    setErrors(prev => {
                                        const next = { ...prev };
                                        delete next.belgeNo;
                                        return next;
                                    });
                                }
                            }}
                            onBlur={e => {
                                const err = validateBshFiyatFarkiField('belgeNo', e.target.value);
                                if (err) {
                                    setErrors(prev => ({ ...prev, belgeNo: err }));
                                }
                            }}
                        />
                    </DocumentHeaderField>
                </DocumentHeaderPanel>
            )}

            {activeTab === 2 && (
                <DocumentHeaderPanel columns={1}>
                    <DocumentHeaderField name="aciklama" label={t('auto_aciklama', 'Açıklama')}>
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
                    title={t('auto_ozet', 'Özet')}
                    readOnly={true}
                    hideAddButton={true}
                    onSave={() => {}}
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
            </div>
        </div>
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
                pageTitle={isEditMode ? (t('BshFiyatFarki_duzenleTitle', 'BSH Fiyat Farkı Düzenle')) : (t('BshFiyatFarki_yeniTitle', 'Yeni BSH Fiyat Farkı'))}
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
                documentType="BshFiyatFarki"
                columns={excelColumns}
            />
        </>
    );
};

export default BshFiyatFarkiForm;
