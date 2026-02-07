import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ProductService } from '@features/product/services/product';
import { BrandService } from '@features/brand/services/brand';
import { CategoryService, ICategoryResponse } from '@features/category/services/category';
import { IProductResponse } from '@features/product/interfaces/product-response.interface';
import { IBrandResponse } from '@features/brand/interfaces/brand-response.interface';
import { ProductForm } from '@features/product/pages/form/product-form';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';

interface ProductFilters {
  name: string | null;
  description: string | null;
  idBrand: number | null;
  idCategory: number | null;
}

@Component({
  selector: 'app-product',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDialogModule,
  ],
  templateUrl: './product.html',
  styleUrl: './product.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Product {
  public readonly displayedColumns: string[] = [
    'name',
    'description',
    'brand',
    'category',
    'createdAt',
    'actions',
  ];

  private readonly productService = inject(ProductService);
  private readonly brandService = inject(BrandService);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  private reloadCooldown = signal<boolean>(false);
  private readonly COOLDOWN_TIME = 2000; // 2 segundos

  // Paginación
  public currentPage = 1;
  public pageSize = 10;
  public readonly pageSizeOptions = [5, 10, 25, 50, 100];

  // Filtros
  public filters: ProductFilters = {
    name: null,
    description: null,
    idBrand: null,
    idCategory: null,
  };

  private appliedFilters: ProductFilters = { ...this.filters };

  // Form Controls para autocompletes
  public brandControl = new FormControl<string | IBrandResponse>('');
  public categoryControl = new FormControl<string | ICategoryResponse>('');

  // Subjects para debounce de búsqueda
  private brandSearchSubject = new Subject<string>();
  private categorySearchSubject = new Subject<string>();

  // Marcas y categorías seleccionadas
  private _selectedBrand = signal<IBrandResponse | null>(null);
  private _selectedCategory = signal<ICategoryResponse | null>(null);

  constructor() {
    // Cargar datos iniciales con paginación
    this.loadData();

    // Configurar debounce para búsqueda de marcas (500ms)
    this.brandSearchSubject
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((v: string) => v.trim()),
        filter((v: string) => v.length > 0),
        debounceTime(500),
        distinctUntilChanged(),
      )
      .subscribe((searchTerm: string) => {
        this.brandService.searchBrands(1, 20, searchTerm);
      });

    // Configurar debounce para búsqueda de categorías (500ms)
    this.categorySearchSubject
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((v: string) => v.trim()),
        filter((v: string) => v.length > 0),
        debounceTime(500),
        distinctUntilChanged(),
      )
      .subscribe((searchTerm: string) => {
        this.categoryService.searchCategories(searchTerm);
      });

    // Configurar listeners para los autocompletes
    this.brandControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      if (typeof value === 'string') {
        this.brandSearchSubject.next(value);
      }
    });

    this.categoryControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (typeof value === 'string') {
          this.categorySearchSubject.next(value);
        }
      });
  }

  private loadData(): void {
    // Llamar al backend con paginación y filtros
    const filters: { name?: string; description?: string; idBrand?: number; idCategory?: number } =
      {};

    if (this.appliedFilters.name) {
      filters['name'] = this.appliedFilters.name;
    }
    if (this.appliedFilters.description) {
      filters['description'] = this.appliedFilters.description;
    }
    if (this.appliedFilters.idBrand !== null) {
      filters['idBrand'] = this.appliedFilters.idBrand;
    }
    if (this.appliedFilters.idCategory !== null) {
      filters['idCategory'] = this.appliedFilters.idCategory;
    }

    this.productService.searchProducts(
      this.currentPage,
      this.pageSize,
      Object.keys(filters).length > 0 ? filters : undefined,
    );
  }

  public get products(): IProductResponse[] {
    return this.productService.searchedProducts;
  }

  public get totalItems(): number {
    return this.productService.searchedProductsCount;
  }

  public get isLoading(): boolean {
    return this.productService.isSearchingProducts;
  }

  public get hasError(): boolean {
    return !!this.productService.searchError;
  }

  public get isReloadDisabled(): boolean {
    return this.reloadCooldown() || this.isLoading;
  }

  public get hasActiveFilters(): boolean {
    return (
      this.appliedFilters.name !== null ||
      this.appliedFilters.description !== null ||
      this.appliedFilters.idBrand !== null ||
      this.appliedFilters.idCategory !== null
    );
  }

  public get activeFiltersCount(): number {
    let count = 0;
    if (this.appliedFilters.name) {
      count++;
    }
    if (this.appliedFilters.description) {
      count++;
    }
    if (this.appliedFilters.idBrand !== null) {
      count++;
    }
    if (this.appliedFilters.idCategory !== null) {
      count++;
    }
    return count;
  }

  // Getters públicos para autocompletes
  public get filteredBrands(): IBrandResponse[] {
    return this.brandService.searchedBrands;
  }

  public get filteredCategories(): ICategoryResponse[] {
    return this.categoryService.searchedCategories;
  }

  public get selectedBrand(): IBrandResponse | null {
    return this._selectedBrand();
  }

  public get selectedCategory(): ICategoryResponse | null {
    return this._selectedCategory();
  }

  public displayBrand(brand: IBrandResponse | null): string {
    return brand ? brand.name : '';
  }

  public displayCategory(category: ICategoryResponse | null): string {
    return category ? category.name : '';
  }

  public onBrandSelected(brand: IBrandResponse | null): void {
    this._selectedBrand.set(brand);
    this.filters.idBrand = brand ? Number(brand.id) : null;
  }

  public onCategorySelected(category: ICategoryResponse | null): void {
    this._selectedCategory.set(category);
    this.filters.idCategory = category ? Number(category.id) : null;
  }

  public applyFilters(): void {
    this.appliedFilters = { ...this.filters };
    this.currentPage = 1; // Resetear a la primera página
    this.loadData(); // Recargar con los nuevos filtros
  }

  public clearFilters(): void {
    this.filters = {
      name: null,
      description: null,
      idBrand: null,
      idCategory: null,
    };
    this.appliedFilters = { ...this.filters };
    this.currentPage = 1;

    // Resetear autocompletes
    this.brandControl.setValue('');
    this.categoryControl.setValue('');
    this._selectedBrand.set(null);
    this._selectedCategory.set(null);

    // Resetear servicios de búsqueda
    this.brandService.resetSearchTrigger();
    this.categoryService.resetSearchTrigger();

    // Recargar sin filtros
    this.loadData();
  }

  public onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData(); // Recargar con la nueva página
  }

  public openCreateDialog(): void {
    const dialogRef = this.dialog.open(ProductForm, {
      width: '600px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Recargar la lista si se creó un producto
        this.reload();
      }
    });
  }

  public openEditDialog(product: IProductResponse): void {
    const dialogRef = this.dialog.open(ProductForm, {
      width: '600px',
      disableClose: true,
      data: product,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Recargar la lista si se editó un producto
        this.reload();
      }
    });
  }

  public deleteProduct(_product: IProductResponse): void {
    // TODO: Implementar lógica de eliminación
  }

  public reload(): void {
    if (this.reloadCooldown()) {
      return;
    }

    this.loadData();
    this.reloadCooldown.set(true);

    setTimeout(() => {
      this.reloadCooldown.set(false);
    }, this.COOLDOWN_TIME);
  }
}
