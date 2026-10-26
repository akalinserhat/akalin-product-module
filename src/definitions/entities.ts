/**
 * @akalin/product_module - Tescilli Kart ve Belge Tanımları (entities.ts)
 * Modüle ait tüm kartlar, belgeler ve raporlar bu kütükte register edilir.
 * Bu kütükte tescil edilmemiş hiçbir liste, kart veya belge menüde gösterilmez ve açılamaz.
 */

import type { IModuleEntityDefinition } from '@akalin/module_core';

export const productCards: IModuleEntityDefinition[] = [
  {
    id: 'urun',
    category: 'kart',
    titleKey: 'Ürün ve Hizmet Kartı',
    title: 'Ürün ve Hizmet Kartı',
    description: 'Ticari mal, hammadde, yarı mamul, masraf ve hizmet kartları',
    route: '/urunVeHizmetler',
    listRoute: '/urunVeHizmetler',
    formRoute: '/urunVeHizmetler/:id',
    useStandardCrud: true,
    showInMenu: true,
    isRegistered: true,
    customActions: [
      { action: 'fiyat-degistir', labelKey: 'Fiyat Değiştirme', description: 'Satış fiyatlarını ve KDV oranlarını düzenleme' },
      { action: 'maliyet-gor', labelKey: 'Maliyet Görme', description: 'Ürün alış ve maliyet fiyatlarını görme' }
    ]
  },
  {
    id: 'kategori',
    category: 'kart',
    titleKey: 'Ürün Grubu ve Kategori',
    title: 'Ürün Grubu ve Kategori',
    description: 'Hiyerarşik ürün ana grupları, alt kategoriler ve reyon tanımları',
    route: '/urun-gruplari',
    listRoute: '/urun-gruplari',
    formRoute: '/urun-gruplari/:id',
    useStandardCrud: true,
    showInMenu: true,
    isRegistered: true
  },
  {
    id: 'paket-set',
    category: 'kart',
    titleKey: 'Paket & Set Kartı',
    title: 'Paket & Set Kartı',
    description: 'Birden fazla ürünün bir arada sunulduğu paket ve set tanımları',
    route: '/paket-ve-setler',
    listRoute: '/paket-ve-setler',
    formRoute: '/paket-ve-setler/:id',
    useStandardCrud: true,
    showInMenu: true,
    isRegistered: true
  },
  {
    id: 'fiyat-listesi',
    category: 'kart',
    titleKey: 'Fiyat Listesi',
    title: 'Fiyat Listesi',
    description: 'Müşteri gruplarına ve para birimlerine göre belirlenmiş özel fiyat listeleri',
    route: '/fiyat-listeleri',
    listRoute: '/fiyat-listeleri',
    formRoute: '/fiyat-listeleri/:id',
    useStandardCrud: true,
    showInMenu: true,
    isRegistered: true
  },
  {
    id: 'kampanya',
    category: 'kart',
    titleKey: 'Kampanyalar',
    title: 'Kampanyalar',
    description: 'Promosyon, indirim ve dinamik satış kampanya kuralları',
    route: '/kampanyalar',
    listRoute: '/kampanyalar',
    formRoute: '/kampanyalar/yeni',
    useStandardCrud: true,
    showInMenu: true,
    isRegistered: true
  },
  {
    id: 'bsh-fiyat-farki',
    category: 'kart',
    titleKey: 'BSH Fiyat Farkı',
    title: 'BSH Fiyat Farkı',
    description: 'BSH entegrasyonu fiyat farkı mutabakat ve analiz listeleri',
    route: '/bsh-fiyat-farki',
    listRoute: '/bsh-fiyat-farki',
    formRoute: '/bsh-fiyat-farki/duzenle/:id',
    useStandardCrud: true,
    showInMenu: true,
    isRegistered: true
  }
];

export const productDocuments: IModuleEntityDefinition[] = [];
export const productReports: IModuleEntityDefinition[] = [];

export const productEntities: IModuleEntityDefinition[] = [
  ...productCards,
  ...productDocuments,
  ...productReports
];

export default productEntities;
