import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Field, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { BillItemRowComponent } from '@features/bill/components/bill-item-row/bill-item-row.component';
import { IBillResponse, IBillData } from '@features/bill/interfaces';
import { NetUnits } from '@features/bill/enums/net-units.enum';
import { CurrencyFormatPipe } from '@shared/pipes';
import { AuthService } from '@features/auth/services/auth.service';
import { IProductResponse } from '@features/product/interfaces/product-response.interface';
import { BILL_FORM_FACADE } from '@features/bill/facades/bill-form.facade';
import { BillFormFacadeService } from '@features/bill/facades/bill-form.facade.service';

interface BillFormData {
  bill?: IBillResponse;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-bill-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatDividerModule,
    MatAutocompleteModule,
    BillItemRowComponent,
    CurrencyFormatPipe,
    Field,
  ],
  templateUrl: './bill-form.html',
  styleUrl: './bill-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: BILL_FORM_FACADE, useClass: BillFormFacadeService }],
})
export class BillForm {
  public readonly facade = inject(BILL_FORM_FACADE);
  public readonly dialogRef = inject(MatDialogRef<BillForm>);
  public readonly data = inject<BillFormData>(MAT_DIALOG_DATA, { optional: true });
  private readonly authService = inject(AuthService);

  public readonly isEditMode = computed(() => this.data?.mode === 'edit');
  public readonly title = computed(() => (this.isEditMode() ? 'Editar Factura' : 'Nueva Factura'));
  public billId?: number = this.data?.bill?.id;

  // Model para el formulario
  public billModel = signal<IBillData>({
    ...(this.data?.bill?.id && { id: Number(this.data.bill.id) }),
    idUser: this.authService.getUserId(),
    idUserOwner: this.authService.getUserId(),
    purchasedAt: this.data?.bill?.purchasedAt || new Date().toISOString().split('T')[0],
    idShop: Number(this.data?.bill?.shop.id) || 0,
    idCurrency: Number(this.data?.bill?.currency.id) || 0,
    uuidPaymentMethod: this.data?.bill?.paymentMethod.uuid || '',
    subTotal: this.data?.bill?.subTotal || 0,
    discount: this.data?.bill?.discount || 0,
    total: this.data?.bill?.total || 0,
    billItems:
      this.data?.bill?.billItems?.map((item) => ({
        ...(item.id && { id: item.id }),
        idProduct: Number(item.product.id),
        quantity: item.quantity,
        contentValue: item.contentValue || null,
        netPrice: item.netPrice,
        netUnit: item.netUnit,
      })) || [],
  });

  // Signal form
  public billForm = form<IBillData>(this.billModel, (schemaPath) => {
    required(schemaPath.idShop, { message: 'La tienda es requerida' });
    required(schemaPath.idCurrency, { message: 'La moneda es requerida' });
    required(schemaPath.uuidPaymentMethod, { message: 'El método de pago es requerido' });
    required(schemaPath.purchasedAt, { message: 'La fecha de compra es requerida' });
  });

  // Expose NetUnits enum for template
  public readonly NetUnits = NetUnits;

  constructor() {
    this.facade.initialize(this.billModel().billItems || []);

    effect(() => {
      if (this.facade.isSuccess()) {
        this.dialogRef.close({ success: true });
        this.facade.resetSuccess();
      }
    });
  }

  public getInitialProduct(index: number): IProductResponse | null {
    return this.data?.bill?.billItems?.[index]?.product || null;
  }

  public getCurrencySymbol(): string {
    const idCurrency = this.billForm().value().idCurrency;
    const currency = this.facade.currencies().find((c) => +c.id === idCurrency);
    return currency?.symbol || '$';
  }

  public close(): void {
    this.dialogRef.close();
  }

  public onSubmit(): void {
    if (this.billForm().invalid()) {
      this.billForm().markAsTouched();
    }

    this.facade.submit(
      this.isEditMode(),
      this.billId,
      this.billForm().value(),
      this.billForm().invalid(),
    );
  }

  public trackByIndex(index: number, _item?: unknown): number {
    return index;
  }
}
