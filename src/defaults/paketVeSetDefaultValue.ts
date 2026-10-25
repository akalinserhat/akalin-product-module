import { IPaketVeSet, IPaketVeSetKalemi, PaketStokDusumYontemi, PaketKalemTuru } from '../dtos/PaketVeSetDto';

export interface GetPaketVeSetDefaultValuesOptions {
    initialData?: Partial<IPaketVeSet> | null;
}

export function createEmptyKalem(siraNo: number = 1): IPaketVeSetKalemi {
    return {
        siraNo,
        kalemTuru: PaketKalemTuru.TekilUrun,
        urunVeHizmetKartiId: 0,
        urunKodu: '',
        urunAdi: '',
        urunBarkod: '',
        urunVeHizmetGrubuId: null,
        urunGrubuKodu: '',
        urunGrubuAdi: '',
        birimId: null,
        birimAdi: '',
        birimTipiId: null,
        miktar: 1,
        aciklama: ''
    };
}

export function getPaketVeSetDefaultValues(options?: GetPaketVeSetDefaultValuesOptions): IPaketVeSet {
    const init = options?.initialData;

    return {
        id: init?.id,
        kod: init?.kod || '',
        ad: init?.ad || '',
        barkod: init?.barkod || '',
        aciklama: init?.aciklama || '',
        stokDusumYontemi: init?.stokDusumYontemi ?? PaketStokDusumYontemi.BilesenlerdenDus,
        aktifMi: init?.aktifMi ?? true,
        kalemler: init?.kalemler && init.kalemler.length > 0 
            ? [...init.kalemler] 
            : [createEmptyKalem(1)]
    };
}
