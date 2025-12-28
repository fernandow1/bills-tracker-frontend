import { Injectable, signal, resource, inject } from '@angular/core';
import { ConfigService } from '@core/services/config.service';
import { AuthService } from '@features/auth/services/auth.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { AuthFetchHelper } from '@core/utils/auth-fetch.helper';
import { ICurrencyData } from '@features/currency/interfaces/currency-data.interface';
import { ICurrencyResponse } from '@features/currency/interfaces/currency-response.interface';

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
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

  // Signal para controlar cuándo crear una moneda
  private createCurrencyTrigger = signal<ICurrencyData | null>(null);

  // Signal para controlar cuándo actualizar una moneda
  private updateCurrencyTrigger = signal<{ id: string; data: ICurrencyData } | null>(null);

  // Signal para controlar carga completa de monedas
  private loadAllCurrenciesTrigger = signal<boolean>(false);

  // Resource para cargar todas las monedas
  private allCurrenciesResource = resource({
    loader: async () => {
      if (!this.loadAllCurrenciesTrigger()) {
        return null;
      }

      const response = await this.authFetch.fetch(
        this.configService.buildApiUrl(this.configService.currencyEndpoints.list),
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

      return (await response.json()) as ICurrencyResponse[];
    },
  });

  // Resource para crear moneda (POST)
  public createCurrencyResource = resource({
    loader: async () => {
      const currencyData = this.createCurrencyTrigger();

      if (!currencyData) {
        return null;
      }

      const response = await this.authFetch.fetch(
        this.configService.buildApiUrl(this.configService.currencyEndpoints.create),
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(currencyData),
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

      return (await response.json()) as ICurrencyResponse;
    },
  });

  // Resource para actualizar moneda (PUT)
  public updateCurrencyResource = resource({
    loader: async () => {
      const updateData = this.updateCurrencyTrigger();

      if (!updateData) {
        return null;
      }

      const response = await this.authFetch.fetch(
        this.configService.buildApiUrl(
          this.configService.currencyEndpoints.update.replace(':id', updateData.id)
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

      return (await response.json()) as ICurrencyResponse;
    },
  });

  /**
   * Crea una nueva moneda
   * @param currencyData Datos de la moneda a crear
   */
  public createCurrency(currencyData: ICurrencyData): void {
    this.createCurrencyTrigger.set(currencyData);
    this.createCurrencyResource.reload();
  }

  /**
   * Resetea el trigger de creación
   */
  public resetCreateTrigger(): void {
    this.createCurrencyTrigger.set(null);
  }

  /**
   * Actualiza una moneda existente
   * @param id ID de la moneda a actualizar
   * @param currencyData Datos actualizados de la moneda
   */
  public updateCurrency(id: string, currencyData: ICurrencyData): void {
    this.updateCurrencyTrigger.set({ id, data: currencyData });
    this.updateCurrencyResource.reload();
  }

  /**
   * Resetea el trigger de actualización
   */
  public resetUpdateTrigger(): void {
    this.updateCurrencyTrigger.set(null);
  }

  /**
   * Carga todas las monedas
   */
  public loadAllCurrencies(): void {
    this.loadAllCurrenciesTrigger.set(true);
    this.allCurrenciesResource.reload();
  }

  /**
   * Obtiene todas las monedas
   */
  public get currencies(): ICurrencyResponse[] | null | undefined {
    if (!this.loadAllCurrenciesTrigger()) {
      return null;
    }
    return this.allCurrenciesResource.value() as ICurrencyResponse[] | null | undefined;
  }

  /**
   * Obtiene el estado de carga de las monedas
   */
  public get isLoadingCurrencies(): boolean {
    return this.allCurrenciesResource.status() === 'loading';
  }

  /**
   * Obtiene el error al cargar monedas si existe
   */
  public get currenciesError(): unknown {
    if (!this.loadAllCurrenciesTrigger()) {
      return null;
    }
    return this.allCurrenciesResource.error();
  }

  /**
   * Recarga la lista de monedas
   */
  public reloadCurrencies(): void {
    if (!this.loadAllCurrenciesTrigger()) {
      this.loadAllCurrenciesTrigger.set(true);
    }
    this.allCurrenciesResource.reload();
  }

  /**
   * Obtiene la moneda creada
   */
  public get createdCurrency(): ICurrencyResponse | null {
    if (this.createCurrencyTrigger() === null) {
      return null;
    }
    return this.createCurrencyResource.value() ?? null;
  }

  /**
   * Obtiene el error de creación si existe
   */
  public get createError(): unknown {
    if (this.createCurrencyTrigger() === null) {
      return null;
    }
    return this.createCurrencyResource.error();
  }

  /**
   * Obtiene el estado de carga de creación
   */
  public get isCreatingCurrency(): boolean {
    return this.createCurrencyResource.status() === 'loading';
  }

  /**
   * Obtiene la moneda actualizada
   */
  public get updatedCurrency(): ICurrencyResponse | null {
    if (this.updateCurrencyTrigger() === null) {
      return null;
    }
    return this.updateCurrencyResource.value() ?? null;
  }

  /**
   * Obtiene el error de actualización si existe
   */
  public get updateError(): unknown {
    if (this.updateCurrencyTrigger() === null) {
      return null;
    }
    return this.updateCurrencyResource.error();
  }

  /**
   * Obtiene el estado de carga de actualización
   */
  public get isUpdatingCurrency(): boolean {
    return this.updateCurrencyResource.status() === 'loading';
  }
}
