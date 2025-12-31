import { NetUnits } from '../enums/net-units.enum';

export interface IBillItemData {
  idBill?: number;
  idProduct: number;
  quantity: number;
  netPrice: number;
  netUnit: NetUnits;
}
