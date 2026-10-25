
export interface KampanyaKuralDto {
    id: number;
    kuralAlani: number;
    kuralAlaniAdi: string;
    kuralOperatoru: number;
    kuralOperatoruAdi: string;
    kuralDegeri: string;
    gerekliMiktar: number;
    grupId?: string;
}

export interface KampanyaDto {
    id?: number;
    kampanyaBelgesiId: number;
    kodu: string;
    adi: string;
    hakedisSonTarihi?: string;
    toplamAdetSiniri?: number;
    birlesmeKurali: number;
    oncelik?: number;
    cakismaStratejisi?: number;
    cakismaStratejisiAdi?: string;
    matrahTuru?: number;
    matrahTuruAdi?: string;
    maksimumToplamIskontoOrani?: number;
    kampanyaGrupId?: number;
    kampanyaGrupAdi?: string;
    birlestirilebilirKampanyaIdleri?: number[];
    birlestirilemezKampanyaIdleri?: number[];
    aksiyonTipi: number;
    aksiyonTipiAdi: string;
    aksiyonDegeri?: number;
    kdvDahilMi?: boolean;
    hediyeUrunVeHizmetKartiId?: number;
    hediyeUrunVeHizmetAdi?: string;
    firmaHakEdisOrani?: number;
    firmaHakEdisTutari?: number;
    firmaHakEdisKdvDahilMi?: boolean;
    indirimTuru?: number;
    hakedisTuru?: number;
    fiyatFarkiBelgesiId?: number;
    cariKatilimSiniriTuru?: number;
    cariKatilimZamanAraligi?: number;
    cariKatilimPeriyotSuresiGun?: number;
    cariKatilimSayisi?: number;
    kurallar: KampanyaKuralDto[];
}

export interface KampanyaGrupDto {
    id: number;
    kod: string;
    ad: string;
    grupTuru: number;
    grupTuruAdi: string;
    ayniGruptanSadeceBiriMi: boolean;
    kampanyaSayisi: number;
}

export interface KampanyaSecimItemDto {
    id: number;
    kodu: string;
    adi: string;
    belgeNo?: string;
    grupAdi?: string;
}

export interface KampanyaBelgesiDto {
    id: number;
    belgeNo: string;
    adi: string;
    baslangicTarihi: string;
    bitisTarihi: string;
    hakedisSonTarihi?: string;
    aktifMi?: boolean;
    silindiMi?: boolean;
    arsivlendiMi?: boolean;
    kampanyalar: KampanyaDto[];
}

export interface KampanyaKuralCreateDto {
    kuralAlani: number;
    kuralOperatoru: number;
    kuralDegeri: string;
    gerekliMiktar: number;
    grupId?: string;
}

export interface KampanyaCreateDto {
    id?: number;
    kodu: string;
    adi: string;
    hakedisSonTarihi?: string;
    toplamAdetSiniri?: number;
    birlesmeKurali: number;
    oncelik?: number;
    cakismaStratejisi?: number;
    matrahTuru?: number;
    maksimumToplamIskontoOrani?: number;
    kampanyaGrupId?: number;
    birlestirilebilirKampanyaIdleri?: number[];
    birlestirilemezKampanyaIdleri?: number[];
    aksiyonTipi: number;
    aksiyonDegeri?: number;
    kdvDahilMi?: boolean;
    hediyeUrunVeHizmetKartiId?: number;
    firmaHakEdisOrani?: number;
    firmaHakEdisTutari?: number;
    firmaHakEdisKdvDahilMi?: boolean;
    cariKatilimSiniriTuru?: number;
    cariKatilimZamanAraligi?: number;
    cariKatilimPeriyotSuresiGun?: number;
    cariKatilimSayisi?: number;
    kurallar: KampanyaKuralCreateDto[];
}

export interface KampanyaBelgesiCreateDto {
    belgeNo: string;
    adi: string;
    baslangicTarihi: string;
    bitisTarihi: string;
    hakedisSonTarihi?: string;
    aktifMi: boolean;
    kampanyalar: KampanyaCreateDto[];
}

export interface KampanyaBelgesiUpdateDto extends KampanyaBelgesiCreateDto {
    id: number;
}

export interface SiparisKampanyaKalemAnalizDto {
    urunVeHizmetKartiId: number;
    miktar: number;
    listeFiyati: number;
    kdvHaricFiyat: number;
    kdvOrani: number;
}

export interface SiparisKampanyaAnalizRequestDto {
    cariId?: number;
    tarih?: string;
    kalemler: SiparisKampanyaKalemAnalizDto[];
}

export interface KampanyaKuralDurumuDto {
    kuralId: number;
    kuralAlani: number;
    kuralAlaniAdi: string;
    kuralOperatoru: number;
    kuralOperatoruAdi: string;
    kuralDegeri: string;
    gerekliMiktar: number;
    mevcutMiktar: number;
    saglandiMi: boolean;
    aciklama: string;
    eksikAksiyon?: string;
}

export interface KampanyaDegerlendirmeSonucuDto {
    kampanyaId: number;
    kampanyaKodu: string;
    kampanyaAdi: string;
    belgeAdi: string;
    baslangicTarihi: string;
    bitisTarihi: string;
    aksiyonTipi: number;
    aksiyonTipiAdi: string;
    aksiyonDegeri?: number;
    kdvDahilMi?: boolean;
    hediyeUrunVeHizmetKartiId?: number;
    hediyeUrunVeHizmetAdi?: string;
    firmaHakEdisOrani?: number;
    firmaHakEdisTutari?: number;
    firmaHakEdisKdvDahilMi?: boolean;
    cariKatilimSiniriTuru?: number;
    cariKatilimZamanAraligi?: number;
    cariKatilimPeriyotSuresiGun?: number;
    cariKatilimSayisi?: number;
    cariKullanimSayisi: number;
    cariKalanHakSayisi?: number;
    uygulanabilirMi: boolean;
    kazanilanIndirimTutari: number;
    kazanilanIndirimOrani: number;
    kuralDurumlari: KampanyaKuralDurumuDto[];
    saglanamayanNedenler: string[];
    nasilYararlanilirOnerileri: string[];
    ilerlemeYuzdesi: number;
}

export interface SiparisKampanyaAnalizSonucuDto {
    uygulanabilirKampanyalar: KampanyaDegerlendirmeSonucuDto[];
    uygulanamayanKampanyalar: KampanyaDegerlendirmeSonucuDto[];
    toplamAktifKampanyaSayisi: number;
    sepetTutari: number;
}

