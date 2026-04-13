import { Signal } from '@angular/core';
import { IBrandResponse } from './brand-response.interface';
import { IBrandData } from './brand-data.interface';

/**
 * Contrato para el Facade de Marcas
 */
export interface IBrandFacade {
  // -- State --
  readonly brands: Signal<IBrandResponse[]>;
  readonly totalItems: Signal<number>;
  readonly isLoading: Signal<boolean>;
  readonly hasError: Signal<boolean>;
  readonly isSaving: Signal<boolean>;
  readonly createdBrand: Signal<IBrandResponse | null | undefined>;
  readonly updatedBrand: Signal<IBrandResponse | null | undefined>;
  readonly createError: Signal<unknown>;
  readonly updateError: Signal<unknown>;

  // -- Actions --
  searchBrands(page: number, pageSize: number, name?: string): void;
  createBrand(data: IBrandData): void;
  updateBrand(id: string, data: IBrandData): void;
  resetTriggers(): void;
  handleSuccess(message: string): void;
  handleError(error: unknown): void;
}
