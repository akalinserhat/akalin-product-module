import { BaseService } from './BaseService';
import httpClient from './httpClient';
import { UrunVeHizmetSeriNolariDto, UrunVeHizmetSeriNolariCreateDto, UrunVeHizmetSeriNolariUpdateDto } from '../dtos/UrunVeHizmetSeriNolariDto';

class UrunVeHizmetSeriNolariService extends BaseService<UrunVeHizmetSeriNolariDto, UrunVeHizmetSeriNolariCreateDto, UrunVeHizmetSeriNolariUpdateDto> {
  constructor() {
    super('/api/UrunVeHizmetSeriNolari');
  }
}

export const urunVeHizmetSeriNolariService = new UrunVeHizmetSeriNolariService();
