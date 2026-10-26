/**
 * @akalin/product_module
 * Webakus ERP ekosistemi için bağımsız, yeniden kullanılabilir Ürün, Hizmet, Kategori,
 * Paket/Set, Fiyat Listesi ve Kampanya Yönetimi Modülü.
 */

// Ana Modül Fabrikası ve Singleton Modül Tanımı
import { createProductModule } from './createProductModule';

export * from './createProductModule';
export { createProductModule } from './createProductModule';

export const UrunYonetimiModule = createProductModule();
export default UrunYonetimiModule;

// Adapter & Servis Context
export * from './adapters/ProductServiceContext';

// Tipler ve DTO'lar
export * from './types';
export * from './definitions/entities';

// Servisler
export * from './services/UrunVeHizmetKartlariService';
export * from './services/UrunVeHizmetGruplariService';
export * from './services/UrunVeHizmetSeriNolariService';
export * from './services/PaketVeSetService';
export * from './services/FiyatListeleriService';
export * from './services/FiyatListesiTanimlariService';
export * from './services/KampanyalarService';
export * from './services/BirimlerService';
export * from './services/MarkalarService';
export * from './services/OzellikTanimlariService';
export * from './services/OzellikTanimlariGruplariService';
export { BaseService } from './services/BaseService';
export { default as httpClient } from './services/httpClient';

// Doğrulayıcılar (Validators)
export * from './validators/urunVeHizmetValidation';
export * from './validators/paketVeSetValidation';
export * from './validators/kampanyaValidation';
export * from './validators/fiyatListesiValidation';
export * from './validators/bshFiyatFarkiValidation';
export * from './validators/urunGrupValidation';

// Varsayılan Değerler (Defaults)
export * from './defaults/urunVeHizmetDefaultValue';
export * from './defaults/paketVeSetDefaultValue';
export * from './defaults/kampanyaDefaultValue';

// Yardımcı Araçlar (Utils) & Context
export * from './utils/stokUtils';
export * from './context/MetadataContext';

// Bileşenler ve Sayfalar
export { default as UrunHizmetModulAyarlari } from './components/UrunHizmetModulAyarlari';
export { default as ExcelImportPage, type ExcelImportPageProps, type ExcelColumnDef, ExcelImportModal, type ExcelImportModalProps } from './pages/ExcelImportPage';
export { default as UrunSeciciList, UrunSeciciModal, type UrunSeciciListProps, type UrunSeciciModalProps } from './components/UrunSeciciList';
export { default as UrunVeHizmetForm } from './components/UrunVeHizmetForm';
export { default as UrunGrupForm } from './components/UrunGrupForm';
export { default as BirimForm } from './components/BirimForm';
export { default as OzellikTanimForm } from './components/OzellikTanimForm';
export { default as FiyatListesiForm } from './components/FiyatListesiForm';
export { default as FiyatListesiTanimForm } from './components/FiyatListesiTanimForm';
export { default as BshFiyatFarkiForm } from './components/BshFiyatFarkiForm';
export { default as BshFiyatFarkiList } from './components/BshFiyatFarkiList';
export { default as KampanyaForm } from './components/KampanyaForm';
export { default as KampanyaKuralWizard } from './components/KampanyaKuralWizard';
export { default as KampanyaKuralPopup } from './components/KampanyaKuralPopup';
export { default as KampanyaAiModal } from './components/KampanyaAiModal';
export { default as TopluFiyatGuncellemeModal } from './components/TopluFiyatGuncellemeModal';
export { default as MarkaFormPopup } from './pages/MarkaFormPopup';
export { default as UrunGrupFormPage } from './pages/UrunGrupFormPage';
