import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Field, form, maxLength, min, max, minLength, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IShopData } from '@features/shop/interfaces/shop-data.interface';
import { IShopResponse } from '@features/shop/interfaces/shop-response.interface';
import { ShopService } from '@features/shop/services/shop';

@Component({
  selector: 'app-shop-form',
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
  templateUrl: './form.html',
  styleUrl: './form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopForm {
  private readonly shopService = inject(ShopService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<ShopForm>, { optional: true });
  private readonly dialogData = inject<IShopResponse | null>(MAT_DIALOG_DATA, {
    optional: true,
  });

  public readonly isEditMode = !!this.dialogData;
  public shopId = this.dialogData?.id;

  public shopModel = signal<IShopData>({
    name: this.dialogData?.name || '',
    description: this.dialogData?.description || '',
    latitude: this.dialogData?.latitude,
    longitude: this.dialogData?.longitude,
  });

  public shopForm = form<IShopData>(this.shopModel, (schemaPath) => {
    required(schemaPath.name, { message: 'El nombre de la tienda es obligatorio' });
    minLength(schemaPath.name, 3, { message: 'El nombre debe tener al menos 3 caracteres' });
    maxLength(schemaPath.name, 255, { message: 'El nombre no puede exceder 100 caracteres' });
    maxLength(schemaPath.description, 255, {
      message: 'La descripción no puede exceder 255 caracteres',
    });

    // Validaciones opcionales para latitud (solo si se proporciona un valor)
    if (schemaPath.latitude) {
      min(schemaPath.latitude, -90, { message: 'La latitud debe ser mayor o igual a -90' });
      max(schemaPath.latitude, 90, { message: 'La latitud debe ser menor o igual a 90' });
    }

    // Validaciones opcionales para longitud (solo si se proporciona un valor)
    if (schemaPath.longitude) {
      min(schemaPath.longitude, -180, { message: 'La longitud debe ser mayor o igual a -180' });
      max(schemaPath.longitude, 180, { message: 'La longitud debe ser menor o igual a 180' });
    }
  });

  constructor() {
    // Resetear triggers al inicializar el componente
    this.shopService.resetCreateTrigger();
    this.shopService.resetUpdateTrigger();

    // Effect para manejar la respuesta de creación
    effect((): void => {
      const createdShop = this.shopService.createdShop;
      const createError = this.shopService.createError;

      if (createdShop) {
        this.snackBar.open('Tienda creada exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: 'success-snackbar',
        });
        this.resetForm();
        this.shopService.resetCreateTrigger();

        if (this.dialogRef) {
          this.dialogRef.close(createdShop);
        }
      }

      if (createError) {
        this.snackBar.open('Error al crear la tienda', 'Cerrar', {
          duration: 5000,
          panelClass: 'error-snackbar',
        });
        this.shopService.resetCreateTrigger();
      }
    });

    // Effect para manejar la respuesta de actualización
    effect((): void => {
      const updatedShop = this.shopService.updatedShop;
      const updateError = this.shopService.updateError;

      if (updatedShop) {
        this.snackBar.open('Tienda actualizada exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: 'success-snackbar',
        });
        this.resetForm();
        this.shopService.resetUpdateTrigger();

        if (this.dialogRef) {
          this.dialogRef.close(updatedShop);
        }
      }

      if (updateError) {
        this.snackBar.open('Error al actualizar la tienda', 'Cerrar', {
          duration: 5000,
          panelClass: 'error-snackbar',
        });
        this.shopService.resetUpdateTrigger();
      }
    });
  }

  public onSubmit(): void {
    if (this.shopForm().invalid()) {
      this.shopForm().markAsTouched();
      return;
    }

    const shopData: IShopData = this.shopForm().value();

    if (this.isEditMode && this.shopId) {
      this.shopService.updateShop(this.shopId, shopData);
    } else {
      this.shopService.createShop(shopData);
    }
  }

  public get isLoading(): boolean {
    return this.shopService.isCreatingShop || this.shopService.isUpdatingShop;
  }

  private resetForm(): void {
    this.shopModel.set({
      name: '',
      description: '',
      latitude: undefined,
      longitude: undefined,
    });
    this.shopForm().reset();
  }
}
