import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CurrencyService } from '@features/currency/services/currency';
import { ICurrencyResponse } from '@features/currency/interfaces/currency-response.interface';

@Component({
  selector: 'app-currency-list',
  imports: [
    CommonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './list.html',
  styleUrl: './list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrencyList implements OnInit {
  public readonly displayedColumns: string[] = ['code', 'name', 'symbol', 'createdAt', 'actions'];

  private readonly service = inject(CurrencyService);
  private readonly dialog = inject(MatDialog);
  private reloadCooldown = signal<boolean>(false);
  private readonly COOLDOWN_TIME = 2000; // 2 segundos

  public ngOnInit(): void {
    // Cargar todas las monedas al iniciar el componente
    this.service.loadAllCurrencies();
  }

  public get currencies(): ICurrencyResponse[] {
    return this.service.currencies || [];
  }

  public get isLoading(): boolean {
    return this.service.isLoadingCurrencies;
  }

  public get hasError(): boolean {
    return !!this.service.currenciesError;
  }

  public get isReloadDisabled(): boolean {
    return this.reloadCooldown() || this.isLoading;
  }

  public openCreateDialog(): void {
    // TODO: Implementar diálogo de creación
  }

  public openEditDialog(_currency: ICurrencyResponse): void {
    // TODO: Implementar diálogo de edición
  }

  public deleteCurrency(_currency: ICurrencyResponse): void {
    // TODO: Implementar lógica de eliminación
  }

  public reload(): void {
    if (this.reloadCooldown()) {
      return;
    }

    this.service.reloadCurrencies();
    this.reloadCooldown.set(true);

    setTimeout(() => {
      this.reloadCooldown.set(false);
    }, this.COOLDOWN_TIME);
  }
}
