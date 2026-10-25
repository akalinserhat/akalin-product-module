export default class BaseGrupStrategy {
  getFields() {
    return [
      { id: 'ustGrupId', name: 'ustGrupId', label: 'Bağlı Olduğu Grup (Üst Grup)', type: 'select-grup' },
      { id: 'ad', name: 'ad', label: 'Grup Adı *', type: 'text', placeholder: 'Örn: Beyaz Eşya', autoFocus: true, required: true },
      { id: 'tekilAd', name: 'tekilAd', label: 'Grup Tekil Adı *', type: 'text', placeholder: 'Örn: Çamaşır Makinesi', required: true },
      { id: 'kod', name: 'kod', label: 'Kısa Kod (Min. 3 Karakter) *', type: 'custom-kod', placeholder: 'Örn: BEY', required: true },
      { id: 'kdvGrubuId', name: 'kdvGrubuId', label: 'Varsayılan KDV Grubu *', type: 'select-kdv', required: true }
    ];
  }
}
