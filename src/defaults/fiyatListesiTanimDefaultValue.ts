export interface FiyatListesiTanimDefaultValues {
    kod: string;
    ad: string;
    aciklama: string;
    fiyatTuru: number;
    dovizCinsi: string;
    kdvDahilMi: boolean;
    aktifMi: boolean;
}

export const getFiyatListesiTanimDefaultValues = (): FiyatListesiTanimDefaultValues => ({
    kod: '',
    ad: '',
    aciklama: '',
    fiyatTuru: 1, // Toptan
    dovizCinsi: 'TRY',
    kdvDahilMi: false,
    aktifMi: true
});
