import { BaseDto } from '../types';

export interface FiyatListesiTanimlariDto extends BaseDto {
    kod: string;
    ad: string;
    aciklama?: string;
    fiyatTuru: number;
    fiyatTuruAdi?: string;
    dovizCinsi: string;
    kdvDahilMi: boolean;
    cariGrubuId?: number | null;
    cariGrubu?: any;
    aktifMi: boolean;
}

export interface FiyatListesiTanimlariCreateDto extends Omit<FiyatListesiTanimlariDto, 'id' | 'olusturulmaTarihi' | 'guncellenmeTarihi' | 'silindiMi'> {
}

export interface FiyatListesiTanimlariUpdateDto extends Partial<FiyatListesiTanimlariCreateDto> {
    id: number;
}
