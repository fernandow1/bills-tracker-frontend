import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, inject, effect } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ICategoryData } from '@features/category/interfaces/category-data.interface';
import { form, Field, required, maxLength, minLength } from '@angular/forms/signals';
import { MatCardModule } from '@angular/material/card';
import { CategoryService, ICategoryResponse } from '@features/category/services/category';

@Component({
  selector: 'app-category-form',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    Field,
  ],
  templateUrl: './category-form.html',
  styleUrls: ['./category-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryForm {
  private readonly categoryService = inject(CategoryService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<CategoryForm>, { optional: true });
  private readonly dialogData = inject<ICategoryResponse | null>(MAT_DIALOG_DATA, {
    optional: true,
  });

  public readonly isEditMode = !!this.dialogData;
  public readonly categoryId = this.dialogData?.id;

  public categoryModel = signal<ICategoryData>({
    name: this.dialogData?.name || '',
    description: this.dialogData?.description || '',
  });

  public categoryForm = form<ICategoryData>(this.categoryModel, (schemaPath) => {
    required(schemaPath.name, { message: 'El nombre de la categoría es obligatorio' });
    minLength(schemaPath.name, 3, { message: 'El nombre debe tener al menos 3 caracteres' });
    maxLength(schemaPath.name, 50, { message: 'El nombre no puede exceder 50 caracteres' });
    maxLength(schemaPath.description, 200, {
      message: 'La descripción no puede tener más de 200 caracteres',
    });
  });

  constructor() {
    // Resetear triggers al inicializar el componente
    this.categoryService.resetCreateTrigger();
    this.categoryService.resetUpdateTrigger();

    // Effect para manejar la respuesta de creación
    effect(() => {
      const createdCategory = this.categoryService.createdCategory;
      const createError = this.categoryService.createError;

      if (createdCategory) {
        this.snackBar.open('Categoría creada exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: 'success-snackbar',
        });
        this.resetForm();
        this.categoryService.resetCreateTrigger();

        // Cerrar el modal si existe
        if (this.dialogRef) {
          this.dialogRef.close(createdCategory);
        }
      }

      if (createError) {
        this.snackBar.open('Error al crear la categoría', 'Cerrar', {
          duration: 5000,
          panelClass: 'error-snackbar',
        });
        this.categoryService.resetCreateTrigger();
      }
    });

    // Effect para manejar la respuesta de actualización
    effect(() => {
      const updatedCategory = this.categoryService.updatedCategory;
      const updateError = this.categoryService.updateError;

      if (updatedCategory) {
        this.snackBar.open('Categoría actualizada exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: 'success-snackbar',
        });
        this.categoryService.resetUpdateTrigger();

        // Cerrar el modal si existe
        if (this.dialogRef) {
          this.dialogRef.close(updatedCategory);
        }
      }

      if (updateError) {
        this.snackBar.open('Error al actualizar la categoría', 'Cerrar', {
          duration: 5000,
          panelClass: 'error-snackbar',
        });
        this.categoryService.resetUpdateTrigger();
      }
    });
  }

  public onSubmit(): void {
    if (this.categoryForm().invalid()) {
      this.categoryForm().markAsTouched();
      return;
    }

    if (this.isEditMode && this.categoryId) {
      // Actualizar categoría existente
      this.categoryService.updateCategory(this.categoryId, this.categoryForm().value());
    } else {
      // Crear nueva categoría
      this.categoryService.createCategory(this.categoryForm().value());
    }
  }

  public get isLoading(): boolean {
    return this.categoryService.isCreatingCategory || this.categoryService.isUpdatingCategory;
  }

  private resetForm(): void {
    this.categoryModel.set({
      name: '',
      description: '',
    });
    this.categoryForm().reset();
  }
}
