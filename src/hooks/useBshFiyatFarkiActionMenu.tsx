/**
 * @file useBshFiyatFarkiActionMenu.tsx
 * @description BSH Fiyat Farkı Belgesi ActionMenu ve dinamik başlık aksiyonları hook'u.
 * 
 * Sorumluluklar:
 * - "Excel'den Veri Al" aksiyonunu ActionMenu (3 nokta menü) içerisine eklemek.
 * - BaseDocumentPage ve ActionMenu standartlarına tam uyumluluk sağlamak.
 * - Kaydet butonunun ActionMenu içinde varsayılan (split-button) aksiyon olarak yer almasını garanti etmek.
 */

import React, { useMemo } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ActionMenuItem } from '@akalin/ui';

export interface UseBshFiyatFarkiActionMenuProps {
    onExcelImportClick: () => void;
    extraDropdownActions?: ActionMenuItem[];
}

export interface UseBshFiyatFarkiActionMenuReturn {
    extraDropdownActions: ActionMenuItem[];
}

export const useBshFiyatFarkiActionMenu = ({
    onExcelImportClick,
    extraDropdownActions
}: UseBshFiyatFarkiActionMenuProps): UseBshFiyatFarkiActionMenuReturn => {
    const { t } = useTranslation();

    const dropdownActions = useMemo(() => {
        const excelAction: ActionMenuItem = {
            label: t("Excel'den Veri Al", "Excel'den Veri Al"),
            icon: <FileSpreadsheet size={16} className="text-success" />,
            onClick: onExcelImportClick
        };

        return [excelAction, ...(extraDropdownActions || [])];
    }, [onExcelImportClick, extraDropdownActions, t]);

    return {
        extraDropdownActions: dropdownActions
    };
};

export default useBshFiyatFarkiActionMenu;
