import { BaseService } from './BaseService';
import httpClient from './httpClient';
import { OzellikTanimlariDto, OzellikTanimlariCreateDto, OzellikTanimlariUpdateDto } from '../dtos/OzellikTanimlariDto';

class OzellikTanimlariService extends BaseService<OzellikTanimlariDto, OzellikTanimlariCreateDto, OzellikTanimlariUpdateDto> {
  constructor() {
    super('/api/OzellikTanimlari');
  }
}

export const ozellikTanimlariService = new OzellikTanimlariService();
