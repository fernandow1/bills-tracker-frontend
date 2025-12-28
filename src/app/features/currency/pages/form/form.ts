import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Field, form, maxLength, minLength, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ICurrencyData } from '@features/currency/interfaces/currency-data.interface';
import { ICurrencyResponse } from '@features/currency/interfaces/currency-response.interface';
import { CurrencyService } from '@features/currency/services/currency';

@Component({
  selector: 'app-currency-form',
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
export class CurrencyForm {
  private readonly currencyService = inject(CurrencyService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<CurrencyForm>, { optional: true });
  private readonly dialogData = inject<ICurrencyResponse | null>(MAT_DIALOG_DATA, {
    optional: true,
  });

  public readonly isEditMode = !!this.dialogData;
  public currencyId = this.dialogData?.id;

  public currencyModel = signal<ICurrencyData>({
    code: this.dialogData?.code || '',
    name: this.dialogData?.name || '',
    symbol: this.dialogData?.symbol || '',
  });

  public currencyForm = form<ICurrencyData>(this.currencyModel, (schemaPath) => {
    required(schemaPath.code, { message: 'El código de la moneda es obligatorio' });
    minLength(schemaPath.code, 3, { message: 'El código debe tener al menos 3 caracteres' });
    maxLength(schemaPath.code, 3, { message: 'El código debe tener exactamente 3 caracteres' });

    required(schemaPath.name, { message: 'El nombre de la moneda es obligatorio' });
    minLength(schemaPath.name, 3, { message: 'El nombre debe tener al menos 3 caracteres' });
    maxLength(schemaPath.name, 50, { message: 'El nombre no puede exceder 50 caracteres' });

    required(schemaPath.symbol, { message: 'El símbolo de la moneda es obligatorio' });
    minLength(schemaPath.symbol, 1, { message: 'El símbolo debe tener al menos 1 carácter' });
    maxLength(schemaPath.symbol, 5, { message: 'El símbolo no puede exceder 5 caracteres' });
  });

  constructor() {
    // Resetear triggers al inicializar el componente
    this.currencyService.resetCreateTrigger();
    this.currencyService.resetUpdateTrigger();

    // Effect para manejar la respuesta de creación
    effect((): void => {
      const createdCurrency = this.currencyService.createdCurrency;
      const createError = this.currencyService.createError;

      if (createdCurrency) {
        this.snackBar.open('Moneda creada exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: 'success-snackbar',
        });
        this.resetForm();
        this.currencyService.resetCreateTrigger();

        if (this.dialogRef) {
          this.dialogRef.close(createdCurrency);
        }
      }

      if (createError) {
        this.snackBar.open('Error al crear la moneda', 'Cerrar', {
          duration: 5000,
          panelClass: 'error-snackbar',
        });
        this.currencyService.resetCreateTrigger();
      }
    });

    // Effect para manejar la respuesta de actualización
    effect((): void => {
      const updatedCurrency = this.currencyService.updatedCurrency;
      const updateError = this.currencyService.updateError;

      if (updatedCurrency) {
        this.snackBar.open('Moneda actualizada exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: 'success-snackbar',
        });
        this.resetForm();
        this.currencyService.resetUpdateTrigger();

        if (this.dialogRef) {
          this.dialogRef.close(updatedCurrency);
        }
      }

      if (updateError) {
        this.snackBar.open('Error al actualizar la moneda', 'Cerrar', {
          duration: 5000,
          panelClass: 'error-snackbar',
        });
        this.currencyService.resetUpdateTrigger();
      }
    });
  }

  public onSubmit(): void {
    if (this.currencyForm().invalid()) {
      this.currencyForm().markAsTouched();
      return;
    }

    const currencyData: ICurrencyData = this.currencyForm().value();

    if (this.isEditMode && this.currencyId) {
      this.currencyService.updateCurrency(this.currencyId, currencyData);
    } else {
      this.currencyService.createCurrency(currencyData);
    }
  }

  public get isLoading(): boolean {
    return this.currencyService.isCreatingCurrency || this.currencyService.isUpdatingCurrency;
  }

  private resetForm(): void {
    this.currencyModel.set({
      code: '',
      name: '',
      symbol: '',
    });
    this.currencyForm().reset();
  }
}
