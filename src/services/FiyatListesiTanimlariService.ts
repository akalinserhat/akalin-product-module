import { BaseService } from './BaseService';
import httpClient from './httpClient';
import { FiyatListesiTanimlariDto, FiyatListesiTanimlariCreateDto, FiyatListesiTanimlariUpdateDto } from '../dtos/FiyatListesiTanimlariDto';

export class FiyatListesiTanimlariService extends BaseService<FiyatListesiTanimlariDto, FiyatListesiTanimlariCreateDto, FiyatListesiTanimlariUpdateDto> {
  constructor() {
    super('/api/FiyatListesiTanimlari');
  }

  async getSonrakiKod(): Promise<string> {
    const res = await httpClient.get<{ code: string }>('/api/FiyatListesiTanimlari/sonraki-kod');
    return res.data?.code || 'FT-0001';
  }
}

export const fiyatListesiTanimlariService = new FiyatListesiTanimlariService();
