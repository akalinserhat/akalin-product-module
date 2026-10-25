/**
 * @file usePaketVeSetActionMenu.tsx
 * @description Paket ve Set Belgesi ActionMenu ve dinamik başlık aksiyonları hook'u.
 * 
 * Sorumluluklar:
 * - "Aktif / Pasif" durum ayarını ActionMenu (3 nokta menü) içerisine taşımak ve BaseSwitch ile sunmak.
 * - Modüler ActionMenu kurallarına (AGENTS.md) tam uyumluluk sağlamak.
 */

import React, { useMemo } from 'react';
import { Power } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseSwitch } from '@akalin/ui';

export interface UsePaketVeSetActionMenuProps {
    aktifMi: boolean;
    onAktifMiChange: (checked: boolean) => void;
    extraDropdownActions?: any[];
}

export interface UsePaketVeSetActionMenuReturn {
    extraDropdownActions: any[];
}

export const usePaketVeSetActionMenu = ({
    aktifMi,
    onAktifMiChange,
    extraDropdownActions
}: UsePaketVeSetActionMenuProps): UsePaketVeSetActionMenuReturn => {
    const { t } = useTranslation();

    const dropdownActions = useMemo(() => {
        const durumAction = {
            custom: (
                <BaseSwitch
                    id="actionMenuPaketVeSetAktifSwitch"
                    checked={aktifMi}
                    onChange={(e) => onAktifMiChange(e.target.checked)}
                    label={
                        <span className="flex items-center gap-8">
                            <Power size={15} className={aktifMi ? "text-success" : "text-secondary"} />
                            <span className="font-medium">{t('Durum', 'Durum')}:</span>
                            <span className={aktifMi ? "text-success font-semibold" : "text-secondary font-semibold"}>
                                {aktifMi ? t('Aktif', 'Aktif') : t('Pasif', 'Pasif')}
                            </span>
                        </span>
                    }
                    className="action-menu-switch-item"
                />
            ),
            dividerAbove: true
        };

        return [durumAction, ...(extraDropdownActions || [])];
    }, [aktifMi, onAktifMiChange, extraDropdownActions, t]);

    return {
        extraDropdownActions: dropdownActions
    };
};

export default usePaketVeSetActionMenu;
