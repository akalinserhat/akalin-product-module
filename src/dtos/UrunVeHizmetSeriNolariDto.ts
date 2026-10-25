import { BaseDto } from '../types';

export interface UrunVeHizmetSeriNolariDto extends BaseDto {
    // TODO: Add properties
}

export interface UrunVeHizmetSeriNolariCreateDto extends Omit<UrunVeHizmetSeriNolariDto, 'id' | 'olusturulmaTarihi' | 'guncellenmeTarihi' | 'silindiMi'> {
    // TODO: Add properties
}

export interface UrunVeHizmetSeriNolariUpdateDto extends Partial<UrunVeHizmetSeriNolariCreateDto> {
    id: number;
}
