/**
 * Webakus - Sistem Ayarları / Ürün Grupları Formu Doğrulama Kuralları (urunGrupValidation.ts)
 * 
 * Başlıca Sorumlulukları:
 * - Ürün ve Hizmet grupları için anlık alan doğrulaması (validateUrunGrupField)
 * - Form kaydetme öncesi genel form doğrulaması (validateUrunGrupForm)
 */

export const validateUrunGrupField = (
    name: string,
    value: any,
    formData: any,
    t: (key: string, fallback?: string) => string = (k, f) => f || k
): string | null => {
    const tur = Number(formData?.tur) || 1;
    const isUrun = tur === 1;

    if (name === 'ad') {
        if (!value || value.toString().trim() === '') {
            return t('UrunGrup_adZorunludur', 'Grup Adı zorunludur');
        }
    }

    if (name === 'tekilAd') {
        if (!value || value.toString().trim() === '') {
            return t('UrunGrup_tekilAdZorunludur', 'Grup Tekil Adı zorunludur');
        }
    }

    if (name === 'kod') {
        if (!value || value.toString().trim() === '') {
            return t('UrunGrup_kodZorunludur', 'Kısa Kod zorunludur');
        }
        if (value.toString().trim().length < 3) {
            return t('UrunGrup_kodMinKarakter', 'Kısa Kod en az 3 karakter olmalıdır');
        }
    }

    if (name === 'kdvGrubuId') {
        if (!value && value !== 0) {
            return t('UrunGrup_kdvGrubuZorunludur', 'Varsayılan KDV Grubu seçimi zorunludur');
        }
    }

    if (name === 'varsayilanBirimId') {
        if (!value || value === '' || value === 0 || value === '0') {
            return t('UrunGrup_varsayilanBirimZorunludur', 'Varsayılan Birim seçimi zorunludur');
        }
    }

    if (name === 'varsayilanStokTakipTuru' && isUrun) {
        if (!value || value.toString().trim() === '') {
            return t('UrunGrup_stokTakipYontemiZorunludur', 'Varsayılan Stok Takip Yöntemi seçimi zorunludur');
        }
    }

    return null;
};

export const validateUrunGrupForm = (
    formData: any,
    t: (key: string, fallback?: string) => string = (k, f) => f || k
): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    const tur = Number(formData?.tur) || 1;
    const isUrun = tur === 1;

    const fieldsToValidate = ['ad', 'tekilAd', 'kod', 'kdvGrubuId', 'varsayilanBirimId'];
    if (isUrun) {
        fieldsToValidate.push('varsayilanStokTakipTuru');
    }

    for (const fieldName of fieldsToValidate) {
        const fieldError = validateUrunGrupField(fieldName, formData?.[fieldName], formData, t);
        if (fieldError) {
            errors[fieldName] = fieldError;
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export default validateUrunGrupForm;
