import { ICurrencyData } from '@features/currency/interfaces/currency-data.interface';

export interface ICurrencyResponse extends ICurrencyData {
  id: string;
  createdAt: string;
  updatedAt: string;
}
