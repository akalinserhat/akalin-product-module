import { BaseService } from './BaseService';
import httpClient from './httpClient';
import {
    KampanyaDto,
    KampanyaGrupDto,
    KampanyaSecimItemDto,
    KampanyaBelgesiDto,
    KampanyaBelgesiCreateDto,
    KampanyaBelgesiUpdateDto,
    SiparisKampanyaAnalizRequestDto,
    SiparisKampanyaAnalizSonucuDto
} from '../dtos/KampanyalarDto';

class KampanyalarService extends BaseService<KampanyaBelgesiDto, KampanyaBelgesiCreateDto, KampanyaBelgesiUpdateDto> {
    constructor() {
        super('/api/Kampanyalar');
    }

    async getAktifKampanyalar(): Promise<KampanyaDto[]> {
        const response = await httpClient.get<KampanyaDto[]>(`${this.basePath}/aktif`);
        return response.data;
    }

    async getKampanyaSecimListesi(haricKampanyaId?: number): Promise<KampanyaSecimItemDto[]> {
        const response = await httpClient.get<KampanyaSecimItemDto[]>(`${this.basePath}/secim-listesi`, {
            params: { haricKampanyaId }
        });
        return response.data;
    }

    async getKampanyaGruplari(): Promise<KampanyaGrupDto[]> {
        const response = await httpClient.get<KampanyaGrupDto[]>(`${this.basePath}/gruplar`);
        return response.data;
    }

    async createKampanyaGrup(grup: { kod: string; ad: string; aciklama?: string; grupTuru?: number; ayniGruptanSadeceBiriMi?: boolean }): Promise<KampanyaGrupDto> {
        const response = await httpClient.post<KampanyaGrupDto>(`${this.basePath}/gruplar`, grup);
        return response.data;
    }

    async siparisKampanyaAnalizi(request: SiparisKampanyaAnalizRequestDto): Promise<SiparisKampanyaAnalizSonucuDto> {
        const response = await httpClient.post<SiparisKampanyaAnalizSonucuDto>(`${this.basePath}/SiparisKampanyaAnalizi`, request);
        return response.data;
    }

    async aiKampanyaAnalizi(ajanId: number, kampanyaMetni?: string, bulutDosyaId?: number): Promise<KampanyaBelgesiCreateDto> {
        const response = await httpClient.post<KampanyaBelgesiCreateDto>(`/api/AiAjanlar/${ajanId}/kampanya-analiz`, { kampanyaMetni, bulutDosyaId });
        return response.data;
    }

    async aiKampanyaDosyaAnalizi(ajanId: number, file: File): Promise<KampanyaBelgesiCreateDto> {
        const formData = new FormData();
        formData.append('dosya', file);
        const response = await httpClient.post<KampanyaBelgesiCreateDto>(`/api/AiAjanlar/${ajanId}/kampanya-dosya-analiz`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }

    async getAiAjanlar(): Promise<any[]> {
        const response = await httpClient.get<any[]>('/api/AiAjanlar');
        return response.data;
    }

    async bulutDosyaIliskilendir(dosyaId: number, belgeId: number, belgeNo?: string): Promise<void> {
        await httpClient.post('/api/Storage/Dosyalar/BelgeIliskilendir', {
            dosyaId,
            belgeTuru: 'KampanyaBelgesi',
            belgeId,
            belgeNo
        });
    }
}

export const kampanyalarService = new KampanyalarService();

