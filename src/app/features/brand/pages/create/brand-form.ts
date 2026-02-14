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
import { BrandService } from '@features/brand/services/brand';
import { NotificationService } from '@core/services/notification.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';

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
  private readonly brandService = inject(BrandService);
  private readonly notificationService = inject(NotificationService);
  private readonly errorHandler = inject(ErrorHandlerService);
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
    // Resetear triggers al inicializar el componente
    this.brandService.resetCreateTrigger();
    this.brandService.resetUpdateTrigger();

    effect((): void => {
      const createdBrand = this.brandService.createdBrand;
      const createError = this.brandService.createError;

      if (createdBrand) {
        this.notificationService.success('Marca creada exitosamente');
        this.resetForm();
        this.brandService.resetCreateTrigger();

        if (this.dialogRef) {
          this.dialogRef.close(createdBrand);
        }
      }

      if (createError) {
        const formattedError = this.errorHandler.formatErrorResponse(createError);
        this.notificationService.showError(formattedError);
        this.brandService.resetCreateTrigger();
      }
    });

    effect((): void => {
      const updatedBrand = this.brandService.updatedBrand;
      const updateError = this.brandService.updateError;

      if (updatedBrand) {
        this.notificationService.success('Marca actualizada exitosamente');
        this.resetForm();
        this.brandService.resetUpdateTrigger();

        if (this.dialogRef) {
          this.dialogRef.close(updatedBrand);
        }
      }

      if (updateError) {
        const formattedError = this.errorHandler.formatErrorResponse(updateError);
        this.notificationService.showError(formattedError);
        this.brandService.resetUpdateTrigger();
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
      this.brandService.updateBrand(this.brandId, brandData);
    } else {
      this.brandService.createBrand(brandData);
    }
  }

  public get isLoading(): boolean {
    return this.brandService.isCreatingBrand || this.brandService.isUpdatingBrand;
  }

  private resetForm(): void {
    this.brandModel.set({
      name: '',
    });
    this.brandForm().reset();
  }
}
