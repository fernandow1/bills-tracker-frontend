import { Injectable, signal, resource, inject } from '@angular/core';
import { ConfigService } from '@core/services/config.service';
import { AuthService } from '@features/auth/services/auth.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { AuthFetchHelper } from '@core/utils/auth-fetch.helper';
import { IProductData } from '@features/product/interfaces/product-data.interface';
import { IProductResponse } from '@features/product/interfaces/product-response.interface';
import { Pagination } from '@core/interfaces/pagination.interface';
import { createFilter, buildFilterParams } from '@core/utils/filter-builder.helper';
import { FilterOperator } from '@core/utils/filter-operators.types';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
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

  // Signal para controlar cuándo crear un producto
  private createProductTrigger = signal<IProductData | null>(null);

  // Signal para controlar cuándo actualizar un producto
  private updateProductTrigger = signal<{ id: string; data: IProductData } | null>(null);

  // Signal para controlar la búsqueda de productos con filtros y paginación
  private searchProductsTrigger = signal<{
    page: number;
    pageSize: number;
    filters?: {
      name?: string;
      description?: string;
      idBrand?: number;
      idCategory?: number;
      ids?: number[];
    };
  } | null>(null);

  // Resource para búsqueda de productos con paginación y filtros
  public searchProductsResource = resource({
    loader: async () => {
      const searchParams = this.searchProductsTrigger();

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
      if (searchParams.filters?.idBrand !== undefined) {
        filters.push(createFilter('idBrand', searchParams.filters.idBrand, FilterOperator.EQUALS));
      }
      if (searchParams.filters?.idCategory !== undefined) {
        filters.push(
          createFilter('idCategory', searchParams.filters.idCategory, FilterOperator.EQUALS)
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
        this.configService.productEndpoints.search
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

      return (await response.json()) as Pagination<IProductResponse>;
    },
  });

  // Resource para crear producto (POST) - con trigger para evitar carga inicial
  public createProductResource = resource({
    loader: async () => {
      const productData = this.createProductTrigger();

      if (!productData) {
        return null;
      }

      const response = await this.authFetch.fetch(
        this.configService.buildApiUrl(this.configService.productEndpoints.create),
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(productData),
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

      return (await response.json()) as IProductResponse;
    },
  });

  // Resource para actualizar producto (PUT) - con trigger para evitar carga inicial
  public updateProductResource = resource({
    loader: async () => {
      const updateData = this.updateProductTrigger();

      if (!updateData) {
        return null;
      }

      const response = await this.authFetch.fetch(
        this.configService.buildApiUrl(
          this.configService.productEndpoints.update.replace(':id', updateData.id)
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

      return (await response.json()) as IProductResponse;
    },
  });

  /**
   * Crea un nuevo producto
   * @param productData Datos del producto a crear
   */
  public createProduct(productData: IProductData): void {
    this.createProductTrigger.set(productData);
    this.createProductResource.reload();
  }

  /**
   * Resetea el trigger para evitar llamadas no deseadas
   */
  public resetCreateTrigger(): void {
    this.createProductTrigger.set(null);
  }

  /**
   * Actualiza un producto existente
   * @param id ID del producto a actualizar
   * @param productData Datos actualizados del producto
   */
  public updateProduct(id: string, productData: IProductData): void {
    this.updateProductTrigger.set({ id, data: productData });
    this.updateProductResource.reload();
  }

  /**
   * Busca productos con paginación y filtros
   * @param page Número de página
   * @param pageSize Tamaño de página
   * @param filters Filtros opcionales
   */
  public searchProducts(
    page: number,
    pageSize: number,
    filters?: {
      name?: string;
      description?: string;
      idBrand?: number;
      idCategory?: number;
      ids?: number[];
    }
  ): void {
    this.searchProductsTrigger.set({ page, pageSize, filters });
    this.searchProductsResource.reload();
  }

  /**
   * Resetea el trigger de búsqueda
   */
  public resetSearchTrigger(): void {
    this.searchProductsTrigger.set(null);
  }

  /**
   * Obtiene los productos de la búsqueda
   */
  public get searchedProducts(): IProductResponse[] {
    const result = this.searchProductsResource.value();
    return result?.data || [];
  }

  /**
   * Obtiene el total de productos en la búsqueda
   */
  public get searchedProductsCount(): number {
    const result = this.searchProductsResource.value();
    return result?.count || 0;
  }

  /**
   * Obtiene el estado de carga de la búsqueda
   */
  public get isSearchingProducts(): boolean {
    return this.searchProductsResource.status() === 'loading';
  }

  /**
   * Obtiene el error de búsqueda si existe
   */
  public get searchError(): unknown {
    if (this.searchProductsTrigger() === null) {
      return null;
    }
    return this.searchProductsResource.error();
  }

  /**
   * Obtiene el producto creado
   */
  public get createdProduct(): IProductResponse | null {
    if (this.createProductTrigger() === null) {
      return null;
    }
    return this.createProductResource.value() ?? null;
  }

  /**
   * Obtiene el error de creación si existe
   */
  public get createError(): unknown {
    if (this.createProductTrigger() === null) {
      return null;
    }
    return this.createProductResource.error();
  }

  /**
   * Obtiene el estado de carga de creación
   */
  public get isCreatingProduct(): boolean {
    return this.createProductResource.status() === 'loading';
  }

  /**
   * Obtiene el producto actualizado
   */
  public get updatedProduct(): IProductResponse | null {
    if (this.updateProductTrigger() === null) {
      return null;
    }
    return this.updateProductResource.value() ?? null;
  }

  /**
   * Obtiene el error de actualización si existe
   */
  public get updateError(): unknown {
    if (this.updateProductTrigger() === null) {
      return null;
    }
    return this.updateProductResource.error();
  }

  /**
   * Obtiene el estado de carga de actualización
   */
  public get isUpdatingProduct(): boolean {
    return this.updateProductResource.status() === 'loading';
  }

  /**
   * Resetea el trigger de actualización
   */
  public resetUpdateTrigger(): void {
    this.updateProductTrigger.set(null);
  }
}
