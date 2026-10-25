import i18n from 'i18next';

export const validateFiyatListesiField = (name: string, value: any, formData?: any): string => {
    const t = (key: string, fallback?: string) => i18n.t(key, fallback || key);
    switch (name) {
        case 'fiyatListesiTanimiId':
            return !value ? t('auto_fiyat_tanimi_zorunludur', 'Fiyat tanımı seçilmesi zorunludur.') : '';
        case 'baslangicTarihi':
            return !value ? t('auto_baslangic_tarihi_zorunludur', 'Başlangıç tarihi zorunludur.') : '';
        case 'bitisTarihi':
            return !value ? t('auto_bitis_tarihi_zorunludur', 'Bitiş tarihi zorunludur.') : '';
        case 'belgeNo':
            return !value ? t('auto_belge_no_zorunludur', 'Belge no zorunludur.') : '';
        case 'cariId':
            return !value ? t('auto_cari_secimi_zorunludur', 'Cari seçimi zorunludur.') : '';
        default:
            return '';
    }
};

export const isKalemActive = (kalem: any): boolean => {
    if (!kalem) return false;
    return Boolean(
        (kalem.tedarikciUrunKodu && String(kalem.tedarikciUrunKodu).trim() !== '') ||
        kalem.urunVeHizmetKartiId ||
        (kalem.fiyat !== undefined && kalem.fiyat !== null && kalem.fiyat !== '' && Number(kalem.fiyat) > 0) ||
        (kalem.valorTarihi && String(kalem.valorTarihi).trim() !== '')
    );
};

export const isKalemComplete = (kalem: any): boolean => {
    if (!kalem) return false;
    return Boolean(
        kalem.tedarikciUrunKodu && String(kalem.tedarikciUrunKodu).trim() !== '' &&
        kalem.fiyat !== undefined && kalem.fiyat !== null && kalem.fiyat !== '' && Number(kalem.fiyat) > 0 &&
        kalem.valorTarihi && String(kalem.valorTarihi).trim() !== ''
    );
};

export interface KalemValidationResult {
    canAdd: boolean;
    invalidRowIndex?: number;
    invalidColId?: 'tedarikciUrunKodu' | 'urunVeHizmetKartiId' | 'fiyat' | 'valorTarihi';
    invalidColIndex?: number;
    errorMessage?: string;
}

export const validateKalemlerBeforeAdd = (kalemler: any[]): KalemValidationResult => {
    const t = (key: string, fallback?: string) => i18n.t(key, fallback || key);
    if (!kalemler || kalemler.length === 0) {
        return {
            canAdd: false,
            errorMessage: t('auto_en_az_bir_satir_girilmeli', 'En az bir satır bilgi girilmelidir.')
        };
    }

    const hasAnyActive = kalemler.some(k => isKalemActive(k));
    if (!hasAnyActive) {
        return {
            canAdd: false,
            invalidRowIndex: 0,
            invalidColIndex: 0,
            invalidColId: 'tedarikciUrunKodu',
            errorMessage: t('auto_en_az_bir_satir_girilmeli', 'En az bir satır bilgi girilmelidir.')
        };
    }

    // Tablodaki her bir satırı denetle
    for (let i = 0; i < kalemler.length; i++) {
        const k = kalemler[i];
        if (!k) continue;

        if (!isKalemActive(k)) {
            return {
                canAdd: false,
                invalidRowIndex: i,
                invalidColIndex: 0,
                invalidColId: 'tedarikciUrunKodu',
                errorMessage: t('auto_onceki_satiri_tamamlayiniz', 'Yeni satır eklemeden önce lütfen mevcut satırdaki tüm zorunlu alanları doldurun.')
            };
        }

        const isComplete = isKalemComplete(k);

        // Satır eksikse (Tedarikçi Ürün Kodu, Fiyat veya Valör Tarihi eksikse)
        if (!isComplete) {
            let invalidColId: 'tedarikciUrunKodu' | 'urunVeHizmetKartiId' | 'fiyat' | 'valorTarihi' = 'tedarikciUrunKodu';
            let invalidColIndex = 0;

            if (!k.tedarikciUrunKodu || String(k.tedarikciUrunKodu).trim() === '') {
                invalidColId = 'tedarikciUrunKodu';
                invalidColIndex = 0;
            } else if (k.fiyat === undefined || k.fiyat === null || k.fiyat === '' || Number(k.fiyat) <= 0) {
                invalidColId = 'fiyat';
                invalidColIndex = 2;
            } else if (!k.valorTarihi || String(k.valorTarihi).trim() === '') {
                invalidColId = 'valorTarihi';
                invalidColIndex = 3;
            }

            return {
                canAdd: false,
                invalidRowIndex: i,
                invalidColId,
                invalidColIndex,
                errorMessage: t('auto_eksik_satir_bilgisi_fiyat_listesi', 'Lütfen eklediğiniz tüm satırlarda Tedarikçi Ürün Kodu, Fiyat ve Valör Tarihi alanlarını eksiksiz doldurun.')
            };
        }
    }

    return { canAdd: true };
};

export const isKalemFieldInvalid = (
    kalem: any, 
    fieldName: 'tedarikciUrunKodu' | 'urunVeHizmetKartiId' | 'fiyat' | 'valorTarihi', 
    hasKalemlerError: boolean
): boolean => {
    if (!hasKalemlerError || !kalem) return false;

    // Eğer bu satırda hiç veri girişi yapılmamışsa hücreleri teker teker işaretleme
    if (!isKalemActive(kalem)) return false;

    // Satır zaten eksiksiz doldurulmuşsa hata verme
    if (isKalemComplete(kalem)) return false;

    switch (fieldName) {
        case 'tedarikciUrunKodu':
            return !kalem.tedarikciUrunKodu || String(kalem.tedarikciUrunKodu).trim() === '';
        case 'urunVeHizmetKartiId':
            return false;
        case 'fiyat':
            return kalem.fiyat === undefined || kalem.fiyat === null || kalem.fiyat === '' || Number(kalem.fiyat) <= 0;
        case 'valorTarihi':
            return !kalem.valorTarihi || String(kalem.valorTarihi).trim() === '';
        default:
            return false;
    }
};

export const validateFiyatListesiForm = (formData: any): { isValid: boolean; errors: Record<string, string> } => {
    const t = (key: string, fallback?: string) => i18n.t(key, fallback || key);
    const errors: Record<string, string> = {};

    if (!formData.fiyatListesiTanimiId) {
        errors.fiyatListesiTanimiId = t('auto_fiyat_tanimi_zorunludur', 'Fiyat tanımı seçilmesi zorunludur.');
    }
    if (!formData.baslangicTarihi) {
        errors.baslangicTarihi = t('auto_baslangic_tarihi_zorunludur', 'Başlangıç tarihi zorunludur.');
    }
    if (!formData.bitisTarihi) {
        errors.bitisTarihi = t('auto_bitis_tarihi_zorunludur', 'Bitiş tarihi zorunludur.');
    }
    if (!formData.belgeNo || String(formData.belgeNo).trim() === '') {
        errors.belgeNo = t('auto_belge_no_zorunludur', 'Belge no zorunludur.');
    }
    if (!formData.cariId) {
        errors.cariId = t('auto_cari_secimi_zorunludur', 'Cari seçimi zorunludur.');
    }

    const gecerliKalemler = formData.kalemler?.filter((k: any) => k && (
        (k.tedarikciUrunKodu && String(k.tedarikciUrunKodu).trim()) || 
        k.urunVeHizmetKartiId || 
        (k.fiyat !== undefined && k.fiyat !== null && k.fiyat !== '' && Number(k.fiyat) > 0) ||
        (k.valorTarihi && String(k.valorTarihi).trim())
    )) || [];

    if (gecerliKalemler.length === 0) {
        errors.kalemler = t('auto_en_az_bir_satir_girilmeli', 'En az bir satır bilgi girilmelidir.');
    } else {
        const eksikSatirVar = gecerliKalemler.some((k: any) => 
            !k.tedarikciUrunKodu || 
            String(k.tedarikciUrunKodu).trim() === '' ||
            k.fiyat === undefined || 
            k.fiyat === null || 
            k.fiyat === '' || 
            Number(k.fiyat) <= 0 ||
            !k.valorTarihi ||
            String(k.valorTarihi).trim() === ''
        );

        if (eksikSatirVar) {
            errors.kalemler = t('auto_eksik_satir_bilgisi_fiyat_listesi', 'Lütfen eklediğiniz tüm satırlarda Tedarikçi Ürün Kodu, Fiyat ve Valör Tarihi alanlarını eksiksiz doldurun.');
        } else {
            const hataliKalemler = gecerliKalemler.filter((k: any) => Number(k.fiyat) < 0);
            if (hataliKalemler.length > 0) {
                errors.kalemler = t('auto_fiyat_negatif_olamaz', "Fiyat 0'dan küçük olamaz.");
            }
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
