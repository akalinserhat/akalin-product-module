import { BaseService } from './BaseService';
import httpClient from './httpClient';
import { OzellikTanimlariGruplariDto, OzellikTanimlariGruplariCreateDto, OzellikTanimlariGruplariUpdateDto } from '../dtos/OzellikTanimlariGruplariDto';

class OzellikTanimlariGruplariService extends BaseService<OzellikTanimlariGruplariDto, OzellikTanimlariGruplariCreateDto, OzellikTanimlariGruplariUpdateDto> {
  constructor() {
    super('/api/OzellikTanimlariGruplari');
  }
}

export const ozellikTanimlariGruplariService = new OzellikTanimlariGruplariService();
