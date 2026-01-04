import { NetUnits } from '../enums/net-units.enum';

export interface IBillItemData {
  idBill?: number;
  idProduct: number;
  quantity: number;
  contentValue?: number | null;
  netPrice: number;
  netUnit: NetUnits;
}
