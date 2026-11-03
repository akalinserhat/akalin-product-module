/**
 * @file useFiyatListesiActionMenu.tsx
 * @description Fiyat Listesi Belgesi ActionMenu ve dinamik başlık aksiyonları kancası (hook).
 * 
 * Sorumluluklar:
 * - "Excel'den Veri Al" aksiyonunu başlangıçta ActionMenu üzerinde varsayılan / split-button tetikleyicisi olarak sunmak.
 * - Excel aktarımı tamamlandıktan sonra varsayılan aksiyonun "Kaydet" olmasını sağlamak.
 * - Split buton tıklandığında doğrudan Excel aktarım modalını açmak.
 * - 3 nokta dropdown menüsünde "Excel'den Veri Al" ve "Kısa Süreli Kampanya Mı?" seçeneklerini sunmak.
 */

import React, { useMemo, useCallback } from 'react';
import { FileSpreadsheet, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseSwitch } from '@akalin/ui';

export interface UseFiyatListesiActionMenuProps {
    onExcelImportClick: () => void;
    extraDropdownActions?: any[];
    kampanyaMi?: boolean;
    onKampanyaChange?: (checked: boolean) => void;
    isExcelDefault?: boolean;
}

export interface UseFiyatListesiActionMenuReturn {
    actionMenuTrigger?: React.ReactNode | any;
    actionMenuDropdownHeader?: React.ReactNode | any;
    onActionMenuTriggerClick?: (e: React.MouseEvent) => void;
    extraDropdownActions: any[];
}

export const useFiyatListesiActionMenu = ({
    onExcelImportClick,
    extraDropdownActions,
    kampanyaMi = false,
    onKampanyaChange,
    isExcelDefault = true
}: UseFiyatListesiActionMenuProps): UseFiyatListesiActionMenuReturn => {
    const { t } = useTranslation();

    const actionMenuTrigger = useMemo(() => {
        if (!isExcelDefault) return undefined;
        return (
            <span className="action-menu-excel-badge" title={t("Excel'den Veri Al", "Excel'den Veri Al")}>
                <FileSpreadsheet size={15} className="shrink-0 text-success" />
                <span>{t("Excel'den Veri Al", "Excel'den Veri Al")}</span>
            </span>
        );
    }, [isExcelDefault, t]);

    const handleTriggerClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onExcelImportClick();
    }, [onExcelImportClick]);

    const dropdownActions = useMemo(() => {
        const excelAction = {
            label: t("Excel'den Veri Al", "Excel'den Veri Al"),
            icon: <FileSpreadsheet size={16} className="text-success" />,
            onClick: onExcelImportClick,
            isDefault: isExcelDefault
        };

        const kampanyaAction = {
            custom: (
                <BaseSwitch
                    id="actionMenuKampanyaSwitch"
                    checked={kampanyaMi}
                    onChange={(e) => onKampanyaChange && onKampanyaChange(e.target.checked)}
                    label={
                        <span className="flex items-center gap-8">
                            <Sparkles size={15} className={kampanyaMi ? "text-warning" : "text-secondary"} />
                            <span>{t('Kısa Süreli Kampanya Mı?', 'Kısa Süreli Kampanya Mı?')}</span>
                        </span>
                    }
                    className="action-menu-switch-item"
                />
            ),
            dividerAbove: true
        };

        return [excelAction, kampanyaAction, ...(extraDropdownActions || [])];
    }, [onExcelImportClick, isExcelDefault, kampanyaMi, onKampanyaChange, extraDropdownActions, t]);

    return {
        actionMenuTrigger,
        onActionMenuTriggerClick: isExcelDefault ? handleTriggerClick : undefined,
        extraDropdownActions: dropdownActions
    };
};

export default useFiyatListesiActionMenu;
