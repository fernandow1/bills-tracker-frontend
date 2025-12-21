import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  effect,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { IProductData } from '@features/product/interfaces/product-data.interface';
import { IProductResponse } from '@features/product/interfaces/product-response.interface';
import { form, Field, required, maxLength, minLength } from '@angular/forms/signals';
import { MatCardModule } from '@angular/material/card';
import { ProductService } from '@features/product/services/product';
import { BrandService } from '@features/brand/services/brand';
import { CategoryService, ICategoryResponse } from '@features/category/services/category';
import { IBrandResponse } from '@features/brand/interfaces/brand-response.interface';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-product-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatAutocompleteModule,
    Field,
  ],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductForm implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly brandService = inject(BrandService);
  private readonly categoryService = inject(CategoryService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<ProductForm>, { optional: true });
  private readonly dialogData = inject<IProductResponse | null>(MAT_DIALOG_DATA, {
    optional: true,
  });
  private readonly destroyRef = inject(DestroyRef);

  public readonly isEditMode = !!this.dialogData;
  public readonly productId = this.dialogData?.id;

  // Form Controls para autocompletes
  public brandControl = new FormControl<string | IBrandResponse>(this.dialogData?.brand || '');
  public categoryControl = new FormControl<string | ICategoryResponse>(
    this.dialogData?.category || ''
  );

  // Subjects para debounce de búsqueda
  private brandSearchSubject = new Subject<string>();
  private categorySearchSubject = new Subject<string>();

  // Signals para marcas y categorías seleccionadas
  private _selectedBrand = signal<IBrandResponse | null>(this.dialogData?.brand || null);
  private _selectedCategory = signal<ICategoryResponse | null>(this.dialogData?.category || null);

  public productModel = signal<IProductData>({
    name: this.dialogData?.name || '',
    description: this.dialogData?.description || '',
    idBrand: this.dialogData?.idBrand || 0,
    idCategory: this.dialogData?.idCategory || 0,
  });

  public productForm = form<IProductData>(this.productModel, (schemaPath) => {
    required(schemaPath.name, { message: 'El nombre del producto es obligatorio' });
    minLength(schemaPath.name, 3, { message: 'El nombre debe tener al menos 3 caracteres' });
    maxLength(schemaPath.name, 100, { message: 'El nombre no puede exceder 100 caracteres' });
    maxLength(schemaPath.description, 500, {
      message: 'La descripción no puede tener más de 500 caracteres',
    });
    required(schemaPath.idBrand, { message: 'La marca es obligatoria' });
    required(schemaPath.idCategory, { message: 'La categoría es obligatoria' });
  });

  constructor() {
    // Resetear triggers al inicializar el componente
    this.productService.resetCreateTrigger();
    this.productService.resetUpdateTrigger();

    // Effect para manejar la respuesta de creación
    effect(() => {
      const createdProduct = this.productService.createdProduct;
      const createError = this.productService.createError;

      if (createdProduct) {
        this.snackBar.open('Producto creado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: 'success-snackbar',
        });
        this.resetForm();
        this.productService.resetCreateTrigger();

        // Cerrar el modal si existe
        if (this.dialogRef) {
          this.dialogRef.close(createdProduct);
        }
      }

      if (createError) {
        this.snackBar.open('Error al crear el producto', 'Cerrar', {
          duration: 5000,
          panelClass: 'error-snackbar',
        });
        this.productService.resetCreateTrigger();
      }
    });

    // Effect para manejar la respuesta de actualización
    effect(() => {
      const updatedProduct = this.productService.updatedProduct;
      const updateError = this.productService.updateError;

      if (updatedProduct) {
        this.snackBar.open('Producto actualizado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: 'success-snackbar',
        });
        this.productService.resetUpdateTrigger();

        // Cerrar el modal si existe
        if (this.dialogRef) {
          this.dialogRef.close(updatedProduct);
        }
      }

      if (updateError) {
        this.snackBar.open('Error al actualizar el producto', 'Cerrar', {
          duration: 5000,
          panelClass: 'error-snackbar',
        });
        this.productService.resetUpdateTrigger();
      }
    });
  }

  public ngOnInit(): void {
    // Configurar debounce para búsqueda de marcas (500ms)
    this.brandSearchSubject
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((searchTerm) => {
        if (searchTerm.trim() === '') {
          return;
        }
        this.brandService.searchBrands(searchTerm);
      });

    // Configurar debounce para búsqueda de categorías (500ms)
    this.categorySearchSubject
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((searchTerm) => {
        if (searchTerm.trim() === '') {
          return;
        }
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

  public get filteredBrands(): IBrandResponse[] {
    return this.brandService.searchedBrands;
  }

  public get filteredCategories(): ICategoryResponse[] {
    return this.categoryService.searchedCategories;
  }

  public displayBrand(brand: IBrandResponse | null): string {
    return brand ? brand.name : '';
  }

  public displayCategory(category: ICategoryResponse | null): string {
    return category ? category.name : '';
  }

  public onBrandSelected(brand: IBrandResponse | null): void {
    this._selectedBrand.set(brand);
    this.productModel.update((current) => ({
      ...current,
      idBrand: brand ? Number(brand.id) : 0,
    }));
  }

  public onCategorySelected(category: ICategoryResponse | null): void {
    this._selectedCategory.set(category);
    this.productModel.update((current) => ({
      ...current,
      idCategory: category ? Number(category.id) : 0,
    }));
  }

  public onSubmit(): void {
    if (this.productForm().invalid()) {
      this.productForm().markAsTouched();
      return;
    }

    if (this.isEditMode && this.productId) {
      // Actualizar producto existente
      this.productService.updateProduct(this.productId, this.productForm().value());
    } else {
      // Crear nuevo producto
      this.productService.createProduct(this.productForm().value());
    }
  }

  public get isLoading(): boolean {
    return this.productService.isCreatingProduct || this.productService.isUpdatingProduct;
  }

  private resetForm(): void {
    this.productModel.set({
      name: '',
      description: '',
      idBrand: 0,
      idCategory: 0,
    });
    this.productForm().reset();
    this.brandControl.setValue('');
    this.categoryControl.setValue('');
    this._selectedBrand.set(null);
    this._selectedCategory.set(null);
  }
}
