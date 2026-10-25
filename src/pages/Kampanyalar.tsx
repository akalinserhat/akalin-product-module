/**
 * Webakus ERP - Kampanyalar Liste Sayfası
 * Sisteme tanımlanmış tüm kampanya belgelerini (kampanya şart ve kuralları, geçerlilik tarihleri) listeler.
 * "Aktif", "Arşiv" ve "Çöp Kutusu" sekmeleri, sayfalama, arama, filtreleme, sütun yönetimi,
 * yeni ekleme, düzenleme, arşive alma/çıkarma ve geri alınabilir silme işlemlerini BaseListPage ile yönetir.
 */
import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BaseListPage, ActionMenu } from '@akalin/ui';
import { Edit2, Trash2, Megaphone, RotateCcw, Archive } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { kampanyalarService } from '../services/KampanyalarService';
import { KampanyaBelgesiDto } from '../dtos/KampanyalarDto';

const Kampanyalar: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleAddNew = useCallback((isShift = false) => {
        const url = '/kampanyalar/yeni';
        if (isShift) {
            window.open(url, '_blank');
        } else {
            navigate(url, { state: { returnUrl: '/kampanyalar' } });
        }
    }, [navigate]);

    const handleEdit = useCallback((row: KampanyaBelgesiDto, e?: any) => {
        const url = `/kampanyalar/duzenle/${row.id}`;
        if (e && e.shiftKey) {
            window.open(url, '_blank');
        } else {
            navigate(url, { state: { returnUrl: '/kampanyalar' } });
        }
    }, [navigate]);

    const handleRestore = useCallback(async (row: KampanyaBelgesiDto) => {
        try {
            await kampanyalarService.restore(row.id);
            toast.success(t('auto_kampanya_geri_yuklendi', 'Kampanya belgesi başarıyla geri yüklendi.'));
            window.dispatchEvent(new CustomEvent('refresh-list'));
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || t('auto_hata_olustu', 'İşlem sırasında hata oluştu.'));
        }
    }, [t]);

    const handleArchive = useCallback(async (row: KampanyaBelgesiDto) => {
        try {
            await kampanyalarService.archive(row.id);
            toast.success(t('auto_kampanya_arsivlendi', 'Kampanya belgesi başarıyla arşive alındı.'));
            window.dispatchEvent(new CustomEvent('refresh-list'));
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || t('auto_hata_olustu', 'İşlem sırasında hata oluştu.'));
        }
    }, [t]);

    const handleUnarchive = useCallback(async (row: KampanyaBelgesiDto) => {
        try {
            await kampanyalarService.unarchive(row.id);
            toast.success(t('auto_kampanya_arsivden_cikarildi', 'Kampanya belgesi arşivden çıkarıldı.'));
            window.dispatchEvent(new CustomEvent('refresh-list'));
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || t('auto_hata_olustu', 'İşlem sırasında hata oluştu.'));
        }
    }, [t]);

    const columns = useMemo(() => [
        { 
            id: 'belgeNo', 
            accessor: 'belgeNo', 
            header: t('Belge No'), 
            width: '140px',
            sortable: true,
            render: (row: KampanyaBelgesiDto) => (
                <span
                    className="font-semibold text-primary cursor-pointer"
                    onClick={(e) => handleEdit(row, e)}
                >
                    {row.belgeNo}
                </span>
            )
        },
        { 
            id: 'adi', 
            accessor: 'adi', 
            header: t('Kampanya Belgesi Adı'), 
            width: '280px',
            sortable: true,
            render: (row: KampanyaBelgesiDto) => (
                <span className="font-medium">{row.adi}</span>
            )
        },
        { 
            id: 'baslangicTarihi', 
            accessor: 'baslangicTarihi', 
            header: t('Başlangıç Tarihi'), 
            width: '140px',
            sortable: true,
            render: (row: KampanyaBelgesiDto) => row.baslangicTarihi ? new Date(row.baslangicTarihi).toLocaleDateString('tr-TR') : '-'
        },
        { 
            id: 'bitisTarihi', 
            accessor: 'bitisTarihi', 
            header: t('Bitiş Tarihi'), 
            width: '140px',
            sortable: true,
            render: (row: KampanyaBelgesiDto) => row.bitisTarihi ? new Date(row.bitisTarihi).toLocaleDateString('tr-TR') : '-'
        },
        { 
            id: 'kampanyaSayisi', 
            accessor: 'kampanyalar', 
            header: t('Tanımlı Kampanyalar'), 
            width: '160px',
            align: 'center' as const,
            render: (row: KampanyaBelgesiDto) => {
                const count = row.kampanyalar?.length || 0;
                return (
                    <span className="chip-primary">
                        <Megaphone size={13} className="mr-4 inline" />
                        {count} {t('Kampanya')}
                    </span>
                );
            }
        },
        {
            id: 'durum',
            accessor: 'durum',
            header: t('Durum'),
            width: '120px',
            align: 'center' as const,
            render: (row: KampanyaBelgesiDto) => {
                if (row.silindiMi) {
                    return (
                        <span className="chip-danger text-11 font-medium">
                            {t('auto_silindi', 'Silindi')}
                        </span>
                    );
                }
                if (row.arsivlendiMi) {
                    return (
                        <span className="chip-warning text-11 font-medium">
                            {t('auto_arsivlendi', 'Arşivlendi')}
                        </span>
                    );
                }
                const now = new Date();
                const end = row.bitisTarihi ? new Date(row.bitisTarihi) : null;
                const isExpired = end && end < now;
                if (isExpired) {
                    return (
                        <span className="badge badge-secondary">
                            {t('suresi_doldu', 'Süresi Doldu')}
                        </span>
                    );
                }
                return (
                    <span className="badge badge-success">
                        {t('Aktif')}
                    </span>
                );
            }
        },
        {
            id: 'actions',
            header: '',
            width: '60px',
            align: 'center' as const,
            render: (row: KampanyaBelgesiDto, _index: number, tableActions: any) => {
                if (row.silindiMi) {
                    return (
                        <ActionMenu
                            actions={[
                                {
                                    label: t('auto_geri_yukle', 'Geri Yükle'),
                                    icon: <RotateCcw size={16} />,
                                    isDefault: true,
                                    default: true,
                                    onClick: () => handleRestore(row)
                                }
                            ]}
                        />
                    );
                }

                if (row.arsivlendiMi) {
                    return (
                        <ActionMenu
                            actions={[
                                {
                                    label: t('auto_arsivden_cikar', 'Arşivden Çıkar'),
                                    icon: <RotateCcw size={16} />,
                                    isDefault: true,
                                    default: true,
                                    onClick: () => handleUnarchive(row)
                                },
                                {
                                    label: t('Sil'),
                                    icon: <Trash2 size={16} />,
                                    onClick: () => tableActions?.handleDelete && tableActions.handleDelete(row),
                                    danger: true
                                }
                            ]}
                        />
                    );
                }

                return (
                    <ActionMenu
                        actions={[
                            {
                                label: t('Düzenle'),
                                icon: <Edit2 size={16} />,
                                isDefault: true,
                                default: true,
                                onClick: (e) => (tableActions?.handleEdit ? tableActions.handleEdit(row, e) : handleEdit(row, e))
                            },
                            {
                                label: t('auto_arsive_al', 'Arşive Al'),
                                icon: <Archive size={16} />,
                                onClick: () => handleArchive(row)
                            },
                            {
                                label: t('Sil'),
                                icon: <Trash2 size={16} />,
                                onClick: () => tableActions?.handleDelete && tableActions.handleDelete(row),
                                danger: true
                            }
                        ]}
                    />
                );
            }
        }
    ], [t, handleEdit, handleRestore, handleArchive, handleUnarchive]);

    const searchableFields = useMemo(() => [
        { id: 'belgeNo', label: t('Belge No') },
        { id: 'adi', label: t('Kampanya Belgesi Adı') }
    ], [t]);

    const mobileCardRender = useCallback((item: KampanyaBelgesiDto, _index: number, tableActions: any) => {
        const now = new Date();
        const end = item.bitisTarihi ? new Date(item.bitisTarihi) : null;
        const isExpired = end && end < now;

        return (
            <div className="card-box p-12 cursor-pointer flex flex-col gap-8" onClick={(e) => handleEdit(item, e)}>
                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <span className="font-bold text-primary">{item.belgeNo}</span>
                        <span className="font-medium text-sm">{item.adi}</span>
                    </div>
                    <div className="flex items-center gap-8" onClick={(e) => e.stopPropagation()}>
                        {item.silindiMi ? (
                            <span className="chip-danger text-11 font-medium">
                                {t('auto_silindi', 'Silindi')}
                            </span>
                        ) : item.arsivlendiMi ? (
                            <span className="chip-warning text-11 font-medium">
                                {t('auto_arsivlendi', 'Arşivlendi')}
                            </span>
                        ) : isExpired ? (
                            <span className="badge badge-secondary">
                                {t('suresi_doldu', 'Süresi Doldu')}
                            </span>
                        ) : (
                            <span className="badge badge-success">
                                {t('Aktif')}
                            </span>
                        )}

                        {item.silindiMi ? (
                            <ActionMenu
                                actions={[
                                    {
                                        label: t('auto_geri_yukle', 'Geri Yükle'),
                                        icon: <RotateCcw size={15} />,
                                        isDefault: true,
                                        default: true,
                                        onClick: () => handleRestore(item)
                                    }
                                ]}
                            />
                        ) : item.arsivlendiMi ? (
                            <ActionMenu
                                actions={[
                                    {
                                        label: t('auto_arsivden_cikar', 'Arşivden Çıkar'),
                                        icon: <RotateCcw size={15} />,
                                        isDefault: true,
                                        default: true,
                                        onClick: () => handleUnarchive(item)
                                    },
                                    {
                                        label: t('Sil'),
                                        icon: <Trash2 size={15} />,
                                        danger: true,
                                        onClick: () => tableActions?.handleDelete && tableActions.handleDelete(item)
                                    }
                                ]}
                            />
                        ) : (
                            <ActionMenu
                                actions={[
                                    {
                                        label: t('Düzenle'),
                                        icon: <Edit2 size={15} />,
                                        isDefault: true,
                                        default: true,
                                        onClick: (e) => (tableActions?.handleEdit ? tableActions.handleEdit(item, e) : handleEdit(item, e))
                                    },
                                    {
                                        label: t('auto_arsive_al', 'Arşive Al'),
                                        icon: <Archive size={15} />,
                                        onClick: () => handleArchive(item)
                                    },
                                    {
                                        label: t('Sil'),
                                        icon: <Trash2 size={15} />,
                                        danger: true,
                                        onClick: () => tableActions?.handleDelete && tableActions.handleDelete(item)
                                    }
                                ]}
                            />
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center text-xs text-secondary border-t pt-8 mt-4">
                    <span>
                        {item.baslangicTarihi ? new Date(item.baslangicTarihi).toLocaleDateString('tr-TR') : '-'}
                        {' - '}
                        {item.bitisTarihi ? new Date(item.bitisTarihi).toLocaleDateString('tr-TR') : '-'}
                    </span>
                    <span className="chip-primary text-11">
                        <Megaphone size={12} className="mr-4 inline" />
                        {item.kampanyalar?.length || 0} {t('Kampanya')}
                    </span>
                </div>
            </div>
        );
    }, [t, handleEdit, handleRestore, handleArchive, handleUnarchive]);

    return (
        <BaseListPage<KampanyaBelgesiDto>
            title={t('Kampanyalar')}
            subtitle={t('auto_kampanya_alt_baslik', 'Aktif ve planlanan kampanya belgelerini yönetin.')}
            icon={<Megaphone size={24} />}
            service={kampanyalarService}
            apiEndpoint="/api/Kampanyalar"
            baseRoute="/kampanyalar"
            addNewText={t('auto_yeni_kampanya_belgesi', 'Yeni Kampanya Belgesi')}
            onAddNew={handleAddNew}
            onEdit={handleEdit}
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
            canDelete={(item) => kampanyalarService.canDelete(item.id)}
            columns={columns}
            searchableFields={searchableFields}
            itemNameResolver={(item) => item.adi || item.belgeNo}
            mobileCardRender={mobileCardRender}
            emptyMessage={t('auto_kayitli_kampanya_bulunamadi', 'Kayıtlı kampanya belgesi bulunamadı.')}
            enableViewModeToggle={true}
            enableArchive={true}
            enableUndoDelete={true}
            enableColumnManagement={true}
            aiDocumentType="KampanyaBelgesi"
            aiPromptSuggestions={[
                t('ai_kampanya_oneri_1', 'Tüm buzdolaplarında geçerli 2. ürüne %50 indirim kampanyası hazırla'),
                t('ai_kampanya_oneri_2', 'Beyaz eşya sepetinde 50.000 TL üzeri alışverişe 5.000 TL sepet indirimi tanımla'),
                t('ai_kampanya_oneri_3', 'Ankastre set alımlarında davlumbaz hediye kampanyası oluştur')
            ]}
        />
    );
};

export default Kampanyalar;
