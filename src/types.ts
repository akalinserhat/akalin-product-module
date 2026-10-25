/**
 * @file types.ts
 * @description @akalin/product_module için temel veri modelleri ve tip tanımları.
 */

export interface BaseDto {
    id: number;
    olusturulmaTarihi?: string;
    guncellenmeTarihi?: string;
    silindiMi?: boolean;
}

export interface PaginatedResult<T> {
    items: T[];
    totalCount: number;
    pageIndex: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

export * from './dtos/BirimlerDto';
export * from './dtos/FiyatListeleriDto';
export * from './dtos/FiyatListesiTanimlariDto';
export * from './dtos/KampanyalarDto';
export * from './dtos/MarkalarDto';
export * from './dtos/OzellikTanimlariDto';
export * from './dtos/OzellikTanimlariGruplariDto';
export * from './dtos/PaketVeSetDto';
export * from './dtos/UrunVeHizmetGruplariDto';
export * from './dtos/UrunVeHizmetKartlariDto';
export * from './dtos/UrunVeHizmetSeriNolariDto';
