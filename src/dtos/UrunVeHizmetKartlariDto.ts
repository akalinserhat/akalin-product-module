import { BaseDto } from '../types';

export interface UrunVeHizmetKartlariDto extends BaseDto {
    stokTakipTuru?: number | string;
    tedarikDurumu?: number | string;
    ozellikler?: any[];
    barkodlar?: any[];
}

export interface UrunVeHizmetKartlariCreateDto extends Omit<UrunVeHizmetKartlariDto, 'id' | 'olusturulmaTarihi' | 'guncellenmeTarihi' | 'silindiMi'> {
    // TODO: Add properties
}

export interface UrunVeHizmetKartlariUpdateDto extends Partial<UrunVeHizmetKartlariCreateDto> {
    id: number;
}
