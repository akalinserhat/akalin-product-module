import BaseUrunVeHizmetStrategy from './BaseUrunVeHizmetStrategy';

export default class HizmetStrategy extends BaseUrunVeHizmetStrategy {
  getTabs() {
    return [
      { id: 'genel', label: 'Genel', icon: 'Info' },
      { id: 'fiyatlar', label: 'Fiyatlandırma', icon: 'Layers' },
      { id: 'ozellikler', label: 'Hizmet Özellikleri', icon: 'Layers' }
    ];
  }

  getFields(tabId: string) {
    const baseFields = super.getFields(tabId);
    
    if (tabId !== 'genel') return baseFields;

    // Hizmet Kodu (Üretici Kodu alanını kullanıyor)
    const hizmetKoduField = { id: 'ureticiKodu', name: 'ureticiKodu', label: 'Hizmet Kodu', type: 'custom-ureticiKodu', placeholder: 'Örn: HZM-001' };

    const kodField = baseFields.find((f: any) => f.id === 'kod') as any;
    if (kodField) kodField.label = 'Sistem Kodu';
    const adField = baseFields.find((f: any) => f.id === 'ad') as any;
    if (adField) {
        adField.label = 'Hizmet Adı *';
        adField.placeholder = 'Hizmet adı...';
    }
    const grupField = baseFields.find((f: any) => f.id === 'urunVeHizmetGrubuId') as any;
    if (grupField) grupField.label = 'Hizmet Grubu';

    const newFields: any[] = [];
    baseFields.forEach((field: any) => {
        if (field.id === 'kod') {
            newFields.push(hizmetKoduField);
            newFields.push(field);
        } else {
            newFields.push(field);
        }
    });

    return newFields;
  }
}
