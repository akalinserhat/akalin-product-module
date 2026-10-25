import i18n from 'i18next';

export const validateBshFiyatFarkiField = (name: string, value: any, _formData?: any): string => {
    const t = (key: string, fallback?: string) => i18n.t(key, fallback || key);
    switch (name) {
        case 'baslangicTarihi':
            return !value ? t('auto_baslangic_tarihi_zorunludur', 'Başlangıç tarihi zorunludur.') : '';
        case 'bitisTarihi':
            return !value ? t('auto_bitis_tarihi_zorunludur', 'Bitiş tarihi zorunludur.') : '';
        case 'belgeNo':
            return !value ? t('auto_belge_no_zorunludur', 'Belge no zorunludur.') : '';
        default:
            return '';
    }
};

export const isBshKalemActive = (kalem: any): boolean => {
    if (!kalem) return false;
    return Boolean(
        (kalem.tedarikciUrunKodu && String(kalem.tedarikciUrunKodu).trim() !== '') ||
        kalem.urunVeHizmetKartiId ||
        (kalem.fiyat !== undefined && kalem.fiyat !== null && kalem.fiyat !== '' && Number(kalem.fiyat) > 0)
    );
};

export const validateBshFiyatFarkiForm = (
    formData: any,
    translateFn?: any
): { isValid: boolean; errors: Record<string, string> } => {
    const t = translateFn || ((key: string, fallback?: string) => i18n.t(key, fallback || key));
    const errors: Record<string, string> = {};

    if (!formData.baslangicTarihi) {
        errors.baslangicTarihi = t('auto_baslangic_tarihi_zorunludur', 'Başlangıç tarihi zorunludur.');
    }

    if (!formData.bitisTarihi) {
        errors.bitisTarihi = t('auto_bitis_tarihi_zorunludur', 'Bitiş tarihi zorunludur.');
    }

    if (!formData.belgeNo) {
        errors.belgeNo = t('auto_belge_no_zorunludur', 'Belge no zorunludur.');
    }

    const kalemler = formData.kalemler;
    const hasValidKalem = Array.isArray(kalemler) && kalemler.some(isBshKalemActive);
    if (!hasValidKalem) {
        errors.kalemler = t('auto_en_az_bir_satir_girilmeli', 'En az bir satır bilgi girilmelidir.');
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
