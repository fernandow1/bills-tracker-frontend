import { Injectable, signal, resource, inject } from '@angular/core';
import { ConfigService } from '@core/services/config.service';
import { HttpFetchAdapter } from '@core/adapters/http-fetch.adapter';
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
  private readonly http = inject(HttpFetchAdapter);

  // Signal para la subida y extracción de factura
  public extractionRequest = signal<{ file: File; metadata?: Record<string, unknown> } | null>(
    null,
  );

  // Resource para subir y extraer imagen de factura
  public extractImageResource = resource({
    loader: async ({ abortSignal }) => {
      const request = this.extractionRequest();
      if (!request) {
        return null;
      }

      const url = this.configService.buildApiUrl(this.configService.billsEndpoints.upload);
      const formData = new FormData();
      formData.append('image', request.file);

      if (request.metadata) {
        formData.append('metadata', JSON.stringify(request.metadata));
      }

      return this.http.post<unknown>(url, formData, { signal: abortSignal });
    },
  });

  // Signal para controlar la búsqueda de facturas
  private searchBillsTrigger = signal<{
    page: number;
    pageSize: number;
    filters?: IBillSearchFilters;
  } | null>(null);

  // Resource para búsqueda de facturas (usando endpoint 'list' ya que 'search' no existe)
  public searchBillsResource = resource({
    loader: async ({ abortSignal }) => {
      const searchParams = this.searchBillsTrigger();
      if (!searchParams) {
        return null;
      }

      const filters = [];
      if (searchParams.filters?.idShop) {
        filters.push(createFilter('idShop', searchParams.filters.idShop, FilterOperator.EQUALS));
      }
      if (searchParams.filters?.idCurrency) {
        filters.push(
          createFilter('idCurrency', searchParams.filters.idCurrency, FilterOperator.EQUALS),
        );
      }
      if (searchParams.filters?.idPaymentMethod) {
        filters.push(
          createFilter(
            'idPaymentMethod',
            searchParams.filters.idPaymentMethod,
            FilterOperator.EQUALS,
          ),
        );
      }
      if (searchParams.filters?.total) {
        filters.push(createFilter('total', searchParams.filters.total, FilterOperator.EQUALS));
      }
      if (searchParams.filters?.idProduct) {
        filters.push(
          createFilter('idProduct', searchParams.filters.idProduct, FilterOperator.EQUALS),
        );
      }

      const params = buildFilterParams(filters);
      params['page'] = searchParams.page.toString();
      params['pageSize'] = searchParams.pageSize.toString();

      const queryString = new URLSearchParams(params).toString();
      const url = `${this.configService.buildApiUrl(this.configService.billsEndpoints.list)}?${queryString}`;

      return this.http.get<Pagination<IBillResponse>>(url, { signal: abortSignal });
    },
  });

  // Signal para controlar cuándo crear una factura
  private createBillTrigger = signal<IBillData | null>(null);

  // Resource para crear factura (POST)
  public createBillResource = resource({
    loader: async ({ abortSignal }) => {
      const billData = this.createBillTrigger();
      if (!billData) {
        return null;
      }

      const url = this.configService.buildApiUrl(this.configService.billsEndpoints.create);
      return this.http.post<IBillResponse>(url, billData, { signal: abortSignal });
    },
  });

  // Signal para controlar cuándo actualizar una factura
  private updateBillTrigger = signal<{ id: string | number; data: IBillData } | null>(null);

  // Resource para actualizar factura (PUT)
  public updateBillResource = resource({
    loader: async ({ abortSignal }) => {
      const updateData = this.updateBillTrigger();
      if (!updateData) {
        return null;
      }

      const url = this.configService.buildApiUrl(
        this.configService.billsEndpoints.update.replace(':id', String(updateData.id)),
      );
      return this.http.put<IBillResponse>(url, updateData.data, { signal: abortSignal });
    },
  });

  /**
   * Inicia la extracción de datos desde una imagen
   * @param file Archivo de imagen de la factura
   * @param metadata Metadatos adicionales
   */
  public uploadBillImage(file: File, metadata?: Record<string, unknown>): void {
    this.extractionRequest.set({ file, metadata });
    this.extractImageResource.reload();
  }

  /**
   * Cancela la extracción en progreso
   */
  public cancelExtraction(): void {
    this.extractionRequest.set(null);
  }

  /**
   * Busca facturas con paginación y filtros
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
   * Obtiene las facturas encontradas
   */
  public get searchedBills(): IBillResponse[] {
    return this.searchBillsResource.value()?.data || [];
  }

  /**
   * Obtiene el total de facturas encontradas
   */
  public get searchedBillsCount(): number {
    return this.searchBillsResource.value()?.count || 0;
  }

  /**
   * Obtiene el estado de carga de la búsqueda
   */
  public get isSearchingBills(): boolean {
    return this.searchBillsResource.status() === 'loading';
  }

  /**
   * Obtiene el error de búsqueda
   */
  public get searchError(): unknown {
    return this.searchBillsResource.error() ?? null;
  }

  /**
   * Crea una nueva factura
   */
  public createBill(billData: IBillData): void {
    this.createBillTrigger.set(billData);
    this.createBillResource.reload();
  }

  /**
   * Resetea el trigger de creación
   */
  public resetCreateTrigger(): void {
    this.createBillTrigger.set(null);
  }

  /**
   * Actualiza una factura existente
   */
  public updateBill(id: string | number, billData: IBillData): void {
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
   * Obtiene el estado de creación
   */
  public get isCreatingBill(): boolean {
    return this.createBillResource.status() === 'loading';
  }

  /**
   * Obtiene el error de creación
   */
  public get createError(): unknown {
    if (this.createBillTrigger() === null) {
      return null;
    }
    return this.createBillResource.error();
  }

  /**
   * Obtiene la factura creada
   */
  public get createdBill(): IBillResponse | null | undefined {
    if (this.createBillTrigger() === null) {
      return null;
    }
    return this.createBillResource.value();
  }

  /**
   * Obtiene el estado de actualización
   */
  public get isUpdatingBill(): boolean {
    return this.updateBillResource.status() === 'loading';
  }

  /**
   * Obtiene el error de actualización
   */
  public get updateError(): unknown {
    if (this.updateBillTrigger() === null) {
      return null;
    }
    return this.updateBillResource.error();
  }

  /**
   * Obtiene la factura actualizada
   */
  public get updatedBill(): IBillResponse | null | undefined {
    if (this.updateBillTrigger() === null) {
      return null;
    }
    return this.updateBillResource.value();
  }

  /**
   * Elimina una factura
   */
  public async deleteBill(id: string | number): Promise<void> {
    const url = this.configService.buildApiUrl(
      this.configService.billsEndpoints.delete.replace(':id', String(id)),
    );
    await this.http.delete<void>(url);
    this.searchBillsResource.reload();
  }
}
