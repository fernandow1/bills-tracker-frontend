import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { BillService } from '@features/bill/services/bill';
import { IBillResponse, IBillSearchFilters } from '@features/bill/interfaces';
import { BillDetail } from '@features/bill/pages/detail/bill-detail';
import { BillForm } from '@features/bill/pages/form/bill-form';
import { CurrencyFormatPipe } from '@shared/pipes';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-bill-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    CurrencyFormatPipe,
  ],
  templateUrl: './bill-list.html',
  styleUrl: './bill-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillList {
  public readonly displayedColumns: string[] = [
    'id',
    'shop',
    'total',
    'currency',
    'paymentMethod',
    'purchasedAt',
    'actions',
  ];

  private readonly billService = inject(BillService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  private reloadCooldown = signal<boolean>(false);
  private readonly COOLDOWN_TIME = 2000;

  // Paginación
  public currentPage = 1;
  public pageSize = 10;
  public readonly pageSizeOptions = [5, 10, 25, 50, 100];

  // Filtros
  public filters: IBillSearchFilters = {};

  private appliedFilters: IBillSearchFilters = { ...this.filters };

  // Form Controls para filtros
  public totalControl = new FormControl<number | null>(null);

  // Subject para debounce
  private totalSubject = new Subject<number | null>();

  constructor() {
    this.loadData();

    // Configurar debounce para total (500ms)
    this.totalSubject
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(500))
      .subscribe((value: number | null) => {
        this.filters.total = value ?? undefined;
        this.applyFilters();
      });

    // Escuchar cambios en el control
    this.totalControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.totalSubject.next(value);
    });
  }

  private loadData(): void {
    const filters: IBillSearchFilters = {};

    if (this.appliedFilters.idProduct) {
      filters.idProduct = this.appliedFilters.idProduct;
    }
    if (this.appliedFilters.idShop) {
      filters.idShop = this.appliedFilters.idShop;
    }
    if (this.appliedFilters.idCurrency) {
      filters.idCurrency = this.appliedFilters.idCurrency;
    }
    if (this.appliedFilters.idPaymentMethod) {
      filters.idPaymentMethod = this.appliedFilters.idPaymentMethod;
    }
    if (this.appliedFilters.total) {
      filters.total = this.appliedFilters.total;
    }

    this.billService.searchBills(this.currentPage, this.pageSize, filters);
  }

  public get bills(): IBillResponse[] {
    return this.billService.searchedBills;
  }

  public get totalItems(): number {
    return this.billService.searchedBillsCount;
  }

  public get isLoading(): boolean {
    return this.billService.isSearchingBills;
  }

  public get hasError(): boolean {
    return !!this.billService.searchError;
  }

  public get isReloadDisabled(): boolean {
    return this.reloadCooldown() || this.isLoading;
  }

  public onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  public applyFilters(): void {
    this.appliedFilters = { ...this.filters };
    this.currentPage = 1;
    this.loadData();
  }

  public clearFilters(): void {
    this.filters = {};
    this.totalControl.setValue(null, { emitEvent: false });
    this.applyFilters();
  }

  public reload(): void {
    if (this.reloadCooldown()) {
      return;
    }

    this.loadData();
    this.reloadCooldown.set(true);

    setTimeout(() => {
      this.reloadCooldown.set(false);
    }, this.COOLDOWN_TIME);
  }

  public openCreateDialog(): void {
    const dialogRef = this.dialog.open(BillForm, {
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      data: { mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.loadData();
      }
    });
  }

  public openEditDialog(bill: IBillResponse): void {
    const dialogRef = this.dialog.open(BillForm, {
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      data: { bill, mode: 'edit' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.loadData();
      }
    });
  }

  public openViewDialog(bill: IBillResponse): void {
    const dialogRef = this.dialog.open(BillDetail, {
      width: '850px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: bill,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'edit') {
        this.openEditDialog(result.bill);
      } else if (result?.action === 'delete') {
        void this.deleteBill(result.bill);
      }
    });
  }

  public async deleteBill(bill: IBillResponse): Promise<void> {
    if (confirm(`¿Está seguro de eliminar la factura ${bill.id}?`)) {
      try {
        await this.billService.deleteBill(bill.id);
        this.loadData();
      } catch {
        // Error será manejado por el interceptor
      }
    }
  }
}
