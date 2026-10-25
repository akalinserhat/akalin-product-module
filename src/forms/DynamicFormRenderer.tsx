/**
 * @file DynamicFormRenderer.tsx
 * @description 
 * Şema bazlı dinamik form oluşturucu ve render bileşeni.
 */

// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { ChevronDown, Check, User, MapPin, DollarSign, Building, Phone, Mail, Hash, Tags, Calendar, Shield, CreditCard, Layers, Box, Info, Barcode, Package, Sparkles, Settings, AlertCircle } from 'lucide-react';
import { BaseInput, FieldError, EmailInput, TabLayout, BaseSwitch, PhoneInput } from '@akalin/ui';
import { useTranslation } from 'react-i18next';


// İkonları string adından component'e çeviren yardımcı harita
const ICON_MAP = {
    'User': <User size={16} />,
    'MapPin': <MapPin size={16} />,
    'DollarSign': <DollarSign size={16} />,
    'Building': <Building size={16} />,
    'Phone': <Phone size={18} />,
    'Mail': <Mail size={18} />,
    'Hash': <Hash size={18} />,
    'Tags': <Tags size={18} />,
    'Calendar': <Calendar size={18} />,
    'Shield': <Shield size={18} />,
    'CreditCard': <CreditCard size={18} />,
    'Layers': <Layers size={16} />,
    'Box': <Box size={16} />,
    'Info': <Info size={16} />,
    'Barcode': <Barcode size={16} />,
    'Package': <Package size={16} />,
    'Sparkles': <Sparkles size={16} />,
    'Settings': <Settings size={16} />
};

export const getIcon = (iconName, overrideProps = {}) => {
    if (!iconName) return null;
    const IconComp = ICON_MAP[iconName];
    if (IconComp) {
        return React.cloneElement(IconComp, { 
            style: { ...IconComp.props.style, ...overrideProps.style },
            ...overrideProps
        });
    }
    return null;
};

const DynamicFormRenderer = ({ 
    strategy, 
    formData, 
    onChange, 
    onBlur,
    errors = {},
    renderCustomField, 
    renderHeader,
    optionsMap = {},
    hideTabs = false,
    activeTabId = null
}: any) => {
    const { t } = useTranslation();
    const tabs = strategy.getTabs();
    const [activeTab, setActiveTab] = useState(tabs.length > 0 ? tabs[0].id : null);

    const currentTabId = hideTabs ? (activeTabId || 'default') : (activeTab || 'default');
    const fields = strategy.getFields(currentTabId) || [];

    const handleFieldChange = (e, field) => {
        let value;
        if (e && e.target) {
            const { type, checked, value: targetValue } = e.target;
            value = type === 'checkbox' ? checked : targetValue;
        } else {
            // Doğrudan değer atanıyorsa (örn: custom bileşen)
            value = e;
        }

        onChange(field.name, value);
    };

    const renderInput = (field) => {
        if (field.hidden) return null;

        // Custom alanlar için dışarıdan gelen render fonksiyonunu çağır
        if (field.type?.startsWith('custom') || field.type === 'barcode-input') {
            if (renderCustomField) {
                return renderCustomField(field, formData, (val) => handleFieldChange(val, field));
            }
            return <div className="form-group" style={{ color: 'var(--danger)' }}>Custom field '{field.name}' handled incorrectly.</div>;
        }

        // Row tipi: Alt alanları yan yana diz
        if (field.type === 'row') {
            return (
                <div className="form-group" style={{ gridColumn: field.gridColumn || '1 / -1', display: 'flex', flexDirection: 'row', gap: '16px', margin: 0, padding: 0 }} key={field.id || field.name || Math.random()}>
                    {field.fields.map(subField => (
                        <div style={{ flex: 1 }} key={subField.name}>
                            {renderInput({ ...subField, gridColumn: '1 / -1' })}
                        </div>
                    ))}
                </div>
            );
        }

        // Checkbox özel render gerektiriyor (etiketi inputun yanında)
        if (field.type === 'checkbox') {
            return (
                <div className="form-group flex-row items-end pb-4" style={{ gridColumn: field.gridColumn || '1 / -1' }} key={field.name}>
                    <label className="checkbox-container" style={{ margin: 0, padding: '10px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', cursor: 'pointer' }}>
                        <input 
                            type="checkbox" 
                            name={field.name} 
                            checked={formData[field.name] !== undefined ? formData[field.name] : (field.defaultValue || false)} 
                            onChange={(e) => handleFieldChange(e, field)} 
                        />
                        <span className="checkmark" style={{ position: 'relative', top: 0, left: 0 }}></span>
                        <span style={{ fontWeight: '500' }}>{typeof field.label === 'string' ? t(field.label) : field.label}</span>
                    </label>
                </div>
            );
        }

        // Switch tipi render (BaseSwitch bileşeni)
        if (field.type === 'switch') {
            return (
                <div className="form-group flex-row items-center" style={{ gridColumn: field.gridColumn || '1 / -1' }} key={field.name}>
                    <div className="dynamic-form-switch-card">
                        <span className="dynamic-form-switch-label">
                            {typeof field.label === 'string' ? t(field.label) : field.label}
                        </span>
                        <BaseSwitch 
                            name={field.name} 
                            checked={formData[field.name] !== undefined ? !!formData[field.name] : (field.defaultValue !== undefined ? !!field.defaultValue : true)} 
                            onChange={(e) => handleFieldChange(e, field)} 
                            disabled={field.disabled}
                        />
                    </div>
                </div>
            );
        }

        // Bilgi kutusu (Helper block)
        if (field.type === 'info-block') {
            return (
                <div className="form-group" style={{ gridColumn: field.gridColumn || '1 / -1', marginTop: '16px' }} key={field.name}>
                    <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                            {getIcon(field.icon, { color: 'var(--info)', style: { flexShrink: 0, marginTop: '2px' } })}
                            <div>
                                {field.title && <strong>{typeof field.title === 'string' ? t(field.title) : field.title}</strong>}
                                {field.title && <br />}
                                {typeof field.text === 'string' ? t(field.text) : field.text}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Telefon Özel Alanı (PhoneInput)
        if (field.type === 'phone' || field.type === 'tel' || field.name === 'telefon') {
            return (
                <div className="form-group" style={{ gridColumn: field.gridColumn }} key={field.name}>
                    <label>
                        {typeof field.label === 'string' ? t(field.label) : field.label} {field.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                    </label>
                    <PhoneInput
                        name={field.name}
                        value={formData[field.name] !== undefined ? formData[field.name] : ''}
                        onChange={(e) => handleFieldChange(e, field)}
                        onBlur={(e) => onBlur && onBlur(field.name, e?.target?.value)}
                        placeholder={field.placeholder ? (typeof field.placeholder === 'string' ? t(field.placeholder) : field.placeholder) : '0 (5XX) XXX XX XX'}
                        required={field.required}
                        disabled={field.disabled}
                        readOnly={field.readOnly}
                        showIcon={true}
                        error={errors[field.name]}
                    />
                    <FieldError error={errors[field.name]} />
                </div>
            );
        }

        // E-posta Özel Alanı
        if (field.type === 'email') {
            return (
                <div className="form-group" style={{ gridColumn: field.gridColumn }} key={field.name}>
                    <label>
                        {typeof field.label === 'string' ? t(field.label) : field.label} {field.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                    </label>
                    <EmailInput
                        name={field.name}
                        value={formData[field.name] !== undefined ? formData[field.name] : ''}
                        onChange={(val) => handleFieldChange(val, field)}
                        onBlur={(e) => onBlur && onBlur(field.name, e?.target?.value)}
                        placeholder={field.placeholder ? (typeof field.placeholder === 'string' ? t(field.placeholder) : field.placeholder) : ''}
                        required={field.required}
                        disabled={field.disabled}
                        error={errors[field.name]}
                    />
                    <FieldError error={errors[field.name]} />
                </div>
            );
        }

        // Standart Input (Text, Number, Select vs)
        return (
            <div className="form-group" style={{ gridColumn: field.gridColumn }} key={field.name}>
                <label>
                    {typeof field.label === 'string' ? t(field.label) : field.label} {field.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                </label>
                
                {field.type === 'select' ? (
                    <div style={{ position: 'relative' }}>
                        {field.icon && getIcon(field.icon, { style: { position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' } })}
                        <select 
                            name={field.name} 
                            value={formData[field.name] !== undefined ? formData[field.name] : ''} 
                            onChange={(e) => handleFieldChange(e, field)} 
                            onBlur={(e) => onBlur && onBlur(field.name, e.target.value)}
                            className={`form-input ${errors[field.name] ? 'input-error' : ''}`}
                            style={{ paddingLeft: field.icon ? '40px' : '16px', width: '100%', borderColor: errors[field.name] ? 'var(--danger)' : undefined }}
                            required={field.required}
                        >
                            <option value="">{t('auto_seciniz_bceb')}</option>
                            {(strategy.getOptions(field.name) || []).map(opt => (
                                <option key={`static-${opt.value}`} value={opt.value}>{typeof opt.label === 'string' ? t(opt.label) : opt.label}</option>
                            ))}
                            {field.options && field.options.map(opt => (
                                <option key={`field-${opt.value}`} value={opt.value}>{typeof opt.label === 'string' ? t(opt.label) : opt.label}</option>
                            ))}
                            {field.optionsKey && optionsMap[field.optionsKey] && optionsMap[field.optionsKey].map(opt => (
                                <option key={`map-${opt[field.optionValue || 'id']}`} value={opt[field.optionValue || 'id']}>
                                    {typeof opt[field.optionLabel || 'ad'] === 'string' ? t(opt[field.optionLabel || 'ad']) : opt[field.optionLabel || 'ad']}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <BaseInput 
                        id={field.id || field.name}
                        type={field.type || 'text'} 
                        name={field.name} 
                        value={formData[field.name] !== undefined ? formData[field.name] : ''} 
                        onChange={(e) => handleFieldChange(e, field)} 
                        onBlur={(e) => onBlur && onBlur(field.name, e?.target?.value)}
                        placeholder={field.placeholder ? (typeof field.placeholder === 'string' ? t(field.placeholder) : field.placeholder) : ''}
                        maxLength={field.maxLength}
                        step={field.step}
                        required={field.required}
                        autoFocus={field.autoFocus}
                        readOnly={field.readOnly}
                        disabled={field.disabled}
                        casing={field.casing || field.harfDonusumu}
                        multiline={field.type === 'textarea'}
                        rows={field.rows}
                        icon={field.icon ? getIcon(field.icon, { style: { color: 'var(--text-muted)' } }) : undefined}
                        error={Boolean(errors[field.name])}
                        style={{ width: '100%', ...(field.style || {}) }}
                    />
                )}
                <FieldError error={errors[field.name]} />
            </div>
        );
    };

    return (
        <div className="dynamic-form-wrapper">
            
            {/* Üst Kısım: Segmented Control vs. (Formun türüne göre dışarıdan verilir) */}
            {renderHeader && renderHeader()}

            {/* Sekmeler (Tabs) */}
            {!hideTabs && tabs.length > 0 && (
                <TabLayout 
                    tabs={tabs.map(tTab => ({
                        ...tTab,
                        label: typeof tTab.label === 'string' ? t(tTab.label) : (tTab.name || tTab.title),
                        icon: typeof tTab.icon === 'string' ? getIcon(tTab.icon, { size: 18 }) : tTab.icon
                    }))} 
                    activeTabId={activeTab} 
                    onChange={setActiveTab} 
                />
            )}

            {/* Form Alanları */}
            <div className="dynamic-form-fields-container">
                {fields.length > 0 ? (
                    <div className="form-grid">
                        {fields.map(field => renderInput(field))}
                    </div>
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {t('Bu sekmede alan bulunmamaktadır.')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DynamicFormRenderer;
