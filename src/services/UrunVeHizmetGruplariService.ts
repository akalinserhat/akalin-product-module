import { BaseService } from './BaseService';
import httpClient from './httpClient';
import { UrunVeHizmetGruplariDto, UrunVeHizmetGruplariCreateDto, UrunVeHizmetGruplariUpdateDto } from '../dtos/UrunVeHizmetGruplariDto';

class UrunVeHizmetGruplariService extends BaseService<UrunVeHizmetGruplariDto, UrunVeHizmetGruplariCreateDto, UrunVeHizmetGruplariUpdateDto> {
  constructor() {
    super('/api/UrunVeHizmetGruplari');
  }
}

export const urunVeHizmetGruplariService = new UrunVeHizmetGruplariService();
