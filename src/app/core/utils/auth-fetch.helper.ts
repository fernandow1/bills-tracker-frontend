import { AuthService } from '@features/auth/services/auth.service';

/**
 * Clase helper para usar en servicios
 * Realiza fetch con manejo automático de errores de autenticación (401, 403)
 */
export class AuthFetchHelper {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /**
   * Realiza un fetch con manejo automático de errores de autenticación
   */
  public async fetch(url: string, options?: RequestInit): Promise<Response> {
    const response = await fetch(url, options);

    // Si recibimos 401 o 403, el token es inválido/expiró
    if (response.status === 401 || response.status === 403) {
      console.warn(`Auth error (${response.status}): Token invalid or expired, logging out`);
      this.authService.logout();
    }

    return response;
  }
}
