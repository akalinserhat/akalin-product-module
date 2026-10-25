import BaseGrupStrategy from './BaseGrupStrategy';

export default class HizmetGrupStrategy extends BaseGrupStrategy {
  getFields(): any[] {
    const fields = super.getFields().map(field => {
      if (field.name === 'ad') return { ...field, label: 'Hizmet Grubu Adı *', placeholder: 'Örn: Danışmanlık' };
      if (field.name === 'tekilAd') return { ...field, label: 'Hizmet Tekil Adı *', placeholder: 'Örn: Finans Danışmanlığı' };
      if (field.name === 'kod') return { ...field, placeholder: 'Örn: DAN' };
      return field;
    });

    return [
      ...fields,
      { id: 'varsayilanBirimId', name: 'varsayilanBirimId', label: 'Varsayılan Birim *', type: 'custom-birim-tree', required: true },
      { id: 'ozellikTanimiIds', name: 'ozellikTanimiIds', label: 'Hizmet Özellikleri (Şablonlar)', type: 'custom-ozellik' },
      { id: 'aktifMi', name: 'aktifMi', label: 'Aktif Kullanımda', type: 'checkbox' },
      { id: 'webdeGosterilsinMi', name: 'webdeGosterilsinMi', label: "Web/E-Ticaret'te Göster", type: 'checkbox' }
    ];
  }
}
