import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Field, form, maxLength, minLength, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IPaymentMethodData } from '@features/payment-method/interfaces/payment-method-data.interface';
import { IPaymentMethodResponse } from '@features/payment-method/interfaces/payment-method-response.interface';
import { PaymentMethodService } from '@features/payment-method/services/payment-method';

@Component({
  selector: 'app-payment-method-form',
  standalone: true,
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
export class PaymentMethodForm {
  private readonly paymentMethodService = inject(PaymentMethodService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<PaymentMethodForm>, { optional: true });
  private readonly dialogData = inject<IPaymentMethodResponse | null>(MAT_DIALOG_DATA, {
    optional: true,
  });

  public readonly isEditMode = !!this.dialogData;
  public paymentMethodId = this.dialogData?.id;

  protected isSubmitting = signal(false);

  public paymentMethodModel = signal<IPaymentMethodData>({
    name: this.dialogData?.name || '',
    description: this.dialogData?.description || '',
  });

  public paymentMethodForm = form<IPaymentMethodData>(this.paymentMethodModel, (schemaPath) => {
    required(schemaPath.name, { message: 'El nombre es obligatorio' });
    minLength(schemaPath.name, 2, { message: 'El nombre debe tener al menos 2 caracteres' });
    maxLength(schemaPath.name, 100, { message: 'El nombre no puede exceder 100 caracteres' });

    maxLength(schemaPath.description, 500, {
      message: 'La descripción no puede exceder 500 caracteres',
    });
  });

  public async onSubmit(): Promise<void> {
    if (this.paymentMethodForm().invalid()) {
      this.paymentMethodForm().markAsTouched();
      this.snackBar.open('Por favor, complete todos los campos requeridos', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    this.isSubmitting.set(true);

    try {
      const paymentMethodData: IPaymentMethodData = this.paymentMethodForm().value();

      if (this.isEditMode && this.paymentMethodId) {
        await this.paymentMethodService.updatePaymentMethod(
          this.paymentMethodId,
          paymentMethodData
        );
        this.snackBar.open('Método de pago actualizado exitosamente', 'Cerrar', {
          duration: 3000,
        });
      } else {
        await this.paymentMethodService.createPaymentMethod(paymentMethodData);
        this.snackBar.open('Método de pago creado exitosamente', 'Cerrar', {
          duration: 3000,
        });
      }

      if (this.dialogRef) {
        this.dialogRef.close(true);
      }
    } catch (error) {
      console.error('Error al guardar método de pago:', error);
      this.snackBar.open('Error al guardar el método de pago', 'Cerrar', {
        duration: 3000,
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close(false);
    }
  }
}
