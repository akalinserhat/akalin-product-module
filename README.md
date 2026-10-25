# @akalin/product_module

Webakus ERP ekosistemi için bağımsız, yeniden kullanılabilir ve `@akalin/module_core` (`IModuleDefinition` / `ModuleRegistry`) ile tam uyumlu Ürün ve Hizmet Yönetimi Modülü.

## Özellikler
- **Ürün ve Hizmet Kartları**: Stoklu ürünler, hizmetler, hammaddeler, mamuller, yarı mamuller için tam CRUD yönetimi.
- **Kategori ve Gruplar**: Ürün ve hizmet hiyerarşik kategori ve grup tanımları.
- **Paket ve Set Tanımları**: Karma paket ve promosyon setleri oluşturma.
- **Kampanyalar**: Kural bazlı kampanya motoru, sepet indirimleri, promosyonlar ve wizard yapısı.
- **Fiyat Listeleri**: Çoklu para birimi ve müşteri/cari bazlı özel fiyat listesi tanımları.
- **BSH Fiyat Farkı**: BSH entegrasyonu ve fiyat farkı analiz tabloları.
- **Excel Aktarımı**: Zengin şablon eşlemeli Excel toplu ürün içeri aktarma ve güncelleme.
- **Merkezi Seçici Modal**: Arama, filtreleme ve klavye destekli hızlı `UrunSeciciList` / `UrunSeciciModal`.
- **Adapter Mimarisi**: Monolitik API bağımlılıklarından arındırılmış `ProductServiceContext` ve `IProductServiceAdapter`.

## Kurulum
```bash
npm install github:akalinserhat/akalin-product-module#main
```

## Kullanım
```tsx
import { createProductModule } from '@akalin/product_module';
import { ModuleRegistry } from '@akalin/module_core';

const productModule = createProductModule();
ModuleRegistry.register(productModule);
```
