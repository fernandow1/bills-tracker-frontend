import { httpResource } from '@angular/common/http';
import { Injectable, signal, resource } from '@angular/core';
import { ConfigService } from '@core/services/config.service';
import { ICategoryData } from '@features/category/interfaces/category-data.interface';

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

  // Resource para obtener todas las categorías
  public categoriesResource = httpResource<ICategoryResponse[]>(() =>
    this.configService.buildApiUrl(this.configService.categoryEndpoints.list)
  );

  // Resource para crear categoría
  public createCategoryResource = resource({
    loader: async () => {
      const categoryData = this.createCategoryTrigger();

      if (!categoryData) {
        return null;
      }

      const response = await fetch(
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

      const response = await fetch(
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
   * Obtiene todas las categorías
   */
  public get categories(): ICategoryResponse[] | null | undefined {
    return this.categoriesResource.value();
  }

  /**
   * Obtiene el estado de carga de las categorías
   */
  public get isLoadingCategories(): boolean {
    return this.categoriesResource.status() === 'loading';
  }

  /**
   * Obtiene el error al cargar categorías si existe
   */
  public get categoriesError(): unknown {
    return this.categoriesResource.error();
  }

  /**
   * Recarga la lista de categorías
   */
  public reloadCategories(): void {
    this.categoriesResource.reload();
  }
}
