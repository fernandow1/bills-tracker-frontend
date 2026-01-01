import { IBillItemData } from '@features/bill/interfaces/bill-item-data.interface';

export interface IBillData {
  idShop: number;
  idCurrency: number;
  idPaymentMethod: number;
  idUser: number; // Usuario que carga la factura
  idUserOwner: number; // Dueño/propietario de la factura (puede ser diferente)
  purchasedAt: string; // Fecha real de la compra (ISO string)
  subTotal: number;
  discount: number;
  total: number;
  billItems: IBillItemData[]; // Array de items para crear/actualizar
}
