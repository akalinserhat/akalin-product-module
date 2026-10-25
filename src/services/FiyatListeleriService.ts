import { BaseService } from './BaseService';
import httpClient from './httpClient';
import { FiyatListeleriDto, FiyatListeleriCreateDto, FiyatListeleriUpdateDto } from '../dtos/FiyatListeleriDto';

class FiyatListeleriService extends BaseService<FiyatListeleriDto, FiyatListeleriCreateDto, FiyatListeleriUpdateDto> {
  constructor() {
    super('/api/FiyatListeleri');
  }
}

export const fiyatListeleriService = new FiyatListeleriService();
