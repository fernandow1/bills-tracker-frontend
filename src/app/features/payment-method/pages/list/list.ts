import { Component, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { PaymentMethodService } from '@features/payment-method/services/payment-method';
import { PaymentMethodForm } from '@features/payment-method/pages/form/form';
import { IPaymentMethodResponse } from '@features/payment-method/interfaces/payment-method-response.interface';

@Component({
  selector: 'app-payment-method-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './list.html',
  styleUrl: './list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentMethodList implements OnInit {
  private readonly service = inject(PaymentMethodService);
  private readonly dialog = inject(MatDialog);
  private reloadCooldown = signal<boolean>(false);
  private readonly COOLDOWN_TIME = 2000; // 2 segundos

  public readonly displayedColumns: string[] = ['name', 'description', 'createdAt', 'actions'];

  public ngOnInit(): void {
    // Cargar todos los métodos de pago al iniciar el componente
    this.service.loadAllPaymentMethods();
  }

  public get paymentMethods(): IPaymentMethodResponse[] {
    return this.service.paymentMethods || [];
  }

  public get isLoading(): boolean {
    return this.service.isLoadingPaymentMethods;
  }

  public get hasError(): boolean {
    return !!this.service.paymentMethodsError;
  }

  public get isReloadDisabled(): boolean {
    return this.reloadCooldown() || this.isLoading;
  }

  public openCreateDialog(): void {
    const dialogRef = this.dialog.open(PaymentMethodForm, {
      width: '600px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Recargar la lista si se creó un método de pago
        this.service.reloadPaymentMethods();
      }
    });
  }

  public openEditDialog(paymentMethod: IPaymentMethodResponse): void {
    const dialogRef = this.dialog.open(PaymentMethodForm, {
      width: '600px',
      disableClose: true,
      data: paymentMethod,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Recargar la lista si se editó un método de pago
        this.service.reloadPaymentMethods();
      }
    });
  }

  public deletePaymentMethod(_paymentMethod: IPaymentMethodResponse): void {
    // TODO: Implementar lógica de eliminación
  }

  public reload(): void {
    if (this.reloadCooldown()) {
      return;
    }

    this.service.reloadPaymentMethods();
    this.reloadCooldown.set(true);

    setTimeout(() => {
      this.reloadCooldown.set(false);
    }, this.COOLDOWN_TIME);
  }
}
