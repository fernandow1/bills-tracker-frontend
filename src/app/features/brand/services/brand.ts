import { Injectable, signal, resource, inject } from '@angular/core';
import { ConfigService } from '@core/services/config.service';
import { AuthService } from '@features/auth/services/auth.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { AuthFetchHelper } from '@core/utils/auth-fetch.helper';
import { IBrandData } from '@features/brand/interfaces/brand-data.interface';
import { IBrandResponse } from '@features/brand/interfaces/brand-response.interface';
import { createFilter, buildFilterParams } from '@core/utils/filter-builder.helper';
import { FilterOperator } from '@core/utils/filter-operators.types';
import { Pagination } from '@core/interfaces/pagination.interface';

@Injectable({
  providedIn: 'root',
})
export class BrandService {
  private readonly configService = new ConfigService();
  private readonly authService = inject(AuthService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly authFetch = new AuthFetchHelper(this.authService, this.errorHandler);

  /**
   * Obtiene los headers con autenticación para fetch
   */
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem(this.configService.authConfig.tokenKey);
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Signal para controlar cuándo crear una marca
  private createBrandTrigger = signal<IBrandData | null>(null);

  // Signal para controlar cuándo actualizar una marca
  private updateBrandTrigger = signal<{ id: string; data: IBrandData } | null>(null);

  // Signal para controlar búsqueda de marcas
  private searchBrandTrigger = signal<string | null>(null);

  // Signal para controlar carga completa de marcas (solo para páginas de listado)
  private loadAllBrandsTrigger = signal<boolean>(false);

  // Resource para cargar todas las marcas (solo cuando se solicite explícitamente)
  private allBrandsResource = resource({
    loader: async () => {
      if (!this.loadAllBrandsTrigger()) {
        return null;
      }

      const response = await this.authFetch.fetch(
        this.configService.buildApiUrl(this.configService.brandEndpoints.list),
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error de red' }));
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        Object.assign(error, {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw error;
      }

      return (await response.json()) as IBrandResponse[];
    },
  });

  // Resource para búsqueda de marcas con filtro
  public searchBrandsResource = resource({
    loader: async () => {
      const searchTerm = this.searchBrandTrigger();

      if (searchTerm === null) {
        return null;
      }

      // Si el término está vacío, retornar null
      if (searchTerm.trim() === '') {
        return null;
      }

      // Construir filtro usando los helpers
      const filter = createFilter('name', searchTerm, FilterOperator.LIKE);
      const params = buildFilterParams([filter]);

      params['page'] = '1';
      params['pageSize'] = '20';

      const queryString = new URLSearchParams(params).toString();
      const url = `${this.configService.buildApiUrl(
        this.configService.brandEndpoints.search
      )}?${queryString}`;

      const response = await this.authFetch.fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error de red' }));
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        Object.assign(error, {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw error;
      }

      return (await response.json()) as Pagination<IBrandResponse>;
    },
  });

  // Resource para crear marca (POST) - con trigger para evitar carga inicial
  public createBrandResource = resource({
    loader: async () => {
      const brandData = this.createBrandTrigger();

      if (!brandData) {
        return null;
      }

      const response = await this.authFetch.fetch(
        this.configService.buildApiUrl(this.configService.brandEndpoints.create),
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(brandData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error de red' }));
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        Object.assign(error, {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw error;
      }

      return (await response.json()) as IBrandResponse;
    },
  });

  // Resource para actualizar marca (PUT) - con trigger para evitar carga inicial
  public updateBrandResource = resource({
    loader: async () => {
      const updateData = this.updateBrandTrigger();

      if (!updateData) {
        return null;
      }

      const response = await this.authFetch.fetch(
        this.configService.buildApiUrl(
          this.configService.brandEndpoints.update.replace(':id', updateData.id)
        ),
        {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(updateData.data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error de red' }));
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        Object.assign(error, {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw error;
      }

      return (await response.json()) as IBrandResponse;
    },
  });

  /**
   * Crea una nueva marca
   * @param brandData Datos de la marca a crear
   */
  public createBrand(brandData: IBrandData): void {
    this.createBrandTrigger.set(brandData);
    this.createBrandResource.reload();
  }

  /**
   * Resetea el trigger para evitar llamadas no deseadas
   */
  public resetCreateTrigger(): void {
    this.createBrandTrigger.set(null);
  }

  /**
   * Actualiza una marca existente
   * @param id ID de la marca a actualizar
   * @param brandData Datos actualizados de la marca
   */
  public updateBrand(id: string, brandData: IBrandData): void {
    this.updateBrandTrigger.set({ id, data: brandData });
    this.updateBrandResource.reload();
  }

  /**
   * Resetea el trigger de actualización
   */
  public resetUpdateTrigger(): void {
    this.updateBrandTrigger.set(null);
  }

  /**
   * Obtiene las marcas encontradas en la búsqueda
   */
  public get searchedBrands(): IBrandResponse[] {
    const result = this.searchBrandsResource.value();
    return result?.data || [];
  }

  /**
   * Obtiene el total de marcas en la búsqueda
   */
  public get searchedBrandsCount(): number {
    const result = this.searchBrandsResource.value();
    return result?.count || 0;
  }

  /**
   * Obtiene el estado del resource de creación
   */
  public get isCreatingBrand(): boolean {
    return this.createBrandResource.status() === 'loading';
  }

  /**
   * Obtiene el error si existe
   */
  public get createError(): unknown {
    // Solo retornar el error si el trigger está activo
    if (this.createBrandTrigger() === null) {
      return null;
    }

    return this.createBrandResource.error();
  }

  /**
   * Obtiene la marca creada
   */
  public get createdBrand(): IBrandResponse | null | undefined {
    // Solo retornar el valor si el trigger está activo
    if (this.createBrandTrigger() === null) {
      return null;
    }
    return this.createBrandResource.value() as IBrandResponse | null | undefined;
  }

  /**
   * Obtiene el estado del resource de actualización
   */
  public get isUpdatingBrand(): boolean {
    return this.updateBrandResource.status() === 'loading';
  }

  /**
   * Obtiene el error de actualización si existe
   */
  public get updateError(): unknown {
    // Solo retornar el error si el trigger está activo
    if (this.updateBrandTrigger() === null) {
      return null;
    }
    return this.updateBrandResource.error();
  }

  /**
   * Obtiene la marca actualizada
   */
  public get updatedBrand(): IBrandResponse | null | undefined {
    // Solo retornar el valor si el trigger está activo
    if (this.updateBrandTrigger() === null) {
      return null;
    }
    return this.updateBrandResource.value() as IBrandResponse | null | undefined;
  }

  /**
   * Carga todas las marcas (para páginas de listado)
   */
  public loadAllBrands(): void {
    this.loadAllBrandsTrigger.set(true);
    this.allBrandsResource.reload();
  }

  /**
   * Obtiene todas las marcas
   */
  public get brands(): IBrandResponse[] | null | undefined {
    if (!this.loadAllBrandsTrigger()) {
      return null;
    }
    return this.allBrandsResource.value() as IBrandResponse[] | null | undefined;
  }

  /**
   * Obtiene el estado de carga de las marcas
   */
  public get isLoadingBrands(): boolean {
    return this.allBrandsResource.status() === 'loading';
  }

  /**
   * Obtiene el error al cargar marcas si existe
   */
  public get brandsError(): unknown {
    if (!this.loadAllBrandsTrigger()) {
      return null;
    }
    return this.allBrandsResource.error();
  }

  /**
   * Recarga la lista de marcas
   */
  public reloadBrands(): void {
    if (!this.loadAllBrandsTrigger()) {
      this.loadAllBrandsTrigger.set(true);
    }
    this.allBrandsResource.reload();
  }

  /**
   * Busca marcas por nombre
   * @param searchTerm Término de búsqueda
   */
  public searchBrands(searchTerm: string): void {
    this.searchBrandTrigger.set(searchTerm);
    this.searchBrandsResource.reload();
  }

  /**
   * Obtiene el estado de carga de la búsqueda
   */
  public get isSearchingBrands(): boolean {
    return this.searchBrandsResource.status() === 'loading';
  }

  /**
   * Resetea el trigger de búsqueda
   */
  public resetSearchTrigger(): void {
    this.searchBrandTrigger.set(null);
  }
}
