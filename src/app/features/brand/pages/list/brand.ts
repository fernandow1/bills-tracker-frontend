import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { BRAND_FACADE } from '@features/brand/facades/brand.facade';
import { IBrandResponse } from '@features/brand/interfaces/brand-response.interface';
import { BrandForm } from '@features/brand/pages/create/brand-form';

@Component({
  selector: 'app-brand-list',
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './brand.html',
  styleUrl: './brand.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Brand {
  private readonly facade = inject(BRAND_FACADE);
  private readonly dialog = inject(MatDialog);

  public readonly displayedColumns: string[] = ['name', 'createdAt', 'actions'];
  private reloadCooldown = signal<boolean>(false);
  private readonly COOLDOWN_TIME = 2000; // 2 segundos

  // Paginación
  public currentPage = 1;
  public pageSize = 10;
  public readonly pageSizeOptions = [5, 10, 25, 50];

  public readonly brands = this.facade.brands;
  public readonly totalItems = this.facade.totalItems;
  public readonly isLoading = this.facade.isLoading;
  public readonly hasError = this.facade.hasError;

  constructor() {
    // Cargar marcas con paginación
    this.loadData();
  }

  private loadData(): void {
    this.facade.searchBrands(this.currentPage, this.pageSize);
  }

  public get isReloadDisabled(): boolean {
    return this.reloadCooldown() || this.isLoading();
  }

  public openCreateDialog(): void {
    const dialogRef = this.dialog.open(BrandForm, {
      width: '500px',
      disableClose: false,
      data: null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadData();
      }
    });
  }

  public openEditDialog(brand: IBrandResponse): void {
    const dialogRef = this.dialog.open(BrandForm, {
      width: '500px',
      disableClose: false,
      data: brand,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadData();
      }
    });
  }

  public onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData();
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
}
