/**
 * Webakus - Ürün ve Hizmet Yönetimi / Ürün & Hizmet Formu Doğrulama Kuralları (urunVeHizmetValidation.ts)
 * 
 * Başlıca Sorumlulukları:
 * - Ürün ve Hizmet kartları için anlık alan doğrulaması (validateUrunVeHizmetField)
 * - Form kaydetme öncesi genel form doğrulaması (validateUrunVeHizmetForm)
 */

export const validateUrunVeHizmetField = (
    name: string,
    value: any,
    formData: any,
    t: (key: string) => string = (k) => k
): string | null => {
    const turId = typeof formData?.urunVeHizmetTuru === 'number' ? formData.urunVeHizmetTuru : parseInt(formData?.urunVeHizmetTuru, 10) || 1;
    const isUrunType = [1, 3, 4, 5, 6, 7, 8].includes(turId);

    if (name === 'ad') {
        if (!value || value.toString().trim() === '') {
            return t('Ürün/Hizmet Adı zorunludur');
        }
    }

    if (name === 'urunVeHizmetGrubuId') {
        if (!value || value.toString().trim() === '') {
            return t('Grup seçimi zorunludur');
        }
    }

    if (name === 'kdvGrubuId') {
        if (!value && value !== 0) {
            return t('KDV oranı seçimi zorunludur');
        }
    }

    if (name === 'birimId' && isUrunType) {
        if (!value || value.toString().trim() === '' || value === 0 || value === '0') {
            return t('Birim türü seçimi zorunludur');
        }
    }

    return null;
};

export const validateUrunVeHizmetForm = (
    formData: any,
    t: (key: string) => string = (k) => k
): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    const turId = typeof formData?.urunVeHizmetTuru === 'number' ? formData.urunVeHizmetTuru : parseInt(formData?.urunVeHizmetTuru, 10) || 1;
    const isUrunType = [1, 3, 4, 5, 6, 7, 8].includes(turId);

    if (!formData.ad || formData.ad.toString().trim() === '') {
        errors.ad = t('Ürün/Hizmet Adı zorunludur');
    }

    if (!formData.urunVeHizmetGrubuId) {
        errors.urunVeHizmetGrubuId = t('Grup seçimi zorunludur');
    }

    if (!formData.kdvGrubuId && formData.kdvGrubuId !== 0) {
        errors.kdvGrubuId = t('KDV oranı seçimi zorunludur');
    }

    if (isUrunType && (!formData.birimId || formData.birimId === 0 || formData.birimId === '0')) {
        errors.birimId = t('Birim türü seçimi zorunludur');
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
