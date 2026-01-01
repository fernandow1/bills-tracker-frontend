import { Injectable, signal, resource, inject } from '@angular/core';
import { ConfigService } from '@core/services/config.service';
import { AuthService } from '@features/auth/services/auth.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { AuthFetchHelper } from '@core/utils/auth-fetch.helper';
import { IShopData } from '@features/shop/interfaces/shop-data.interface';
import { IShopResponse } from '@features/shop/interfaces/shop-response.interface';
import { Pagination } from '@core/interfaces/pagination.interface';
import { createFilter, buildFilterParams } from '@core/utils/filter-builder.helper';
import { FilterOperator } from '@core/utils/filter-operators.types';

@Injectable({
  providedIn: 'root',
})
export class ShopService {
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

  // Signal para controlar cuándo crear una tienda
  private createShopTrigger = signal<IShopData | null>(null);

  // Signal para controlar cuándo actualizar una tienda
  private updateShopTrigger = signal<{ id: string; data: IShopData } | null>(null);

  // Signal para controlar la búsqueda de tiendas con filtros y paginación
  private searchShopsTrigger = signal<{
    page: number;
    pageSize: number;
    filters?: { name?: string; description?: string; ids?: number[] };
  } | null>(null);

  // Resource para búsqueda de tiendas con paginación y filtros
  public searchShopsResource = resource({
    loader: async () => {
      const searchParams = this.searchShopsTrigger();

      if (!searchParams) {
        return null;
      }

      const params = buildFilterParams([]);

      // Agregar parámetros de paginación
      params['page'] = searchParams.page.toString();
      params['pageSize'] = searchParams.pageSize.toString();

      // Agregar filtros si existen
      const filters = [];
      if (searchParams.filters?.name) {
        filters.push(createFilter('name', searchParams.filters.name, FilterOperator.LIKE));
      }
      if (searchParams.filters?.description) {
        filters.push(
          createFilter('description', searchParams.filters.description, FilterOperator.LIKE)
        );
      }
      if (searchParams.filters?.ids !== undefined && searchParams.filters.ids.length > 0) {
        filters.push(createFilter('id', searchParams.filters.ids, FilterOperator.IN));
      }

      // Reconstruir params con filtros
      const finalParams = buildFilterParams(filters);
      finalParams['page'] = searchParams.page.toString();
      finalParams['pageSize'] = searchParams.pageSize.toString();

      const queryString = new URLSearchParams(finalParams).toString();
      const url = `${this.configService.buildApiUrl(
        this.configService.shopEndpoints.search
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

      return (await response.json()) as Pagination<IShopResponse>;
    },
  });

  // Resource para crear tienda (POST) - con trigger para evitar carga inicial
  public createShopResource = resource({
    loader: async () => {
      const shopData = this.createShopTrigger();

      if (!shopData) {
        return null;
      }

      const response = await this.authFetch.fetch(
        this.configService.buildApiUrl(this.configService.shopEndpoints.create),
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(shopData),
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

      return (await response.json()) as IShopResponse;
    },
  });

  // Resource para actualizar tienda (PUT) - con trigger para evitar carga inicial
  public updateShopResource = resource({
    loader: async () => {
      const updateData = this.updateShopTrigger();

      if (!updateData) {
        return null;
      }

      const response = await this.authFetch.fetch(
        this.configService.buildApiUrl(
          this.configService.shopEndpoints.update.replace(':id', updateData.id)
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

      return (await response.json()) as IShopResponse;
    },
  });

  /**
   * Crea una nueva tienda
   * @param shopData Datos de la tienda a crear
   */
  public createShop(shopData: IShopData): void {
    this.createShopTrigger.set(shopData);
    this.createShopResource.reload();
  }

  /**
   * Resetea el trigger para evitar llamadas no deseadas
   */
  public resetCreateTrigger(): void {
    this.createShopTrigger.set(null);
  }

  /**
   * Actualiza una tienda existente
   * @param id ID de la tienda a actualizar
   * @param shopData Datos actualizados de la tienda
   */
  public updateShop(id: string, shopData: IShopData): void {
    this.updateShopTrigger.set({ id, data: shopData });
    this.updateShopResource.reload();
  }

  /**
   * Busca tiendas con paginación y filtros
   * @param page Número de página
   * @param pageSize Tamaño de página
   * @param filters Filtros opcionales
   */
  public searchShops(
    page: number,
    pageSize: number,
    filters?: { name?: string; description?: string; ids?: number[] }
  ): void {
    this.searchShopsTrigger.set({ page, pageSize, filters });
    this.searchShopsResource.reload();
  }

  /**
   * Resetea el trigger de búsqueda
   */
  public resetSearchTrigger(): void {
    this.searchShopsTrigger.set(null);
  }

  /**
   * Obtiene las tiendas de la búsqueda
   */
  public get searchedShops(): IShopResponse[] {
    const result = this.searchShopsResource.value();
    return result?.data || [];
  }

  /**
   * Obtiene el total de tiendas en la búsqueda
   */
  public get searchedShopsCount(): number {
    const result = this.searchShopsResource.value();
    return result?.count || 0;
  }

  /**
   * Obtiene el estado de carga de la búsqueda
   */
  public get isSearchingShops(): boolean {
    return this.searchShopsResource.status() === 'loading';
  }

  /**
   * Obtiene el error de búsqueda si existe
   */
  public get searchError(): unknown {
    if (this.searchShopsTrigger() === null) {
      return null;
    }
    return this.searchShopsResource.error();
  }

  /**
   * Obtiene la tienda creada
   */
  public get createdShop(): IShopResponse | null {
    if (this.createShopTrigger() === null) {
      return null;
    }
    return this.createShopResource.value() ?? null;
  }

  /**
   * Obtiene el error de creación si existe
   */
  public get createError(): unknown {
    if (this.createShopTrigger() === null) {
      return null;
    }
    return this.createShopResource.error();
  }

  /**
   * Obtiene el estado de carga de creación
   */
  public get isCreatingShop(): boolean {
    return this.createShopResource.status() === 'loading';
  }

  /**
   * Obtiene la tienda actualizada
   */
  public get updatedShop(): IShopResponse | null {
    if (this.updateShopTrigger() === null) {
      return null;
    }
    return this.updateShopResource.value() ?? null;
  }

  /**
   * Obtiene el error de actualización si existe
   */
  public get updateError(): unknown {
    if (this.updateShopTrigger() === null) {
      return null;
    }
    return this.updateShopResource.error();
  }

  /**
   * Obtiene el estado de carga de actualización
   */
  public get isUpdatingShop(): boolean {
    return this.updateShopResource.status() === 'loading';
  }

  /**
   * Resetea el trigger de actualización
   */
  public resetUpdateTrigger(): void {
    this.updateShopTrigger.set(null);
  }
}
