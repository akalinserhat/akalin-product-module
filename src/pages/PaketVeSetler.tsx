import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BaseListPage, ActionMenu } from '@akalin/ui';
import { Edit2, Trash2, Layers, ShieldCheck, RotateCcw, Archive, Box } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { IPaketVeSetListItem, PaketStokDusumYontemi } from '../dtos/PaketVeSetDto';
import paketVeSetService from '../services/PaketVeSetService';

export const PaketVeSetler: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleAddNew = useCallback((isShift = false) => {
        const url = '/paket-ve-setler/yeni';
        if (isShift) {
            window.open(url, '_blank');
        } else {
            navigate(url);
        }
    }, [navigate]);

    const handleEdit = useCallback((item: IPaketVeSetListItem, e?: any) => {
        if (e && e.shiftKey) {
            window.open(`/paket-ve-setler/${item.id}`, '_blank');
        } else {
            navigate(`/paket-ve-setler/${item.id}`);
        }
    }, [navigate]);

    const handleRestore = useCallback(async (item: IPaketVeSetListItem) => {
        try {
            await paketVeSetService.restore(item.id);
            toast.success(t('auto_paket_set_geri_yuklendi', 'Paket/Set tanımı başarıyla geri yüklendi.'));
            window.dispatchEvent(new CustomEvent('refresh-list'));
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || t('auto_hata_olustu', 'İşlem sırasında hata oluştu.'));
        }
    }, [t]);

    const handleArchive = useCallback(async (item: IPaketVeSetListItem) => {
        try {
            await paketVeSetService.archive(item.id);
            toast.success(t('auto_paket_set_arsivlendi', 'Paket/Set tanımı başarıyla arşive alındı.'));
            window.dispatchEvent(new CustomEvent('refresh-list'));
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || t('auto_hata_olustu', 'İşlem sırasında hata oluştu.'));
        }
    }, [t]);

    const handleUnarchive = useCallback(async (item: IPaketVeSetListItem) => {
        try {
            await paketVeSetService.unarchive(item.id);
            toast.success(t('auto_paket_set_arsivden_cikarildi', 'Paket/Set tanımı arşivden çıkarıldı.'));
            window.dispatchEvent(new CustomEvent('refresh-list'));
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || t('auto_hata_olustu', 'İşlem sırasında hata oluştu.'));
        }
    }, [t]);

    const columns = useMemo(() => [
        {
            id: 'kod',
            accessor: 'kod',
            header: t('Paket/Set Kodu'),
            width: '18%',
            minWidth: '130px',
            sortable: true,
            render: (row: IPaketVeSetListItem) => (
                <span className="font-semibold text-primary cursor-pointer" onClick={(e) => handleEdit(row, e)}>
                    {row.kod}
                </span>
            )
        },
        {
            id: 'ad',
            accessor: 'ad',
            header: t('Paket/Set Adı'),
            width: '32%',
            minWidth: '200px',
            sortable: true,
            render: (row: IPaketVeSetListItem) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.ad}</span>
                    {row.barkod && (
                        <span className="text-xs text-secondary font-mono">
                            {row.barkod}
                        </span>
                    )}
                </div>
            )
        },
        {
            id: 'kalemSayisi',
            accessor: 'kalemSayisi',
            header: t('Bileşenler'),
            width: '18%',
            minWidth: '150px',
            align: 'center' as const,
            sortable: true,
            render: (row: IPaketVeSetListItem) => (
                <span className="chip-primary">
                    <Layers size={13} className="mr-4 inline" />
                    {row.kalemSayisi} {t('Kalem')} ({row.toplamMiktar} {t('Adet')})
                </span>
            )
        },
        {
            id: 'stokDusumYontemi',
            accessor: 'stokDusumYontemi',
            header: t('Stok Düşüm Yöntemi'),
            width: '20%',
            minWidth: '180px',
            render: (row: IPaketVeSetListItem) => (
                <span className="text-xs flex items-center gap-6">
                    <ShieldCheck size={14} className="text-secondary" />
                    {row.stokDusumYontemi === PaketStokDusumYontemi.BilesenlerdenDus
                        ? t('Bileşenlerin Stokundan Düş')
                        : t('Paket Stokundan Düş')}
                </span>
            )
        },
        {
            id: 'aktifMi',
            accessor: 'aktifMi',
            header: t('Durum'),
            width: '12%',
            minWidth: '100px',
            align: 'center' as const,
            render: (row: IPaketVeSetListItem) => {
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
                return (
                    <span className={`badge ${row.aktifMi ? 'badge-success' : 'badge-secondary'}`}>
                        {row.aktifMi ? t('Aktif') : t('Pasif')}
                    </span>
                );
            }
        },
        {
            id: 'actions',
            header: '',
            width: '60px',
            minWidth: '60px',
            align: 'center' as const,
            render: (row: IPaketVeSetListItem, _index: number, tableActions: any) => {
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
                                onClick: (e) => tableActions?.handleEdit ? tableActions.handleEdit(row, e) : handleEdit(row, e)
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
        { id: 'kod', label: t('Paket Kodu') },
        { id: 'ad', label: t('Paket Adı') },
        { id: 'barkod', label: t('Barkod') }
    ], [t]);

    const mobileCardRender = useCallback((item: IPaketVeSetListItem, _index: number, tableActions: any) => (
        <div className="card-box p-12 cursor-pointer flex flex-col gap-8" onClick={(e) => handleEdit(item, e)}>
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <span className="font-bold text-primary">{item.kod}</span>
                    <span className="font-medium text-sm">{item.ad}</span>
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
                    ) : (
                        <span className={`badge ${item.aktifMi ? 'badge-success' : 'badge-secondary'}`}>
                            {item.aktifMi ? t('Aktif') : t('Pasif')}
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
                                    onClick: (e) => tableActions?.handleEdit ? tableActions.handleEdit(item, e) : handleEdit(item, e)
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
                <span>{item.kalemSayisi} {t('Kalem')} ({item.toplamMiktar} {t('Adet')})</span>
                <span>
                    {item.stokDusumYontemi === PaketStokDusumYontemi.BilesenlerdenDus
                        ? t('Bileşenlerden Düş')
                        : t('Paket Stoğundan Düş')}
                </span>
            </div>
        </div>
    ), [t, handleEdit, handleRestore, handleArchive, handleUnarchive]);

    return (
        <BaseListPage
            title={t('Paket & Set Tanımları')}
            subtitle={t('auto_paket_set_alt_baslik', 'Karma koli, set ve paket ürün reçetelerini yönetin.')}
            icon={<Box size={24} />}
            service={paketVeSetService}
            apiEndpoint="/api/PaketVeSet"
            baseRoute="/paket-ve-setler"
            addNewText={t('Yeni Paket / Set')}
            onAddNew={handleAddNew}
            columns={columns}
            searchableFields={searchableFields}
            itemNameResolver={(item) => item.ad || item.kod}
            onEdit={handleEdit}
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
            canDelete={(item) => paketVeSetService.canDelete(item.id)}
            mobileCardRender={mobileCardRender}
            emptyMessage={t('Kayıtlı paket veya set tanımı bulunamadı.')}
            enableColumnManagement={true}
            enableViewModeToggle={true}
            enableUndoDelete={true}
        />
    );
};

export default PaketVeSetler;
