import { BaseDto } from '../types';

export interface MarkalarDto extends BaseDto {
    // TODO: Add properties
}

export interface MarkalarCreateDto extends Omit<MarkalarDto, 'id' | 'olusturulmaTarihi' | 'guncellenmeTarihi' | 'silindiMi'> {
    // TODO: Add properties
}

export interface MarkalarUpdateDto extends Partial<MarkalarCreateDto> {
    id: number;
}
