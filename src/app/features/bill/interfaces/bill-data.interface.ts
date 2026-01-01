import { IBillItemData } from '@features/bill/interfaces/bill-item-data.interface';

export interface IBillData {
  idShop: number;
  idCurrency: number;
  idPaymentMethod: number;
  idUser: number;
  subTotal: number;
  discount: number;
  total: number;
  billItems: IBillItemData[]; // Array de items para crear/actualizar
}
