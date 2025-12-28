import { IPaymentMethodData } from '@features/payment-method/interfaces/payment-method-data.interface';

export interface IPaymentMethodResponse extends IPaymentMethodData {
  id: number;
  createdAt: string;
  updatedAt: string;
}
