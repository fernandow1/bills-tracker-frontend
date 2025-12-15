import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { CategoryService, ICategoryResponse } from '@features/category/services/category';
import { CategoryForm } from '../create/category-form';

@Component({
  selector: 'app-category-list',
  imports: [
    CommonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './category-list.html',
  styleUrls: ['./category-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryList {
  public readonly displayedColumns: string[] = ['name', 'description', 'createdAt', 'actions'];

  private readonly service = inject(CategoryService);
  private readonly dialog = inject(MatDialog);
  private reloadCooldown = signal<boolean>(false);
  private readonly COOLDOWN_TIME = 2000; // 2 segundos

  public get categories(): ICategoryResponse[] {
    return this.service.categories || [];
  }

  public get isLoading(): boolean {
    return this.service.isLoadingCategories;
  }

  public get hasError(): boolean {
    return !!this.service.categoriesError;
  }

  public get isReloadDisabled(): boolean {
    return this.reloadCooldown() || this.isLoading;
  }

  public openCreateDialog(): void {
    const dialogRef = this.dialog.open(CategoryForm, {
      width: '500px',
      disableClose: false,
      data: null, // null para modo creación
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Si se creó una categoría, recargar la lista
        this.service.reloadCategories();
      }
    });
  }

  public openEditDialog(category: ICategoryResponse): void {
    const dialogRef = this.dialog.open(CategoryForm, {
      width: '500px',
      disableClose: false,
      data: category, // Pasar datos de la categoría para modo edición
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Si se actualizó una categoría, recargar la lista
        this.service.reloadCategories();
      }
    });
  }

  public reload(): void {
    if (this.reloadCooldown()) {
      return;
    }

    this.service.reloadCategories();
    this.reloadCooldown.set(true);

    setTimeout(() => {
      this.reloadCooldown.set(false);
    }, this.COOLDOWN_TIME);
  }
}
