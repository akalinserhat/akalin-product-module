/**
 * Webakus ERP - Merkezi Dinamik Breadcrumb Hook'u (useAppBreadcrumbs.tsx)
 * 
 * Başlıca Görevleri:
 * - Aktif rotayı (location.pathname) ve ModuleRegistry menü ağacını analiz eder
 * - Hiyerarşiyi standartlaştırır: [Ana Sayfa] -> [Modül Grubu] -> [Liste / Sayfa] -> [Kayıt / Detay] -> [Alt İşlem]
 * - Tüm sayfalarda tutarlı, eksiksiz ve tıklanabilir navigasyon geçmişi üretir
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home } from 'lucide-react';
import { BreadcrumbItem } from '@akalin/ui';
import { ModuleRegistry, type IMenuItemDefinition } from '@akalin/module_core';

export interface BreadcrumbSubItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

export interface UseAppBreadcrumbsOptions {
  pathname?: string;
  recordTitle?: string;
  subTrail?: BreadcrumbSubItem[];
  hideBreadcrumb?: boolean;
}

const submoduleMap: Record<string, { label: string; path: string }> = {
  'UrunGruplari': { label: 'Ürün Grupları', path: '/ayarlar/sistem-ayarlari/UrunGruplari' },
  'urun-gruplari': { label: 'Ürün Grupları', path: '/ayarlar/sistem-ayarlari/UrunGruplari' },
  'HizmetGruplari': { label: 'Hizmet Grupları', path: '/ayarlar/sistem-ayarlari/HizmetGruplari' },
  'hizmet-gruplari': { label: 'Hizmet Grupları', path: '/ayarlar/sistem-ayarlari/HizmetGruplari' },
  'VergiVeKDV': { label: 'Vergi ve KDV Ayarları', path: '/ayarlar/sistem-ayarlari/VergiVeKDV' },
  'VergiVeKdv': { label: 'Vergi ve KDV Ayarları', path: '/ayarlar/sistem-ayarlari/VergiVeKDV' },
  'vergi-ve-kdv': { label: 'Vergi ve KDV Ayarları', path: '/ayarlar/sistem-ayarlari/VergiVeKDV' },
  'ParaBirimleri': { label: 'Para Birimleri', path: '/ayarlar/sistem-ayarlari/ParaBirimleri' },
  'para-birimleri': { label: 'Para Birimleri', path: '/ayarlar/sistem-ayarlari/ParaBirimleri' },
  'Markalar': { label: 'Markalar', path: '/ayarlar/sistem-ayarlari/Markalar' },
  'markalar': { label: 'Markalar', path: '/ayarlar/sistem-ayarlari/Markalar' },
  'Birimler': { label: 'Birimler', path: '/ayarlar/sistem-ayarlari/Birimler' },
  'birimler': { label: 'Birimler', path: '/ayarlar/sistem-ayarlari/Birimler' },
  'OzellikTanimlari': { label: 'Özellik Tanımları', path: '/ayarlar/sistem-ayarlari/OzellikTanimlari' },
  'ozellik-tanimlari': { label: 'Özellik Tanımları', path: '/ayarlar/sistem-ayarlari/OzellikTanimlari' },
  'Kullanicilar': { label: 'Kullanıcı ve Personel', path: '/ayarlar/sistem-ayarlari/Kullanicilar' },
  'kullanicilar': { label: 'Kullanıcı ve Personel', path: '/ayarlar/sistem-ayarlari/Kullanicilar' },
  'KullanicilarVePersonel': { label: 'Kullanıcı ve Personel', path: '/ayarlar/sistem-ayarlari/Kullanicilar' },
  'kullanicilar-ve-personel': { label: 'Kullanıcı ve Personel', path: '/ayarlar/sistem-ayarlari/Kullanicilar' },
  'RolVeYetkiler': { label: 'Rol ve Yetki Yönetimi', path: '/ayarlar/sistem-ayarlari/RolVeYetkiler' },
  'rol-ve-yetkiler': { label: 'Rol ve Yetki Yönetimi', path: '/ayarlar/sistem-ayarlari/RolVeYetkiler' },
  'GuvenlikAyarlari': { label: 'Güvenlik Ayarları', path: '/ayarlar/sistem-ayarlari/GuvenlikAyarlari' },
  'guvenlik-ayarlari': { label: 'Güvenlik Ayarları', path: '/ayarlar/sistem-ayarlari/GuvenlikAyarlari' },
  'KartAyarlari': { label: 'Kart Ayarları', path: '/ayarlar/sistem-ayarlari/KartAyarlari' },
  'kart-ayarlari': { label: 'Kart Ayarları', path: '/ayarlar/sistem-ayarlari/KartAyarlari' },
  'BelgeAyarlari': { label: 'Belge Ayarları', path: '/ayarlar/sistem-ayarlari/BelgeAyarlari' },
  'belge-ayarlari': { label: 'Belge Ayarları', path: '/ayarlar/sistem-ayarlari/BelgeAyarlari' },
  'KasaHesaplari': { label: 'Kasa Hesapları', path: '/ayarlar/sistem-ayarlari/KasaHesaplari' },
  'kasa-hesaplari': { label: 'Kasa Hesapları', path: '/ayarlar/sistem-ayarlari/KasaHesaplari' },
  'BankaHesaplari': { label: 'Banka Hesapları', path: '/ayarlar/sistem-ayarlari/BankaHesaplari' },
  'banka-hesaplari': { label: 'Banka Hesapları', path: '/ayarlar/sistem-ayarlari/BankaHesaplari' },
  'PosCihazlari': { label: 'POS Cihazları', path: '/ayarlar/sistem-ayarlari/PosCihazlari' },
  'pos-cihazlari': { label: 'POS Cihazları', path: '/ayarlar/sistem-ayarlari/PosCihazlari' },
  'TuketiciKredisiFirmalari': { label: 'Tüketici Kredisi Firmaları', path: '/ayarlar/sistem-ayarlari/TuketiciKredisiFirmalari' },
  'tuketici-kredisi-firmalari': { label: 'Tüketici Kredisi Firmaları', path: '/ayarlar/sistem-ayarlari/TuketiciKredisiFirmalari' },
  'GelirGiderKartlari': { label: 'Gelir / Gider Kartları', path: '/ayarlar/sistem-ayarlari/GelirGiderKartlari' },
  'gelirgider': { label: 'Gelir / Gider Kartları', path: '/ayarlar/sistem-ayarlari/GelirGiderKartlari' },
  'gelir-gider-kartlari': { label: 'Gelir / Gider Kartları', path: '/ayarlar/sistem-ayarlari/GelirGiderKartlari' },
  'FiyatListesiTanimlari': { label: 'Fiyat Listesi Tanımları', path: '/ayarlar/sistem-ayarlari/FiyatListesiTanimlari' },
  'fiyat-listesi-tanimlari': { label: 'Fiyat Listesi Tanımları', path: '/ayarlar/sistem-ayarlari/FiyatListesiTanimlari' },
  'fiyat-listeleri': { label: 'Fiyat Listeleri', path: '/ayarlar/sistem-ayarlari/FiyatListesiTanimlari' },
  'UygulamaEntegrasyonlari': { label: 'Uygulama Entegrasyonları', path: '/ayarlar/sistem-ayarlari/UygulamaEntegrasyonlari' },
  'uygulama-entegrasyonlari': { label: 'Uygulama Entegrasyonları', path: '/ayarlar/sistem-ayarlari/UygulamaEntegrasyonlari' },
  'VeriAktarimi': { label: 'Veri Aktarım Merkezi', path: '/ayarlar/sistem-ayarlari/VeriAktarimi' },
  'veri-aktarimi': { label: 'Veri Aktarım Merkezi', path: '/ayarlar/sistem-ayarlari/VeriAktarimi' },
  'DepolarVeSubeler': { label: 'Depolar ve Şubeler', path: '/ayarlar/sistem-ayarlari/DepolarVeSubeler' },
  'depolar-ve-subeler': { label: 'Depolar ve Şubeler', path: '/ayarlar/sistem-ayarlari/DepolarVeSubeler' },
  'depolar': { label: 'Depolar ve Şubeler', path: '/ayarlar/sistem-ayarlari/DepolarVeSubeler' },
  'depo': { label: 'Depolar ve Şubeler', path: '/ayarlar/sistem-ayarlari/DepolarVeSubeler' },
  'KargoFirmalari': { label: 'Kargo Firmaları', path: '/ayarlar/sistem-ayarlari/KargoFirmalari' },
  'kargo-firmalari': { label: 'Kargo Firmaları', path: '/ayarlar/sistem-ayarlari/KargoFirmalari' },
  'BarkodYonetimi': { label: 'Barkod Yönetimi', path: '/ayarlar/sistem-ayarlari/BarkodYonetimi' },
  'barkod-yonetimi': { label: 'Barkod Yönetimi', path: '/ayarlar/sistem-ayarlari/BarkodYonetimi' },
  'SmtpAyarlari': { label: 'E-Posta & SMTP Ayarları', path: '/ayarlar/SmtpAyarlari?tab=templates' },
  'smtpayarlari': { label: 'E-Posta & SMTP Ayarları', path: '/ayarlar/SmtpAyarlari?tab=templates' },
  'templates': { label: 'E-Posta Şablonları', path: '/ayarlar/SmtpAyarlari?tab=templates' },
  'sablon': { label: 'E-Posta Şablonları', path: '/ayarlar/SmtpAyarlari?tab=templates' },
  'alinan': { label: 'Alınan Siparişler', path: '/siparisler/alinan' },
  'verilen': { label: 'Verilen Siparişler', path: '/siparisler/verilen' },
  'alinan-iade': { label: 'Alınan Sipariş İade', path: '/siparisler/alinan-iade' },
  'verilen-iade': { label: 'Verilen Sipariş İade', path: '/siparisler/verilen-iade' }
};

const isDocumentPath = (path: string): boolean => {
  const p = path.toLowerCase();
  return p.includes('/siparis') || 
         p.includes('/fatura') || 
         p.includes('/irsaliye') || 
         p.includes('/depo') || 
         p.includes('/kasa') || 
         p.includes('/banka') || 
         p.includes('/cek-senet') ||
         p.includes('/fiyat-liste') ||
         p.includes('/bsh-fiyat-farki') ||
         p.includes('/kampanya');
};

export const useAppBreadcrumbs = (options?: UseAppBreadcrumbsOptions): BreadcrumbItem[] => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = options?.pathname || location.pathname;
  const rawRecordTitle = options?.recordTitle;
  const subTrail = options?.subTrail;
  const hideBreadcrumb = options?.hideBreadcrumb;

  // Klavye ile metin alanı içinde aktif yazım yapılırken (onChange esnasında) Breadcrumb'ın
  // her harfte anlık değişmesini engeller; seçim yapıldığında veya alandan çıkıldığında (focusout) günceller.
  const [committedRecordTitle, setCommittedRecordTitle] = useState<string | undefined>(rawRecordTitle);
  const isTypingInInputRef = useRef(false);
  const latestRawTitleRef = useRef<string | undefined>(rawRecordTitle);
  const lastPathRef = useRef<string>(currentPath);

  useEffect(() => {
    latestRawTitleRef.current = rawRecordTitle;
  }, [rawRecordTitle]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
        !(target as HTMLInputElement).readOnly
      ) {
        isTypingInInputRef.current = true;
      }
    };

    const commitPendingTitle = () => {
      if (isTypingInInputRef.current) {
        isTypingInInputRef.current = false;
        setCommittedRecordTitle(latestRawTitleRef.current);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Tab') {
        setTimeout(commitPendingTitle, 0);
      }
    };

    window.addEventListener('input', handleInput, true);
    window.addEventListener('focusout', commitPendingTitle, true);
    window.addEventListener('change', commitPendingTitle, true);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('input', handleInput, true);
      window.removeEventListener('focusout', commitPendingTitle, true);
      window.removeEventListener('change', commitPendingTitle, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  useEffect(() => {
    if (lastPathRef.current !== currentPath) {
      lastPathRef.current = currentPath;
      isTypingInInputRef.current = false;
      setCommittedRecordTitle(rawRecordTitle);
      return;
    }

    if (!isTypingInInputRef.current || !rawRecordTitle || !committedRecordTitle) {
      isTypingInInputRef.current = false;
      setCommittedRecordTitle(rawRecordTitle);
    }
  }, [rawRecordTitle, currentPath, committedRecordTitle]);

  const recordTitle = committedRecordTitle;

  return useMemo(() => {
    if (hideBreadcrumb) {
      return [];
    }

    // 1. Adım: Kök / Ana Sayfa
    const items: BreadcrumbItem[] = [
      {
        label: t('Ana Sayfa'),
        icon: <Home size={12} />,
        onClick: currentPath !== '/' || subTrail || recordTitle ? () => navigate('/') : undefined,
        active: currentPath === '/' && !subTrail && !recordTitle
      }
    ];

    if (currentPath === '/' && !subTrail && !recordTitle) {
      return items;
    }

    const menuTree = ModuleRegistry.getNavHierarchy() || [];

    // Menü ağacında geçerli rotayı eşleştir (Önce Tam Eşleşme, sonra Alt Rota Eşleşmesi)
    let matchedParent: IMenuItemDefinition | null = null;
    let matchedItem: IMenuItemDefinition | null = null;

    // 1. Önce Tam Eşleşme (Exact Match)
    for (const rootItem of menuTree) {
      if (rootItem.path === currentPath) {
        matchedItem = rootItem;
        break;
      }
      if (rootItem.children && rootItem.children.length > 0) {
        for (const child of rootItem.children) {
          if (child.path === currentPath) {
            matchedParent = rootItem;
            matchedItem = child;
            break;
          }
        }
      }
      if (matchedItem) break;
    }

    // 2. Tam eşleşme yoksa, alt rota eşleşmesi ara (Kök rotalar hariç)
    if (!matchedItem) {
      for (const rootItem of menuTree) {
        if (rootItem.children && rootItem.children.length > 0) {
          for (const child of rootItem.children) {
            if (child.path && child.path !== '/' && child.path !== '/ayarlar' && currentPath.startsWith(child.path + '/')) {
              matchedParent = rootItem;
              matchedItem = child;
              break;
            }
          }
        }
        if (!matchedItem && rootItem.path && rootItem.path !== '/' && rootItem.path !== '/ayarlar' && currentPath.startsWith(rootItem.path + '/')) {
          matchedItem = rootItem;
          break;
        }
        if (matchedItem) break;
      }
    }

    // 2. Adım: Modül / Menü Grubu (örn: Sistem & Tanımlar)
    if (matchedParent) {
      items.push({
        label: t(matchedParent.label),
        onClick: matchedParent.path ? () => navigate(matchedParent.path!) : undefined
      });
    }

    // 3. Adım: Sayfa / Liste (örn: Sistem Ayarları)
    if (matchedItem) {
      const isItemEnd = matchedItem.path === currentPath && !subTrail && !recordTitle;
      items.push({
        label: t(matchedItem.label),
        onClick: !isItemEnd && matchedItem.path ? () => navigate(matchedItem.path!) : undefined,
        active: isItemEnd
      });

      // 4. Adım: Alt İşlem Ağacı veya Kayıt Başlığı
      if (recordTitle && subTrail && subTrail.length > 0) {
        const parentPath = (currentPath.endsWith('/adres') || currentPath.endsWith('/bulut-dosyalari') || currentPath.endsWith('/excel-import') || currentPath.endsWith('/cari-secim') || currentPath.includes('/kural'))
          ? currentPath.replace(/\/(adres|bulut-dosyalari|excel-import|cari-secim|kural.*)$/, '')
          : undefined;
        items.push({
          label: recordTitle,
          onClick: parentPath ? () => navigate(parentPath) : undefined,
          active: false
        });
      }

      if (subTrail && subTrail.length > 0) {
        subTrail.forEach((sub, idx) => {
          const isSubLast = idx === subTrail.length - 1;
          items.push({
            label: sub.label,
            onClick: !isSubLast ? sub.onClick : undefined,
            active: isSubLast
          });
        });
      } else if (!isItemEnd && matchedItem.path) {
        const subPath = currentPath.replace(matchedItem.path, '').replace(/^\//, '');
        if (subPath) {
          const rawSubSegments = subPath.split('/').filter(Boolean).filter(seg => seg.toLowerCase() !== 'duzenle');

          let recordTitleUsed = false;
          let cumulativeSubPath = matchedItem.path;

          rawSubSegments.forEach((subSeg, idx) => {
            cumulativeSubPath += `/${subSeg}`;
            const isSubSegLast = idx === rawSubSegments.length - 1;
            const known = submoduleMap[subSeg];
            let label = subSeg;
            let redirectPath = cumulativeSubPath;

            const isIdOrYeni = !isNaN(Number(subSeg)) || subSeg === 'yeni' || /^[0-9a-fA-F-]{36}$/.test(subSeg) || isSubSegLast;

            if (isIdOrYeni && recordTitle && !recordTitleUsed) {
              label = recordTitle;
              recordTitleUsed = true;
            } else if (known) {
              label = t(known.label);
              redirectPath = known.path;
            } else if (subSeg === 'kural' || subSeg === 'kurallar') {
              label = t('auto_kampanya_kurallari', 'Kampanya Kuralları');
            } else if (subSeg === 'yeni') {
              label = isDocumentPath(currentPath) ? (currentPath.includes('/kural') ? t('auto_yeni_kural', 'Yeni Kural') : t('auto_yeni_belge', 'Yeni Belge')) : t('Yeni Kayıt');
            } else if (subSeg === 'duzenle') {
              label = t('Düzenle');
            } else if (subSeg === 'adres') {
              label = t('Adres Bilgileri');
            } else if (subSeg === 'bulut-dosyalari') {
              label = t('FilesOnClouds_title', 'Bulut Dosyaları');
            } else if (subSeg === 'excel-import' || subSeg === 'excel-den-veri-al') {
              label = t('ExcelImport_title', "Excel'den Veri Al");
            } else if (subSeg === 'cari-secim') {
              label = t('Cari Seçimi', 'Cari Seçimi');
            } else if (!isNaN(Number(subSeg))) {
              label = `#${subSeg}`;
            } else {
              label = subSeg.charAt(0).toUpperCase() + subSeg.slice(1);
            }

            if (!items.some(it => it.label === label)) {
              items.push({
                label,
                onClick: !isSubSegLast ? () => navigate(redirectPath) : undefined,
                active: isSubSegLast
              });
            }
          });

          if (recordTitle && !recordTitleUsed) {
            items.push({
              label: recordTitle,
              active: true
            });
          }
        }
      } else if (recordTitle) {
        items.push({
          label: recordTitle,
          active: true
        });
      }
    } else {
      // Menüde doğrudan bulunamayan rotalar için URL parçalama fallback'i
      const segments = currentPath.split('/').filter(Boolean);
      let cumulativePath = '';

      const isActionOrId = (seg: string) => {
        return seg === 'yeni' || seg === 'duzenle' || !isNaN(Number(seg));
      };

      segments.forEach((seg, idx) => {
        cumulativePath += `/${seg}`;

        if (seg.toLowerCase() === 'duzenle') {
          return;
        }

        // Eğer recordTitle veya subTrail varsa, 'duzenle', 'yeni' ve sayısal ID segmentlerini atla
        if ((recordTitle || (subTrail && subTrail.length > 0)) && isActionOrId(seg)) {
          return;
        }

        const isSegLast = idx === segments.length - 1 && !subTrail && !recordTitle;
        const knownSubmodule = submoduleMap[seg];
        
        let label = seg;
        let redirectPath = cumulativePath;

        if (knownSubmodule) {
          // Eğer bu segment bir sistem ayarları alt modülü ise ve Sistem Ayarları henüz breadcrumb'ta yoksa, öncelikle Sistem & Tanımlar ve Sistem Ayarları adımlarını ekle
          const sistemAyarlariLabel = t('Sistem Ayarları');
          if (!items.some(it => it.label === sistemAyarlariLabel)) {
            const sistemTanimlarLabel = t('Sistem & Tanımlar');
            if (!items.some(it => it.label === sistemTanimlarLabel)) {
              items.push({
                label: sistemTanimlarLabel
              });
            }
            items.push({
              label: sistemAyarlariLabel,
              onClick: () => navigate('/ayarlar/sistem-ayarlari')
            });
          }

          label = t(knownSubmodule.label);
          redirectPath = knownSubmodule.path;
        } else if (seg === 'yeni') label = isDocumentPath(currentPath) ? t('auto_yeni_belge', 'Yeni Belge') : t('Yeni Kayıt');
        else if (seg === 'duzenle') label = t('Düzenle');
        else if (seg === 'ayarlar') {
          const hasSubsequentSubmodule = segments.slice(idx + 1).some(s => submoduleMap[s] || s === 'sistem-ayarlari');
          if (hasSubsequentSubmodule) {
            return;
          }
          label = t('Ayarlar');
          redirectPath = '/ayarlar/sistem-ayarlari';
        }
        else if (seg === 'sistem-ayarlari') {
          const sistemTanimlarLabel = t('Sistem & Tanımlar');
          if (!items.some(it => it.label === sistemTanimlarLabel)) {
            items.push({
              label: sistemTanimlarLabel
            });
          }
          label = t('Sistem Ayarları');
          redirectPath = '/ayarlar/sistem-ayarlari';
        }
        else if (seg === 'cariler') { label = t('Cari Liste'); redirectPath = '/cariler'; }
        else if (seg === 'urunler' || seg === 'urunVeHizmetler') { label = t('Ürün ve Hizmetler'); redirectPath = '/urunVeHizmetler'; }
        else if (seg === 'kullanicilar') { label = t('Kullanıcı & Personel'); redirectPath = '/ayarlar/kullanicilar'; }
        else if (seg === 'paket-ve-setler') { label = t('Paket & Set Tanımları'); redirectPath = '/paket-ve-setler'; }
        else if (seg === 'kampanyalar') { label = t('Kampanyalar'); redirectPath = '/kampanyalar'; }
        else if (seg === 'faturalar') { label = t('Faturalar'); redirectPath = '/faturalar'; }
        else if (seg === 'siparisler') { label = t('Siparişler'); redirectPath = '/siparisler'; }
        else if (seg === 'bildirimler') { label = t('Bildirimler'); redirectPath = '/bildirimler'; }
        else if (seg === 'adres') { label = t('Adres Bilgileri'); }
        else if (seg === 'bulut-dosyalari') { label = t('FilesOnClouds_title', 'Bulut Dosyaları'); }
        else if (seg === 'excel-import' || seg === 'excel-den-veri-al') { label = t('ExcelImport_title', "Excel'den Veri Al"); }
        else if (seg === 'cari-secim') { label = t('Cari Seçimi', 'Cari Seçimi'); }
        else if (!isNaN(Number(seg))) label = `#${seg}`;
        else {
          label = seg.charAt(0).toUpperCase() + seg.slice(1);
        }

        if (!items.some(it => it.label === label)) {
          items.push({
            label,
            onClick: !isSegLast ? () => navigate(redirectPath) : undefined,
            active: isSegLast
          });
        }
      });

      if (subTrail && subTrail.length > 0) {
        subTrail.forEach((sub, idx) => {
          const isSubLast = idx === subTrail.length - 1;
          items.push({
            label: sub.label,
            onClick: !isSubLast ? sub.onClick : undefined,
            active: isSubLast
          });
        });
      } else if (recordTitle) {
        items.push({
          label: recordTitle,
          active: true
        });
      }
    }

    // Yalnızca en son adımın aktif olmasını sağla
    if (items.length > 0) {
      for (let i = 0; i < items.length - 1; i++) {
        items[i].active = false;
      }
      items[items.length - 1].active = true;
    }

    return items;
  }, [currentPath, recordTitle, subTrail, navigate, t]);
};

export default useAppBreadcrumbs;
