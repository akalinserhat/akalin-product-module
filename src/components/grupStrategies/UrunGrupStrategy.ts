import BaseGrupStrategy from './BaseGrupStrategy';

export default class UrunGrupStrategy extends BaseGrupStrategy {
  getFields() {
    return [
      ...super.getFields(),
      { id: 'varsayilanBirimId', name: 'varsayilanBirimId', label: 'Varsayılan Birim *', type: 'custom-birim-tree', required: true },
      { 
        id: 'varsayilanStokTakipTuru', name: 'varsayilanStokTakipTuru', label: 'Varsayılan Stok Takip Yöntemi *', type: 'custom-stoktakip-select', required: true
      },
      { id: 'ozellikTanimiIds', name: 'ozellikTanimiIds', label: 'Kategori Özellikleri (Şablonlar)', type: 'custom-ozellik' },
      { id: 'aktifMi', name: 'aktifMi', label: 'Aktif Kullanımda', type: 'checkbox' },
      { id: 'webdeGosterilsinMi', name: 'webdeGosterilsinMi', label: "Web/E-Ticaret'te Göster", type: 'checkbox' }
    ];
  }
}
