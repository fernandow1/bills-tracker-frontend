import { Injectable, signal, resource, inject } from '@angular/core';
import { ConfigService } from '@core/services/config.service';
import { HttpFetchAdapter } from '@core/adapters/http-fetch.adapter';
import { IBrandData } from '@features/brand/interfaces/brand-data.interface';
import { IBrandResponse } from '@features/brand/interfaces/brand-response.interface';
import { createFilter, buildFilterParams } from '@core/utils/filter-builder.helper';
import { FilterOperator } from '@core/utils/filter-operators.types';
import { Pagination, SearchParams } from '@core/interfaces';

@Injectable({
  providedIn: 'root',
})
export class BrandService {
  private readonly configService = new ConfigService();
  private readonly http = inject(HttpFetchAdapter);

  // Signal para controlar cuándo crear una marca
  private createBrandTrigger = signal<IBrandData | null>(null);

  // Signal para controlar cuándo actualizar una marca
  private updateBrandTrigger = signal<{ id: string; data: IBrandData } | null>(null);

  // Signal para controlar búsqueda de marcas con paginación
  private searchBrandTrigger = signal<SearchParams<{ name?: string }> | null>(null);

  // Resource para búsqueda de marcas con paginación y filtro
  public searchBrandsResource = resource({
    loader: async ({ abortSignal }) => {
      const searchParams = this.searchBrandTrigger();

      if (!searchParams) {
        return null;
      }

      const filters = [];

      // Agregar filtro de nombre si existe
      if (searchParams.filters?.name) {
        filters.push(createFilter('name', searchParams.filters.name, FilterOperator.LIKE));
      }

      // Construir params con filtros
      const finalParams = buildFilterParams(filters);
      finalParams['page'] = searchParams.page.toString();
      finalParams['pageSize'] = searchParams.pageSize.toString();

      const queryString = new URLSearchParams(finalParams).toString();
      const url = `${this.configService.buildApiUrl(
        this.configService.brandEndpoints.search,
      )}?${queryString}`;

      return this.http.get<Pagination<IBrandResponse>>(url, { signal: abortSignal });
    },
  });

  // Resource para crear marca (POST) - con trigger para evitar carga inicial
  public createBrandResource = resource({
    loader: async ({ abortSignal }) => {
      const brandData = this.createBrandTrigger();

      if (!brandData) {
        return null;
      }

      const url = this.configService.buildApiUrl(this.configService.brandEndpoints.create);
      return this.http.post<IBrandResponse>(url, brandData, { signal: abortSignal });
    },
  });

  // Resource para actualizar marca (PUT) - con trigger para evitar carga inicial
  public updateBrandResource = resource({
    loader: async ({ abortSignal }) => {
      const updateData = this.updateBrandTrigger();

      if (!updateData) {
        return null;
      }

      const url = this.configService.buildApiUrl(
        this.configService.brandEndpoints.update.replace(':id', updateData.id),
      );
      return this.http.put<IBrandResponse>(url, updateData.data, { signal: abortSignal });
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
   * Busca marcas con paginación y filtro opcional por nombre
   * @param page Número de página
   * @param pageSize Tamaño de página
   * @param name Filtro opcional por nombre
   */
  public searchBrands(page: number, pageSize: number, name?: string): void {
    this.searchBrandTrigger.set({
      page,
      pageSize,
      filters: name ? { name } : undefined,
    });
    this.searchBrandsResource.reload();
  }

  /**
   * Obtiene el estado de carga de la búsqueda
   */
  public get isSearchingBrands(): boolean {
    return this.searchBrandsResource.status() === 'loading';
  }

  /**
   * Obtiene el error de búsqueda si existe
   */
  public get searchError(): unknown {
    if (this.searchBrandTrigger() === null) {
      return null;
    }
    return this.searchBrandsResource.error();
  }

  /**
   * Resetea el trigger de búsqueda
   */
  public resetSearchTrigger(): void {
    this.searchBrandTrigger.set(null);
  }
}
