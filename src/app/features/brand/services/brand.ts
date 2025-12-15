import { Injectable, signal, resource } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { ConfigService } from '@core/services/config.service';
import { IBrandData } from '@features/brand/interfaces/brand-data.interface';
import { IBrandResponse } from '@features/brand/interfaces/brand-response.interface';

@Injectable({
  providedIn: 'root',
})
export class BrandService {
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

  // Signal para controlar cuándo crear una marca
  private createBrandTrigger = signal<IBrandData | null>(null);

  // Signal para controlar cuándo actualizar una marca
  private updateBrandTrigger = signal<{ id: string; data: IBrandData } | null>(null);

  // httpResource para obtener todas las marcas (GET) - más simple que resource genérico
  public brandsResource = httpResource<IBrandResponse[]>(() =>
    this.configService.buildApiUrl(this.configService.brandEndpoints.list)
  );

  // Resource para crear marca (POST) - con trigger para evitar carga inicial
  public createBrandResource = resource({
    loader: async () => {
      const brandData = this.createBrandTrigger();

      if (!brandData) {
        return null;
      }

      const response = await fetch(
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

      const response = await fetch(
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
   * Obtiene todas las marcas usando httpResource signals
   */
  public get brands(): IBrandResponse[] | null | undefined {
    return this.brandsResource.hasValue() ? this.brandsResource.value() : null;
  }

  /**
   * Obtiene el estado de carga de las marcas usando httpResource signals
   */
  public get isLoadingBrands(): boolean {
    return this.brandsResource.isLoading();
  }

  /**
   * Obtiene el error al cargar marcas si existe usando httpResource signals
   */
  public get brandsError(): unknown {
    return this.brandsResource.error();
  }

  /**
   * Recarga la lista de marcas
   */
  public reloadBrands(): void {
    this.brandsResource.reload();
  }
}
