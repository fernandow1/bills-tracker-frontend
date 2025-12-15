import { IBrandData } from '@features/brand/interfaces/brand-data.interface';

export interface IBrandResponse extends IBrandData {
  id: string;
  createdAt: string;
  updatedAt: string;
}
