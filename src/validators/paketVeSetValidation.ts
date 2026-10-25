import { IPaketVeSet, IPaketVeSetKalemi, PaketKalemTuru } from '../dtos/PaketVeSetDto';

export function isKalemFilled(k: IPaketVeSetKalemi): boolean {
    if (!k) return false;
    if (k.kalemTuru === PaketKalemTuru.UrunGrubu) {
        return Boolean(k.urunVeHizmetGrubuId && Number(k.urunVeHizmetGrubuId) > 0);
    }
    return Boolean(k.urunVeHizmetKartiId && Number(k.urunVeHizmetKartiId) > 0);
}

export function validatePaketVeSetField(
    fieldName: string,
    value: any,
    t: any = (k: string) => k
): string | null {
    switch (fieldName) {
        case 'kod':
            if (!value || (typeof value === 'string' && !value.trim())) {
                return t('Paket/Set Kodu zorunludur');
            }
            break;
        case 'ad':
            if (!value || (typeof value === 'string' && !value.trim())) {
                return t('Paket/Set Adı zorunludur');
            }
            break;
        default:
            break;
    }
    return null;
}

export function validatePaketVeSetForm(
    data: IPaketVeSet,
    t: any = (k: string) => k
): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!data.kod || !data.kod.trim()) {
        errors.kod = t('Paket/Set Kodu zorunludur');
    }

    if (!data.ad || !data.ad.trim()) {
        errors.ad = t('Paket/Set Adı zorunludur');
    }

    const kalemler = data.kalemler || [];
    const validKalemler = kalemler.filter(isKalemFilled);

    if (validKalemler.length === 0) {
        errors.kalemler = t('auto_paket_set_urun_secimi_zorunlu', 'Paket/Set kalemlerinde ürün seçimi zorunludur. Lütfen en az bir ürün veya ürün grubu seçiniz.');
        return errors;
    }

    // Kullanıcının etkileşime girdiği ancak ürün seçmediği satır var mı?
    const yarimDoluKalem = kalemler.find(k => {
        const hasInteraction = Boolean(
            (k.urunKodu && k.urunKodu.trim()) ||
            (k.urunAdi && k.urunAdi.trim()) ||
            (k.urunGrubuKodu && k.urunGrubuKodu.trim()) ||
            (k.urunGrubuAdi && k.urunGrubuAdi.trim()) ||
            k.birimId ||
            (k.aciklama && k.aciklama.trim())
        );
        return hasInteraction && !isKalemFilled(k);
    });

    if (yarimDoluKalem) {
        errors.kalemler = t('auto_paket_set_urun_secimi_zorunlu', 'Paket/Set kalemlerinde ürün seçimi zorunludur. Lütfen tüm satırlar için ürün veya grup seçiniz.');
        return errors;
    }

    // Miktar kontrolü: Miktar 1'den küçük olamaz
    const gecersizMiktarKalem = validKalemler.find(k => k.miktar === undefined || k.miktar === null || Number(k.miktar) < 1);
    if (gecersizMiktarKalem) {
        errors.kalemler = t('auto_paket_set_miktar_birden_kucuk_olamaz', 'Paket/Set kalemlerinde miktar 1\'den küçük olamaz.');
        return errors;
    }

    // Birim kontrolü: Birim seçimi zorunludur
    const birimsizKalem = validKalemler.find(k => !k.birimId || Number(k.birimId) <= 0);
    if (birimsizKalem) {
        errors.kalemler = t('auto_paket_set_kalem_birim_zorunlu', 'Paket/Set kalemlerinde birim seçimi zorunludur. Lütfen tüm satırlar için birim seçiniz.');
        return errors;
    }

    return errors;
}
