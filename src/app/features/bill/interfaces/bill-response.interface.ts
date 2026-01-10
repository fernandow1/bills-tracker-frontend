import { IBillData } from '@features/bill/interfaces/bill-data.interface';
import { IBillItemResponse } from '@features/bill/interfaces/bill-item-response.interface';
import { IShopResponse } from '@features/shop/interfaces/shop-response.interface';
import { ICurrencyResponse } from '@features/currency/interfaces/currency-response.interface';
import { IPaymentMethodResponse } from '@features/payment-method/interfaces/payment-method-response.interface';

export interface IBillResponse
  extends Omit<IBillData, 'billItems' | 'idShop' | 'idCurrency' | 'idPaymentMethod'> {
  id: number;
  shop: IShopResponse; // Relación con tienda poblada
  currency: ICurrencyResponse; // Relación con moneda poblada
  paymentMethod: IPaymentMethodResponse; // Relación con método de pago poblado
  purchasedAt: string; // Fecha real de la compra (ISO string)
  billItems: IBillItemResponse[]; // Items poblados con productos
  createdAt: string;
  updatedAt: string;
}
