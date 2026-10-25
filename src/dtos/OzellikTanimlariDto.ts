import { BaseDto } from '../types';

export interface OzellikTanimlariDto extends BaseDto {
    // TODO: Add properties
}

export interface OzellikTanimlariCreateDto extends Omit<OzellikTanimlariDto, 'id' | 'olusturulmaTarihi' | 'guncellenmeTarihi' | 'silindiMi'> {
    // TODO: Add properties
}

export interface OzellikTanimlariUpdateDto extends Partial<OzellikTanimlariCreateDto> {
    id: number;
}
