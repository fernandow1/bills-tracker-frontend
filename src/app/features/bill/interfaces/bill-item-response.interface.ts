import { IBillItemData } from '@features/bill/interfaces/bill-item-data.interface';
import { IProductResponse } from '@features/product/interfaces/product-response.interface';

export interface IBillItemResponse extends IBillItemData {
  id: string;
  product: IProductResponse; // Relación con producto poblado
  createdAt: string;
  updatedAt: string;
}
