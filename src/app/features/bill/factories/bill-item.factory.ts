import { IBillItemData } from '@features/bill/interfaces';
import { NetUnits } from '@features/bill/enums/net-units.enum';

export class BillItemFactory {
  public static createEmpty(): IBillItemData {
    return {
      idProduct: 0,
      quantity: 1,
      contentValue: null,
      netPrice: 0,
      netUnit: NetUnits.UNIT,
    };
  }
}
