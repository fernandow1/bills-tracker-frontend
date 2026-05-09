import { InjectionToken, Signal } from '@angular/core';
import { ICurrencyResponse } from '@features/currency/interfaces';
import { IPaymentMethodResponse } from '@features/payment-method/interfaces/payment-method-response.interface';
import { IShopResponse } from '@features/shop/interfaces/shop-response.interface';
import { IBillItemData } from '@features/bill/interfaces';

export interface IBillFormFacade {
  currencies: Signal<ICurrencyResponse[]>;
  paymentMethods: Signal<IPaymentMethodResponse[]>;
  shops: Signal<IShopResponse[]>;
  billItems: Signal<IBillItemData[]>;
  total: Signal<number>;
  isLoading: Signal<boolean>;
  isSuccess: Signal<boolean>;

  initialize(initialItems: IBillItemData[]): void;
  addBillItem(): void;
  removeBillItem(index: number): void;
  updateBillItem(index: number, item: IBillItemData): void;
  submit(
    isEditMode: boolean,
    billId: number | undefined,
    formValue: any,
    isFormInvalid: boolean,
  ): void;
  resetSuccess(): void;
}

export const BILL_FORM_FACADE = new InjectionToken<IBillFormFacade>('BILL_FORM_FACADE');
