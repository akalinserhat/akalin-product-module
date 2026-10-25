import UrunStrategy from './UrunStrategy';
import HizmetStrategy from './HizmetStrategy';

export default class FormStrategyFactory {
  static getStrategy(turuIdStr, hasBarkodModulu = false) {
    const turu = String(turuIdStr);
    
    switch(turu) {
      case 'Urun':
      case '1':
      case 'SarfMalzemesi':
      case '3':
      case 'Hammadde':
      case '4':
      case 'Demirbas':
      case '5':
      case 'YariMamul':
      case '6':
      case 'Mamul':
      case '7':
      case 'PaketSet':
      case '8':
        return new UrunStrategy(true, hasBarkodModulu);
      case 'Hizmet':
      case '2':
        return new HizmetStrategy(false, false);
      default:
        return new UrunStrategy(true, hasBarkodModulu); // Fallback
    }
  }
}
