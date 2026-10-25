import { BaseService } from './BaseService';
import httpClient from './httpClient';
import { MarkalarDto, MarkalarCreateDto, MarkalarUpdateDto } from '../dtos/MarkalarDto';

class MarkalarService extends BaseService<MarkalarDto, MarkalarCreateDto, MarkalarUpdateDto> {
  constructor() {
    super('/api/Markalar');
  }
}

export const markalarService = new MarkalarService();
