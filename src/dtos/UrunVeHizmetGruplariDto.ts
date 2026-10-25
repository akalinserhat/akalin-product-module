import { BaseDto } from '../types';

export interface UrunVeHizmetGruplariDto extends BaseDto {
    // TODO: Add properties
}

export interface UrunVeHizmetGruplariCreateDto extends Omit<UrunVeHizmetGruplariDto, 'id' | 'olusturulmaTarihi' | 'guncellenmeTarihi' | 'silindiMi'> {
    // TODO: Add properties
}

export interface UrunVeHizmetGruplariUpdateDto extends Partial<UrunVeHizmetGruplariCreateDto> {
    id: number;
}
