import { TFunction } from 'i18next';

export interface FiyatListesiTanimFormData {
    kod: string;
    ad: string;
    aciklama?: string;
    fiyatTuru: number;
    dovizCinsi: string;
    kdvDahilMi: boolean;
    aktifMi: boolean;
}

export const validateFiyatListesiTanimField = (
    field: keyof FiyatListesiTanimFormData,
    value: any,
    t: TFunction
): string => {
    if (field === 'kod') {
        if (!value || !String(value).trim()) {
            return t('FiyatListesi_errKodZorunlu', 'Liste Kodu zorunludur.');
        }
    }
    if (field === 'ad') {
        if (!value || !String(value).trim()) {
            return t('FiyatListesi_errAdZorunlu', 'Liste Adı zorunludur.');
        }
    }
    return '';
};

export const validateFiyatListesiTanimForm = (
    data: FiyatListesiTanimFormData,
    t: TFunction
): Record<string, string> => {
    const errors: Record<string, string> = {};
    const kodError = validateFiyatListesiTanimField('kod', data.kod, t);
    if (kodError) errors.kod = kodError;

    const adError = validateFiyatListesiTanimField('ad', data.ad, t);
    if (adError) errors.ad = adError;

    return errors;
};
