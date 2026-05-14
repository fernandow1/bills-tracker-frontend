import { Injectable, signal, resource, inject } from '@angular/core';
import { ConfigService } from '@core/services/config.service';
import { HttpFetchAdapter } from '@core/adapters/http-fetch.adapter';
import { IPaymentMethodData } from '@features/payment-method/interfaces/payment-method-data.interface';
import { IPaymentMethodResponse } from '@features/payment-method/interfaces/payment-method-response.interface';

@Injectable({
  providedIn: 'root',
})
export class PaymentMethodService {
  private readonly configService = new ConfigService();
  private readonly http = inject(HttpFetchAdapter);

  // Signal para controlar carga completa de métodos de pago
  private loadAllPaymentMethodsTrigger = signal<boolean>(false);

  // Resource para cargar todos los métodos de pago
  private allPaymentMethodsResource = resource({
    loader: async ({ abortSignal }) => {
      if (!this.loadAllPaymentMethodsTrigger()) {
        return null;
      }

      const url = this.configService.buildApiUrl(this.configService.paymentMethodEndpoints.list);
      return this.http.get<IPaymentMethodResponse[]>(url, { signal: abortSignal });
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
    return this.allPaymentMethodsResource.value();
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
    const url = this.configService.buildApiUrl(this.configService.paymentMethodEndpoints.create);
    return this.http.post<IPaymentMethodResponse>(url, data);
  }

  /**
   * Actualiza un método de pago existente
   */
  public async updatePaymentMethod(
    uuid: string,
    data: IPaymentMethodData,
  ): Promise<IPaymentMethodResponse> {
    const url = this.configService.paymentMethodEndpoints.update.replace(':id', uuid);
    return this.http.patch<IPaymentMethodResponse>(this.configService.buildApiUrl(url), data);
  }
}
