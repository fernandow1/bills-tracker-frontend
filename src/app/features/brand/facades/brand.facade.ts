import { Injectable, inject, computed, InjectionToken, effect } from '@angular/core';
import { BrandService } from '@features/brand/services/brand';
import { NotificationService } from '@core/services/notification.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { IBrandFacade } from '@features/brand/interfaces/brand-facade.interface';
import { IBrandData } from '@features/brand/interfaces/brand-data.interface';

/**
 * InjectionToken para desacoplar componentes del Facade
 */
export const BRAND_FACADE = new InjectionToken<IBrandFacade>('BRAND_FACADE', {
  providedIn: 'root',
  factory: () => inject(BrandFacade),
});

@Injectable({
  providedIn: 'root',
})
export class BrandFacade implements IBrandFacade {
  private readonly service = inject(BrandService);
  private readonly notificationService = inject(NotificationService);
  private readonly errorHandler = inject(ErrorHandlerService);

  constructor() {
    // Escuchar cambios en los resultados y disparar notificaciones automáticamente
    effect(() => {
      const createdBrand = this.createdBrand();
      if (createdBrand) {
        this.handleSuccess('Marca creada exitosamente');
      }

      const updatedBrand = this.updatedBrand();
      if (updatedBrand) {
        this.handleSuccess('Marca actualizada exitosamente');
      }

      const createError = this.createError();
      if (createError) {
        this.handleError(createError);
      }

      const updateError = this.updateError();
      if (updateError) {
        this.handleError(updateError);
      }
    });
  }

  // -- State (Exposed as signals) --
  public readonly brands = computed(() => this.service.searchedBrands);
  public readonly totalItems = computed(() => this.service.searchedBrandsCount);
  public readonly isLoading = computed(() => this.service.isSearchingBrands);
  public readonly hasError = computed(() => !!this.service.searchError);

  public readonly isSaving = computed(
    () => this.service.isCreatingBrand || this.service.isUpdatingBrand,
  );

  public readonly createdBrand = computed(() => this.service.createdBrand);
  public readonly updatedBrand = computed(() => this.service.updatedBrand);
  public readonly createError = computed(() => this.service.createError);
  public readonly updateError = computed(() => this.service.updateError);

  // -- Actions --

  public searchBrands(page: number, pageSize: number, name?: string): void {
    this.service.searchBrands(page, pageSize, name);
  }

  public createBrand(data: IBrandData): void {
    this.service.createBrand(data);
  }

  public updateBrand(id: string, data: IBrandData): void {
    this.service.updateBrand(id, data);
  }

  public resetTriggers(): void {
    this.service.resetCreateTrigger();
    this.service.resetUpdateTrigger();
  }

  public handleSuccess(message: string): void {
    this.notificationService.success(message);
  }

  public handleError(error: unknown): void {
    const formattedError = this.errorHandler.formatErrorResponse(error);
    this.notificationService.showError(formattedError);
  }
}
