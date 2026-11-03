/**
 * Webakus - Ürün Yönetimi / Fiyat Listesi Formu Varsayılan Değerleri (fiyatListesiDefaultValue.ts)
 * 
 * Başlıca Görevleri:
 * - Fiyat listesi belgesi ve kalemleri için ilk açılış varsayılan verilerini üretmek
 * - Akıllı başlangıç ve bitiş tarihi aralıklarını hesaplamak (bugün - ay sonu)
 * - ActionMenu için Excel içe aktarım ve Kaydet varsayılan buton durumlarını yönetmek
 */

export interface FiyatListesiDefaultValues {
    belgeGuid: string;
    belgeNo: string;
    baslangicTarihi: string;
    bitisTarihi: string;
    cariId: number | null;
    cariUnvani: string;
    fiyatListesiTanimiId: number | null;
    aciklama: string;
    kampanyaMi: boolean;
    kalemler: any[];
    isExcelImported: boolean;
}

export interface FiyatListesiDefaultValuesOptions {
    isEditMode?: boolean;
    initialData?: any;
}

/**
 * Fiyat listesi belgesi için başlangıç ve bitiş tarihlerini hesaplar.
 * Varsayılan: Bugün ile geçerli ayın son günü.
 */
export const getFiyatListesiDefaultDates = (): { baslangicTarihi: string; bitisTarihi: string } => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    // Ayın son günü (UTC)
    const endOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0)).toISOString().split('T')[0];
    return {
        baslangicTarihi: today,
        bitisTarihi: endOfMonth
    };
};

/**
 * Fiyat listesi için tekil boş kalem üretir.
 */
export function createEmptyFiyatListesiKalem(id: number = Date.now()) {
    return {
        id,
        urunVeHizmetKartiId: null,
        tedarikciUrunKodu: '',
        fiyat: 0,
        valorTarihi: ''
    };
}

/**
 * Fiyat listesi belgesi için başlangıç state nesnesini üretir.
 */
export const getFiyatListesiDefaultValues = (options: FiyatListesiDefaultValuesOptions = {}): FiyatListesiDefaultValues => {
    const { isEditMode = false, initialData } = options;
    const defaultDates = getFiyatListesiDefaultDates();

    return {
        belgeGuid: initialData?.belgeGuid || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
        belgeNo: initialData?.belgeNo || (isEditMode ? '' : '[OTOMATİK]'),
        baslangicTarihi: initialData?.baslangicTarihi ? initialData.baslangicTarihi.substring(0, 10) : defaultDates.baslangicTarihi,
        bitisTarihi: initialData?.bitisTarihi ? initialData.bitisTarihi.substring(0, 10) : defaultDates.bitisTarihi,
        cariId: initialData?.cariId ?? null,
        cariUnvani: initialData?.cariUnvani || initialData?.cariUnvan || '',
        fiyatListesiTanimiId: initialData?.fiyatListesiTanimiId ?? null,
        aciklama: initialData?.aciklama || '',
        kampanyaMi: initialData?.kampanyaMi ?? false,
        kalemler: initialData?.kalemler && initialData.kalemler.length > 0 
            ? initialData.kalemler 
            : (isEditMode ? [] : [createEmptyFiyatListesiKalem()]),
        isExcelImported: initialData?.isExcelImported ?? false
    };
};
