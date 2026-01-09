import { NetUnits } from '../enums/net-units.enum';

export interface IBillItemData {
  id?: string; // ID del item (solo en modo edición)
  idBill?: number;
  idProduct: number;
  quantity: number;
  contentValue?: number | null;
  netPrice: number;
  netUnit: NetUnits;
}
