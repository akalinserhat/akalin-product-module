/**
 * @akalin/product_module - Tescilli Liste, Kart ve Belge Tanımları (entities.ts)
 * Modüle ait tüm listeler, kartlar ve belgeler hiyerarşik olarak bu dosyada register edilir.
 * Bu dosyada tescil edilmemiş hiçbir liste, kart veya belge menüde gösterilmez ve erişilemez.
 */

import type { IModuleEntityDefinition } from '@akalin/module_core';

export const productLists: IModuleEntityDefinition[] = [
  {
    id: 'urun-liste',
    category: 'liste',
    titleKey: 'Ürün ve Hizmetler',
    title: 'Ürün ve Hizmetler',
    description: 'Ticari mal, hammadde, yarı mamul, masraf ve hizmet listesi',
    route: '/urunVeHizmetler',
    listRoute: '/urunVeHizmetler',
    useStandardCrud: true,
    showInMenu: true,
    isRegistered: true,
    children: [
      {
        id: 'urun',
        category: 'kart',
        parentId: 'urun-liste',
        titleKey: 'Ürün ve Hizmet Kartı',
        title: 'Ürün ve Hizmet Kartı',
        description: 'Ticari mal, hammadde, yarı mamul, masraf ve hizmet kartları',
        route: '/urunVeHizmetler/:id',
        formRoute: '/urunVeHizmetler/:id',
        useStandardCrud: true,
        showInMenu: false,
        isRegistered: true,
        customActions: [
          { action: 'fiyat-degistir', labelKey: 'Fiyat Değiştirme', description: 'Satış fiyatlarını ve KDV oranlarını düzenleme' },
          { action: 'maliyet-gor', labelKey: 'Maliyet Görme', description: 'Ürün alış ve maliyet fiyatlarını görme' }
        ]
      },
      {
        id: 'kategori',
        category: 'kart',
        parentId: 'urun-liste',
        titleKey: 'Ürün Grubu ve Kategori',
        title: 'Ürün Grubu ve Kategori',
        description: 'Hiyerarşik ürün ana grupları, alt kategoriler ve reyon tanımları',
        route: '/urun-gruplari/:id',
        formRoute: '/urun-gruplari/:id',
        useStandardCrud: true,
        showInMenu: false,
        isRegistered: true
      }
    ]
  },
  {
    id: 'paket-ve-setler',
    category: 'liste',
    titleKey: 'Paket & Set Tanımları',
    title: 'Paket & Set Tanımları',
    description: 'Birden fazla ürünün bir arada sunulduğu paket ve set listesi',
    route: '/paket-ve-setler',
    listRoute: '/paket-ve-setler',
    useStandardCrud: true,
    showInMenu: true,
    isRegistered: true,
    children: [
      {
        id: 'paket-set',
        category: 'kart',
        parentId: 'paket-ve-setler',
        titleKey: 'Paket & Set Kartı',
        title: 'Paket & Set Kartı',
        description: 'Paket ve set bileşenleri ve fiyatlandırma kartı',
        route: '/paket-ve-setler/:id',
        formRoute: '/paket-ve-setler/:id',
        useStandardCrud: true,
        showInMenu: false,
        isRegistered: true
      }
    ]
  },
  {
    id: 'kampanyalar',
    category: 'liste',
    titleKey: 'Kampanyalar',
    title: 'Kampanyalar',
    description: 'Promosyon, indirim ve dinamik satış kampanya kuralları listesi',
    route: '/kampanyalar',
    listRoute: '/kampanyalar',
    useStandardCrud: true,
    showInMenu: true,
    isRegistered: true,
    children: [
      {
        id: 'kampanya',
        category: 'belge',
        parentId: 'kampanyalar',
        titleKey: 'Kampanya Tanımı',
        title: 'Kampanya Tanımı',
        description: 'Promosyon, indirim ve dinamik satış kampanya kuralı ve koşul belgesi',
        route: '/kampanyalar/:id',
        formRoute: '/kampanyalar/:id',
        useStandardCrud: true,
        showInMenu: false,
        isRegistered: true
      }
    ]
  },
  {
    id: 'fiyat-listeleri',
    category: 'liste',
    titleKey: 'Fiyat Listeleri',
    title: 'Fiyat Listeleri',
    description: 'Müşteri gruplarına ve para birimlerine göre belirlenmiş özel fiyat listeleri',
    route: '/fiyat-listeleri',
    listRoute: '/fiyat-listeleri',
    useStandardCrud: true,
    showInMenu: true,
    isRegistered: true,
    children: [
      {
        id: 'fiyat-listesi',
        category: 'belge',
        parentId: 'fiyat-listeleri',
        titleKey: 'Fiyat Listesi Kartı',
        title: 'Fiyat Listesi Kartı',
        description: 'Müşteri gruplarına ve para birimlerine göre özel fiyatlandırma belgesi',
        route: '/fiyat-listeleri/:id',
        formRoute: '/fiyat-listeleri/:id',
        useStandardCrud: true,
        showInMenu: false,
        isRegistered: true
      }
    ]
  },
  {
    id: 'bsh-fiyat-farki',
    category: 'liste',
    titleKey: 'BSH Fiyat Farkı',
    title: 'BSH Fiyat Farkı',
    description: 'BSH entegrasyonu fiyat farkı mutabakat ve analiz listeleri',
    route: '/bsh-fiyat-farki',
    listRoute: '/bsh-fiyat-farki',
    useStandardCrud: true,
    showInMenu: true,
    isRegistered: true,
    children: [
      {
        id: 'bsh-fiyat-farki-kart',
        category: 'kart',
        parentId: 'bsh-fiyat-farki',
        titleKey: 'BSH Fiyat Farkı Detayı',
        title: 'BSH Fiyat Farkı Detayı',
        description: 'BSH entegrasyonu fiyat farkı mutabakat kartı',
        route: '/bsh-fiyat-farki/duzenle/:id',
        formRoute: '/bsh-fiyat-farki/duzenle/:id',
        useStandardCrud: true,
        showInMenu: false,
        isRegistered: true
      }
    ]
  }
];

export const productCards: IModuleEntityDefinition[] = [
  ...productLists.flatMap((l) => (l.children || []).filter((c) => c.category === 'kart'))
];

export const productDocuments: IModuleEntityDefinition[] = [
  ...productLists.flatMap((l) => (l.children || []).filter((c) => c.category === 'belge'))
];

export const productReports: IModuleEntityDefinition[] = [];

export const productEntities: IModuleEntityDefinition[] = [
  ...productLists,
  ...productCards,
  ...productDocuments,
  ...productReports
];

export default productEntities;
