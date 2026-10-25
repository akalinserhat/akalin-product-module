export default class BaseFormStrategy {
    /**
     * Formda gösterilecek sekmeleri döndürür.
     * @returns {Array<{id: string, label: string, icon: React.ReactNode}>}
     */
    getTabs() {
        return [];
    }

    /**
     * Belirtilen sekme (tabId) için form alanlarını döndürür.
     * @param {string} tabId 
     * @returns {Array<{id: string, name: string, label: string, type: string, required: boolean, gridColumn: string, hidden: boolean, ...props}>}
     */
    getFields(tabId) {
        return [];
    }

    /**
     * Seçenekli (select vb.) alanlar için eğer statik bir seçenek listesi dönülecekse kullanılır.
     * @param {string} fieldId 
     * @returns {Array<{value: any, label: string}>}
     */
    getOptions(fieldId) {
        return [];
    }
}
