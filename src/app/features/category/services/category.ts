import { Injectable, signal, resource, inject } from '@angular/core';
import { ConfigService } from '@core/services/config.service';
import { AuthService } from '@features/auth/services/auth.service';
import { AuthFetchHelper } from '@core/utils/auth-fetch.helper';
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
  private readonly authService = inject(AuthService);
  private readonly authFetch = new AuthFetchHelper(this.authService);

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

  // Signal para controlar cuándo crear una categoría
  private createCategoryTrigger = signal<ICategoryData | null>(null);

  // Signal para controlar cuándo actualizar una categoría
  private updateCategoryTrigger = signal<{ id: string; data: ICategoryData } | null>(null);

  // Signal para controlar búsqueda de categorías
  private searchCategoryTrigger = signal<string | null>(null);

  // Signal para controlar carga completa de categorías (solo para páginas de listado)
  private loadAllCategoriesTrigger = signal<boolean>(false);

  // Resource para cargar todas las categorías (solo cuando se solicite explícitamente)
  private allCategoriesResource = resource({
    loader: async () => {
      if (!this.loadAllCategoriesTrigger()) {
        return null;
      }

      const response = await this.authFetch.fetch(
        this.configService.buildApiUrl(this.configService.categoryEndpoints.list),
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

      return (await response.json()) as ICategoryResponse[];
    },
  });

  // Resource para búsqueda de categorías con filtro
  public searchCategoriesResource = resource({
    loader: async () => {
      const searchTerm = this.searchCategoryTrigger();

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

      // Agregar parámetros de paginación para el autocomplete
      params['page'] = '1';
      params['pageSize'] = '20';

      const queryString = new URLSearchParams(params).toString();
      const url = `${this.configService.buildApiUrl(
        this.configService.categoryEndpoints.search
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

      return (await response.json()) as Pagination<ICategoryResponse>;
    },
  });

  // Resource para crear categoría
  public createCategoryResource = resource({
    loader: async () => {
      const categoryData = this.createCategoryTrigger();

      if (!categoryData) {
        return null;
      }

      const response = await this.authFetch.fetch(
        this.configService.buildApiUrl(this.configService.categoryEndpoints.create),
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(categoryData),
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

      return (await response.json()) as ICategoryResponse;
    },
  });

  // Resource para actualizar categoría
  public updateCategoryResource = resource({
    loader: async () => {
      const updateData = this.updateCategoryTrigger();

      if (!updateData) {
        return null;
      }

      const response = await this.authFetch.fetch(
        this.configService.buildApiUrl(
          this.configService.categoryEndpoints.update.replace(':id', updateData.id)
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

      return (await response.json()) as ICategoryResponse;
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
  public loadAllCategories(): void {
    this.loadAllCategoriesTrigger.set(true);
    this.allCategoriesResource.reload();
  }

  /**
   * Obtiene todas las categorías
   */
  public get categories(): ICategoryResponse[] | null | undefined {
    if (!this.loadAllCategoriesTrigger()) {
      return null;
    }
    return this.allCategoriesResource.value() as ICategoryResponse[] | null | undefined;
  }

  /**
   * Obtiene el estado de carga de las categorías
   */
  public get isLoadingCategories(): boolean {
    return this.allCategoriesResource.status() === 'loading';
  }

  /**
   * Obtiene el error al cargar categorías si existe
   */
  public get categoriesError(): unknown {
    if (!this.loadAllCategoriesTrigger()) {
      return null;
    }
    return this.allCategoriesResource.error();
  }

  /**
   * Recarga la lista de categorías
   */
  public reloadCategories(): void {
    if (!this.loadAllCategoriesTrigger()) {
      this.loadAllCategoriesTrigger.set(true);
    }
    this.allCategoriesResource.reload();
  }

  /**
   * Busca categorías por nombre
   * @param searchTerm Término de búsqueda
   */
  public searchCategories(searchTerm: string): void {
    this.searchCategoryTrigger.set(searchTerm);
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
    this.searchCategoryTrigger.set(null);
  }
}
