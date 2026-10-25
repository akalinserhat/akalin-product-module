export enum PaketStokDusumYontemi {
    BilesenlerdenDus = 1,
    PaketStogundanDus = 2
}

export enum PaketKalemTuru {
    TekilUrun = 1,
    UrunGrubu = 2
}

export interface IPaketVeSetKalemi {
    id?: number;
    kalemTuru: PaketKalemTuru;
    urunVeHizmetKartiId?: number | null;
    urunKodu?: string;
    urunAdi?: string;
    urunBarkod?: string;
    urunVeHizmetGrubuId?: number | null;
    urunGrubuKodu?: string;
    urunGrubuAdi?: string;
    birimId?: number | null;
    birimAdi?: string;
    birimTipiId?: number | null;
    miktar: number;
    siraNo: number;
    aciklama?: string;
}

export interface IPaketVeSetListItem {
    id: number;
    kod: string;
    ad: string;
    barkod?: string;
    stokDusumYontemi: PaketStokDusumYontemi;
    stokDusumYontemiAdi: string;
    kalemSayisi: number;
    toplamMiktar: number;
    aktifMi: boolean;
    olusturulmaTarihi: string;
    silindiMi?: boolean;
    arsivlendiMi?: boolean;
}

export interface IPaketVeSet {
    id?: number;
    kod: string;
    ad: string;
    barkod?: string;
    aciklama?: string;
    stokDusumYontemi: PaketStokDusumYontemi;
    aktifMi: boolean;
    kalemler: IPaketVeSetKalemi[];
}
