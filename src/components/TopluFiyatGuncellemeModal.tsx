import React, { useState, useEffect } from 'react';
import { BaseDetailDialog } from '@akalin/ui';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface TopluFiyatGuncellemeModalProps {
    fiyatListesi: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const TopluFiyatGuncellemeModal: React.FC<TopluFiyatGuncellemeModalProps> = ({
    fiyatListesi,
    isOpen,
    onClose,
    onSuccess
}) => {
    const { t } = useTranslation();
    const [yuzdeOrani, setYuzdeOrani] = useState<string>('10');
    const [urunGruplari, setUrunGruplari] = useState<any[]>([]);
    const [seciliGrupId, setSeciliGrupId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            axios.get('/api/UrunVeHizmetGruplari')
                .then(res => setUrunGruplari(res.data || []))
                .catch(err => console.error("Ürün grupları çekilemedi", err));
        }
    }, [isOpen]);

    const handleSave = async () => {
        const yuzde = parseFloat(yuzdeOrani);
        if (isNaN(yuzde) || yuzde === 0) {
            toast.error(t('TopluZam_gecersizOran') || 'Lütfen geçerli bir yüzde oranı giriniz.');
            return;
        }

        try {
            setLoading(true);
            await axios.post('/api/FiyatListeleri/toplu-zam', {
                fiyatListesiId: fiyatListesi.id,
                yuzdeOrani: yuzde,
                urunVeHizmetGrubuId: seciliGrupId ? parseInt(seciliGrupId, 10) : null
            });
            toast.success(t('TopluZam_basarili') || 'Toplu fiyat güncellemesi başarıyla uygulandı.');
            onSuccess();
        } catch (error: any) {
            toast.error(error?.response?.data?.mesaj || t('TopluZam_hata') || 'Toplu fiyat güncellemesi sırasında hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseDetailDialog
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('FiyatListesi_topluZam') || 'Toplu Zam / İndirim'}: ${fiyatListesi?.ad}`}
            size="md"
            onSave={handleSave}
            saveText={t('Uygula') || 'Uygula'}
            cancelText={t('İptal') || 'İptal'}
            isSaveDisabled={loading}
        >
            <div className="flex-col gap-16">
                <div className="surface-card p-12 mb-8">
                    <p className="text-secondary text-sm">
                        {t('TopluZam_aciklama') || 'Bu fiyat listesindeki kalemlerin birim fiyatlarını yüzde bazında artırabilir (zam) veya azaltabilirsiniz (indirim). İndirim uygulamak için negatif değer (-10 gibi) giriniz.'}
                    </p>
                </div>

                <div className="form-group">
                    <label className="form-label required-label">
                        {t('TopluZam_yuzdeOrani') || 'Değişim Oranı (%)'}
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        autoFocus
                        value={yuzdeOrani}
                        onChange={(e) => setYuzdeOrani(e.target.value)}
                        placeholder="Örn: 10 (%10 Zam) veya -5 (%5 İndirim)"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">
                        {t('TopluZam_urunGrubuFiltresi') || 'Ürün / Hizmet Grubu Filtresi (Opsiyonel)'}
                    </label>
                    <select
                        className="form-control"
                        value={seciliGrupId}
                        onChange={(e) => setSeciliGrupId(e.target.value)}
                    >
                        <option value="">{t('Tüm Gruplar') || '-- Tüm Ürün/Hizmet Grupları --'}</option>
                        {urunGruplari.map((grup: any) => (
                            <option key={grup.id} value={grup.id}>
                                {grup.ad}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </BaseDetailDialog>
    );
};

export default TopluFiyatGuncellemeModal;
