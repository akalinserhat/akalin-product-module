import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
    BaseDocumentPage,
    DocumentHeaderPanel,
    DocumentHeaderField,
    DocumentResultPanel,
    AlertDialog,
    BasitInput,
    BaseDropdownSecici,
    UrunSeciciInput,
    UrunSeciciModal,
    UrunGrupSeciciModal,
    BirimSecici,
    FieldError
} from '@akalin/ui';
import { Box, FileText, Barcode, Layers, ShieldCheck, X } from 'lucide-react';
import { useMetadata } from '../context/MetadataContext';
import { IPaketVeSet, IPaketVeSetKalemi, PaketStokDusumYontemi, PaketKalemTuru } from '../dtos/PaketVeSetDto';
import { paketVeSetService } from '../services/PaketVeSetService';
import { getPaketVeSetDefaultValues, createEmptyKalem } from '../defaults/paketVeSetDefaultValue';
import { validatePaketVeSetField, validatePaketVeSetForm, isKalemFilled } from '../validators/paketVeSetValidation';
import { usePaketVeSetActionMenu } from '../hooks/usePaketVeSetActionMenu';

export const PaketVeSetFormPage: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const returnTo = location.state?.returnTo || '/paket-ve-setler';
    const isNumericId = id && id !== 'yeni' && !isNaN(Number(id));
    const isEdit = !!isNumericId;

    const [loading, setLoading] = useState(!!isNumericId);
    const [saving, setSaving] = useState(false);
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [activeTab, setActiveTab] = useState<number>(1);
    const [formData, setFormData] = useState<IPaketVeSet>(getPaketVeSetDefaultValues());
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Ürün & Ürün Grubu Seçici Modal State
    const [urunModalOpen, setUrunModalOpen] = useState(false);
    const [urunGrupModalOpen, setUrunGrupModalOpen] = useState(false);
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
    const [urunAramaMetni, setUrunAramaMetni] = useState('');

    // Sistem Ölçü Birimleri Listesi ve Eşleme Haritası
    const [birimler, setBirimler] = useState<any[]>([]);

    useEffect(() => {
        let isMounted = true;
        axios.get('/api/Birimler')
            .then(res => {
                if (!isMounted) return;
                const list = Array.isArray(res.data) ? res.data : (res.data?.veriler || []);
                setBirimler(list.filter((b: any) => b.durum !== false && b.durum !== 0));
            })
            .catch((err) => {
                console.error('Birimler yüklenemedi:', err);
            });
        return () => { isMounted = false; };
    }, []);

    const birimlerMap = useMemo(() => {
        const map = new Map<number, any>();
        birimler.forEach(b => {
            if (b.id) map.set(Number(b.id), b);
        });
        return map;
    }, [birimler]);

    const { enums } = useMetadata();
    const kalemTuruOptions = useMemo(() => {
        if (enums?.PaketKalemTuru && enums.PaketKalemTuru.length > 0) {
            return enums.PaketKalemTuru.map((e: any) => ({
                id: e.value,
                label: e.label || (e.value === PaketKalemTuru.UrunGrubu ? t('auto_urun_grubu_kategori', 'Ürün Grubu (Kategori)') : t('auto_tekil_urun', 'Tekil Ürün'))
            }));
        }
        return [
            { id: PaketKalemTuru.TekilUrun, label: t('auto_tekil_urun', 'Tekil Ürün') },
            { id: PaketKalemTuru.UrunGrubu, label: t('auto_urun_grubu_kategori', 'Ürün Grubu (Kategori)') }
        ];
    }, [enums?.PaketKalemTuru, t]);

    // Çıkış / Hata Uyarı Modalı
    const [alertDialog, setAlertDialog] = useState({
        isOpen: false,
        type: 'info' as 'info' | 'error' | 'warning' | 'confirm' | 'success',
        title: '',
        message: '',
        onConfirm: null as any,
        confirmText: t('Tamam')
    });

    // Sayfadan ayrılma koruması
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isFormDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isFormDirty]);

    // Veri Yükleme
    useEffect(() => {
        if (isNumericId) {
            setLoading(true);
            paketVeSetService.getById(Number(id))
                .then((data) => {
                    const loadedData = data as unknown as IPaketVeSet;
                    setFormData({
                        ...getPaketVeSetDefaultValues(),
                        ...loadedData,
                        kalemler: loadedData.kalemler && loadedData.kalemler.length > 0
                            ? loadedData.kalemler.map((k, idx) => {
                                const foundBirim = k.birimId ? birimlerMap.get(Number(k.birimId)) : null;
                                return {
                                    ...k,
                                    kalemTuru: k.kalemTuru || (k.urunVeHizmetGrubuId ? PaketKalemTuru.UrunGrubu : PaketKalemTuru.TekilUrun),
                                    siraNo: k.siraNo || idx + 1,
                                    birimTipiId: k.birimTipiId ?? foundBirim?.tip ?? null
                                };
                            })
                            : [createEmptyKalem(1)]
                    });
                    setLoading(false);
                })
                .catch(() => {
                    setAlertDialog({
                        isOpen: true,
                        type: 'error',
                        title: t('Hata'),
                        message: t('Paket/Set detayları yüklenemedi.'),
                        onConfirm: () => navigate('/paket-ve-setler'),
                        confirmText: t('Tamam')
                    });
                    setLoading(false);
                });
        } else {
            setFormData(getPaketVeSetDefaultValues());
            setLoading(false);
        }
    }, [id, isNumericId, navigate, t, birimlerMap]);

    // Birimler yüklendiğinde birimTipiId eksik olan kalemleri tamamla
    useEffect(() => {
        if (birimlerMap.size === 0) return;
        setFormData(prev => {
            let changed = false;
            const nextKalemler = prev.kalemler.map(k => {
                if (k.birimId && (k.birimTipiId === null || k.birimTipiId === undefined)) {
                    const b = birimlerMap.get(Number(k.birimId));
                    if (b && b.tip !== undefined && b.tip !== null) {
                        changed = true;
                        return { ...k, birimTipiId: b.tip };
                    }
                }
                return k;
            });
            return changed ? { ...prev, kalemler: nextKalemler } : prev;
        });
    }, [birimlerMap]);

    const handleFieldChange = (field: keyof IPaketVeSet, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsFormDirty(true);
        if (errors[field]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };
    
    // ActionMenu Yönetimi
    const paketVeSetActionMenu = usePaketVeSetActionMenu({
        aktifMi: formData.aktifMi,
        onAktifMiChange: (checked) => handleFieldChange('aktifMi', checked)
    });

    const handleFieldBlur = (field: string, value: any) => {
        const error = validatePaketVeSetField(field, value, t);
        if (error) {
            setErrors(prev => ({ ...prev, [field]: error }));
        } else if (errors[field]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    // Kalem İşlemleri
    const handleAddKalem = () => {
        setFormData(prev => ({
            ...prev,
            kalemler: [
                ...prev.kalemler,
                createEmptyKalem(prev.kalemler.length + 1)
            ]
        }));
        setIsFormDirty(true);
        if (errors.kalemler) {
            setErrors(prev => {
                const next = { ...prev };
                delete next.kalemler;
                return next;
            });
        }
    };

    const handleRemoveKalem = (index: number) => {
        setFormData(prev => {
            const filtered = prev.kalemler.filter((_, idx) => idx !== index);
            const nextKalemler = filtered.length > 0
                ? filtered.map((k, idx) => ({ ...k, siraNo: idx + 1 }))
                : [createEmptyKalem(1)];
            return { ...prev, kalemler: nextKalemler };
        });
        setIsFormDirty(true);
    };

    const handleKalemChange = (index: number, field: keyof IPaketVeSetKalemi, value: any) => {
        setFormData(prev => {
            const newKalemler = [...prev.kalemler];
            newKalemler[index] = {
                ...newKalemler[index],
                [field]: value
            };
            return { ...prev, kalemler: newKalemler };
        });
        setIsFormDirty(true);
        if (errors.kalemler) {
            setErrors(prev => {
                const next = { ...prev };
                delete next.kalemler;
                return next;
            });
        }
    };

    const handleOpenUrunModal = (index: number, aramaMetni: string = '') => {
        setActiveRowIndex(index);
        setUrunAramaMetni(aramaMetni);
        setUrunModalOpen(true);
    };

    const handleSelectUrun = (urun: any) => {
        if (activeRowIndex === null) return;

        setFormData(prev => {
            const newKalemler = [...prev.kalemler];
            const secilenBirimId = urun.birimId || urun.varsayilanBirimId || null;
            const b = secilenBirimId ? birimlerMap.get(Number(secilenBirimId)) : null;
            const secilenBirimAdi = urun.birimAdi || urun.varsayilanBirimAdi || b?.ad || '';
            const secilenBirimTipiId = urun.birimTipiId ?? urun.varsayilanBirimTipiId ?? b?.tip ?? null;

            newKalemler[activeRowIndex] = {
                ...newKalemler[activeRowIndex],
                kalemTuru: PaketKalemTuru.TekilUrun,
                urunVeHizmetKartiId: urun.id,
                urunKodu: urun.kod || '',
                urunAdi: urun.ad || '',
                urunBarkod: urun.barkod || '',
                birimId: secilenBirimId ? Number(secilenBirimId) : null,
                birimAdi: secilenBirimAdi,
                birimTipiId: secilenBirimTipiId !== null && secilenBirimTipiId !== undefined ? Number(secilenBirimTipiId) : null,
                urunVeHizmetGrubuId: null,
                urunGrubuKodu: '',
                urunGrubuAdi: ''
            };
            return { ...prev, kalemler: newKalemler };
        });

        setIsFormDirty(true);
        setUrunModalOpen(false);
        setActiveRowIndex(null);
    };

    const handleOpenUrunGrupModal = (index: number) => {
        setActiveRowIndex(index);
        setUrunGrupModalOpen(true);
    };

    const handleSelectUrunGrup = (grupId: any, grupItem: any) => {
        if (activeRowIndex === null) return;

        const numGrupId = Number(grupId) || (grupItem?.id ? Number(grupItem.id) : null);
        const grupBirimId = grupItem?.varsayilanBirimId || null;
        const b = grupBirimId ? birimlerMap.get(Number(grupBirimId)) : null;
        const grupBirimAdi = grupItem?.varsayilanBirim?.ad || grupItem?.varsayilanBirimAdi || b?.ad || '';
        const grupBirimTipiId = grupItem?.varsayilanBirim?.tip ?? grupItem?.varsayilanBirimTipiId ?? b?.tip ?? null;

        setFormData(prev => {
            const newKalemler = [...prev.kalemler];
            newKalemler[activeRowIndex] = {
                ...newKalemler[activeRowIndex],
                kalemTuru: PaketKalemTuru.UrunGrubu,
                urunVeHizmetGrubuId: numGrupId,
                urunGrubuKodu: grupItem?.kod || '',
                urunGrubuAdi: grupItem?.ad || grupItem?.tekilAd || '',
                urunVeHizmetKartiId: null,
                urunKodu: '',
                urunAdi: '',
                urunBarkod: '',
                birimId: grupBirimId ? Number(grupBirimId) : (newKalemler[activeRowIndex].birimId ? Number(newKalemler[activeRowIndex].birimId) : null),
                birimAdi: grupBirimAdi || newKalemler[activeRowIndex].birimAdi || '',
                birimTipiId: grupBirimTipiId !== null && grupBirimTipiId !== undefined ? Number(grupBirimTipiId) : (newKalemler[activeRowIndex].birimTipiId ?? null)
            };
            return { ...prev, kalemler: newKalemler };
        });

        setIsFormDirty(true);
        setUrunGrupModalOpen(false);
        setActiveRowIndex(null);
    };

    // Kaydetme İşlemi
    const handleSave = async (e?: React.FormEvent) => {
        if (e && e.preventDefault) e.preventDefault();

        const formErrors = validatePaketVeSetForm(formData, t);
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            const firstErrorKey = Object.keys(formErrors)[0];
            toast.error(formErrors[firstErrorKey]);
            return;
        }

        try {
            setSaving(true);
            const validKalemler = formData.kalemler.filter(isKalemFilled);
            const payload: any = {
                ...formData,
                kod: formData.kod.trim().toUpperCase(),
                ad: formData.ad.trim(),
                barkod: formData.barkod?.trim() || null,
                aciklama: formData.aciklama?.trim() || null,
                kalemler: validKalemler.map((k, idx) => ({
                    kalemTuru: k.kalemTuru || PaketKalemTuru.TekilUrun,
                    urunVeHizmetKartiId: k.kalemTuru === PaketKalemTuru.UrunGrubu ? null : (k.urunVeHizmetKartiId || null),
                    urunVeHizmetGrubuId: k.kalemTuru === PaketKalemTuru.UrunGrubu ? (k.urunVeHizmetGrubuId || null) : null,
                    birimId: k.birimId ? Number(k.birimId) : null,
                    miktar: Number(k.miktar) > 0 ? Number(k.miktar) : 1,
                    siraNo: idx + 1,
                    aciklama: k.aciklama?.trim() || null
                }))
            };

            let savedId = formData.id;
            if (isEdit && formData.id) {
                await paketVeSetService.update(formData.id, payload);
                toast.success(t('Paket / Set tanımı başarıyla güncellendi.'));
            } else {
                const res: any = await paketVeSetService.create(payload);
                savedId = res?.id ?? res?.Id ?? (typeof res === 'number' ? res : undefined);
                toast.success(t('Paket / Set tanımı başarıyla oluşturuldu.'));
            }

            setIsFormDirty(false);
            if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
            } else {
                navigate(returnTo, { state: { newlyAddedSetId: savedId }, replace: true });
            }
        } catch (error: any) {
            const errMsg = error?.response?.data?.mesaj || error?.message || t('Paket/Set kaydedilirken hata oluştu.');
            toast.error(errMsg);
        } finally {
            setSaving(false);
        }
    };

    const doNavigateBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate(returnTo, { replace: true });
        }
    };

    const handleBack = () => {
        if (isFormDirty) {
            setAlertDialog({
                isOpen: true,
                type: 'confirm',
                title: t('Kaydedilmemiş Değişiklikler'),
                message: t('Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinize emin misiniz?'),
                confirmText: t('Evet, Çık'),
                onConfirm: doNavigateBack
            });
        } else {
            doNavigateBack();
        }
    };

    // Özet Hesaplama
    const validKalemler = useMemo(() => {
        return (formData.kalemler || []).filter(isKalemFilled);
    }, [formData.kalemler]);

    const toplamKalemMiktari = useMemo(() => {
        return validKalemler.reduce((acc, curr) => acc + (Number(curr.miktar) || 0), 0);
    }, [validKalemler]);

    const stokDusumOptions = useMemo(() => [
        { id: PaketStokDusumYontemi.BilesenlerdenDus, label: t('Bileşenlerin Stokundan Düş (Reçete Dağıtımı)') },
        { id: PaketStokDusumYontemi.PaketStogundanDus, label: t('Paket Stokundan Düş (Montajlı Set)') }
    ], [t]);

    const tabs = useMemo(() => [
        { id: 1, title: t('Genel Bilgiler'), icon: <Box size={16} /> },
        { id: 2, title: t('Detaylı Açıklama & Notlar'), icon: <FileText size={16} /> }
    ], [t]);

    // SpreadsheetGrid Sütunları
    const spreadsheetColumns = useMemo(() => [
        {
            id: 'siraNo',
            header: '#',
            width: 45,
            align: 'center' as const,
            render: (_row: IPaketVeSetKalemi, index: number) => (
                <div className="flex items-center justify-center h-full text-secondary font-medium text-xs">
                    {index + 1}
                </div>
            )
        },
        {
            id: 'kalemTuru',
            header: t('auto_kalem_turu', 'Tür'),
            width: 140,
            render: (row: IPaketVeSetKalemi, index: number) => (
                <div className="p-4 w-full">
                    <BaseDropdownSecici
                        value={row.kalemTuru || PaketKalemTuru.TekilUrun}
                        onChange={(newTur: any) => {
                            const numTur = Number(newTur) || PaketKalemTuru.TekilUrun;
                            setFormData(prev => {
                                const newKalemler = [...prev.kalemler];
                                const current = newKalemler[index];
                                if (current.kalemTuru !== numTur) {
                                    newKalemler[index] = {
                                        ...current,
                                        kalemTuru: numTur,
                                        urunVeHizmetKartiId: numTur === PaketKalemTuru.TekilUrun ? current.urunVeHizmetKartiId : 0,
                                        urunKodu: numTur === PaketKalemTuru.TekilUrun ? current.urunKodu : '',
                                        urunAdi: numTur === PaketKalemTuru.TekilUrun ? current.urunAdi : '',
                                        urunBarkod: numTur === PaketKalemTuru.TekilUrun ? current.urunBarkod : '',
                                        urunVeHizmetGrubuId: numTur === PaketKalemTuru.UrunGrubu ? current.urunVeHizmetGrubuId : null,
                                        urunGrubuKodu: numTur === PaketKalemTuru.UrunGrubu ? current.urunGrubuKodu : '',
                                        urunGrubuAdi: numTur === PaketKalemTuru.UrunGrubu ? current.urunGrubuAdi : '',
                                        birimId: null,
                                        birimAdi: '',
                                        birimTipiId: null
                                    };
                                }
                                return { ...prev, kalemler: newKalemler };
                            });
                            setIsFormDirty(true);
                        }}
                        options={kalemTuruOptions}
                    />
                </div>
            )
        },
        {
            id: 'bilesen',
            header: `${t('auto_bilesen_secimi', 'Bileşen (Ürün veya Grup)')} *`,
            width: 340,
            isInvalid: (row: IPaketVeSetKalemi) => Boolean(errors.kalemler && !isKalemFilled(row)),
            render: (row: IPaketVeSetKalemi, index: number) => {
                if (row.kalemTuru === PaketKalemTuru.UrunGrubu) {
                    const hasSelection = Boolean(row.urunVeHizmetGrubuId);
                    const displayText = hasSelection 
                        ? `${row.urunGrubuKodu ? row.urunGrubuKodu + ' - ' : ''}${row.urunGrubuAdi}`
                        : '';

                    return (
                        <div 
                            className="flex items-center justify-between w-full h-40 px-12 cursor-pointer group"
                            onClick={() => handleOpenUrunGrupModal(index)}
                        >
                            <div className="flex items-center gap-8 flex-1 min-w-0">
                                <Layers size={15} className={hasSelection ? "text-warning shrink-0" : "text-secondary shrink-0"} />
                                {hasSelection ? (
                                    <span className="text-13 font-semibold text-primary truncate">
                                        {displayText}
                                    </span>
                                ) : (
                                    <span className="text-13 text-secondary italic">
                                        {t('auto_grup_secimi_placeholder', 'Grup seçmek için tıklayın...')}
                                    </span>
                                )}
                            </div>
                            {hasSelection && (
                                <button
                                    type="button"
                                    className="p-4 rounded text-secondary hover:text-danger hover:bg-hover ml-4 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFormData(prev => {
                                            const newKalemler = [...prev.kalemler];
                                            newKalemler[index] = {
                                                ...newKalemler[index],
                                                urunVeHizmetGrubuId: null,
                                                urunGrubuKodu: '',
                                                urunGrubuAdi: '',
                                                birimId: null,
                                                birimAdi: '',
                                                birimTipiId: null
                                            };
                                            return { ...prev, kalemler: newKalemler };
                                        });
                                        setIsFormDirty(true);
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    );
                }

                return (
                    <UrunSeciciInput
                        value={row.urunAdi ? `${row.urunKodu ? row.urunKodu + ' - ' : ''}${row.urunAdi}` : ''}
                        onChange={(e: any) => handleKalemChange(index, 'urunAdi', e.target.value)}
                        onKeyDown={(e: any) => {
                            if (e.key === 'Enter' || e.key === 'Tab') {
                                if (!row.urunVeHizmetKartiId) {
                                    e.preventDefault();
                                    handleOpenUrunModal(index, row.urunAdi);
                                }
                            }
                        }}
                        onMenuClick={() => handleOpenUrunModal(index, row.urunAdi)}
                        hasSelection={!!row.urunVeHizmetKartiId}
                        onClear={() => {
                            setFormData(prev => {
                                const newKalemler = [...prev.kalemler];
                                newKalemler[index] = {
                                    ...newKalemler[index],
                                    urunVeHizmetKartiId: 0,
                                    urunKodu: '',
                                    urunAdi: '',
                                    urunBarkod: '',
                                    birimId: null,
                                    birimAdi: '',
                                    birimTipiId: null
                                };
                                return { ...prev, kalemler: newKalemler };
                            });
                            setIsFormDirty(true);
                        }}
                        placeholder={t('Ürün seçmek için tıklayın veya yazın...')}
                        inputStyle={{ border: 'none', background: 'transparent', borderRadius: 0, height: '40px', boxShadow: 'none', outline: 'none' }}
                    />
                );
            }
        },
        {
            id: 'birimId',
            header: `${t('Birim')} *`,
            width: 140,
            isInvalid: (row: IPaketVeSetKalemi) => Boolean(errors.kalemler && isKalemFilled(row) && (!row.birimId || Number(row.birimId) <= 0)),
            render: (row: IPaketVeSetKalemi, index: number) => {
                const hasItem = row.kalemTuru === PaketKalemTuru.UrunGrubu
                    ? Boolean(row.urunVeHizmetGrubuId && Number(row.urunVeHizmetGrubuId) > 0)
                    : Boolean(row.urunVeHizmetKartiId && Number(row.urunVeHizmetKartiId) > 0);

                return (
                    <BirimSecici
                        value={row.birimId}
                        birimTipiId={row.birimTipiId ?? null}
                        disabled={!hasItem}
                        required={false}
                        placeholder={hasItem ? t('auto_birim_seciniz_noktali', 'Birim Seçiniz...') : t('auto_once_urun_seciniz', 'Önce ürün seçiniz...')}
                        variant="grid"
                        onChange={(birimId, rawOption) => {
                            handleKalemChange(index, 'birimId', birimId ? Number(birimId) : null);
                            if (rawOption?.ad) {
                                handleKalemChange(index, 'birimAdi', rawOption.ad);
                            } else if (!birimId) {
                                handleKalemChange(index, 'birimAdi', '');
                            }
                            if (rawOption?.tip !== undefined && rawOption?.tip !== null) {
                                handleKalemChange(index, 'birimTipiId', rawOption.tip);
                            }
                        }}
                    />
                );
            }
        },
        {
            id: 'miktar',
            header: `${t('Miktar')} *`,
            width: 110,
            align: 'right' as const,
            isInvalid: (row: IPaketVeSetKalemi) => Boolean(errors.kalemler && isKalemFilled(row) && (row.miktar === undefined || row.miktar === null || Number(row.miktar) < 1)),
            render: (row: IPaketVeSetKalemi, index: number) => (
                <input
                    type="number"
                    min={1}
                    value={row.miktar}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                            handleKalemChange(index, 'miktar', '');
                        } else {
                            const num = Number(val);
                            handleKalemChange(index, 'miktar', isNaN(num) ? 1 : Math.max(1, num));
                        }
                    }}
                    onBlur={(e) => {
                        const num = Number(e.target.value);
                        if (isNaN(num) || num < 1) {
                            handleKalemChange(index, 'miktar', 1);
                        }
                    }}
                    className="spreadsheet-cell-input text-right font-medium"
                />
            )
        },
        {
            id: 'aciklama',
            header: t('Açıklama'),
            width: '100%',
            render: (row: IPaketVeSetKalemi, index: number) => (
                <input
                    type="text"
                    value={row.aciklama || ''}
                    onChange={(e) => handleKalemChange(index, 'aciklama', e.target.value)}
                    placeholder={t('Satır notu...')}
                    className="spreadsheet-cell-input text-sm"
                />
            )
        }
    ], [t, handleKalemChange, handleOpenUrunModal, handleOpenUrunGrupModal, kalemTuruOptions]);

    // Header Bölümü İçeriği
    const headerContent = (
        <>
            {errors.kalemler && (
                <div className="mb-12">
                    <FieldError error={errors.kalemler} />
                </div>
            )}

            {activeTab === 1 && (
                <DocumentHeaderPanel columns={2}>
                    <DocumentHeaderField name="kod" label={t('Paket/Set Kodu')} required>
                        <BasitInput
                            value={formData.kod}
                            onChange={(e) => handleFieldChange('kod', e.target.value)}
                            onBlur={() => handleFieldBlur('kod', formData.kod)}
                            error={!!errors.kod}
                            placeholder={t('Örn: SET-001')}
                            casing="hepsiBuyuk"
                            autoFocus
                        />
                    </DocumentHeaderField>

                    <DocumentHeaderField name="ad" label={t('Paket/Set Adı')} required>
                        <BasitInput
                            value={formData.ad}
                            onChange={(e) => handleFieldChange('ad', e.target.value)}
                            onBlur={() => handleFieldBlur('ad', formData.ad)}
                            error={!!errors.ad}
                            placeholder={t('Örn: Yönetici Çalışma Masası Seti')}
                            casing="basHarflerBuyuk"
                        />
                    </DocumentHeaderField>

                    <DocumentHeaderField name="barkod" label={t('Barkod (EAN / GTIN)')}>
                        <BasitInput
                            value={formData.barkod || ''}
                            onChange={(e) => handleFieldChange('barkod', e.target.value)}
                            placeholder={t('Örn: 8690000000000')}
                            icon={<Barcode size={16} />}
                        />
                    </DocumentHeaderField>

                    <DocumentHeaderField name="stokDusumYontemi" label={t('Stok Düşüm Yöntemi')}>
                        <BaseDropdownSecici
                            value={formData.stokDusumYontemi}
                            onChange={(val) => handleFieldChange('stokDusumYontemi', val)}
                            options={stokDusumOptions}
                        />
                    </DocumentHeaderField>
                </DocumentHeaderPanel>
            )}

            {activeTab === 2 && (
                <DocumentHeaderPanel columns={1}>
                    <DocumentHeaderField name="aciklama" label={t('Detaylı Açıklama & Notlar')}>
                        <BasitInput
                            multiline
                            rows={3}
                            value={formData.aciklama || ''}
                            onChange={(e) => handleFieldChange('aciklama', e.target.value)}
                            placeholder={t('Paket veya set ile ilgili açıklama, montaj talimatları veya müşteri notlarını buraya girebilirsiniz...')}
                        />
                    </DocumentHeaderField>
                </DocumentHeaderPanel>
            )}
        </>
    );

    // Footer Bölümü İçeriği (Özet Paneli)
    const footerContent = (
        <div className="w-full h-full flex justify-end items-start">
            <div className="w-full h-full max-w-300">
                <DocumentResultPanel
                    title={t('Set Özeti')}
                    readOnly={true}
                    items={[
                        {
                            id: 'kalemSayisi',
                            label: t('Bileşen Çeşidi'),
                            value: `${validKalemler.length} ${t('Kalem')}`,
                            visibilityRule: 'p4',
                            isEditable: false
                        },
                        {
                            id: 'toplamMiktar',
                            label: t('Toplam Parça Miktarı'),
                            value: `${toplamKalemMiktari} ${t('Adet')}`,
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

    if (loading) {
        return (
            <div className="p-24 flex items-center justify-center text-secondary h-full">
                <span>{t('Yükleniyor...')}</span>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-full">
            <BaseDocumentPage
                formId="paketVeSetForm"
                onSubmit={handleSave}
                onSave={handleSave}
                isSaving={saving}
                onValidate={() => validatePaketVeSetForm(formData, t)}
                isDirty={isFormDirty}
                onDirtyChange={setIsFormDirty}
                errors={errors}
                documentId={formData.id}
                documentType="PaketVeSet"
                documentNo={formData.kod}
                formData={formData}
                pageTitle={isEdit ? (formData.ad ? `${t('Paket & Set Düzenle')} - ${formData.ad}` : t('Paket & Set Düzenle')) : t('Yeni Paket / Set')}
                onBack={handleBack}
                tabs={tabs}
                activeTabId={activeTab}
                onTabChange={(tabId) => setActiveTab(Number(tabId))}
                headerContent={headerContent}
                extraDropdownActions={paketVeSetActionMenu.extraDropdownActions}
                gridProps={{
                    columns: spreadsheetColumns,
                    data: formData.kalemler,
                    onAddRow: handleAddKalem,
                    onRemoveRow: handleRemoveKalem,
                    autoAddRow: true,
                    autoAddRowWhenEmpty: true,
                    maxOneEmptyRow: true,
                    isEmptyRow: (row: any) => !isKalemFilled(row),
                    mobileCardRender: (row: IPaketVeSetKalemi) => (
                        <div className="flex flex-col gap-6 p-4">
                            <div className="flex justify-between items-start">
                                <span className="font-semibold text-primary flex items-center gap-6">
                                    {row.kalemTuru === PaketKalemTuru.UrunGrubu ? (
                                        <>
                                            <span className="badge badge-warning text-xs">{t('auto_urun_grubu', 'Ürün Grubu')}</span>
                                            {row.urunGrubuKodu ? `${row.urunGrubuKodu} - ` : ''}{row.urunGrubuAdi || t('auto_grup_secilmedi', 'Grup Seçilmedi')}
                                        </>
                                    ) : (
                                        <>
                                            {row.urunKodu ? `${row.urunKodu} - ` : ''}{row.urunAdi || t('Ürün Seçilmedi')}
                                        </>
                                    )}
                                </span>
                                <span className="badge badge-info">{row.miktar} {row.birimAdi || t('Adet')}</span>
                            </div>
                            {row.aciklama && (
                                <span className="text-xs text-secondary">{row.aciklama}</span>
                            )}
                        </div>
                    )
                }}
                footerContent={footerContent}
            />

            <UrunSeciciModal
                isOpen={urunModalOpen}
                onClose={() => setUrunModalOpen(false)}
                initialSearchText={urunAramaMetni}
                onSelect={handleSelectUrun}
            />

            <UrunGrupSeciciModal
                isOpen={urunGrupModalOpen}
                onClose={() => setUrunGrupModalOpen(false)}
                onSelect={handleSelectUrunGrup}
                tur={1}
            />

            <AlertDialog
                isOpen={alertDialog.isOpen}
                onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
                type={alertDialog.type}
                title={alertDialog.title}
                message={alertDialog.message}
                onConfirm={alertDialog.onConfirm}
                confirmText={alertDialog.confirmText}
            />
        </div>
    );
};

export default PaketVeSetFormPage;
