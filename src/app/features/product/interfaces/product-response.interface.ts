import { IProductData } from '@features/product/interfaces/product-data.interface';
import { IBrandResponse } from '@features/brand/interfaces/brand-response.interface';
import { ICategoryResponse } from '@features/category/services/category';

export interface IProductResponse extends IProductData {
  id: string;
  brand: IBrandResponse;
  category: ICategoryResponse;
  createdAt: string;
  updatedAt: string;
}
