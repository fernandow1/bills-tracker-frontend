import { Injectable, signal, resource, inject } from '@angular/core';
import { ConfigService } from '@core/services/config.service';
import { AuthService } from '@features/auth/services/auth.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { AuthFetchHelper } from '@core/utils/auth-fetch.helper';
import { IPaymentMethodData } from '@features/payment-method/interfaces/payment-method-data.interface';
import { IPaymentMethodResponse } from '@features/payment-method/interfaces/payment-method-response.interface';

@Injectable({
  providedIn: 'root',
})
export class PaymentMethodService {
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

  // Signal para controlar carga completa de métodos de pago
  private loadAllPaymentMethodsTrigger = signal<boolean>(false);

  // Resource para cargar todos los métodos de pago
  private allPaymentMethodsResource = resource({
    loader: async () => {
      if (!this.loadAllPaymentMethodsTrigger()) {
        return null;
      }

      const response = await this.authFetch.fetch(
        this.configService.buildApiUrl(this.configService.paymentMethodEndpoints.list),
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

      return (await response.json()) as IPaymentMethodResponse[];
    },
  });

  /**
   * Método público para disparar la carga de todos los métodos de pago
   */
  public loadAllPaymentMethods(): void {
    this.loadAllPaymentMethodsTrigger.set(true);
  }

  /**
   * Obtiene la lista completa de métodos de pago desde el resource
   */
  public get paymentMethods(): IPaymentMethodResponse[] | null | undefined {
    if (!this.loadAllPaymentMethodsTrigger()) {
      return null;
    }
    return this.allPaymentMethodsResource.value() as IPaymentMethodResponse[] | null | undefined;
  }

  /**
   * Obtiene el estado de carga de los métodos de pago
   */
  public get isLoadingPaymentMethods(): boolean {
    return this.allPaymentMethodsResource.status() === 'loading';
  }

  /**
   * Obtiene el error al cargar métodos de pago si existe
   */
  public get paymentMethodsError(): unknown {
    if (!this.loadAllPaymentMethodsTrigger()) {
      return null;
    }
    return this.allPaymentMethodsResource.error();
  }

  /**
   * Recarga la lista de métodos de pago
   */
  public reloadPaymentMethods(): void {
    if (!this.loadAllPaymentMethodsTrigger()) {
      this.loadAllPaymentMethodsTrigger.set(true);
    }
    this.allPaymentMethodsResource.reload();
  }

  /**
   * Crea un nuevo método de pago
   */
  public async createPaymentMethod(data: IPaymentMethodData): Promise<IPaymentMethodResponse> {
    const response = await this.authFetch.fetch(
      this.configService.buildApiUrl(this.configService.paymentMethodEndpoints.create),
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
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

    return (await response.json()) as IPaymentMethodResponse;
  }

  /**
   * Actualiza un método de pago existente
   */
  public async updatePaymentMethod(
    id: number,
    data: IPaymentMethodData
  ): Promise<IPaymentMethodResponse> {
    const url = this.configService.paymentMethodEndpoints.update.replace(':id', id.toString());

    const response = await this.authFetch.fetch(this.configService.buildApiUrl(url), {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
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

    return (await response.json()) as IPaymentMethodResponse;
  }
}
