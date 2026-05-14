import { Injectable, signal, resource, inject } from '@angular/core';
import { ConfigService } from '@core/services/config.service';
import { HttpFetchAdapter } from '@core/adapters/http-fetch.adapter';
import { ICategoryData } from '@features/category/interfaces/category-data.interface';
import { createFilter, buildFilterParams } from '@core/utils/filter-builder.helper';
import { FilterOperator } from '@core/utils/filter-operators.types';
import { Pagination } from '@core/interfaces/pagination.interface';

export interface ICategoryResponse extends ICategoryData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly configService = new ConfigService();
  private readonly http = inject(HttpFetchAdapter);

  // Signal para controlar cuándo crear una categoría
  private createCategoryTrigger = signal<ICategoryData | null>(null);

  // Signal para controlar cuándo actualizar una categoría
  private updateCategoryTrigger = signal<{ id: string; data: ICategoryData } | null>(null);

  // Signal para controlar carga completa de categorías (solo para páginas de listado)
  private searchCategoriesTrigger = signal<{
    page: number;
    pageSize: number;
    filters?: { name?: string };
  } | null>(null);

  // Resource para búsqueda de categorías con filtro
  public searchCategoriesResource = resource({
    loader: async ({ abortSignal }) => {
      const searchTerm = this.searchCategoriesTrigger();

      if (searchTerm === null) {
        return null;
      }

      const filters = [];

      // Si el término está vacío, retornar null
      if (searchTerm.filters?.name) {
        filters.push(createFilter('name', searchTerm.filters.name, FilterOperator.LIKE));
      }

      // Construir filtro usando los helpers
      const params = buildFilterParams(filters);

      // Agregar parámetros de paginación para el autocomplete
      params['page'] = searchTerm.page.toString();
      params['pageSize'] = searchTerm.pageSize.toString();

      const queryString = new URLSearchParams(params).toString();
      const url = `${this.configService.buildApiUrl(
        this.configService.categoryEndpoints.search,
      )}?${queryString}`;

      return this.http.get<Pagination<ICategoryResponse>>(url, { signal: abortSignal });
    },
  });

  // Resource para crear categoría
  public createCategoryResource = resource({
    loader: async ({ abortSignal }) => {
      const categoryData = this.createCategoryTrigger();

      if (!categoryData) {
        return null;
      }

      const url = this.configService.buildApiUrl(this.configService.categoryEndpoints.create);
      return this.http.post<ICategoryResponse>(url, categoryData, { signal: abortSignal });
    },
  });

  // Resource para actualizar categoría
  public updateCategoryResource = resource({
    loader: async ({ abortSignal }) => {
      const updateData = this.updateCategoryTrigger();

      if (!updateData) {
        return null;
      }

      const url = this.configService.buildApiUrl(
        this.configService.categoryEndpoints.update.replace(':id', updateData.id),
      );
      return this.http.put<ICategoryResponse>(url, updateData.data, { signal: abortSignal });
    },
  });

  /**
   * Crea una nueva categoría
   * @param categoryData Datos de la categoría a crear
   */
  public createCategory(categoryData: ICategoryData): void {
    this.createCategoryTrigger.set(categoryData);
    this.createCategoryResource.reload();
  }

  /**
   * Resetea el trigger para evitar llamadas no deseadas
   */
  public resetCreateTrigger(): void {
    this.createCategoryTrigger.set(null);
  }

  /**
   * Actualiza una categoría existente
   * @param id ID de la categoría a actualizar
   * @param categoryData Datos actualizados de la categoría
   */
  public updateCategory(id: string, categoryData: ICategoryData): void {
    this.updateCategoryTrigger.set({ id, data: categoryData });
    this.updateCategoryResource.reload();
  }

  /**
   * Resetea el trigger de actualización
   */
  public resetUpdateTrigger(): void {
    this.updateCategoryTrigger.set(null);
  }

  /**
   * Obtiene las categorías encontradas en la búsqueda
   */
  public get searchedCategories(): ICategoryResponse[] {
    const result = this.searchCategoriesResource.value();
    return result?.data || [];
  }

  /**
   * Obtiene el total de categorías en la búsqueda
   */
  public get searchedCategoriesCount(): number {
    const result = this.searchCategoriesResource.value();
    return result?.count || 0;
  }

  /**
   * Obtiene el estado del resource de creación
   */
  public get isCreatingCategory(): boolean {
    return this.createCategoryResource.status() === 'loading';
  }

  /**
   * Obtiene el error si existe
   */
  public get createError(): unknown {
    // Solo retornar el error si el trigger está activo
    if (this.createCategoryTrigger() === null) {
      return null;
    }

    return this.createCategoryResource.error();
  }

  /**
   * Obtiene la categoría creada
   */
  public get createdCategory(): ICategoryResponse | null | undefined {
    // Solo retornar el valor si el trigger está activo
    if (this.createCategoryTrigger() === null) {
      return null;
    }
    return this.createCategoryResource.value() as ICategoryResponse | null | undefined;
  }

  /**
   * Obtiene el estado del resource de actualización
   */
  public get isUpdatingCategory(): boolean {
    return this.updateCategoryResource.status() === 'loading';
  }

  /**
   * Obtiene el error de actualización si existe
   */
  public get updateError(): unknown {
    // Solo retornar el error si el trigger está activo
    if (this.updateCategoryTrigger() === null) {
      return null;
    }
    return this.updateCategoryResource.error();
  }

  /**
   * Obtiene la categoría actualizada
   */
  public get updatedCategory(): ICategoryResponse | null | undefined {
    // Solo retornar el valor si el trigger está activo
    if (this.updateCategoryTrigger() === null) {
      return null;
    }
    return this.updateCategoryResource.value() as ICategoryResponse | null | undefined;
  }

  /**
   * Carga todas las categorías (para páginas de listado)
   */
  public loadCategories(page: number, pageSize: number): void {
    this.searchCategoriesTrigger.set({ page, pageSize });
    this.searchCategoriesResource.reload();
  }

  /**
   * Obtiene todas las categorías
   */
  public get categories(): Pagination<ICategoryResponse> | null | undefined {
    if (!this.searchCategoriesTrigger()) {
      return null;
    }
    return this.searchCategoriesResource.value() as
      | Pagination<ICategoryResponse>
      | null
      | undefined;
  }

  /**
   * Obtiene el estado de carga de las categorías
   */
  public get isLoadingCategories(): boolean {
    return this.searchCategoriesResource.status() === 'loading';
  }

  /**
   * Obtiene el error al cargar categorías si existe
   */
  public get categoriesError(): unknown {
    if (!this.searchCategoriesTrigger()) {
      return null;
    }
    return this.searchCategoriesResource.error();
  }

  /**
   * Recarga la lista de categorías
   */
  public reloadCategories(): void {
    if (!this.searchCategoriesTrigger()) {
      this.searchCategoriesTrigger.set({ page: 1, pageSize: 10 });
    }
    this.searchCategoriesResource.reload();
  }

  /**
   * Busca categorías por nombre
   * @param searchTerm Término de búsqueda
   */
  public searchCategories(searchTerm: string): void {
    this.searchCategoriesTrigger.set({ page: 1, pageSize: 20, filters: { name: searchTerm } });
    this.searchCategoriesResource.reload();
  }

  /**
   * Obtiene el estado de carga de la búsqueda
   */
  public get isSearchingCategories(): boolean {
    return this.searchCategoriesResource.status() === 'loading';
  }

  /**
   * Resetea el trigger de búsqueda
   */
  public resetSearchTrigger(): void {
    this.searchCategoriesTrigger.set(null);
  }
}
