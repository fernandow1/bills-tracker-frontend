import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ShopService } from '@features/shop/services/shop';
import { IShopResponse } from '@features/shop/interfaces/shop-response.interface';
import { ShopForm } from '@features/shop/pages/form/form';

interface ShopFilters {
  name: string | null;
  description: string | null;
}

@Component({
  selector: 'app-shop',
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
    MatDialogModule,
  ],
  templateUrl: './shop.html',
  styleUrl: './shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shop implements OnInit {
  public readonly displayedColumns: string[] = ['name', 'description', 'createdAt', 'actions'];

  private readonly shopService = inject(ShopService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  private reloadCooldown = signal<boolean>(false);
  private readonly COOLDOWN_TIME = 2000; // 2 segundos

  // Paginación
  public currentPage = 1;
  public pageSize = 10;
  public readonly pageSizeOptions = [5, 10, 25, 50, 100];

  // Filtros
  public filters: ShopFilters = {
    name: null,
    description: null,
  };

  private appliedFilters: ShopFilters = { ...this.filters };

  // Form Controls para búsqueda con debounce
  public nameControl = new FormControl<string>('');
  public descriptionControl = new FormControl<string>('');

  // Subjects para debounce de búsqueda
  private nameSearchSubject = new Subject<string>();
  private descriptionSearchSubject = new Subject<string>();

  public ngOnInit(): void {
    // Cargar datos iniciales con paginación
    this.loadData();

    // Configurar debounce para búsqueda por nombre (500ms)
    this.nameSearchSubject
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((v: string) => v.trim()),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe((searchTerm: string) => {
        this.filters.name = searchTerm || null;
        this.applyFilters();
      });

    // Configurar debounce para búsqueda por descripción (500ms)
    this.descriptionSearchSubject
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((v: string) => v.trim()),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe((searchTerm: string) => {
        this.filters.description = searchTerm || null;
        this.applyFilters();
      });

    // Configurar listeners para los FormControls
    this.nameControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.nameSearchSubject.next(value || '');
    });

    this.descriptionControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.descriptionSearchSubject.next(value || '');
      });
  }

  private loadData(): void {
    // Llamar al backend con paginación y filtros
    const filters: { name?: string; description?: string } = {};

    if (this.appliedFilters.name) {
      filters['name'] = this.appliedFilters.name;
    }
    if (this.appliedFilters.description) {
      filters['description'] = this.appliedFilters.description;
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
    return this.appliedFilters.name !== null || this.appliedFilters.description !== null;
  }

  public get activeFiltersCount(): number {
    let count = 0;
    if (this.appliedFilters.name) {
      count++;
    }
    if (this.appliedFilters.description) {
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
      description: null,
    };
    this.appliedFilters = { ...this.filters };
    this.currentPage = 1;

    // Limpiar FormControls
    this.nameControl.setValue('', { emitEvent: false });
    this.descriptionControl.setValue('', { emitEvent: false });

    // Recargar sin filtros
    this.loadData();
  }

  public onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData(); // Recargar con la nueva página
  }

  public openCreateDialog(): void {
    const dialogRef = this.dialog.open(ShopForm, {
      width: '600px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Recargar la lista si se creó una tienda
        this.reload();
      }
    });
  }

  public openEditDialog(shop: IShopResponse): void {
    const dialogRef = this.dialog.open(ShopForm, {
      width: '600px',
      disableClose: true,
      data: shop,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Recargar la lista si se editó una tienda
        this.reload();
      }
    });
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
