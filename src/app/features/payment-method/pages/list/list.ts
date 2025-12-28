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
  #paymentMethodService = inject(PaymentMethodService);
  #dialog = inject(MatDialog);

  protected readonly displayedColumns: string[] = ['name', 'description', 'createdAt', 'actions'];

  protected paymentMethods = signal<IPaymentMethodResponse[]>([]);
  protected isLoading = signal(false);

  public ngOnInit(): void {
    this.loadPaymentMethods();
  }

  private loadPaymentMethods(): void {
    this.isLoading.set(true);
    this.#paymentMethodService.loadAllPaymentMethods();

    // Esperar un momento para que el resource cargue
    setTimeout(() => {
      const data = this.#paymentMethodService.getAllPaymentMethods();
      if (data) {
        this.paymentMethods.set(data);
      }
      this.isLoading.set(this.#paymentMethodService.isLoadingPaymentMethods());
    }, 100);
  }

  public openCreateDialog(): void {
    const dialogRef = this.#dialog.open(PaymentMethodForm, {
      width: '500px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadPaymentMethods();
      }
    });
  }

  public openEditDialog(paymentMethod: IPaymentMethodResponse): void {
    const dialogRef = this.#dialog.open(PaymentMethodForm, {
      width: '500px',
      data: paymentMethod,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadPaymentMethods();
      }
    });
  }
}
