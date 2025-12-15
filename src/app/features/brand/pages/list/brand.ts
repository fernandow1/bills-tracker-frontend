import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
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

  public get brands(): IBrandResponse[] {
    return this.service.brands || [];
  }

  public get isLoading(): boolean {
    return this.service.isLoadingBrands;
  }

  public get hasError(): boolean {
    return !!this.service.brandsError;
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
        this.service.reloadBrands();
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
        this.service.reloadBrands();
      }
    });
  }

  public reload(): void {
    if (this.reloadCooldown()) {
      return;
    }

    this.service.reloadBrands();
    this.reloadCooldown.set(true);

    setTimeout(() => {
      this.reloadCooldown.set(false);
    }, this.COOLDOWN_TIME);
  }
}
