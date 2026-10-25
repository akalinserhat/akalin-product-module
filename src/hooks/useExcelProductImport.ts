/**
 * Webakus ERP - Ürün Yönetimi Excel Ürün İçe Aktarma Hook'u (useExcelProductImport)
 * 
 * Başlıca Görevleri:
 * - Excel'den gelen ham ürün/fiyat verilerini filtreler ve doğrular.
 * - /api/UrunVeHizmetKartlari/bulk-lookup servisi üzerinden ürün kodlarını topluca eşleştirir.
 * - Mevcut belge grid satırlarını günceller veya yeni ürün satırları ekler.
 */

import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export interface ExcelImportOptions {
    currentRows: any[];
    onUpdateRows: (newRows: any[]) => void;
    // (Optional) Function to map the imported row and API product into a grid row format
    rowMapper?: (importedRow: any, matchedProduct: any | null) => any;
    // (Optional) Function to completely override the import process
    customImportHandler?: (rawImportedData: any[]) => void | Promise<void>;
}

export const useExcelProductImport = () => {
    const { t } = useTranslation();

    const handleImport = async (rawImportedData: any[], options: ExcelImportOptions) => {
        if (options.customImportHandler) {
            return options.customImportHandler(rawImportedData);
        }

        const { currentRows, onUpdateRows, rowMapper } = options;

        // 1. Temel Filtreleme (Sadece Ürün Kodu olan ve Fiyatı geçerli bir sayı olan satırları filtrele)
        const importedData = rawImportedData.filter(item => {
            const codeStr = String(item.tedarikciUrunKodu || '').trim().toLowerCase();
            
            // Başlık satırının yanlışlıkla içeri alınmasını kesin olarak engelle
            if (codeStr === 'ürün kodu' || codeStr === 'urun kodu' || codeStr === 'stok kodu' || codeStr === 'tedarikçi ürün kodu' || codeStr === 'tedarikci urun kodu' || codeStr === 'barkod') {
                return false;
            }

            const hasCode = !!(item.tedarikciUrunKodu && String(item.tedarikciUrunKodu).trim() !== '');
            if (!hasCode) return false;
            if (item.fiyat == null || isNaN(Number(item.fiyat))) return false;
            return true;
        });

        if (importedData.length === 0) {
            toast.error(t('Aktarılacak geçerli veri bulunamadı.'));
            return;
        }

        // Grid'deki mevcut satırlar
        const newKalemler = [...(currentRows || [])];
        
        // Eğer gridde sadece 1 tane boş satır varsa onu temizle
        const isEmptyRow = (row: any) => !row.urunVeHizmetKartiId && !row.tedarikciUrunKodu;
        if (newKalemler.length === 1 && isEmptyRow(newKalemler[0])) {
            newKalemler.pop();
        }

        // 2. Ürün Eşleştirme (API)
        const uniqueCodes = [...new Set(importedData.map(i => i.tedarikciUrunKodu ? String(i.tedarikciUrunKodu).trim() : ''))].filter(Boolean);
        let productMap: Record<string, any> = {};

        if (uniqueCodes.length > 0) {
            const toastId = toast.loading(t('Ürünler eşleştiriliyor...'));
            try {
                const res = await axios.post('/api/UrunVeHizmetKartlari/bulk-lookup', uniqueCodes);
                res.data.forEach((p: any) => {
                    const kod = p.kod || p.Kod;
                    const ureticiKodu = p.ureticiKodu || p.UreticiKodu;
                    const barkod = p.barkod || p.Barkod;
                    
                    const kdvOrani = p.kdvOrani || p.KdvOrani || 0;
                    const mappedProduct = { ...p, Id: p.id || p.Id, KdvOrani: kdvOrani };

                    if (kod) productMap[String(kod).trim().toUpperCase()] = mappedProduct;
                    if (ureticiKodu) productMap[String(ureticiKodu).trim().toUpperCase()] = mappedProduct;
                    if (barkod) productMap[String(barkod).trim().toUpperCase()] = mappedProduct;
                });
                toast.dismiss(toastId);
            } catch (err: any) {
                console.error("Bulk lookup failed", err);
                toast.dismiss(toastId);
                toast.error(t('Ürün eşleştirme sırasında bir hata oluştu. Eşleştirme yapılmadan devam edilecek.'));
            }
        }

        let eklendiCount = 0;
        let guncellendiCount = 0;

        // 3. Grid Güncelleme/Ekleme
        importedData.forEach(item => {
            const code = item.tedarikciUrunKodu ? String(item.tedarikciUrunKodu).trim() : '';
            const lookupCode = code.toUpperCase();
            
            const matchedProduct = lookupCode ? productMap[lookupCode] : null;

            // Satır formatlayıcı çağrısı (Eğer yoksa varsayılan mantık çalışır)
            let processedRow = rowMapper ? rowMapper(item, matchedProduct) : null;
            
            if (!processedRow) {
                processedRow = {
                    tedarikciUrunKodu: code,
                    fiyat: item.fiyat,
                    ...(matchedProduct ? {
                        urunVeHizmetKartiId: matchedProduct.Id,
                        urunVeHizmetAdi: matchedProduct.ad || matchedProduct.Ad,
                        aramaMetni: matchedProduct.ad || matchedProduct.Ad
                    } : {})
                };
            }

            // Grid'de bu ürün kodu zaten var mı?
            const existingIndex = newKalemler.findIndex(k => {
                const kCode = k.tedarikciUrunKodu ? String(k.tedarikciUrunKodu).trim().toUpperCase() : '';
                return kCode === lookupCode && lookupCode !== '';
            });

            if (existingIndex > -1) {
                newKalemler[existingIndex] = {
                    ...newKalemler[existingIndex],
                    ...processedRow
                };
                guncellendiCount++;
            } else {
                newKalemler.push({
                    id: Date.now() + Math.random(),
                    ...processedRow
                });
                eklendiCount++;
            }
        });

        // 4. State Güncelleme ve Bildirim
        onUpdateRows(newKalemler);
        
        if (eklendiCount > 0 && guncellendiCount > 0) {
            toast.success(t(`${eklendiCount} yeni satır eklendi, ${guncellendiCount} mevcut satır güncellendi.`));
        } else if (eklendiCount > 0) {
            toast.success(t(`${eklendiCount} satır başarıyla eklendi.`));
        } else if (guncellendiCount > 0) {
            toast.success(t(`${guncellendiCount} satır başarıyla güncellendi.`));
        } else {
            toast.success(t('İşlem tamamlandı, eklenecek/güncellenecek veri bulunamadı.'));
        }
    };

    return { handleImport };
};
