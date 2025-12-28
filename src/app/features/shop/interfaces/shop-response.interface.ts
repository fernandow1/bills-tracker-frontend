import { IShopData } from '@features/shop/interfaces/shop-data.interface';

export interface IShopResponse extends IShopData {
  id: string;
  createdAt: string;
  updatedAt: string;
}
