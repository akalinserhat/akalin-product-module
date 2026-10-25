import { BaseService } from './BaseService';
import httpClient from './httpClient';
import { UrunVeHizmetKartlariDto, UrunVeHizmetKartlariCreateDto, UrunVeHizmetKartlariUpdateDto } from '../dtos/UrunVeHizmetKartlariDto';

class UrunVeHizmetKartlariService extends BaseService<UrunVeHizmetKartlariDto, UrunVeHizmetKartlariCreateDto, UrunVeHizmetKartlariUpdateDto> {
  constructor() {
    super('/api/UrunVeHizmetKartlari');
  }

  async getSablonlar(grupId: number | string): Promise<any> {
    const response = await httpClient.get(`${this.basePath}/sablonlar/${grupId}`);
    return response.data;
  }

  async getHareketler(id: number | string, params?: Record<string, any>): Promise<any> {
    const response = await httpClient.get(`${this.basePath}/${id}/hareketler`, { params });
    return response.data;
  }
}

export const urunVeHizmetKartlariService = new UrunVeHizmetKartlariService();
