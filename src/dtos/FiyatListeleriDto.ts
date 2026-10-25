import { BaseDto } from '../types';

export interface FiyatListeleriDto extends BaseDto {
    // TODO: Add properties
}

export interface FiyatListeleriCreateDto extends Omit<FiyatListeleriDto, 'id' | 'olusturulmaTarihi' | 'guncellenmeTarihi' | 'silindiMi'> {
    // TODO: Add properties
}

export interface FiyatListeleriUpdateDto extends Partial<FiyatListeleriCreateDto> {
    id: number;
}
