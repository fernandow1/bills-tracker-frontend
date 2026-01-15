import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

export interface TokenPayload {
  sub: string; // Subject (user ID)
  username: string;
  email?: string;
  roles?: string[];
  iat: number; // Issued at
  exp: number; // Expiration time
}

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly tokenKey = environment.auth.tokenKey;

  /**
   * Almacena el token en localStorage
   */
  public setToken(token: string): void {
    try {
      localStorage.setItem(this.tokenKey, token);
    } catch (error) {
      console.error('Error storing token:', error);
    }
  }

  /**
   * Obtiene el token del localStorage
   */
  public getToken(): string | null {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  /**
   * Elimina el token del localStorage
   */
  public removeToken(): void {
    try {
      localStorage.removeItem(this.tokenKey);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  /**
   * Decodifica el payload del JWT sin verificar la firma
   * NOTA: Solo para uso en frontend, la verificación real debe hacerse en el backend
   */
  public decodeToken(token?: string): TokenPayload | null {
    const tokenToUse = token || this.getToken();

    if (!tokenToUse) {
      return null;
    }

    try {
      // Un JWT tiene 3 partes separadas por puntos: header.payload.signature
      const parts = tokenToUse.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT format');
        return null;
      }

      // Decodificar la parte del payload (segunda parte)
      const payload = parts[1];
      const decodedPayload = this.base64UrlDecode(payload);
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Verifica si el token ha expirado
   */
  public isTokenExpired(token?: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) {
      return true;
    }

    // exp está en segundos, Date.now() está en milisegundos
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  }

  /**
   * Obtiene la fecha de expiración del token
   */
  public getTokenExpirationDate(token?: string): Date | null {
    const payload = this.decodeToken(token);
    if (!payload) {
      return null;
    }

    // Convertir de segundos a milisegundos
    return new Date(payload.exp * 1000);
  }

  /**
   * Obtiene el tiempo restante antes de que expire el token (en milisegundos)
   */
  public getTimeUntilExpiration(token?: string): number {
    const expirationDate = this.getTokenExpirationDate(token);
    if (!expirationDate) {
      return 0;
    }

    const timeRemaining = expirationDate.getTime() - Date.now();
    return Math.max(0, timeRemaining);
  }

  /**
   * Verifica si el token existe y no ha expirado
   */
  public isValidToken(token?: string): boolean {
    const tokenToUse = token || this.getToken();
    return tokenToUse !== null && !this.isTokenExpired(tokenToUse);
  }

  /**
   * Obtiene información del usuario desde el token
   */
  public getUserFromToken(
    token?: string,
  ): { id: string; username: string; email?: string; roles?: string[] } | null {
    const payload = this.decodeToken(token);
    if (!payload) {
      return null;
    }

    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      roles: payload.roles,
    };
  }

  /**
   * Decodifica una cadena base64url (usado en JWT)
   */
  private base64UrlDecode(base64Url: string): string {
    // Convertir base64url a base64 estándar
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // Agregar padding si es necesario
    while (base64.length % 4) {
      base64 += '=';
    }

    // Decodificar
    return atob(base64);
  }
}
