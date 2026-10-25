/**
 * @file useFiyatListesiActionMenu.tsx
 * @description Fiyat Listesi Belgesi ActionMenu ve dinamik başlık aksiyonları kancası (hook).
 * 
 * Sorumluluklar:
 * - "Excel'den Veri Al" aksiyonunu ActionMenu üzerinde varsayılan / split-button tetikleyicisi olarak sunmak.
 * - Split buton tıklandığında doğrudan Excel aktarım modalını açmak.
 * - 3 nokta dropdown menüsünde "Excel'den Veri Al" aksiyonunu isDefault: true ile vurgulu sunmak.
 * - "Kısa Süreli Kampanya Mı?" seçeneğini BaseSwitch bileşeni ile ActionMenu içerisinde sunmak.
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
}

export interface UseFiyatListesiActionMenuReturn {
    actionMenuTrigger?: React.ReactNode | any;
    actionMenuDropdownHeader?: React.ReactNode | any;
    onActionMenuTriggerClick: (e: React.MouseEvent) => void;
    extraDropdownActions: any[];
}

export const useFiyatListesiActionMenu = ({
    onExcelImportClick,
    extraDropdownActions,
    kampanyaMi = false,
    onKampanyaChange
}: UseFiyatListesiActionMenuProps): UseFiyatListesiActionMenuReturn => {
    const { t } = useTranslation();

    const actionMenuTrigger = useMemo(() => {
        return (
            <span className="action-menu-excel-badge" title={t("Excel'den Veri Al", "Excel'den Veri Al")}>
                <FileSpreadsheet size={15} className="shrink-0 text-success" />
                <span>{t("Excel'den Veri Al", "Excel'den Veri Al")}</span>
            </span>
        );
    }, [t]);

    const handleTriggerClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onExcelImportClick();
    }, [onExcelImportClick]);

    const dropdownActions = useMemo(() => {
        const excelAction = {
            label: t("Excel'den Veri Al", "Excel'den Veri Al"),
            icon: <FileSpreadsheet size={16} className="text-success" />,
            onClick: onExcelImportClick,
            isDefault: true
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
    }, [onExcelImportClick, kampanyaMi, onKampanyaChange, extraDropdownActions, t]);

    return {
        actionMenuTrigger,
        onActionMenuTriggerClick: handleTriggerClick,
        extraDropdownActions: dropdownActions
    };
};

export default useFiyatListesiActionMenu;
