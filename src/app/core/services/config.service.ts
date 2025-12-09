import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private static _instance: ConfigService | null = null;
  // Propiedades generales
  public get isProduction(): boolean {
    return environment.production;
  }

  public get appName(): string {
    return environment.appName;
  }

  public get version(): string {
    return environment.version;
  }

  public get enableLogging(): boolean {
    return environment.enableLogging;
  }

  public get enableDebugMode(): boolean {
    return environment.enableDebugMode;
  }

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

  // Auth Configuration
  public get authConfig() {
    return environment.auth;
  }

  // App Configuration
  public get appConfig() {
    return environment.app;
  }

  // Métodos de utilidad

  /**
   * Construye una URL completa del API
   */
  public buildApiUrl(endpoint: string): string {
    return `${this.apiUrl}${endpoint}`;
  }

  /**
   * Obtiene una configuración específica con un valor por defecto
   */
  public getConfig<T>(path: string, defaultValue: T): T {
    const value = this.getNestedProperty(environment, path);
    return value !== undefined ? (value as T) : defaultValue;
  }

  /**
   * Verifica si una característica está habilitada
   */
  public isFeatureEnabled(feature: string): boolean {
    return this.getConfig(`features.${feature}`, false);
  }

  /**
   * Obtiene el valor de una propiedad anidada usando notación de punto
   */
  private getNestedProperty(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
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
    const instance = ConfigService.getInstance();
    if (instance.enableLogging) {
      // eslint-disable-next-line no-console
      console.log(`[${instance.appName}]`, message, ...args);
    }
  }

  /**
   * Error logging (siempre activo)
   */
  public static error(message: string, error?: unknown): void {
    const instance = ConfigService.getInstance();
    console.error(`[${instance.appName} ERROR]`, message, error);
  }

  /**
   * Warning logging (siempre activo)
   */
  public static warn(message: string, ...args: unknown[]): void {
    const instance = ConfigService.getInstance();
    console.warn(`[${instance.appName} WARN]`, message, ...args);
  }
}
