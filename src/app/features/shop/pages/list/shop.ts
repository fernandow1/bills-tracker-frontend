import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { ShopService } from '@features/shop/services/shop';
import { IShopResponse } from '@features/shop/interfaces/shop-response.interface';

interface ShopFilters {
  name: string | null;
  address: string | null;
}

@Component({
  selector: 'app-shop',
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
  ],
  templateUrl: './shop.html',
  styleUrl: './shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shop implements OnInit {
  public readonly displayedColumns: string[] = ['name', 'address', 'createdAt', 'actions'];

  private readonly shopService = inject(ShopService);

  private reloadCooldown = signal<boolean>(false);
  private readonly COOLDOWN_TIME = 2000; // 2 segundos

  // Paginación
  public currentPage = 1;
  public pageSize = 10;
  public readonly pageSizeOptions = [5, 10, 25, 50, 100];

  // Filtros
  public filters: ShopFilters = {
    name: null,
    address: null,
  };

  private appliedFilters: ShopFilters = { ...this.filters };

  public ngOnInit(): void {
    // Cargar datos iniciales con paginación
    this.loadData();
  }

  private loadData(): void {
    // Llamar al backend con paginación y filtros
    const filters: { name?: string; address?: string } = {};

    if (this.appliedFilters.name) {
      filters['name'] = this.appliedFilters.name;
    }
    if (this.appliedFilters.address) {
      filters['address'] = this.appliedFilters.address;
    }

    this.shopService.searchShops(
      this.currentPage,
      this.pageSize,
      Object.keys(filters).length > 0 ? filters : undefined
    );
  }

  public get shops(): IShopResponse[] {
    return this.shopService.searchedShops;
  }

  public get totalItems(): number {
    return this.shopService.searchedShopsCount;
  }

  public get isLoading(): boolean {
    return this.shopService.isSearchingShops;
  }

  public get hasError(): boolean {
    return !!this.shopService.searchError;
  }

  public get isReloadDisabled(): boolean {
    return this.reloadCooldown() || this.isLoading;
  }

  public get hasActiveFilters(): boolean {
    return this.appliedFilters.name !== null || this.appliedFilters.address !== null;
  }

  public get activeFiltersCount(): number {
    let count = 0;
    if (this.appliedFilters.name) {
      count++;
    }
    if (this.appliedFilters.address) {
      count++;
    }
    return count;
  }

  public applyFilters(): void {
    this.appliedFilters = { ...this.filters };
    this.currentPage = 1; // Resetear a la primera página
    this.loadData(); // Recargar con los nuevos filtros
  }

  public clearFilters(): void {
    this.filters = {
      name: null,
      address: null,
    };
    this.appliedFilters = { ...this.filters };
    this.currentPage = 1;

    // Recargar sin filtros
    this.loadData();
  }

  public onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData(); // Recargar con la nueva página
  }

  public openCreateDialog(): void {
    // TODO: Implementar diálogo de creación
  }

  public openEditDialog(_shop: IShopResponse): void {
    // TODO: Implementar diálogo de edición
  }

  public deleteShop(_shop: IShopResponse): void {
    // TODO: Implementar lógica de eliminación
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
