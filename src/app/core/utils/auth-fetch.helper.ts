import { AuthService } from '@features/auth/services/auth.service';
import { firstValueFrom } from 'rxjs';

/**
 * Clase helper para usar en servicios
 * Realiza fetch con manejo automático de errores de autenticación (401, 403)
 * Intenta refresh del token antes de hacer logout
 */
export class AuthFetchHelper {
  private authService: AuthService;
  private isRefreshing = false;

  constructor(authService: AuthService) {
    this.authService = authService;
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
            Authorization: `Bearer ${refreshResponse.token}`,
          },
        };

        // Reintentar la petición original con el nuevo token
        this.isRefreshing = false;
        return await fetch(url, newOptions);
      } catch (refreshError) {
        // Si el refresh falla, hacer logout
        console.error('Token refresh failed, logging out', refreshError);
        this.isRefreshing = false;
        this.authService.logout();
      }
    }

    return response;
  }
}
