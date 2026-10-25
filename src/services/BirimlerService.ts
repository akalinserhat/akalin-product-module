import { BaseService } from './BaseService';
import httpClient from './httpClient';
import { BirimlerDto, BirimlerCreateDto, BirimlerUpdateDto } from '../dtos/BirimlerDto';

class BirimlerService extends BaseService<BirimlerDto, BirimlerCreateDto, BirimlerUpdateDto> {
  constructor() {
    super('/api/Birimler');
  }
}

export const birimlerService = new BirimlerService();
