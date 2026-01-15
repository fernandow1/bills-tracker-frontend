import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private static _instance: ConfigService | null = null;

  // API Configuration
  public get apiUrl(): string {
    return environment.apiUrl;
  }

  public get authEndpoints() {
    return environment.endpoints.auth;
  }

  public get billsEndpoints() {
    return environment.endpoints.bills;
  }

  public get usersEndpoints() {
    return environment.endpoints.users;
  }

  public get categoryEndpoints() {
    return environment.endpoints.categories;
  }

  public get brandEndpoints() {
    return environment.endpoints.brands;
  }

  public get productEndpoints() {
    return environment.endpoints.products;
  }

  public get shopEndpoints() {
    return environment.endpoints.shops;
  }

  public get currencyEndpoints() {
    return environment.endpoints.currencies;
  }

  public get paymentMethodEndpoints() {
    return environment.endpoints.paymentMethods;
  }

  // Auth Configuration
  public get authConfig() {
    return environment.auth;
  }

  // Métodos de utilidad

  /**
   * Construye una URL completa del API
   */
  public buildApiUrl(endpoint: string): string {
    return `${this.apiUrl}${endpoint}`;
  }

  constructor() {
    // Auto-registrar como singleton (Angular DI garantiza una sola instancia)
    if (!ConfigService._instance) {
      ConfigService._instance = this;
    }
  }

  /**
   * Obtiene la instancia singleton (siempre controlada por Angular DI)
   */
  private static getInstance(): ConfigService {
    if (!ConfigService._instance) {
      // Crear una instancia temporal si no existe (para casos edge)
      ConfigService._instance = new ConfigService();
    }
    return ConfigService._instance;
  }

  /**
   * Log condicional basado en la configuración
   */
  public static log(message: string, ...args: unknown[]): void {
    if (environment.enableLogging) {
      // eslint-disable-next-line no-console
      console.log(`[${environment.appName}]`, message, ...args);
    }
  }

  /**
   * Error logging (siempre activo)
   */
  public static error(message: string, error?: unknown): void {
    console.error(`[${environment.appName} ERROR]`, message, error);
  }

  /**
   * Warning logging (siempre activo)
   */
  public static warn(message: string, ...args: unknown[]): void {
    console.warn(`[${environment.appName} WARN]`, message, ...args);
  }
}
