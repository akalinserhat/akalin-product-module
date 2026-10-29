/**
 * Webakus ERP - Ürün Yönetimi Excel'den Veri Al (ExcelImportPage) Köprüsü.
 * Merkezi implementasyon @akalin/file_manager_module içerisindeki FileImportPage bileşeninden sağlanır.
 */

export {
  FileImportPage as default,
  FileImportPage,
  ExcelImportPage,
  ExcelImportModal,
  FileImportModal,
  openExcelInNewTab,
  FILE_FILTER_PRESETS,
  type FileImportPageProps,
  type ExcelImportPageProps,
  type ExcelImportModalProps,
  type ExcelColumnDef,
  type ExcelSheet,
  type FileFilterCategory,
  type FileSelectionMode,
  type ImportedFileItem,
} from '@akalin/file_manager_module';
