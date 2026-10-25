import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
    BasePopup,
    BaseCardPage,
    ParaBirimiSecici,
    BaseDropdownSecici,
    type DropdownOption,
    BaseInput,
    BaseSwitch,
    NotInput,
    FieldError,
    useHeaderApi
} from '@akalin/ui';
import { Tag } from 'lucide-react';
import {
    validateFiyatListesiTanimField,
    validateFiyatListesiTanimForm,
    type FiyatListesiTanimFormData
} from '../validators/fiyatListesiTanimValidation';
import { getFiyatListesiTanimDefaultValues } from '../defaults/fiyatListesiTanimDefaultValue';
import { fiyatListesiTanimlariService } from '../services/FiyatListesiTanimlariService';

// --- FiyatListeTuruSecici Component ---
interface FiyatListeTuruSeciciProps {
    value?: number;
    onChange?: (val: number) => void;
}

const FiyatListeTuruSecici: React.FC<FiyatListeTuruSeciciProps> = ({ value, onChange }) => {
    const { t } = useTranslation();
    const options: DropdownOption[] = [
        { id: 1, label: t('Toptan') || 'Toptan' },
        { id: 2, label: t('Alış') || 'Alış' },
        { id: 3, label: t('Perakende') || 'Perakende' }
    ];

    const selectedText = options.find(o => o.id === value)?.label as string;

    return (
        <BaseDropdownSecici
            value={value}
            onChange={(id) => onChange?.(Number(id))}
            options={options}
            clearable={false}
            displayText={selectedText}
        />
    );
};

// --- KDVDurumuSecici Component ---
interface KDVDurumuSeciciProps {
    value?: boolean;
    onChange?: (val: boolean) => void;
}

const KDVDurumuSecici: React.FC<KDVDurumuSeciciProps> = ({ value, onChange }) => {
    const { t } = useTranslation();
    const options: DropdownOption[] = [
        { id: 'false', label: t('FiyatListesi_kdvHaric') || 'KDV Hariç' },
        { id: 'true', label: t('FiyatListesi_kdvDahil') || 'KDV Dahil' }
    ];

    const selectedText = value ? (t('FiyatListesi_kdvDahil') || 'KDV Dahil') : (t('FiyatListesi_kdvHaric') || 'KDV Hariç');

    return (
        <BaseDropdownSecici
            value={value ? 'true' : 'false'}
            onChange={(id) => onChange?.(id === 'true')}
            options={options}
            clearable={false}
            displayText={selectedText}
        />
    );
};

// --- Main FiyatListesiTanimForm Component ---
export interface FiyatListesiTanimFormProps {
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
    onDirtyChange: (isDirty: boolean) => void;
    asModal?: boolean;
}

const FiyatListesiTanimForm: React.FC<FiyatListesiTanimFormProps> = ({
    initialData,
    onSuccess,
    onCancel,
    onDirtyChange,
    asModal = false
}) => {
    const { t } = useTranslation();
    const { setHeaderBreadcrumbOptions } = useHeaderApi() || {};
    const [formData, setFormData] = useState<FiyatListesiTanimFormData>(() => {
        const defaults = getFiyatListesiTanimDefaultValues();
        if (initialData) {
            return {
                ...defaults,
                kod: initialData.kod || defaults.kod,
                ad: initialData.ad || '',
                aciklama: initialData.aciklama || '',
                fiyatTuru: initialData.fiyatTuru || defaults.fiyatTuru,
                dovizCinsi: initialData.dovizCinsi || defaults.dovizCinsi,
                kdvDahilMi: initialData.kdvDahilMi !== undefined ? initialData.kdvDahilMi : defaults.kdvDahilMi,
                aktifMi: initialData.aktifMi !== undefined ? initialData.aktifMi : true
            };
        }
        return defaults;
    });
    const [paraBirimleri, setParaBirimleri] = useState<any[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const adInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        axios.get('/api/ParaBirimleri')
            .then(res => setParaBirimleri(res.data || []))
            .catch(() => {});

        if (initialData) {
            setFormData({
                kod: initialData.kod || '',
                ad: initialData.ad || '',
                aciklama: initialData.aciklama || '',
                fiyatTuru: initialData.fiyatTuru || 1,
                dovizCinsi: initialData.dovizCinsi || 'TRY',
                kdvDahilMi: initialData.kdvDahilMi || false,
                aktifMi: initialData.aktifMi !== undefined ? initialData.aktifMi : true
            });
        } else {
            fiyatListesiTanimlariService.getSonrakiKod()
                .then(code => setFormData(prev => ({ ...prev, kod: code })))
                .catch(() => setFormData(prev => ({ ...prev, kod: 'FT-0001' })));
        }

        setTimeout(() => {
            if (adInputRef.current) adInputRef.current.focus();
        }, 100);
    }, [initialData]);

    const handleChange = (field: keyof FiyatListesiTanimFormData, value: any) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            const isDirty = initialData 
                ? updated.kod !== (initialData.kod || '') ||
                  updated.ad !== (initialData.ad || '') ||
                  updated.aciklama !== (initialData.aciklama || '') ||
                  updated.fiyatTuru !== (initialData.fiyatTuru || 1) ||
                  updated.dovizCinsi !== (initialData.dovizCinsi || 'TRY') ||
                  updated.kdvDahilMi !== (initialData.kdvDahilMi || false) ||
                  updated.aktifMi !== (initialData.aktifMi !== undefined ? initialData.aktifMi : true)
                : true;
            onDirtyChange(isDirty);
            return updated;
        });

        if (errors[field]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const handleBlur = (field: keyof FiyatListesiTanimFormData) => {
        const error = validateFiyatListesiTanimField(field, formData[field], t);
        setErrors(prev => {
            if (error) {
                return { ...prev, [field]: error };
            }
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const handleSave = async () => {
        const validationErrors = validateFiyatListesiTanimForm(formData, t);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error(t('Form_lutfenHatalariDuzeltin', 'Lütfen formdaki zorunlu alanları doldurunuz.'));
            return;
        }

        setSaving(true);

        try {
            if (initialData?.id) {
                await fiyatListesiTanimlariService.update(initialData.id, formData as any);
                toast.success(t('FiyatListesiTanimi_guncellendi', 'Fiyat tanımı başarıyla güncellendi.'));
            } else {
                await fiyatListesiTanimlariService.create(formData as any);
                toast.success(t('FiyatListesiTanimi_kaydedildi', 'Fiyat tanımı başarıyla oluşturuldu.'));
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error?.response?.data?.mesaj || t('Hata_kaydetmeBasarisiz', 'Kaydetme işlemi sırasında hata oluştu.'));
        } finally {
            setSaving(false);
        }
    };

    const selectedParaBirimiId = paraBirimleri.find(p => p.kod === formData.dovizCinsi)?.id;

    const isEditing = Boolean(initialData?.id);
    const titleText = isEditing 
        ? (formData.ad || t('FiyatListesi_duzenleTitle', 'Fiyat Listesi Düzenle')) 
        : t('FiyatListesi_yeniTitle', 'Yeni Fiyat Listesi');

    const recordTitle = formData.ad || (isEditing ? t('FiyatListesi_duzenleTitle', 'Fiyat Listesi Düzenle') : t('FiyatListesi_yeniTitle', 'Yeni Fiyat Listesi'));

    useEffect(() => {
        if (setHeaderBreadcrumbOptions && !asModal) {
            setHeaderBreadcrumbOptions({ recordTitle });
        }
        return () => {
            if (setHeaderBreadcrumbOptions && !asModal) {
                setHeaderBreadcrumbOptions(null);
            }
        };
    }, [recordTitle, setHeaderBreadcrumbOptions, asModal]);

    const formContent = (
        <div className="dynamic-form-fields-container">
            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label required">{t('FiyatListesi_kod', 'Liste Kodu')}</label>
                    <BaseInput
                        type="text"
                        value={formData.kod}
                        onChange={(e) => handleChange('kod', e.target.value)}
                        onBlur={() => handleBlur('kod')}
                        error={!!errors.kod}
                    />
                    <FieldError error={errors.kod} />
                </div>

                <div className="form-group">
                    <label className="form-label required">{t('FiyatListesi_ad', 'Liste Adı')}</label>
                    <BaseInput
                        ref={adInputRef}
                        type="text"
                        value={formData.ad}
                        onChange={(e) => handleChange('ad', e.target.value)}
                        onBlur={() => handleBlur('ad')}
                        placeholder={t('FiyatListesi_ornekListeAdi', 'Örn: 2026 Perakende Fiyat Listesi')}
                        error={!!errors.ad}
                    />
                    <FieldError error={errors.ad} />
                </div>

                <div className="form-group">
                    <label className="form-label">{t('FiyatListesi_fiyatTuru', 'Liste Türü')}</label>
                    <FiyatListeTuruSecici
                        value={formData.fiyatTuru}
                        onChange={(val) => handleChange('fiyatTuru', val)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">{t('FiyatListesi_dovizCinsi', 'Para Birimi')}</label>
                    <ParaBirimiSecici
                        value={selectedParaBirimiId}
                        onChange={(_id, rawValue) => handleChange('dovizCinsi', rawValue?.kod || 'TRY')}
                        clearable={false}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">{t('FiyatListesi_kdvDurumu', 'KDV Durumu')}</label>
                    <KDVDurumuSecici
                        value={formData.kdvDahilMi}
                        onChange={(val) => handleChange('kdvDahilMi', val)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">{t('FiyatListesi_durum', 'Durum')}</label>
                    <div className="flex items-center min-h-42">
                        <BaseSwitch
                            checked={formData.aktifMi}
                            onChange={(e) => handleChange('aktifMi', e.target.checked)}
                            label={formData.aktifMi ? t('Aktif', 'Aktif') : t('Pasif', 'Pasif')}
                        />
                    </div>
                </div>

                <div className="form-group col-span-full">
                    <label className="form-label">{t('FiyatListesi_aciklama', 'Açıklama')}</label>
                    <NotInput
                        rows={3}
                        value={formData.aciklama || ''}
                        onChange={(e) => handleChange('aciklama', e.target.value)}
                        placeholder={t('FiyatListesi_aciklamaPlaceholder', 'Fiyat listesi ile ilgili genel açıklamaları buraya yazabilirsiniz...')}
                    />
                </div>
            </div>
        </div>
    );

    if (asModal) {
        return (
            <BasePopup
                isOpen={true}
                modalSize="lg"
                title={titleText}
                onSave={handleSave}
                isSaving={saving}
                onClose={onCancel}
            >
                {formContent}
            </BasePopup>
        );
    }

    return (
        <BaseCardPage
            id="fiyatListesiTanimCardPage"
            title={titleText}
            subtitleLeft={formData.kod || t('FiyatListesi_sayfaAltBasligi', 'Ürün ve hizmet satış/alış fiyat listelerinin yönetimi.')}
            subtitleRight={formData.fiyatTuru === 1 ? t('Toptan', 'Toptan') : formData.fiyatTuru === 2 ? t('Alış', 'Alış') : t('Perakende', 'Perakende')}
            icon={<Tag size={20} />}
            showBackButton={true}
            onClose={onCancel}
            onSave={handleSave}
            isSaving={saving}
        >
            {formContent}
        </BaseCardPage>
    );
};

export default FiyatListesiTanimForm;
