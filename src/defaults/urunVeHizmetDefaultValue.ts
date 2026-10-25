/**
 * Webakus ERP - Ürün ve Hizmet Formu Varsayılan Değerleri (urunVeHizmetDefaultValue.ts)
 * 
 * Başlıca Sorumlulukları:
 * - Yeni ürün/hizmet kartı açılışında form alanlarının başlangıç değerlerini ve varsayılan türü belirler.
 */

export interface UrunVeHizmetDefaultValuesOptions {
  initialData?: any;
}

export function getUrunVeHizmetDefaultValues(options: UrunVeHizmetDefaultValuesOptions = {}) {
  const { initialData } = options;

  let turId = 1;
  if (initialData?.urunVeHizmetTuru) {
    if (typeof initialData.urunVeHizmetTuru === 'number') {
      turId = initialData.urunVeHizmetTuru;
    } else {
      switch (initialData.urunVeHizmetTuru) {
        case 'Urun': turId = 1; break;
        case 'Hizmet': turId = 2; break;
        case 'SarfMalzemesi': turId = 3; break;
        case 'Hammadde': turId = 4; break;
        case 'Demirbas': turId = 5; break;
        case 'YariMamul': turId = 6; break;
        case 'Mamul': turId = 7; break;
        case 'PaketSet': turId = 8; break;
        default: turId = parseInt(initialData.urunVeHizmetTuru, 10) || 1;
      }
    }
  }

  const getStokTakipTuruStr = (val: any) => {
    if (val === 1 || val === '1') return 'MiktarBazli';
    if (val === 2 || val === '2') return 'SeriNoBazli';
    if (val === 3 || val === '3') return 'LotNoBazli';
    if (val === 4 || val === '4') return 'Takipsiz';
    return val || 'MiktarBazli';
  };

  const getTedarikDurumuStr = (val: any) => {
    if (val === 1 || val === '1') return 'Satista';
    if (val === 2 || val === '2') return 'TedarikAsamasinda';
    if (val === 3 || val === '3') return 'StoktaYok';
    if (val === 4 || val === '4') return 'UretimdenKalkti';
    return val || 'Satista';
  };

  return {
    kod: initialData?.kod || '????',
    urunVeHizmetTuru: turId,
    ad: initialData?.ad || '',
    aciklama: initialData?.aciklama || '',
    urunVeHizmetGrubuId: initialData?.urunVeHizmetGrubuId || '',
    markaId: initialData?.markaId || '',
    ureticiKodu: initialData?.ureticiKodu || '',
    barkod: initialData?.barkod || '',
    birimId: initialData?.birimId || '',
    kdvGrubuId: initialData?.kdvGrubuId || '',
    stokTakipTuru: getStokTakipTuruStr(initialData?.stokTakipTuru),
    tedarikDurumu: getTedarikDurumuStr(initialData?.tedarikDurumu),
    seriNoUzunlugu: initialData?.seriNoUzunlugu || '',
    seriNoOneki: initialData?.seriNoOneki || '',
    satisFiyati: initialData?.satisFiyati || '',
    alisFiyati: initialData?.alisFiyati || '',
    toptanFiyati: initialData?.toptanFiyati || '',
    karMarji: initialData?.karMarji || '',
    dovizCinsi: initialData?.dovizCinsi || 'TRY',
    tarih: initialData?.olusturulmaTarihi ? initialData.olusturulmaTarihi.split('T')[0] : (initialData?.tarih || new Date().toISOString().split('T')[0]),
    ...(initialData || {})
  };
}
