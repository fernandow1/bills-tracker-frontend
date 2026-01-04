import { Injectable, signal, resource, inject } from '@angular/core';
import { ConfigService } from '@core/services/config.service';
import { AuthService } from '@features/auth/services/auth.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { AuthFetchHelper } from '@core/utils/auth-fetch.helper';
import { IBillData } from '@features/bill/interfaces/bill-data.interface';
import { IBillResponse } from '@features/bill/interfaces/bill-response.interface';
import { IBillSearchFilters } from '@features/bill/interfaces/bill-search-filters.interface';
import { Pagination } from '@core/interfaces/pagination.interface';
import { createFilter, buildFilterParams } from '@core/utils/filter-builder.helper';
import { FilterOperator } from '@core/utils/filter-operators.types';

@Injectable({
  providedIn: 'root',
})
export class BillService {
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

  // Signal para controlar cuándo crear una factura
  private createBillTrigger = signal<IBillData | null>(null);

  // Signal para controlar cuándo actualizar una factura
  private updateBillTrigger = signal<{ id: string; data: IBillData } | null>(null);

  // Signal para controlar la búsqueda de facturas con filtros y paginación
  private searchBillsTrigger = signal<{
    page: number;
    pageSize: number;
    filters?: IBillSearchFilters;
  } | null>(null);

  // Resource para búsqueda de facturas con paginación y filtros
  public searchBillsResource = resource({
    loader: async () => {
      const searchParams = this.searchBillsTrigger();

      if (!searchParams) {
        return null;
      }

      const filters = [];

      // Agregar filtros si existen
      if (searchParams.filters?.idShop) {
        filters.push(
          createFilter('idShop', searchParams.filters.idShop.toString(), FilterOperator.EQUALS)
        );
      }
      if (searchParams.filters?.idCurrency) {
        filters.push(
          createFilter(
            'idCurrency',
            searchParams.filters.idCurrency.toString(),
            FilterOperator.EQUALS
          )
        );
      }
      if (searchParams.filters?.idPaymentMethod) {
        filters.push(
          createFilter(
            'idPaymentMethod',
            searchParams.filters.idPaymentMethod.toString(),
            FilterOperator.EQUALS
          )
        );
      }
      // Construir params con filtros
      const finalParams = buildFilterParams(filters);
      finalParams['page'] = searchParams.page.toString();
      finalParams['pageSize'] = searchParams.pageSize.toString();

      const queryString = new URLSearchParams(finalParams).toString();
      const url = `${this.configService.buildApiUrl(
        this.configService.billsEndpoints.list
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

      return (await response.json()) as Pagination<IBillResponse>;
    },
  });

  // Resource para crear factura (POST)
  public createBillResource = resource({
    loader: async () => {
      const billData = this.createBillTrigger();

      if (!billData) {
        return null;
      }

      const response = await this.authFetch.fetch(
        this.configService.buildApiUrl(this.configService.billsEndpoints.create),
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(billData),
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

      const result = (await response.json()) as IBillResponse;

      return result;
    },
  });

  // Resource para actualizar factura (PUT)
  public updateBillResource = resource({
    loader: async () => {
      const updateData = this.updateBillTrigger();

      if (!updateData) {
        return null;
      }

      const response = await this.authFetch.fetch(
        this.configService.buildApiUrl(
          this.configService.billsEndpoints.update.replace(':id', updateData.id)
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

      return (await response.json()) as IBillResponse;
    },
  });

  /**
   * Crea una nueva factura
   * @param billData Datos de la factura a crear
   */
  public createBill(billData: IBillData): void {
    this.createBillTrigger.set(billData);
    this.createBillResource.reload();
  }

  /**
   * Resetea el trigger para evitar llamadas no deseadas
   */
  public resetCreateTrigger(): void {
    this.createBillTrigger.set(null);
  }

  /**
   * Actualiza una factura existente
   * @param id ID de la factura a actualizar
   * @param billData Datos actualizados de la factura
   */
  public updateBill(id: string, billData: IBillData): void {
    this.updateBillTrigger.set({ id, data: billData });
    this.updateBillResource.reload();
  }

  /**
   * Resetea el trigger de actualización
   */
  public resetUpdateTrigger(): void {
    this.updateBillTrigger.set(null);
  }

  /**
   * Busca facturas con paginación y filtros
   * @param page Número de página
   * @param pageSize Tamaño de página
   * @param filters Filtros opcionales
   */
  public searchBills(page: number, pageSize: number, filters?: IBillSearchFilters): void {
    this.searchBillsTrigger.set({ page, pageSize, filters });
  }

  /**
   * Resetea el trigger de búsqueda
   */
  public resetSearchTrigger(): void {
    this.searchBillsTrigger.set(null);
  }

  /**
   * Obtiene las facturas de la búsqueda
   */
  public get searchedBills(): IBillResponse[] {
    const result = this.searchBillsResource.value();
    return result?.data || [];
  }

  /**
   * Obtiene el total de facturas en la búsqueda
   */
  public get searchedBillsCount(): number {
    const result = this.searchBillsResource.value();
    return result?.count || 0;
  }

  /**
   * Obtiene el estado de carga de la búsqueda
   */
  public get isSearchingBills(): boolean {
    return this.searchBillsResource.status() === 'loading';
  }

  /**
   * Obtiene el error de búsqueda si existe
   */
  public get searchError(): unknown {
    if (this.searchBillsTrigger() === null) {
      return null;
    }
    return this.searchBillsResource.error();
  }

  /**
   * Obtiene la factura creada
   */
  public get createdBill(): IBillResponse | null {
    if (this.createBillTrigger() === null) {
      return null;
    }
    return this.createBillResource.value() ?? null;
  }

  /**
   * Obtiene el error de creación si existe
   */
  public get createError(): unknown {
    if (this.createBillTrigger() === null) {
      return null;
    }
    return this.createBillResource.error();
  }

  /**
   * Obtiene el estado de carga de creación
   */
  public get isCreatingBill(): boolean {
    return this.createBillResource.status() === 'loading';
  }

  /**
   * Obtiene la factura actualizada
   */
  public get updatedBill(): IBillResponse | null {
    if (this.updateBillTrigger() === null) {
      return null;
    }
    return this.updateBillResource.value() ?? null;
  }

  /**
   * Obtiene el error de actualización si existe
   */
  public get updateError(): unknown {
    if (this.updateBillTrigger() === null) {
      return null;
    }
    return this.updateBillResource.error();
  }

  /**
   * Obtiene el estado de carga de actualización
   */
  public get isUpdatingBill(): boolean {
    return this.updateBillResource.status() === 'loading';
  }

  /**
   * Obtiene una factura por ID
   */
  public async getBillById(id: string): Promise<IBillResponse> {
    const url = this.configService.buildApiUrl(
      this.configService.billsEndpoints.base.replace(':id', id)
    );

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

    return (await response.json()) as IBillResponse;
  }

  /**
   * Elimina una factura
   */
  public async deleteBill(id: string): Promise<void> {
    const url = this.configService.buildApiUrl(
      this.configService.billsEndpoints.delete.replace(':id', id)
    );

    const response = await this.authFetch.fetch(url, {
      method: 'DELETE',
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
  }
}
