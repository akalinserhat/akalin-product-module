import BaseUrunVeHizmetStrategy from './BaseUrunVeHizmetStrategy';

export default class UrunStrategy extends BaseUrunVeHizmetStrategy {
  getFields(tabId) {
    const baseFields = super.getFields(tabId);
    
    if (tabId !== 'genel') return baseFields; // Sadece genel sekmesine alan ekliyoruz
    
    const markaField = { id: 'markaId', name: 'markaId', label: 'Marka', type: 'custom-marka-select' };
    const ureticiKoduField = { id: 'ureticiKodu', name: 'ureticiKodu', label: 'Üretici Kodu', type: 'custom-ureticiKodu', placeholder: 'Örn: MNF-001' };
    const birimField = { id: 'birimId', name: 'birimId', label: 'Birim Türü', type: 'custom-birim-select' };
    const tedarikField = { 
        id: 'tedarikDurumu', name: 'tedarikDurumu', label: 'Tedarik Durumu', type: 'custom-tedarik-select'
    };

    const stokTakipField = { 
        id: 'stokTakipTuru', name: 'stokTakipTuru', label: 'Stok Takip Yönetimi', type: 'custom-stoktakip-select'
    };
    
    const seriNoUzunluguField = { id: 'seriNoUzunlugu', name: 'seriNoUzunlugu', label: 'Seri No Uzunluğu', type: 'custom-serino-uzunluk' };
    const seriNoOnekiField = { id: 'seriNoOneki', name: 'seriNoOneki', label: 'Seri No Ön Eki', type: 'custom-serino-onek' };

    const kodField = baseFields.find((f: any) => f.id === 'kod') as any;
    if (kodField) kodField.label = 'Ürün Kodu';
    const adField = baseFields.find((f: any) => f.id === 'ad') as any;
    if (adField) {
        adField.label = 'Ürün Adı *';
        adField.placeholder = 'Ürün adı...';
    }
    const grupField = baseFields.find((f: any) => f.id === 'urunVeHizmetGrubuId') as any;
    if (grupField) grupField.label = 'Ürün Grubu';

    const newFields: any[] = [];
    baseFields.forEach((field: any) => {
        if (field.id === 'urunVeHizmetGrubuId') {
            newFields.push(markaField);
            newFields.push(field);
        } else if (field.id === 'kod') {
            newFields.push(ureticiKoduField);
            newFields.push(field);
        } else if (field.id === 'kdvGrubuId') {
            newFields.push(birimField);
            newFields.push(field);
            newFields.push(stokTakipField);
            newFields.push(seriNoUzunluguField);
            newFields.push(seriNoOnekiField);
            newFields.push(tedarikField);
        } else {
            newFields.push(field);
        }
    });

    return newFields;
  }
}
