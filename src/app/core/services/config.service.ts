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
  public buildApiUrl(endpoint: string): string {
    const baseUrl = environment.apiUrl;
    // Eliminar trailing slash de baseUrl y leading slash de endpoint
    const cleanBase = baseUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.replace(/^\//, '');
    return `${cleanBase}/${cleanEndpoint}`;
  }

  /**
   * Obtiene la configuración de autenticación
   */
  public get authConfig() {
    return environment.auth;
  }

  /**
   * Obtiene los endpoints de autenticación
   */
  public get authEndpoints() {
    return environment.endpoints.auth;
  }

  /**
   * Obtiene los endpoints de bills
   */
  public get billsEndpoints() {
    return environment.endpoints.bills;
  }

  /**
   * Obtiene los endpoints de categories
   */
  public get categoriesEndpoints() {
    return environment.endpoints.categories;
  }

  /**
   * Obtiene los endpoints de brands
   */
  public get brandsEndpoints() {
    return environment.endpoints.brands;
  }

  /**
   * Obtiene los endpoints de products
   */
  public get productsEndpoints() {
    return environment.endpoints.products;
  }

  /**
   * Obtiene los endpoints de shops
   */
  public get shopEndpoints() {
    return environment.endpoints.shops;
  }

  /**
   * Obtiene los endpoints de currencies
   */
  public get currenciesEndpoints() {
    return environment.endpoints.currencies;
  }

  /**
   * Obtiene los endpoints de payment methods
   */
  public get paymentMethodsEndpoints() {
    return environment.endpoints.paymentMethods;
  }

  /**
   * Obtiene los endpoints de users
   */
  public get usersEndpoints() {
    return environment.endpoints.users;
  }

  /**
   * Obtiene la configuración de Mapbox
   */
  public get mapboxConfig() {
    return environment.mapbox;
  }

  // Aliases para compatibilidad (algunos servicios usan singular)
  public get brandEndpoints() {
    return this.brandsEndpoints;
  }

  public get categoryEndpoints() {
    return this.categoriesEndpoints;
  }

  public get productEndpoints() {
    return this.productsEndpoints;
  }

  public get currencyEndpoints() {
    return this.currenciesEndpoints;
  }

  public get paymentMethodEndpoints() {
    return this.paymentMethodsEndpoints;
  }

  /**
   * Método estático para logging
   */
  public static log(message: string, ...args: any[]): void {
    if (environment.enableLogging) {
      // eslint-disable-next-line no-console
      console.log(`[${environment.appName}]`, message, ...args);
    }
  }

  /**
   * Método estático para errores
   */
  public static error(message: string, ...args: any[]): void {
    console.error(`[${environment.appName} ERROR]`, message, ...args);
  }

  /**
   * Método estático para warnings
   */
  public static warn(message: string, ...args: any[]): void {
    console.warn(`[${environment.appName} WARN]`, message, ...args);
  }
}
