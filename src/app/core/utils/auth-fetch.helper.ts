import { AuthService } from '@features/auth/services/auth.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { firstValueFrom } from 'rxjs';

/**
 * Clase helper para usar en servicios
 * Realiza fetch con manejo automático de errores de autenticación (401, 403)
 * Intenta refresh del token antes de hacer logout
 */
export class AuthFetchHelper {
  private authService: AuthService;
  private errorHandler: ErrorHandlerService;
  private isRefreshing = false;

  constructor(authService: AuthService, errorHandler: ErrorHandlerService) {
    this.authService = authService;
    this.errorHandler = errorHandler;
  }

  /**
   * Realiza un fetch con manejo automático de errores de autenticación
   */
  public async fetch(url: string, options?: RequestInit): Promise<Response> {
    const response = await fetch(url, options);

    // Si recibimos 401 o 403, intentar refresh del token
    if ((response.status === 401 || response.status === 403) && !this.isRefreshing) {
      console.warn(`Auth error (${response.status}), attempting token refresh`);

      try {
        this.isRefreshing = true;

        // Intentar refresh del token
        const refreshResponse = await firstValueFrom(this.authService.refreshToken());
        console.warn('Token refreshed successfully, retrying request');

        // Actualizar el header con el nuevo token
        const newOptions = {
          ...options,
          headers: {
            ...options?.headers,
            Authorization: `Bearer ${refreshResponse.accessToken}`,
          },
        };

        // Reintentar la petición original con el nuevo token
        this.isRefreshing = false;
        return await fetch(url, newOptions);
      } catch (refreshError) {
        // Si el refresh falla, hacer logout
        this.isRefreshing = false;
        this.errorHandler.handleError(refreshError, 'Token Refresh');
        this.authService.logout();
        throw refreshError;
      }
    }

    // Si hay error y no es de autenticación, procesarlo
    if (!response.ok && response.status !== 401 && response.status !== 403) {
      try {
        const errorData = await response.clone().json();
        const context = `${options?.method || 'GET'} ${url}`;

        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        Object.assign(error, {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });

        // No mostrar snackbar para errores de validación (422, 400)
        const showSnackbar = response.status !== 422 && response.status !== 400;
        this.errorHandler.handleError(error, context, showSnackbar);
      } catch {
        // Si no se puede parsear el JSON, continuar
      }
    }

    return response;
  }
}
