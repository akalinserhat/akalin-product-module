import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import httpClient from '../services/httpClient';
import { KampanyaKuralDto } from '../dtos/KampanyalarDto';
import { ListPlus, Info } from 'lucide-react';
import { BaseCard, UrunGrupSeciciModal, TamsayiInput, BaseDropdownSecici, UrunSeciciModal, OzellikTanimSeciciModal } from '@akalin/ui';

interface RuleRow extends Partial<KampanyaKuralDto> {
    _uid: string;
    _selectedItems?: any[];
}

interface KampanyaKuralPopupProps {
    initialData: RuleRow | null;
    onSuccess: (updatedRule: RuleRow) => void;
    onCancel: () => void;
    setIsSaving: (saving: boolean) => void;
}

const KampanyaKuralPopup: React.FC<KampanyaKuralPopupProps> = ({ initialData, onSuccess, onCancel, setIsSaving }) => {
    const { t } = useTranslation();
    
    const [rule, setRule] = useState<RuleRow>({
        _uid: Math.random().toString(36).substring(7),
        kuralAlani: 2,
        kuralOperatoru: 1,
        kuralDegeri: '',
        gerekliMiktar: 1,
        _selectedItems: []
    });

    const [isLoadingItems, setIsLoadingItems] = useState(false);
    const [activeModal, setActiveModal] = useState<{ type: number, isMultiSelect: boolean } | null>(null);

    useEffect(() => {
        if (initialData) {
            setRule(initialData);

            if (initialData.kuralDegeri && (!initialData._selectedItems || initialData._selectedItems.length === 0)) {
                const ids = initialData.kuralDegeri.split(',').map(id => id.trim()).filter(id => id);
                if (ids.length > 0) {
                    setIsLoadingItems(true);
                    
                    let basePath = '';
                    switch(Number(initialData.kuralAlani)) {
                        case 1: basePath = '/api/UrunVeHizmetKartlari'; break;
                        case 2: basePath = '/api/UrunVeHizmetGruplari'; break;
                        case 9: basePath = '/api/OzellikTanimlari'; break;
                    }

                    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                    Promise.all(ids.map(async (id: string) => {
                        if (!/^\d+$/.test(id)) {
                            return { id, name: id };
                        }

                        if (basePath) {
                            try {
                                const res = await fetch(`${basePath}/${id}`, {
                                    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
                                });
                                if (res.ok) {
                                    const item = await res.json();
                                    return {
                                        id: item.id,
                                        name: item.ad || item.Ad || item.tanim || item.Tanim || item.adi || item.Adi || `Kayıt #${item.id}`
                                    };
                                }
                            } catch {}
                        }
                        return { id, name: `Kayıt #${id}` };
                    }))
                    .then(validItems => {
                        if (validItems.length > 0) {
                            setRule(prev => ({ ...prev, _selectedItems: validItems }));
                        }
                    })
                    .finally(() => setIsLoadingItems(false));
                }
            }
        }
    }, [initialData]);

    const updateRule = (field: keyof RuleRow, value: any) => {
        setRule(prev => ({ ...prev, [field]: value }));
    };

    const handleSelectItems = (selectedData: any | any[], type: number) => {
        if (!selectedData) return;
        
        const selectedItems = Array.isArray(selectedData) ? selectedData : [selectedData];
        if (selectedItems.length === 0) return;
        
        const idArray = selectedItems.map(item => item.id);
        const kuralDegeri = idArray.join(',');
        
        const mockItems = selectedItems.map(item => ({ 
            id: item.id, 
            name: item.ad || item.Ad || item.tanim || item.Tanim || item.adi || item.Adi || `Kayıt #${item.id}` 
        }));
        
        updateRule('kuralDegeri', kuralDegeri);
        updateRule('_selectedItems', mockItems);
    };

    const kuralAlaniOptions = [
        { id: 2, label: t('Ürün Grubu') },
        { id: 1, label: t('Ürün Açıklama') },
        { id: 9, label: t('Ürün Özelliği') }
    ];

    const kuralOperatoruOptions = [
        { id: 1, label: t('Eşittir') },
        { id: 2, label: t('Eşit Değildir') },
        { id: 10, label: t('Her Biri İçin (Satır/Adet Başına)') },
        { id: 7, label: t('Tümünü İçerir (Her Birinden)') },
        { id: 9, label: t('Herhangi Birini İçerir (Toplamda)') },
        { id: 8, label: t('İçermez') }
    ];

    const getOperatorExplanation = (opId: number) => {
        switch (Number(opId)) {
            case 1: return t('KuralOperatoru_Esittir_Aciklama');
            case 2: return t('KuralOperatoru_EsitDegildir_Aciklama');
            case 10: return t('KuralOperatoru_HerBiriIcin_Aciklama');
            case 7: return t('KuralOperatoru_Icerir_Aciklama');
            case 9: return t('KuralOperatoru_HerhangiBiriniIcerir_Aciklama');
            case 8: return t('KuralOperatoru_Icermez_Aciklama');
            default: return '';
        }
    };

    // Listen to form submit event triggered by BasePopup's SaveButton
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            onSuccess(rule);
            setIsSaving(false);
        }, 100);
    };

    return (
        <form id="base-popup-form" onSubmit={handleSubmit} className="rule-popup-container">
            <BaseCard variant="elevated">
                <div className="flex-col gap-16 p-16">
                    <div className="form-grid">
                        <div>
                            <label className="text-secondary text-12 block mb-6 font-medium">
                                {t('Kural Alanı')}
                            </label>
                            <BaseDropdownSecici
                                options={kuralAlaniOptions}
                                value={rule.kuralAlani}
                                onChange={(id) => {
                                    updateRule('kuralAlani', id);
                                    updateRule('kuralDegeri', '');
                                    updateRule('_selectedItems', []);
                                }}
                                placeholder={t('Kural Alanı')}
                            />
                        </div>
                        <div>
                            <label className="text-secondary text-12 block mb-6 font-medium">
                                {t('Gerekli Miktar (Adet)')}
                            </label>
                            <TamsayiInput 
                                value={rule.gerekliMiktar || 1} 
                                onChange={(e) => updateRule('gerekliMiktar', e.target.value || 1)} 
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-secondary text-12 block mb-6 font-medium">
                            {t('Operatör')}
                        </label>
                        <BaseDropdownSecici
                            options={kuralOperatoruOptions}
                            value={rule.kuralOperatoru}
                            onChange={(id) => updateRule('kuralOperatoru', id)}
                            placeholder={t('Operatör')}
                        />
                        <div className="operator-info-box mt-8">
                            <Info size={16} className="text-primary mt-2 shrink-0" />
                            <span className="operator-info-text">
                                {getOperatorExplanation(rule.kuralOperatoru || 1)}
                            </span>
                        </div>
                    </div>
                    
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <label className="text-secondary text-12 font-medium">
                                {t('Değer Seçimi')}
                            </label>
                            {rule._selectedItems && rule._selectedItems.length > 0 && (
                                <span className="text-12 text-secondary">
                                    {rule._selectedItems.length} {t('Öğe Seçildi')}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-8">
                            <button 
                                type="button"
                                className="btn btn-outline w-full flex items-center justify-center" 
                                onClick={() => setActiveModal({ 
                                    type: rule.kuralAlani || 2, 
                                    isMultiSelect: rule.kuralOperatoru === 7 || rule.kuralOperatoru === 8 || rule.kuralOperatoru === 9 || rule.kuralOperatoru === 10
                                })}
                            >
                                <ListPlus size={16} className="mr-8" />
                                {rule.kuralDegeri ? t('Seçimleri Düzenle') : t('Değer Seç...')}
                            </button>
                        </div>
                    </div>

                    {isLoadingItems && (
                        <div className="rule-selected-items-wrapper">
                            <span className="chip-primary">
                                {t('Yükleniyor...')}
                            </span>
                        </div>
                    )}
                    {!isLoadingItems && rule._selectedItems && rule._selectedItems.length > 0 && (
                        <div className="rule-selected-items-wrapper">
                            {rule._selectedItems.map((item, i) => (
                                <span key={i} className="chip-primary">
                                    {item.name}
                                </span>
                            ))}
                        </div>
                    )}
                    {!isLoadingItems && rule.kuralDegeri && (!rule._selectedItems || rule._selectedItems.length === 0) && (
                        <div className="rule-selected-items-wrapper">
                            <span className="chip-primary">
                                {rule.kuralDegeri.split(',').length} {t('Öğe Seçildi')}
                            </span>
                        </div>
                    )}
                </div>
            </BaseCard>

            {/* Modals */}
            {activeModal?.type === 1 && (
                <UrunSeciciModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    isMultiSelect={activeModal.isMultiSelect}
                    onSelect={(ids) => {
                        handleSelectItems(ids, 1);
                        setActiveModal(null);
                    }}
                />
            )}
            {activeModal?.type === 2 && (
                <UrunGrupSeciciModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    isMultiSelect={activeModal.isMultiSelect}
                    onSelect={(ids) => {
                        handleSelectItems(ids, 2);
                        setActiveModal(null);
                    }}
                />
            )}
            {activeModal?.type === 9 && (
                <OzellikTanimSeciciModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    isMultiSelect={activeModal.isMultiSelect}
                    onSelect={(ids) => {
                        handleSelectItems(ids, 9);
                        setActiveModal(null);
                    }}
                />
            )}
        </form>
    );
};

export default KampanyaKuralPopup;
