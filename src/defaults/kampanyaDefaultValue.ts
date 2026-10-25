/**
 * Webakus - Ürün Yönetimi / Kampanya Formu Varsayılan Değerleri (kampanyaDefaultValue.ts)
 * 
 * Başlıca Görevleri:
 * - Kampanya belgesi ve kuralları için ilk açılış varsayılan verilerini üretmek
 * - Geçmiş kampanyalara bakarak akıllı başlangıç ve bitiş tarihi aralıklarını hesaplamak
 */

import { kampanyalarService } from '../services/KampanyalarService';

export interface KampanyaDefaultDates {
    baslangicTarihi: string;
    bitisTarihi: string;
}

/**
 * Mevcut kampanyaları inceleyerek en uygun başlangıç ve bitiş tarihlerini hesaplar.
 */
export const getKampanyaDefaultDates = async (): Promise<KampanyaDefaultDates> => {
    try {
        const res = await kampanyalarService.getAll();
        const allDocs = Array.isArray(res) ? res : (res && 'items' in res && Array.isArray((res as any).items) ? (res as any).items : []);
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        // Current month bounds (using UTC to prevent timezone shifts when converting to ISOString)
        const firstDayOfCurrentMonth = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0));
        const lastDayOfCurrentMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59));

        // Filter docs that end in the current month
        const currentMonthDocs = allDocs.filter((doc: any) => {
            if (!doc.bitisTarihi) return false;
            const end = new Date(doc.bitisTarihi);
            return end.getFullYear() === currentYear && end.getMonth() === currentMonth;
        });

        if (currentMonthDocs.length === 0) {
            // No docs end in this month, so return 1st to End of this month
            return {
                baslangicTarihi: firstDayOfCurrentMonth.toISOString().split('T')[0],
                bitisTarihi: lastDayOfCurrentMonth.toISOString().split('T')[0]
            };
        }

        // Find the maximum bitisTarihi
        let maxBitisTarihi = new Date(0);
        currentMonthDocs.forEach((doc: any) => {
            const date = new Date(doc.bitisTarihi);
            if (date > maxBitisTarihi) {
                maxBitisTarihi = date;
            }
        });

        // Check if maxBitisTarihi covers the end of the month
        const lastDayDate = lastDayOfCurrentMonth.getDate();
        
        if (maxBitisTarihi.getDate() >= lastDayDate) {
            // Current month is fully covered. Default to NEXT month.
            const firstDayOfNextMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 1, 0, 0, 0));
            const lastDayOfNextMonth = new Date(Date.UTC(currentYear, currentMonth + 2, 0, 23, 59, 59));
            
            return {
                baslangicTarihi: firstDayOfNextMonth.toISOString().split('T')[0],
                bitisTarihi: lastDayOfNextMonth.toISOString().split('T')[0]
            };
        }

        // It doesn't cover the end of the month, so start the day after maxBitisTarihi
        const nextDay = new Date(Date.UTC(maxBitisTarihi.getFullYear(), maxBitisTarihi.getMonth(), maxBitisTarihi.getDate() + 1, 0, 0, 0));

        return {
            baslangicTarihi: nextDay.toISOString().split('T')[0],
            bitisTarihi: lastDayOfCurrentMonth.toISOString().split('T')[0]
        };

    } catch (error) {
        console.error("Error fetching default dates", error);
        // Fallback to current month if error
        const now = new Date();
        return {
            baslangicTarihi: new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString().split('T')[0],
            bitisTarihi: new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)).toISOString().split('T')[0]
        };
    }
};

/**
 * Kampanya belgesi için başlangıç state nesnesini üretir.
 */
export const getKampanyaDefaultValues = (varsayilanParaBirimi: string = 'TRY') => {
    const today = new Date().toISOString().split('T')[0];
    return {
        belgeNo: '[OTOMATIK]',
        adi: '',
        baslangicTarihi: today,
        bitisTarihi: today,
        hakedisSonTarihi: undefined,
        aktifMi: true,
        kampanyalar: []
    };
};
