/**
 * Webakus ERP - BSH Fiyat Farkı Belgesi Varsayılan Değerleri ve KDV Hesaplama Yardımcıları (bshFiyatFarkiDefaultValue.ts)
 *
 * Başlıca Görevleri:
 * - BSH Fiyat Farkı belgesi ve satırları için ilk açılış varsayılan değerlerini üretir.
 * - KDV listesinden en yüksek KDV oranını tespit eder.
 * - Satırlarda KDV Oranı, KDV Hariç Fiyat ve KDV Dahil Fiyat arasındaki çift yönlü hesaplamaları yönetir.
 */

export interface BshFiyatFarkiDefaultValuesOptions {
    isEditMode?: boolean;
    initialData?: any;
    defaultKdvOrani?: number;
    defaultKdvGrubuId?: any;
}

/**
 * Bir KDV grubu nesnesinden aktif KDV oranını sayısal olarak çözümler.
 */
export const getKdvOran = (kdv: any): number => {
    if (!kdv) return 0;
    if (kdv.oranlar && Array.isArray(kdv.oranlar) && kdv.oranlar.length > 0) {
        const sorted = [...kdv.oranlar].sort(
            (a: any, b: any) => new Date(b.baslangicTarihi).getTime() - new Date(a.baslangicTarihi).getTime()
        );
        return Number(sorted[0].oran ?? 0);
    }
    return Number(kdv.aktifOran ?? kdv.oran ?? kdv.kdvOrani ?? kdv.deger ?? 0);
};

/**
 * KDV listesi içerisindeki en yüksek KDV oranına sahip grubu ve oranını döndürür.
 */
export const getMaxKdvGrubu = (kdvGruplari: any[]): { id: any; oran: number } | null => {
    if (!Array.isArray(kdvGruplari) || kdvGruplari.length === 0) return null;
    let maxItem = kdvGruplari[0];
    let maxOran = getKdvOran(maxItem);

    for (let i = 1; i < kdvGruplari.length; i++) {
        const oran = getKdvOran(kdvGruplari[i]);
        if (oran > maxOran) {
            maxOran = oran;
            maxItem = kdvGruplari[i];
        }
    }

    return {
        id: maxItem.id !== undefined ? maxItem.id : maxItem.Id,
        oran: maxOran
    };
};

/**
 * Verilen KDV grubu ID'si veya KDV oranına göre sistemdeki KDV listesinden eşleşen grup ID'sini bulur.
 */
export const resolveKdvGrubuId = (kdvGruplari: any[], kdvGrubuId?: any, kdvOrani?: any): any => {
    if (!Array.isArray(kdvGruplari) || kdvGruplari.length === 0) {
        return kdvGrubuId ?? '';
    }
    if (kdvGrubuId !== undefined && kdvGrubuId !== null && kdvGrubuId !== '') {
        const byId = kdvGruplari.find((k: any) => String(k.id ?? k.Id) === String(kdvGrubuId));
        if (byId) return byId.id ?? byId.Id;
    }
    if (kdvOrani !== undefined && kdvOrani !== null && kdvOrani !== '') {
        const targetOran = Number(kdvOrani);
        const byOran = kdvGruplari.find((k: any) => Number(getKdvOran(k)) === targetOran);
        if (byOran) return byOran.id ?? byOran.Id;
    }
    return '';
};

/**
 * Satırdaki KDV oranına ve fiyat giriş yönüne ('haric' | 'dahil') göre
 * KDV Hariç Fiyat ve KDV Dahil Fiyat (fiyat) değerlerini hesaplar.
 */
export const calculateBshKalemPrices = (params: {
    fiyatGirisYonu?: 'haric' | 'dahil';
    kdvHaricFiyat?: number;
    fiyat?: number;
    kdvOrani?: number;
}): { kdvHaricFiyat: number; fiyat: number } => {
    const oran = Number(params.kdvOrani ?? 0);
    const carpan = 1 + oran / 100;

    if (params.fiyatGirisYonu === 'haric') {
        const haric = Number(Number(params.kdvHaricFiyat ?? 0).toFixed(2));
        const dahil = Number((haric * carpan).toFixed(2));
        return { kdvHaricFiyat: haric, fiyat: dahil };
    }

    const dahil = Number(Number(params.fiyat ?? 0).toFixed(2));
    const haric = carpan > 0 ? Number((dahil / carpan).toFixed(2)) : dahil;
    return { kdvHaricFiyat: haric, fiyat: dahil };
};

/**
 * BSH Fiyat Farkı belgesi için tekil boş satır üretir.
 */
export const createEmptyBshFiyatFarkiKalem = (
    kdvOrani: number = 0,
    kdvGrubuId: any = null,
    id: number = Date.now()
) => ({
    id,
    urunVeHizmetKartiId: null,
    urunVeHizmetAdi: '',
    aramaMetni: '',
    tedarikciUrunKodu: '',
    kdvGrubuId,
    kdvOrani,
    kdvHaricFiyat: 0,
    fiyat: 0,
    fiyatGirisYonu: 'dahil' as 'haric' | 'dahil'
});

/**
 * BSH Fiyat Farkı belgesi için başlangıç state nesnesini üretir.
 */
export const getBshFiyatFarkiDefaultValues = (options: BshFiyatFarkiDefaultValuesOptions = {}) => {
    const { isEditMode = false, initialData, defaultKdvOrani = 0, defaultKdvGrubuId = null } = options;
    const headerKdvOrani = initialData?.kdvOrani !== undefined && initialData?.kdvOrani !== null
        ? Number(initialData.kdvOrani)
        : defaultKdvOrani;
    const headerKdvGrubuId = initialData?.kdvGrubuId ?? defaultKdvGrubuId;

    return {
        belgeNo: initialData?.belgeNo || (isEditMode ? '' : '[OTOMATİK]'),
        baslangicTarihi: initialData?.baslangicTarihi
            ? initialData.baslangicTarihi.substring(0, 10)
            : new Date().toISOString().substring(0, 10),
        bitisTarihi: initialData?.bitisTarihi ? initialData.bitisTarihi.substring(0, 10) : '',
        aciklama: initialData?.aciklama || '',
        kdvOrani: headerKdvOrani,
        kdvGrubuId: headerKdvGrubuId,
        kalemler:
            initialData?.kalemler && initialData.kalemler.length > 0
                ? initialData.kalemler
                : isEditMode
                ? []
                : [createEmptyBshFiyatFarkiKalem(headerKdvOrani, headerKdvGrubuId)]
    };
};

