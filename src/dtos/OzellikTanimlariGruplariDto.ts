import { BaseDto } from '../types';

export interface OzellikTanimlariGruplariDto extends BaseDto {
    // TODO: Add properties
}

export interface OzellikTanimlariGruplariCreateDto extends Omit<OzellikTanimlariGruplariDto, 'id' | 'olusturulmaTarihi' | 'guncellenmeTarihi' | 'silindiMi'> {
    // TODO: Add properties
}

export interface OzellikTanimlariGruplariUpdateDto extends Partial<OzellikTanimlariGruplariCreateDto> {
    id: number;
}
