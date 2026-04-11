import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Field, form, maxLength, minLength, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IBrandResponse } from '@features/brand/interfaces/brand-response.interface';
import { IBrandData } from '@features/brand/interfaces/brand-data.interface';
import { BRAND_FACADE } from '@features/brand/facades/brand.facade';

@Component({
  selector: 'app-brand-form',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    Field,
  ],
  templateUrl: './brand-form.html',
  styleUrl: './brand-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandForm {
  private readonly facade = inject(BRAND_FACADE);
  private readonly dialogRef = inject(MatDialogRef<BrandForm>, { optional: true });
  private readonly dialogData = inject<IBrandResponse | null>(MAT_DIALOG_DATA, {
    optional: true,
  });

  public readonly isEditMode = !!this.dialogData;
  public brandId = this.dialogData?.id;

  public brandModel = signal<IBrandData>({
    name: this.dialogData?.name || '',
  });

  public brandForm = form<IBrandData>(this.brandModel, (schemaPath) => {
    required(schemaPath.name, { message: 'El nombre de la marca es obligatorio' });
    minLength(schemaPath.name, 3, { message: 'El nombre debe tener al menos 3 caracteres' });
    maxLength(schemaPath.name, 50, { message: 'El nombre no puede exceder 50 caracteres' });
  });

  constructor() {
    // Resetear triggers al inicializar el componente a través del facade
    this.facade.resetTriggers();

    effect((): void => {
      const createdBrand = this.facade.createdBrand();
      const createError = this.facade.createError();

      if (createdBrand) {
        this.resetForm();
        this.facade.resetTriggers();

        if (this.dialogRef) {
          this.dialogRef.close(createdBrand);
        }
      }

      if (createError) {
        this.facade.resetTriggers();
      }
    });

    effect((): void => {
      const updatedBrand = this.facade.updatedBrand();
      const updateError = this.facade.updateError();

      if (updatedBrand) {
        this.resetForm();
        this.facade.resetTriggers();

        if (this.dialogRef) {
          this.dialogRef.close(updatedBrand);
        }
      }

      if (updateError) {
        this.facade.resetTriggers();
      }
    });
  }

  public onSubmit(): void {
    if (this.brandForm().invalid()) {
      this.brandForm().markAsTouched();
      return;
    }

    const brandData: IBrandData = this.brandForm().value();

    if (this.isEditMode && this.brandId) {
      this.facade.updateBrand(this.brandId, brandData);
    } else {
      this.facade.createBrand(brandData);
    }
  }

  public get isLoading(): boolean {
    return this.facade.isSaving();
  }

  private resetForm(): void {
    this.brandModel.set({
      name: '',
    });
    this.brandForm().reset();
  }
}
