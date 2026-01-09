import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  effect,
  DestroyRef,
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
export class BillForm {
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
  public billId?: number = this.data?.bill?.id;

  // Model para el formulario
  public billModel = signal<IBillData>({
    ...(this.data?.bill?.id && { id: Number(this.data.bill.id) }), // Incluir ID solo en modo edición
    idUser: this.authService.getUserId(), // Obtener ID del usuario autenticado
    idUserOwner: this.authService.getUserId(), // Por defecto, mismo que idUser
    purchasedAt: this.data?.bill?.purchasedAt || new Date().toISOString().split('T')[0], // Fecha de hoy por defecto
    idShop: Number(this.data?.bill?.shop.id) || 0,
    idCurrency: Number(this.data?.bill?.currency.id) || 0,
    idPaymentMethod: this.data?.bill?.paymentMethod.id || 0,
    subTotal: this.data?.bill?.subTotal || 0,
    discount: this.data?.bill?.discount || 0,
    total: this.data?.bill?.total || 0,
    billItems:
      this.data?.bill?.billItems?.map((item) => ({
        ...(item.id && { id: item.id }), // Incluir ID del item en modo edición
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

  // Map donde la clave es el índice de la fila y el valor son los productos disponibles para ese autocomplete
  private productsPerRow = signal<Map<number, IProductResponse[]>>(new Map());

  // Datos reales de servicios
  public readonly currencies = computed(() => this.currencyService.currencies ?? []);
  public readonly paymentMethods = computed(() => this.paymentMethodService.paymentMethods ?? []);
  public readonly shops = computed(() => this.shopService.searchedShops ?? []);

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

    // Inicializar productos por fila
    const initialItems = this.billModel().billItems || [];
    const initialMap = new Map<number, IProductResponse[]>();

    initialItems.forEach((item, index) => {
      if (this.data?.bill?.billItems?.[index]?.product) {
        // En modo edición, cargar el producto seleccionado
        initialMap.set(index, [this.data.bill.billItems[index].product]);
      } else {
        // En modo creación, inicializar con array vacío
        initialMap.set(index, []);
      }
    });

    this.productsPerRow.set(initialMap);

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
        const errorMessage = this.extractErrorMessage(createError);
        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar'],
          verticalPosition: 'top',
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
        const errorMessage = this.extractErrorMessage(updateError);
        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar'],
          verticalPosition: 'top',
        });
        this.billService.resetUpdateTrigger();
      }
    });
  }

  public onProductSearch(rowIndex: number, searchTerm: string): void {
    if (searchTerm.trim() === '') {
      // Si está vacío, limpiar productos de esta fila (excepto el seleccionado si existe)
      const currentItem = this.billItems()[rowIndex];
      const selectedProduct = currentItem?.idProduct
        ? this.getProductForRow(rowIndex)?.find((p) => +p.id === currentItem.idProduct)
        : null;

      this.productsPerRow.update((map) => {
        const newMap = new Map(map);
        newMap.set(rowIndex, selectedProduct ? [selectedProduct] : []);
        return newMap;
      });
      return;
    }

    // Buscar productos para esta fila específica
    this.productService.searchProducts(1, 25, { name: searchTerm });

    // Cuando termine la búsqueda, actualizar solo esta fila
    // Usar un pequeño timeout para esperar la respuesta
    setTimeout(() => {
      const searchedProducts = this.productService.searchedProducts ?? [];
      const currentItem = this.billItems()[rowIndex];

      // Combinar productos buscados con el producto actualmente seleccionado (si existe)
      const productMap = new Map<number, IProductResponse>();

      // Agregar producto seleccionado primero
      if (currentItem?.idProduct) {
        const selectedProduct = this.getProductForRow(rowIndex)?.find(
          (p) => +p.id === currentItem.idProduct
        );
        if (selectedProduct) {
          productMap.set(Number(selectedProduct.id), selectedProduct);
        }
      }

      // Agregar productos de búsqueda
      searchedProducts.forEach((p) => productMap.set(Number(p.id), p));

      this.productsPerRow.update((map) => {
        const newMap = new Map(map);
        newMap.set(rowIndex, Array.from(productMap.values()));
        return newMap;
      });
    }, 100);
  }

  public getProductForRow(rowIndex: number): IProductResponse[] {
    return this.productsPerRow().get(rowIndex) || [];
  }

  public displayProduct(product: IProductResponse | string | null): string {
    if (!product || typeof product === 'string') {
      return '';
    }
    return product.name;
  }

  public onProductSelected(rowIndex: number, product: IProductResponse): void {
    // Actualizar el item con el producto seleccionado
    this.billItems.update((items) => {
      const updated = [...items];
      updated[rowIndex] = {
        ...updated[rowIndex],
        idProduct: Number(product.id),
        netPrice: 0, // Resetear precio cuando cambia el producto
      };
      return updated;
    });

    // Guardar el producto seleccionado en la lista de esta fila
    this.productsPerRow.update((map) => {
      const newMap = new Map(map);
      const currentProducts = newMap.get(rowIndex) || [];

      // Agregar el producto seleccionado si no está en la lista
      if (!currentProducts.find((p) => +p.id === +product.id)) {
        newMap.set(rowIndex, [product, ...currentProducts]);
      }

      return newMap;
    });
  }

  public getProductForItem(item: IBillItemData, rowIndex: number): IProductResponse | null {
    const products = this.getProductForRow(rowIndex);
    return products.find((p) => +p.id === item.idProduct) || null;
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

    const newIndex = this.billItems().length;
    this.billItems.update((items) => [...items, newItem]);

    // Inicializar productos para la nueva fila
    this.productsPerRow.update((map) => {
      const newMap = new Map(map);
      newMap.set(newIndex, []);
      return newMap;
    });
  }

  public removeBillItem(index: number): void {
    this.billItems.update((items) => items.filter((_, i) => i !== index));

    // Remover productos de esa fila y reindexar el Map
    this.productsPerRow.update((map) => {
      const newMap = new Map<number, IProductResponse[]>();

      // Reindexar: las filas después de la eliminada bajan un índice
      map.forEach((products, rowIndex) => {
        if (rowIndex < index) {
          newMap.set(rowIndex, products);
        } else if (rowIndex > index) {
          newMap.set(rowIndex - 1, products);
        }
        // rowIndex === index se descarta
      });

      return newMap;
    });
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
    // Verificar autenticación antes de continuar
    if (!this.authService.isLoggedIn()) {
      this.snackBar.open('Su sesión ha expirado. Por favor, inicie sesión nuevamente.', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
      this.dialogRef.close();
      this.authService.logout();
      return;
    }

    const userId = this.authService.getUserId();
    if (!userId) {
      this.snackBar.open(
        'No se pudo obtener el usuario. Por favor, inicie sesión nuevamente.',
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      );
      this.dialogRef.close();
      this.authService.logout();
      return;
    }

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

    const billData: IBillData = {
      ...(this.isEditMode() && this.billId && { id: this.billId }), // Incluir ID en modo edición
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
        ...(item.id && { id: item.id }), // Incluir ID del item si existe (modo edición)
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

  public getProductBrand(rowIndex: number, productId: number): string {
    const products = this.getProductForRow(rowIndex);
    const product = products.find((p) => +p.id === productId);
    return product?.brand?.name || '-';
  }

  public getProductCategory(rowIndex: number, productId: number): string {
    const products = this.getProductForRow(rowIndex);
    const product = products.find((p) => +p.id === productId);
    return product?.category?.name || '-';
  }

  /**
   * Extrae el mensaje de error del backend
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error && 'error' in error) {
      const httpError = error as Error & { error?: { message?: string | string[] } };
      const apiError = httpError.error;

      if (apiError?.message) {
        if (Array.isArray(apiError.message)) {
          return apiError.message.join(', ');
        }
        return apiError.message;
      }

      return httpError.message || 'Error al procesar la solicitud';
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Error desconocido al procesar la factura';
  }

  public trackByIndex(index: number): number {
    return index;
  }
}
