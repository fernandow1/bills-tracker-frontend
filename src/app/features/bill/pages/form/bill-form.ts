import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  effect,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { MatTableModule } from '@angular/material/table';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BillService } from '@features/bill/services/bill';
import { IBillResponse, IBillData, IBillItemData } from '@features/bill/interfaces';
import { NetUnits } from '@features/bill/enums/net-units.enum';
import { CurrencyFormatPipe } from '@shared/pipes';
import { CurrencyService } from '@features/currency/services/currency';
import { PaymentMethodService } from '@features/payment-method/services/payment-method';
import { ShopService } from '@features/shop/services/shop';
import { ProductService } from '@features/product/services/product';
import { AuthService } from '@features/auth/services/auth.service';
import { IProductResponse } from '@features/product/interfaces/product-response.interface';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
    MatTableModule,
    MatAutocompleteModule,
    CurrencyFormatPipe,
    Field,
  ],
  templateUrl: './bill-form.html',
  styleUrl: './bill-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillForm implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<BillForm>);
  private readonly billService = inject(BillService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly currencyService = inject(CurrencyService);
  private readonly paymentMethodService = inject(PaymentMethodService);
  private readonly shopService = inject(ShopService);
  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  public readonly data = inject<BillFormData>(MAT_DIALOG_DATA, { optional: true });

  // Subject para debounce de búsqueda
  private productSearchSubject = new Subject<string>();

  public readonly displayedColumns: string[] = [
    'product',
    'brand',
    'category',
    'quantity',
    'contentValue',
    'netPrice',
    'netUnit',
    'subtotal',
    'actions',
  ];

  public readonly isEditMode = computed(() => this.data?.mode === 'edit');
  public readonly title = computed(() => (this.isEditMode() ? 'Editar Factura' : 'Nueva Factura'));
  public billId?: string = this.data?.bill?.id;

  // Model para el formulario
  public billModel = signal<IBillData>({
    idUser: 1, // Asignar un ID de usuario fijo por ahora
    idUserOwner: 1, // Por defecto, mismo que idUser
    purchasedAt: this.data?.bill?.purchasedAt || new Date().toISOString().split('T')[0], // Fecha de hoy por defecto
    idShop: Number(this.data?.bill?.shop.id) || 0,
    idCurrency: Number(this.data?.bill?.currency.id) || 0,
    idPaymentMethod: this.data?.bill?.paymentMethod.id || 0,
    subTotal: this.data?.bill?.subTotal || 0,
    discount: this.data?.bill?.discount || 0,
    total: this.data?.bill?.total || 0,
    billItems:
      this.data?.bill?.billItems?.map((item) => ({
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
    required(schemaPath.idPaymentMethod, { message: 'El método de pago es requerido' });
    required(schemaPath.purchasedAt, { message: 'La fecha de compra es requerida' });
  });

  // Items separados para mejor manejo
  public billItems = signal<IBillItemData[]>(this.billModel().billItems || []);

  // Datos reales de servicios
  public readonly currencies = computed(() => this.currencyService.currencies ?? []);
  public readonly paymentMethods = computed(() => this.paymentMethodService.paymentMethods ?? []);
  public readonly shops = computed(() => this.shopService.searchedShops ?? []);
  public readonly products = computed(() => this.productService.searchedProducts ?? []);

  // Expose NetUnits enum for template
  public readonly NetUnits = NetUnits;

  public readonly total = computed(() => {
    return this.billItems().reduce((sum, item) => {
      return sum + item.quantity * item.netPrice;
    }, 0);
  });

  constructor() {
    // Cargar datos de servicios
    this.currencyService.loadAllCurrencies();
    this.paymentMethodService.loadAllPaymentMethods();

    // Cargar siempre los primeros 25 registros (tanto en creación como edición)
    this.shopService.searchShops(1, 25);
    this.productService.searchProducts(1, 25);

    // Resetear triggers al inicializar
    this.billService.resetCreateTrigger();
    this.billService.resetUpdateTrigger();

    // Effect para crear
    effect(() => {
      const createdBill = this.billService.createdBill;
      const createError = this.billService.createError;

      if (createdBill) {
        this.snackBar.open('Factura creada exitosamente', 'Cerrar', {
          duration: 3000,
        });
        this.billService.resetCreateTrigger();
        this.dialogRef.close({ success: true, bill: createdBill });
      }

      if (createError) {
        this.snackBar.open(`Error al crear la factura: ${createError}`, 'Cerrar', {
          duration: 5000,
        });
        this.billService.resetCreateTrigger();
      }
    });

    // Effect para actualizar
    effect(() => {
      const updatedBill = this.billService.updatedBill;
      const updateError = this.billService.updateError;

      if (updatedBill) {
        this.snackBar.open('Factura actualizada exitosamente', 'Cerrar', {
          duration: 3000,
        });
        this.billService.resetUpdateTrigger();
        this.dialogRef.close({ success: true, bill: updatedBill });
      }

      if (updateError) {
        this.snackBar.open(`Error al actualizar la factura: ${updateError}`, 'Cerrar', {
          duration: 5000,
        });
        this.billService.resetUpdateTrigger();
      }
    });
  }

  public ngOnInit(): void {
    // Configurar debounce para búsqueda de productos (500ms)
    this.productSearchSubject
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((searchTerm) => {
        if (searchTerm.trim() === '') {
          // Si está vacío, volver a cargar los primeros 25
          this.productService.searchProducts(1, 25);
          return;
        }
        this.productService.searchProducts(1, 25, { name: searchTerm });
      });
  }

  public onProductSearch(searchTerm: string): void {
    this.productSearchSubject.next(searchTerm);
  }

  public displayProduct(product: IProductResponse | string | null): string {
    if (!product || typeof product === 'string') {
      return '';
    }
    return product.name;
  }

  public onProductSelected(rowIndex: number, product: IProductResponse): void {
    this.billItems.update((items) => {
      const updated = [...items];
      updated[rowIndex] = {
        ...updated[rowIndex],
        idProduct: Number(product.id),
        netPrice: 0, // Resetear precio cuando cambia el producto
      };
      return updated;
    });
  }

  public getProductForItem(item: IBillItemData): IProductResponse | null {
    return this.products().find((p) => +p.id === item.idProduct) || null;
  }

  public get isLoading(): boolean {
    return this.billService.isCreatingBill || this.billService.isUpdatingBill;
  }

  public addBillItem(): void {
    const newItem: IBillItemData = {
      idProduct: 0,
      quantity: 1,
      contentValue: null,
      netPrice: 0,
      netUnit: NetUnits.UNIT,
    };
    this.billItems.update((items) => [...items, newItem]);
  }

  public removeBillItem(index: number): void {
    this.billItems.update((items) => items.filter((_, i) => i !== index));
  }

  public updateItemField(
    index: number,
    field: keyof IBillItemData,
    value: number | NetUnits | null
  ): void {
    this.billItems.update((items) => {
      const updated = [...items];
      updated[index] = { ...updated[index], [field]: value };

      // Si cambia netUnit a 'u' (unidad), resetear contentValue porque no aplica
      if (field === 'netUnit' && value === NetUnits.UNIT) {
        updated[index].contentValue = null;
      }

      return updated;
    });
  }

  public isContentValueEnabled(item: IBillItemData): boolean {
    return item.netUnit !== NetUnits.UNIT;
  }

  public isContentValueInvalid(item: IBillItemData): boolean {
    return this.isContentValueEnabled(item) && (!item.contentValue || item.contentValue <= 0);
  }

  public getItemSubtotal(item: IBillItemData): number {
    return item.quantity * item.netPrice;
  }

  public getCurrencySymbol(): string {
    const idCurrency = this.billForm().value().idCurrency;
    const currency = this.currencies().find((c) => +c.id === idCurrency);
    return currency?.symbol || '$';
  }

  public close(): void {
    this.dialogRef.close();
  }

  public onSubmit(): void {
    if (this.billForm().invalid()) {
      this.billForm().markAsTouched();
      return;
    }

    if (this.billItems().length === 0) {
      this.snackBar.open('Debe agregar al menos un item a la factura', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    // Validar que todos los items tengan producto
    const hasInvalidItems = this.billItems().some(
      (item) => !item.idProduct || item.idProduct === 0
    );

    if (hasInvalidItems) {
      this.snackBar.open('Todos los items deben tener un producto seleccionado', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    // Validar que items con peso/volumen tengan contentValue
    const hasInvalidContentValue = this.billItems().some(
      (item) => this.isContentValueEnabled(item) && (!item.contentValue || item.contentValue <= 0)
    );

    if (hasInvalidContentValue) {
      this.snackBar.open('Todos los items con peso/volumen deben tener contenido', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const formValue = this.billForm().value();
    const subTotal = this.total();
    const discount = 0; // Por ahora sin descuento
    const currentUser = this.authService.currentUser();
    const userId = currentUser?.id ? Number(currentUser.id) : 0;

    const billData: IBillData = {
      idUser: userId, // Usuario que carga
      idUserOwner: userId, // Por defecto, mismo que idUser (dueño = quien carga)
      purchasedAt: formValue.purchasedAt || new Date().toISOString().split('T')[0],
      idShop: formValue.idShop || 0,
      idCurrency: formValue.idCurrency || 0,
      idPaymentMethod: formValue.idPaymentMethod || 0,
      subTotal: subTotal,
      discount: discount,
      total: subTotal - discount,
      billItems: this.billItems().map((item) => ({
        idProduct: item.idProduct,
        quantity: item.quantity,
        contentValue: item.netUnit !== NetUnits.UNIT ? item.contentValue : null,
        netPrice: item.netPrice,
        netUnit: item.netUnit,
      })),
    };

    if (this.isEditMode() && this.billId) {
      this.billService.updateBill(this.billId, billData);
    } else {
      this.billService.createBill(billData);
    }
  }

  public getProductBrand(productId: number): string {
    const product = this.products().find((p) => +p.id === productId);
    return product?.brand?.name || '-';
  }

  public getProductCategory(productId: number): string {
    const product = this.products().find((p) => +p.id === productId);
    return product?.category?.name || '-';
  }
  public trackByIndex(index: number): number {
    return index;
  }
}
