import BaseFormStrategy from '../../forms/BaseFormStrategy';

export default class BaseUrunVeHizmetStrategy extends BaseFormStrategy {
  isUrunType: boolean;
  hasBarkodModulu: boolean;

  constructor(isUrunType = true, hasBarkodModulu = false) {
    super();
    this.isUrunType = isUrunType;
    this.hasBarkodModulu = hasBarkodModulu;
  }

  getTabs() {
    const tabs = [
      { id: 'genel', label: 'Genel', icon: 'Info' },
      { id: 'fiyatlar', label: 'Fiyatlandırma', icon: 'Layers' },
      { id: 'ozellikler', label: 'Ürün Özellikleri', icon: 'Layers' }
    ];
    if (this.isUrunType && this.hasBarkodModulu) {
      tabs.push({ id: 'barkodlar', label: 'Barkodlar', icon: 'Barcode' });
    }
    return tabs;
  }

  getFields(tabId: string) {
    if (tabId === 'genel') {
      return [
        { id: 'urunVeHizmetTuru', name: 'urunVeHizmetTuru', label: 'Kart Türü', type: 'custom-urun-turu-select', required: true },
        { id: 'tarih', name: 'tarih', label: 'Tarih', type: 'date', autoFocus: true },
        { id: 'urunVeHizmetGrubuId', name: 'urunVeHizmetGrubuId', label: 'Grup', type: 'custom-tree', required: true },
        { id: 'kod', name: 'kod', label: 'Sistem Kodu', type: 'text', placeholder: 'Sistem tarafından verilir', hidden: true },
        { id: 'barkod', name: 'barkod', label: 'Ana Barkod', type: 'barcode-input', placeholder: 'Barkod giriniz veya okutunuz...' },
        { id: 'ad', name: 'ad', label: 'Adı *', type: 'text', placeholder: 'İsim giriniz...', required: true, gridColumn: '1 / -1', hidden: true },
        { id: 'aciklama', name: 'aciklama', label: 'Kart Açıklaması / Alt Başlık', type: 'text', placeholder: 'Açıklama giriniz...', gridColumn: '1 / -1', hidden: true },
        { id: 'kdvGrubuId', name: 'kdvGrubuId', label: 'Varsayılan KDV Oranı', type: 'custom-kdv-selector', required: true }
      ];
    } else if (tabId === 'fiyatlar') {
      return [
        { id: 'alisFiyati', name: 'alisFiyati', label: 'Alış Fiyatı', type: 'currency', placeholder: '0,00' },
        { id: 'satisFiyati', name: 'satisFiyati', label: 'Satış Fiyatı (KDV Hariç)', type: 'currency', placeholder: '0,00' },
        { id: 'toptanFiyati', name: 'toptanFiyati', label: 'Toptan Satış Fiyatı', type: 'currency', placeholder: '0,00' },
        { id: 'karMarji', name: 'karMarji', label: 'Kâr Marjı (%)', type: 'number', placeholder: '0' },
        { id: 'dovizCinsi', name: 'dovizCinsi', label: 'Para Birimi', type: 'custom-doviz-select', placeholder: 'TRY' }
      ];
    } else if (tabId === 'ozellikler') {
      return [{ id: 'ozellikler', name: 'ozellikler', type: 'custom', gridColumn: '1 / -1' }];
    } else if (tabId === 'barkodlar') {
      return [{ id: 'barkodlar', name: 'barkodlar', type: 'custom', gridColumn: '1 / -1' }];
    }
    return [];
  }
}
