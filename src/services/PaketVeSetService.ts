import { BaseService } from './BaseService';
import { IPaketVeSet, IPaketVeSetListItem } from '../dtos/PaketVeSetDto';

class PaketVeSetService extends BaseService<IPaketVeSetListItem, IPaketVeSet, IPaketVeSet> {
    constructor() {
        super('/api/PaketVeSet');
    }
}

export const paketVeSetService = new PaketVeSetService();
export default paketVeSetService;
