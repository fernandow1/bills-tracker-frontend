import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BrandService } from '@features/brand/services/brand';
import { IBrandResponse } from '@features/brand/interfaces/brand-response.interface';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { BrandForm } from '@src/app/features/brand/pages/create/brand-form';

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
  public readonly displayedColumns: string[] = ['name', 'createdAt', 'actions'];

  private readonly service = inject(BrandService);
  private readonly dialog = inject(MatDialog);
  private reloadCooldown = signal<boolean>(false);
  private readonly COOLDOWN_TIME = 2000; // 2 segundos

  // Paginación
  public currentPage = 1;
  public pageSize = 10;
  public readonly pageSizeOptions = [5, 10, 25, 50];

  constructor() {
    // Cargar marcas con paginación
    this.loadData();
  }

  private loadData(): void {
    this.service.searchBrands(this.currentPage, this.pageSize);
  }

  public get brands(): IBrandResponse[] {
    return this.service.searchedBrands;
  }

  public get totalItems(): number {
    return this.service.searchedBrandsCount;
  }

  public get isLoading(): boolean {
    return this.service.isSearchingBrands;
  }

  public get hasError(): boolean {
    return !!this.service.searchError;
  }

  public get isReloadDisabled(): boolean {
    return this.reloadCooldown() || this.isLoading;
  }

  public openCreateDialog(): void {
    const dialogRef = this.dialog.open(BrandForm, {
      width: '500px',
      disableClose: false,
      data: null, // null para modo creación
    });

    dialogRef.afterClosed().subscribe((result): void => {
      if (result) {
        // Si se creó una marca, recargar la lista
        this.loadData();
      }
    });
  }

  public openEditDialog(brand: IBrandResponse): void {
    const dialogRef = this.dialog.open(BrandForm, {
      width: '500px',
      disableClose: false,
      data: brand, // pasar la marca para modo edición
    });

    dialogRef.afterClosed().subscribe((result): void => {
      if (result) {
        // Si se editó una marca, recargar la lista
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
