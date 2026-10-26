import React, { lazy } from 'react';
import { Box, Megaphone, FileText, Zap, Layers } from 'lucide-react';
import { type IModuleDefinition } from '@akalin/module_core';
import { ModuleSettingsRegistry } from '@akalin/ui';
import { ProductServiceProvider, IProductServiceAdapter, defaultProductService } from './adapters/ProductServiceContext';
import UrunHizmetModulAyarlariComponent from './components/UrunHizmetModulAyarlari';
import { productLists, productCards, productDocuments, productReports } from './definitions/entities';

export interface CreateProductModuleOptions {
  id?: string;
  title?: string;
  order?: number;
  permissionPrefix?: string;
  adapter?: IProductServiceAdapter;
  registerSettings?: boolean;
}

export const UrunVeHizmetlerPage = lazy(() => import('./pages/UrunVeHizmetler'));
export const UrunVeHizmetFormPage = lazy(() => import('./pages/UrunVeHizmetFormPage'));
export const PaketVeSetlerPage = lazy(() => import('./pages/PaketVeSetler'));
export const PaketVeSetFormPage = lazy(() => import('./pages/PaketVeSetFormPage'));
export const UrunGrupFormPage = lazy(() => import('./pages/UrunGrupFormPage'));
export const KampanyalarPage = lazy(() => import('./pages/Kampanyalar'));
export const KampanyaFormPage = lazy(() => import('./components/KampanyaForm'));
export const FiyatListeleriPage = lazy(() => import('./pages/FiyatListeleri'));
export const FiyatListesiPage = lazy(() => import('./pages/FiyatListesiPage'));
export const BshFiyatFarkiListPage = lazy(() => import('./components/BshFiyatFarkiList'));
export const BshFiyatFarkiFormPage = lazy(() => import('./components/BshFiyatFarkiForm'));

export const MarkaFormPopup = lazy(() => import('./pages/MarkaFormPopup'));
export const BirimFormPopup = lazy(() => import('./pages/BirimFormPopup'));
export const OzellikTanimFormPopup = lazy(() => import('./pages/OzellikTanimFormPopup'));

export function createProductModule(options: CreateProductModuleOptions = {}): IModuleDefinition {
  const {
    id = 'urun-yonetimi',
    title = 'Ürün ve Hizmet Yönetimi',
    order = 20,
    permissionPrefix = 'urun',
    adapter = defaultProductService,
    registerSettings = true
  } = options;

  if (registerSettings) {
    try {
      ModuleSettingsRegistry.register({
        moduleId: 'MOD_URUN_YONETIMI',
        aliases: [
          'MOD_URUN_HIZMET',
          'MOD_URUN',
          'MOD_STOK',
          'MOD_STOK_YONETIMI',
          'urun_yonetimi',
          'urun-yonetimi',
          'UrunYonetimi',
          'urunVeHizmetler',
          'urun-hizmet'
        ],
        title: 'Ürün ve Hizmet Modülü Ayarları',
        description: 'Faaliyet alanına özel ürün ve hizmet kartı davranışlarını ve üretici kodu tercihlerini yapılandırın.',
        icon: React.createElement(Box, { size: 20 }),
        iconName: 'Package',
        component: UrunHizmetModulAyarlariComponent,
        defaultValues: {
          ureticiKoduMetinTercihi: 'hepsiBuyuk'
        }
      });
    } catch (e) {
      // Already registered or in test env
    }
  }

  const withProvider = (Component: React.ComponentType<any>) => {
    return (props: any) => (
      <ProductServiceProvider adapter={adapter}>
        <Component {...props} />
      </ProductServiceProvider>
    );
  };

  return {
    id,
    title,
    aliases: [
      'MOD_URUN_YONETIMI',
      'MOD_URUN_HIZMET',
      'MOD_URUN',
      'MOD_STOK',
      'MOD_STOK_YONETIMI',
      'urun_yonetimi',
      'urun-yonetimi',
      'UrunYonetimi',
      'urunVeHizmetler',
      'urun-hizmet',
      '@akalin/product_module'
    ],
    permissionPrefix,
    icon: React.createElement(Box, { size: 20 }),
    iconName: 'Package',
    order,
    strictEntityRegistration: true,
    whitelistedRoutes: [
      'markalar/form',
      'birimler/form',
      'urun-ve-hizmetler/form',
      'urun-gruplari/form',
      '/popup/markalar/form',
      '/popup/birimler/form',
      '/popup/urun-ve-hizmetler/form',
      '/popup/urun-gruplari/form',
      '/urun-gruplari',
      '/urun-gruplari/yeni',
      '/urun-gruplari/:id',
      '/urun-gruplari/duzenle/:id'
    ],
    lists: productLists,
    cards: productCards,
    documents: productDocuments,
    reports: productReports,
    routes: [
      {
        path: '/urunVeHizmetler',
        element: React.createElement(withProvider(UrunVeHizmetlerPage)),
        title: 'Ürün ve Hizmetler',
        requiredPermissions: ['urun.kart.urun.goruntule']
      },
      {
        path: '/urunVeHizmetler/yeni',
        element: React.createElement(withProvider(UrunVeHizmetFormPage)),
        title: 'Yeni Ürün/Hizmet',
        requiredPermissions: ['urun.kart.urun.olustur']
      },
      {
        path: '/urunVeHizmetler/:id',
        element: React.createElement(withProvider(UrunVeHizmetFormPage)),
        title: 'Ürün/Hizmet Düzenle',
        requiredPermissions: ['urun.kart.urun.duzenle']
      },
      {
        path: '/paket-ve-setler',
        element: React.createElement(withProvider(PaketVeSetlerPage)),
        title: 'Paket & Set Tanımları',
        requiredPermissions: ['urun.kart.paket-set.goruntule']
      },
      {
        path: '/paket-ve-setler/yeni',
        element: React.createElement(withProvider(PaketVeSetFormPage)),
        title: 'Yeni Paket / Set',
        requiredPermissions: ['urun.kart.paket-set.olustur']
      },
      {
        path: '/paket-ve-setler/:id',
        element: React.createElement(withProvider(PaketVeSetFormPage)),
        title: 'Paket / Set Düzenle',
        requiredPermissions: ['urun.kart.paket-set.duzenle']
      },
      {
        path: '/urun-gruplari/yeni',
        element: React.createElement(withProvider(UrunGrupFormPage)),
        title: 'Yeni Ürün Grubu',
        requiredPermissions: ['urun.kart.kategori.olustur']
      },
      {
        path: '/urun-gruplari/duzenle/:id',
        element: React.createElement(withProvider(UrunGrupFormPage)),
        title: 'Ürün Grubu Düzenle',
        requiredPermissions: ['urun.kart.kategori.duzenle']
      },
      {
        path: '/urun-gruplari/:id',
        element: React.createElement(withProvider(UrunGrupFormPage)),
        title: 'Ürün Grubu',
        requiredPermissions: ['urun.kart.kategori.goruntule']
      },
      {
        path: '/kampanyalar',
        element: React.createElement(withProvider(KampanyalarPage)),
        title: 'Kampanyalar',
        requiredPermissions: ['urun.kart.urun.goruntule']
      },
      {
        path: '/kampanyalar/yeni',
        element: React.createElement(withProvider(KampanyaFormPage)),
        title: 'Yeni Kampanya',
        requiredPermissions: ['urun.kart.urun.olustur']
      },
      {
        path: '/kampanyalar/yeni/excel-import',
        element: React.createElement(withProvider(KampanyaFormPage)),
        title: "Excel'den Veri Al",
        requiredPermissions: ['urun.kart.urun.olustur']
      },
      {
        path: '/kampanyalar/yeni/kural/yeni',
        element: React.createElement(withProvider(KampanyaFormPage)),
        title: 'Yeni Kampanya Kuralı',
        requiredPermissions: ['urun.kart.urun.olustur']
      },
      {
        path: '/kampanyalar/yeni/kural/:kuralIndex',
        element: React.createElement(withProvider(KampanyaFormPage)),
        title: 'Kampanya Kuralı Düzenle',
        requiredPermissions: ['urun.kart.urun.olustur']
      },
      {
        path: '/kampanyalar/yeni/kural',
        element: React.createElement(withProvider(KampanyaFormPage)),
        title: 'Yeni Kampanya Kuralı',
        requiredPermissions: ['urun.kart.urun.olustur']
      },
      {
        path: '/kampanyalar/duzenle/:id',
        element: React.createElement(withProvider(KampanyaFormPage)),
        title: 'Kampanya Düzenle',
        requiredPermissions: ['urun.kart.urun.duzenle']
      },
      {
        path: '/kampanyalar/duzenle/:id/excel-import',
        element: React.createElement(withProvider(KampanyaFormPage)),
        title: "Excel'den Veri Al",
        requiredPermissions: ['urun.kart.urun.duzenle']
      },
      {
        path: '/kampanyalar/duzenle/:id/kural/yeni',
        element: React.createElement(withProvider(KampanyaFormPage)),
        title: 'Yeni Kampanya Kuralı',
        requiredPermissions: ['urun.kart.urun.duzenle']
      },
      {
        path: '/kampanyalar/duzenle/:id/kural/:kuralIndex',
        element: React.createElement(withProvider(KampanyaFormPage)),
        title: 'Kampanya Kuralı Düzenle',
        requiredPermissions: ['urun.kart.urun.duzenle']
      },
      {
        path: '/kampanyalar/duzenle/:id/kural',
        element: React.createElement(withProvider(KampanyaFormPage)),
        title: 'Yeni Kampanya Kuralı',
        requiredPermissions: ['urun.kart.urun.duzenle']
      },
      {
        path: '/kampanyalar/:id',
        element: React.createElement(withProvider(KampanyaFormPage)),
        title: 'Kampanya Belgesi',
        requiredPermissions: ['urun.kart.urun.duzenle']
      },
      {
        path: '/kampanyalar/:id/excel-import',
        element: React.createElement(withProvider(KampanyaFormPage)),
        title: "Excel'den Veri Al",
        requiredPermissions: ['urun.kart.urun.duzenle']
      },
      {
        path: '/kampanyalar/:id/kural/yeni',
        element: React.createElement(withProvider(KampanyaFormPage)),
        title: 'Yeni Kampanya Kuralı',
        requiredPermissions: ['urun.kart.urun.duzenle']
      },
      {
        path: '/kampanyalar/:id/kural/:kuralIndex',
        element: React.createElement(withProvider(KampanyaFormPage)),
        title: 'Kampanya Kuralı Düzenle',
        requiredPermissions: ['urun.kart.urun.duzenle']
      },
      {
        path: '/kampanyalar/:id/kural',
        element: React.createElement(withProvider(KampanyaFormPage)),
        title: 'Yeni Kampanya Kuralı',
        requiredPermissions: ['urun.kart.urun.duzenle']
      },
      {
        path: '/fiyat-listeleri',
        element: React.createElement(withProvider(FiyatListeleriPage)),
        title: 'Fiyat Listeleri',
        requiredPermissions: ['urun.kart.fiyat-listesi.goruntule']
      },
      {
        path: '/fiyat-listeleri/yeni',
        element: React.createElement(withProvider(FiyatListesiPage)),
        title: 'Yeni Fiyat Listesi',
        requiredPermissions: ['urun.kart.fiyat-listesi.olustur']
      },
      {
        path: '/fiyat-listeleri/yeni/bulut-dosyalari',
        element: React.createElement(withProvider(FiyatListesiPage)),
        title: 'Bulut Dosyaları',
        requiredPermissions: ['urun.kart.fiyat-listesi.olustur']
      },
      {
        path: '/fiyat-listeleri/yeni/excel-import',
        element: React.createElement(withProvider(FiyatListesiPage)),
        title: "Excel'den Veri Al",
        requiredPermissions: ['urun.kart.fiyat-listesi.olustur']
      },
      {
        path: '/fiyat-listeleri/yeni/cari-secim',
        element: React.createElement(withProvider(FiyatListesiPage)),
        title: 'Cari Seçimi',
        requiredPermissions: ['urun.kart.fiyat-listesi.olustur']
      },
      {
        path: '/fiyat-listeleri/:id',
        element: React.createElement(withProvider(FiyatListesiPage)),
        title: 'Fiyat Listesi Düzenle',
        requiredPermissions: ['urun.kart.fiyat-listesi.duzenle']
      },
      {
        path: '/fiyat-listeleri/:id/bulut-dosyalari',
        element: React.createElement(withProvider(FiyatListesiPage)),
        title: 'Bulut Dosyaları',
        requiredPermissions: ['urun.kart.fiyat-listesi.duzenle']
      },
      {
        path: '/fiyat-listeleri/:id/excel-import',
        element: React.createElement(withProvider(FiyatListesiPage)),
        title: "Excel'den Veri Al",
        requiredPermissions: ['urun.kart.fiyat-listesi.duzenle']
      },
      {
        path: '/fiyat-listeleri/:id/cari-secim',
        element: React.createElement(withProvider(FiyatListesiPage)),
        title: 'Cari Seçimi',
        requiredPermissions: ['urun.kart.fiyat-listesi.duzenle']
      },
      {
        path: '/bsh-fiyat-farki',
        element: React.createElement(withProvider(BshFiyatFarkiListPage)),
        title: 'BSH Fiyat Farkı Listesi',
        requiredPermissions: ['urun.kart.fiyat-listesi.goruntule']
      },
      {
        path: '/bsh-fiyat-farki/yeni',
        element: React.createElement(withProvider(BshFiyatFarkiFormPage)),
        title: 'Yeni BSH Fiyat Farkı',
        requiredPermissions: ['urun.kart.fiyat-listesi.olustur']
      },
      {
        path: '/bsh-fiyat-farki/yeni/excel-import',
        element: React.createElement(withProvider(BshFiyatFarkiFormPage)),
        title: "Excel'den Veri Al",
        requiredPermissions: ['urun.kart.fiyat-listesi.olustur']
      },
      {
        path: '/bsh-fiyat-farki/duzenle/:id',
        element: React.createElement(withProvider(BshFiyatFarkiFormPage)),
        title: 'BSH Fiyat Farkı Düzenle',
        requiredPermissions: ['urun.kart.fiyat-listesi.duzenle']
      },
      {
        path: '/bsh-fiyat-farki/duzenle/:id/excel-import',
        element: React.createElement(withProvider(BshFiyatFarkiFormPage)),
        title: "Excel'den Veri Al",
        requiredPermissions: ['urun.kart.fiyat-listesi.duzenle']
      }
    ],
    popupRoutes: [
      {
        path: 'markalar/form',
        element: React.createElement(withProvider(MarkaFormPopup)),
        title: 'Marka Tanımı',
        isPopup: true
      },
      {
        path: 'birimler/form',
        element: React.createElement(withProvider(BirimFormPopup)),
        title: 'Birim Tanımı',
        isPopup: true
      },
      {
        path: 'urun-ve-hizmetler/form',
        element: React.createElement(withProvider(UrunVeHizmetFormPage)),
        title: 'Ürün ve Hizmet Tanımı',
        isPopup: true
      },
      {
        path: 'ozellik-tanimlari/form',
        element: React.createElement(withProvider(OzellikTanimFormPopup)),
        title: 'Özellik Tanımı',
        isPopup: true
      },
      {
        path: 'urun-gruplari/form',
        element: React.createElement(withProvider(UrunGrupFormPage)),
        title: 'Ürün Grubu Tanımı',
        isPopup: true
      }
    ],
    menuItems: [
      {
        id: 'urun-yonetimi-group',
        label: 'Ürün ve Hizmet Yönetimi',
        icon: React.createElement(Box, { size: 20 }),
        order,
        isDropdown: true,
        children: [
          {
            id: 'urun-liste',
            label: 'Ürün ve Hizmetler',
            path: '/urunVeHizmetler',
            icon: React.createElement(Box, { size: 16 }),
            order: 1,
            requiredPermissions: ['urun.kart.urun.goruntule']
          },
          {
            id: 'paket-ve-setler-menu',
            label: 'Paket & Set Tanımları',
            path: '/paket-ve-setler',
            icon: React.createElement(Layers, { size: 16 }),
            order: 2,
            requiredPermissions: ['urun.kart.paket-set.goruntule']
          },
          {
            id: 'kampanyalar-menu',
            label: 'Kampanyalar',
            path: '/kampanyalar',
            icon: React.createElement(Megaphone, { size: 16 }),
            order: 3,
            requiredPermissions: ['urun.kart.urun.goruntule']
          },
          {
            id: 'fiyat-listeleri-menu',
            label: 'Fiyat Listeleri',
            path: '/fiyat-listeleri',
            icon: React.createElement(FileText, { size: 16 }),
            order: 4,
            requiredPermissions: ['urun.kart.fiyat-listesi.goruntule']
          },
          {
            id: 'bsh-fiyat-farki-menu',
            label: 'BSH Fiyat Farkı',
            path: '/bsh-fiyat-farki',
            icon: React.createElement(Zap, { size: 16 }),
            order: 5,
            requiredPermissions: ['urun.kart.fiyat-listesi.goruntule']
          }
        ]
      }
    ],
    components: {
      UrunVeHizmetlerPage,
      UrunVeHizmetFormPage,
      PaketVeSetlerPage,
      PaketVeSetFormPage,
      UrunGrupFormPage,
      KampanyalarPage,
      KampanyaFormPage,
      FiyatListeleriPage,
      FiyatListesiPage,
      BshFiyatFarkiListPage,
      BshFiyatFarkiFormPage,
      MarkaFormPopup,
      BirimFormPopup,
      OzellikTanimFormPopup,
      UrunHizmetModulAyarlari: UrunHizmetModulAyarlariComponent
    }
  };
}

export default createProductModule;
