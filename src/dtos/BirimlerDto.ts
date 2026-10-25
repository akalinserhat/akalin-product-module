import { BaseDto } from '../types';

export interface BirimlerDto extends BaseDto {
    // TODO: Add properties
}

export interface BirimlerCreateDto extends Omit<BirimlerDto, 'id' | 'olusturulmaTarihi' | 'guncellenmeTarihi' | 'silindiMi'> {
    // TODO: Add properties
}

export interface BirimlerUpdateDto extends Partial<BirimlerCreateDto> {
    id: number;
}
