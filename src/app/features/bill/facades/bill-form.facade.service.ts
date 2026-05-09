import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { IBillFormFacade } from './bill-form.facade';
import { BillService } from '@features/bill/services/bill';
import { CurrencyService } from '@features/currency/services/currency';
import { PaymentMethodService } from '@features/payment-method/services/payment-method';
import { ShopService } from '@features/shop/services/shop';
import { AuthService } from '@features/auth/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { BillItemFactory } from '@features/bill/factories/bill-item.factory';
import { IBillItemData, IBillData } from '@features/bill/interfaces';
import { NetUnits } from '@features/bill/enums/net-units.enum';
import { roundAmount } from '@core/utils';

@Injectable()
export class BillFormFacadeService implements IBillFormFacade {
  private readonly billService = inject(BillService);
  private readonly currencyService = inject(CurrencyService);
  private readonly paymentMethodService = inject(PaymentMethodService);
  private readonly shopService = inject(ShopService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly errorHandler = inject(ErrorHandlerService);

  public readonly currencies = computed(() => this.currencyService.currencies ?? []);
  public readonly paymentMethods = computed(() => this.paymentMethodService.paymentMethods ?? []);
  public readonly shops = computed(() => this.shopService.searchedShops ?? []);
  
  public readonly billItems = signal<IBillItemData[]>([]);
  public readonly isSuccess = signal<boolean>(false);

  public readonly total = computed(() => {
    return this.billItems().reduce((sum, item) => {
      if (item.netUnit !== NetUnits.UNIT && item.contentValue) {
        return sum + item.quantity * item.contentValue * item.netPrice;
      }
      return sum + item.quantity * item.netPrice;
    }, 0);
  });

  public readonly isLoading = computed(() => 
    this.billService.isCreatingBill || this.billService.isUpdatingBill
  );

  constructor() {
    this.currencyService.loadAllCurrencies();
    this.paymentMethodService.loadAllPaymentMethods();
    this.shopService.searchShops(1, 25);
    this.billService.resetCreateTrigger();
    this.billService.resetUpdateTrigger();

    effect(() => {
      const createdBill = this.billService.createdBill;
      const createError = this.billService.createError;

      if (createdBill) {
        this.notificationService.success('Factura creada exitosamente');
        this.billService.resetCreateTrigger();
        this.isSuccess.set(true);
      }

      if (createError) {
        const formattedError = this.errorHandler.formatErrorResponse(createError);
        this.notificationService.showError(formattedError);
        this.billService.resetCreateTrigger();
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const updatedBill = this.billService.updatedBill;
      const updateError = this.billService.updateError;

      if (updatedBill) {
        this.notificationService.success('Factura actualizada exitosamente');
        this.billService.resetUpdateTrigger();
        this.isSuccess.set(true);
      }

      if (updateError) {
        const formattedError = this.errorHandler.formatErrorResponse(updateError);
        this.notificationService.showError(formattedError);
        this.billService.resetUpdateTrigger();
      }
    }, { allowSignalWrites: true });
  }

  public initialize(initialItems: IBillItemData[]): void {
    this.billItems.set(initialItems);
  }

  public addBillItem(): void {
    const newItem = BillItemFactory.createEmpty();
    this.billItems.update((items) => [...items, newItem]);
  }

  public removeBillItem(index: number): void {
    this.billItems.update((items) => items.filter((_, i) => i !== index));
  }

  public updateBillItem(index: number, updatedItem: IBillItemData): void {
    this.billItems.update((items) => {
      const updated = [...items];
      updated[index] = updatedItem;
      return updated;
    });
  }

  public submit(isEditMode: boolean, billId: number | undefined, formValue: any, isFormInvalid: boolean): void {
    if (!this.authService.isLoggedIn()) {
      this.notificationService.error('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
      this.authService.logout();
      this.isSuccess.set(true); // Cierra dialog
      return;
    }

    const userId = this.authService.getUserId();
    if (!userId) {
      this.notificationService.error('No se pudo obtener el usuario. Por favor, inicie sesión nuevamente.');
      this.authService.logout();
      this.isSuccess.set(true);
      return;
    }

    if (isFormInvalid) {
      return;
    }

    if (this.billItems().length === 0) {
      this.notificationService.warning('Debe agregar al menos un item a la factura');
      return;
    }

    const hasInvalidItems = this.billItems().some((item) => !item.idProduct || item.idProduct === 0);
    if (hasInvalidItems) {
      this.notificationService.warning('Todos los items deben tener un producto seleccionado');
      return;
    }

    const hasInvalidContentValue = this.billItems().some(
      (item) => item.netUnit !== NetUnits.UNIT && (!item.contentValue || item.contentValue <= 0),
    );
    if (hasInvalidContentValue) {
      this.notificationService.warning('Todos los items con peso/volumen deben tener contenido');
      return;
    }

    const subTotal = roundAmount(this.total());
    const discount = 0;

    const billData: IBillData = {
      ...(isEditMode && billId && { id: billId }),
      idUser: userId,
      idUserOwner: userId,
      purchasedAt: formValue.purchasedAt || new Date().toISOString().split('T')[0],
      idShop: formValue.idShop || 0,
      idCurrency: formValue.idCurrency || 0,
      uuidPaymentMethod: formValue.uuidPaymentMethod || '',
      subTotal: subTotal,
      discount: discount,
      total: roundAmount(subTotal - discount),
      billItems: this.billItems().map((item) => ({
        ...(item.id && { id: item.id }),
        idProduct: item.idProduct,
        quantity: item.quantity,
        contentValue: item.netUnit !== NetUnits.UNIT ? item.contentValue : null,
        netPrice: item.netPrice,
        netUnit: item.netUnit,
      })),
    };

    if (isEditMode && billId) {
      this.billService.updateBill(billId, billData);
    } else {
      this.billService.createBill(billData);
    }
  }

  public resetSuccess(): void {
    this.isSuccess.set(false);
  }
}
