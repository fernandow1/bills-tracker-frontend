import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Servicio de configuración que proporciona acceso a la configuración de la aplicación.
 * Lee la configuración desde window.__APP_CONFIG__ que se carga en main.ts
 */
@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  /**
   * Construye una URL completa del API combinando la base URL con un endpoint
   */
  buildApiUrl(endpoint: string): string {
    const baseUrl = environment.apiUrl;
    // Eliminar trailing slash de baseUrl y leading slash de endpoint
    const cleanBase = baseUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.replace(/^\//, '');
    return `${cleanBase}/${cleanEndpoint}`;
  }

  /**
   * Obtiene la configuración de autenticación
   */
  get authConfig() {
    return environment.auth;
  }

  /**
   * Obtiene los endpoints de autenticación
   */
  get authEndpoints() {
    return environment.endpoints.auth;
  }

  /**
   * Obtiene los endpoints de bills
   */
  get billsEndpoints() {
    return environment.endpoints.bills;
  }

  /**
   * Obtiene los endpoints de categories
   */
  get categoriesEndpoints() {
    return environment.endpoints.categories;
  }

  /**
   * Obtiene los endpoints de brands
   */
  get brandsEndpoints() {
    return environment.endpoints.brands;
  }

  /**
   * Obtiene los endpoints de products
   */
  get productsEndpoints() {
    return environment.endpoints.products;
  }

  /**
   * Obtiene los endpoints de shops
   */
  get shopEndpoints() {
    return environment.endpoints.shops;
  }

  /**
   * Obtiene los endpoints de currencies
   */
  get currenciesEndpoints() {
    return environment.endpoints.currencies;
  }

  /**
   * Obtiene los endpoints de payment methods
   */
  get paymentMethodsEndpoints() {
    return environment.endpoints.paymentMethods;
  }

  /**
   * Obtiene los endpoints de users
   */
  get usersEndpoints() {
    return environment.endpoints.users;
  }

  /**
   * Obtiene la configuración de Mapbox
   */
  get mapboxConfig() {
    return environment.mapbox;
  }

  // Aliases para compatibilidad (algunos servicios usan singular)
  get brandEndpoints() {
    return this.brandsEndpoints;
  }

  get categoryEndpoints() {
    return this.categoriesEndpoints;
  }

  get productEndpoints() {
    return this.productsEndpoints;
  }

  get currencyEndpoints() {
    return this.currenciesEndpoints;
  }

  get paymentMethodEndpoints() {
    return this.paymentMethodsEndpoints;
  }

  /**
   * Método estático para logging
   */
  static log(message: string, ...args: any[]): void {
    if (environment.enableLogging) {
      // eslint-disable-next-line no-console
      console.log(`[${environment.appName}]`, message, ...args);
    }
  }

  /**
   * Método estático para errores
   */
  static error(message: string, ...args: any[]): void {
    // eslint-disable-next-line no-console
    console.error(`[${environment.appName} ERROR]`, message, ...args);
  }

  /**
   * Método estático para warnings
   */
  static warn(message: string, ...args: any[]): void {
    // eslint-disable-next-line no-console
    console.warn(`[${environment.appName} WARN]`, message, ...args);
  }
}
