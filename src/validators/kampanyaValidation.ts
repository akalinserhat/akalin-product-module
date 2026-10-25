/**
 * Webakus - Ürün Yönetimi / Kampanya Formu Doğrulama Kuralları (kampanyaValidation.ts)
 * 
 * Başlıca Görevleri:
 * - Kampanya ve kural tanımları için alan kontrollerini ve hata mesajlarını saf (pure) fonksiyon olarak yönetmek
 * - İndirim, hakediş ve cari katılım koşullarının geçerliliğini doğrulamak
 */

export interface KampanyaValidationOptions {
    isIndirimActive?: boolean;
    isHakedisActive?: boolean;
    t?: (key: string) => string;
}

export const validateKampanya = (
    localKampanya: any, 
    isIndirimActive: boolean = true, 
    isHakedisActive: boolean = false,
    t: any = (k: string, d?: string) => d || k
): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!localKampanya?.kodu?.trim()) {
        newErrors.kodu = t('Kampanya kodu zorunludur.');
    }

    if (!localKampanya?.adi?.trim()) {
        newErrors.adi = t('Kampanya adı zorunludur.');
    }

    // Kurallar boş bırakıldığında kampanya tüm sepet için koşulsuz geçerlidir (ERP standardı)

    if (!isIndirimActive && !isHakedisActive) {
        newErrors.indirimHakedis = t('İndirim veya Hakedişten en az birini aktif etmelisiniz.');
    }

    if (isIndirimActive) {
        if (!localKampanya?.indirimTuru) {
            newErrors.indirimTuru = t('İndirim türü seçmelisiniz.');
        }
        if (!localKampanya?.aksiyonDegeri || Number(localKampanya.aksiyonDegeri) <= 0) {
            newErrors.aksiyonDegeri = t('İndirim değeri girmelisiniz.');
        }
    }

    if (isHakedisActive) {
        if (!localKampanya?.hakedisTuru) {
            newErrors.hakedisTuru = t('Hakediş türü seçmelisiniz.');
        }
        if (localKampanya?.hakedisTuru === 3) {
            if (!localKampanya?.fiyatFarkiBelgesiId) {
                newErrors.fiyatFarkiBelgesiId = t('Fiyat farkı belgesi seçmelisiniz.');
            }
        } else {
            if (!localKampanya?.firmaHakEdisTutari || Number(localKampanya.firmaHakEdisTutari) <= 0) {
                newErrors.firmaHakEdisTutari = t('Hakediş tutarı/oranı girmelisiniz.');
            }
        }
    }

    // Cari Katılım Koşulları Validasyonu
    if (!localKampanya?.cariKatilimZamanAraligi) {
        newErrors.cariKatilimZamanAraligi = t('Yararlanma periyodu seçmelisiniz.');
    } else if (localKampanya.cariKatilimZamanAraligi === 6) { // Belirli Bir Sürede (Gün)
        if (!localKampanya?.cariKatilimPeriyotSuresiGun || Number(localKampanya.cariKatilimPeriyotSuresiGun) <= 0) {
            newErrors.cariKatilimPeriyotSuresiGun = t('Periyot süresi 0\'dan büyük olmalıdır.');
        }
    }

    if (!localKampanya?.cariKatilimSiniriTuru) {
        newErrors.cariKatilimSiniriTuru = t('Katılım sınırı seçmelisiniz.');
    } else if (localKampanya.cariKatilimSiniriTuru === 2) { // Belirli Sayıda
        if (!localKampanya?.cariKatilimSayisi || Number(localKampanya.cariKatilimSayisi) <= 0) {
            newErrors.cariKatilimSayisi = t('Katılım sayısı 0\'dan büyük olmalıdır.');
        }
    }

    // Birleşim & Öncelik Validasyonları
    if (localKampanya?.birlesmeKurali === 5) {
        if (!localKampanya?.birlestirilebilirKampanyaIdleri || localKampanya.birlestirilebilirKampanyaIdleri.length === 0) {
            newErrors.birlestirilebilirKampanyaIdleri = t('auto_whitelist_en_az_bir_secim', 'Yalnızca seçilenlerle birleştirilebilir kuralı için en az bir kampanya seçmelisiniz.');
        }
    }
    if (localKampanya?.birlesmeKurali === 6) {
        if (!localKampanya?.birlestirilemezKampanyaIdleri || localKampanya.birlestirilemezKampanyaIdleri.length === 0) {
            newErrors.birlestirilemezKampanyaIdleri = t('auto_blacklist_en_az_bir_secim', 'Seçilenler hariç birleştirilebilir kuralı için hariç tutulacak en az bir kampanya seçmelisiniz.');
        }
    }
    if (localKampanya?.oncelik !== undefined && (Number(localKampanya.oncelik) < 1 || Number(localKampanya.oncelik) > 100)) {
        newErrors.oncelik = t('auto_oncelik_araligi_hata', 'Öncelik değeri 1 ile 100 arasında olmalıdır.');
    }
    if (localKampanya?.maksimumToplamIskontoOrani !== undefined && (Number(localKampanya.maksimumToplamIskontoOrani) < 0 || Number(localKampanya.maksimumToplamIskontoOrani) > 100)) {
        newErrors.maksimumToplamIskontoOrani = t('auto_maksimum_iskonto_hata', 'Maksimum iskonto tavanı %0 ile %100 arasında olmalıdır.');
    }

    return newErrors;
};

export const validateKampanyaBelgesiForm = (
    formData: { adi?: string; baslangicTarihi?: string; bitisTarihi?: string },
    t: any = (k: string, d?: string) => d || k
): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!formData?.adi?.trim()) {
        newErrors.adi = t('Zorunlu Alan');
    }
    if (!formData?.baslangicTarihi) {
        newErrors.baslangicTarihi = t('Zorunlu Alan');
    }
    if (!formData?.bitisTarihi) {
        newErrors.bitisTarihi = t('Zorunlu Alan');
    }

    return newErrors;
};
