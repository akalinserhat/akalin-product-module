import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import axios, { type AxiosInstance } from 'axios';
import { urunVeHizmetKartlariService } from '../services/UrunVeHizmetKartlariService';
import { urunVeHizmetGruplariService } from '../services/UrunVeHizmetGruplariService';
import { urunVeHizmetSeriNolariService } from '../services/UrunVeHizmetSeriNolariService';
import { paketVeSetService } from '../services/PaketVeSetService';
import { fiyatListeleriService } from '../services/FiyatListeleriService';
import { fiyatListesiTanimlariService } from '../services/FiyatListesiTanimlariService';
import { kampanyalarService } from '../services/KampanyalarService';
import { birimlerService } from '../services/BirimlerService';
import { markalarService } from '../services/MarkalarService';
import { ozellikTanimlariService } from '../services/OzellikTanimlariService';
import { ozellikTanimlariGruplariService } from '../services/OzellikTanimlariGruplariService';

export interface IProductServiceAdapter {
  urunVeHizmetKartlariService: typeof urunVeHizmetKartlariService;
  urunVeHizmetGruplariService: typeof urunVeHizmetGruplariService;
  urunVeHizmetSeriNolariService: typeof urunVeHizmetSeriNolariService;
  paketVeSetService: typeof paketVeSetService;
  fiyatListeleriService: typeof fiyatListeleriService;
  fiyatListesiTanimlariService: typeof fiyatListesiTanimlariService;
  kampanyalarService: typeof kampanyalarService;
  birimlerService: typeof birimlerService;
  markalarService: typeof markalarService;
  ozellikTanimlariService: typeof ozellikTanimlariService;
  ozellikTanimlariGruplariService: typeof ozellikTanimlariGruplariService;
  getBelgeAyarlari?: (belgeTuru: string) => Promise<any>;
}

export const defaultProductService: IProductServiceAdapter = {
  urunVeHizmetKartlariService,
  urunVeHizmetGruplariService,
  urunVeHizmetSeriNolariService,
  paketVeSetService,
  fiyatListeleriService,
  fiyatListesiTanimlariService,
  kampanyalarService,
  birimlerService,
  markalarService,
  ozellikTanimlariService,
  ozellikTanimlariGruplariService,
  getBelgeAyarlari: async (belgeTuru: string) => {
    const res = await axios.get(`/api/BelgeAyarlari/belge-turu/${belgeTuru}`);
    return res.data;
  }
};

export const createRestProductAdapter = (customAxios?: AxiosInstance): IProductServiceAdapter => {
  return {
    ...defaultProductService,
    getBelgeAyarlari: async (belgeTuru: string) => {
      const client = customAxios || axios;
      const res = await client.get(`/api/BelgeAyarlari/belge-turu/${belgeTuru}`);
      return res.data;
    }
  };
};

const ProductServiceContext = createContext<IProductServiceAdapter>(defaultProductService);

export const ProductServiceProvider: React.FC<{
  adapter?: IProductServiceAdapter;
  children: ReactNode;
}> = ({ adapter = defaultProductService, children }) => {
  const value = useMemo(() => adapter, [adapter]);
  return (
    <ProductServiceContext.Provider value={value}>
      {children}
    </ProductServiceContext.Provider>
  );
};

export const useProductService = () => {
  return useContext(ProductServiceContext);
};

export default ProductServiceContext;
