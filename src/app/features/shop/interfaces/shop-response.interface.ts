import { IShopData } from '@features/shop/interfaces/shop-data.interface';

export interface IShopResponse extends IShopData {
  id: number;
  createdAt: string;
  updatedAt: string;
}
