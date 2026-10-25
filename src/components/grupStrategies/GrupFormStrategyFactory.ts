import UrunGrupStrategy from './UrunGrupStrategy';
import HizmetGrupStrategy from './HizmetGrupStrategy';
import BaseGrupStrategy from './BaseGrupStrategy';

export default class GrupFormStrategyFactory {
  static getStrategy(tur) {
    switch (Number(tur)) {
      case 1:
        return new UrunGrupStrategy();
      case 2:
        return new HizmetGrupStrategy();
      default:
        return new BaseGrupStrategy();
    }
  }
}
