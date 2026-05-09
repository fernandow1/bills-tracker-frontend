import { Component, inject, signal, OnInit, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { IBillItemData } from '@features/bill/interfaces';
import { NetUnits } from '@features/bill/enums/net-units.enum';
import { ProductService } from '@features/product/services/product';
import { IProductResponse } from '@features/product/interfaces/product-response.interface';
import { CurrencyFormatPipe } from '@shared/pipes';

@Component({
  selector: 'tr[app-bill-item-row]',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatAutocompleteModule,
    CurrencyFormatPipe,
  ],
  templateUrl: './bill-item-row.component.html',
})
export class BillItemRowComponent implements OnInit {
  item = input.required<IBillItemData>();
  initialProduct = input<IProductResponse | null>(null);
  disabled = input(false);

  itemChange = output<IBillItemData>();
  remove = output<void>();

  private readonly productService = inject(ProductService);

  public NetUnits = NetUnits;

  public searchedProducts = signal<IProductResponse[]>([]);
  public selectedProduct = signal<IProductResponse | null>(null);

  ngOnInit() {
    const initial = this.initialProduct();
    if (initial) {
      this.selectedProduct.set(initial);
      this.searchedProducts.set([initial]);
    }
  }

  public displayProduct(product: IProductResponse | string | null): string {
    if (!product || typeof product === 'string') return '';
    return product.name;
  }

  public onProductSearch(searchTerm: string): void {
    if (searchTerm.trim() === '') {
      this.searchedProducts.set(this.selectedProduct() ? [this.selectedProduct()!] : []);
      return;
    }

    // Call search on the service
    this.productService.searchProducts(1, 25, { name: searchTerm });

    // Add a slight delay to allow the service to update its signal
    setTimeout(() => {
      const results = this.productService.searchedProducts ?? [];
      const map = new Map<number, IProductResponse>();

      if (this.selectedProduct()) {
        map.set(Number(this.selectedProduct()!.id), this.selectedProduct()!);
      }

      results.forEach((p) => map.set(Number(p.id), p));
      this.searchedProducts.set(Array.from(map.values()));
    }, 100);
  }

  public onProductSelected(product: IProductResponse): void {
    this.selectedProduct.set(product);
    this.updateField('idProduct', Number(product.id));
    this.updateField('netPrice', 0);
  }

  public updateField<K extends keyof IBillItemData>(field: K, value: IBillItemData[K]): void {
    const updated = { ...this.item(), [field]: value };
    if (field === 'netUnit' && value === NetUnits.UNIT) {
      updated.contentValue = null;
    }
    this.itemChange.emit(updated);
  }

  public isContentValueEnabled(): boolean {
    return this.item().netUnit !== NetUnits.UNIT;
  }

  public isContentValueInvalid(): boolean {
    const item = this.item();
    return this.isContentValueEnabled() && (!item.contentValue || item.contentValue <= 0);
  }

  public subtotal = computed(() => {
    const item = this.item();
    if (item.netUnit !== NetUnits.UNIT && item.contentValue) {
      return item.quantity * item.contentValue * item.netPrice;
    }
    return item.quantity * item.netPrice;
  });
}
