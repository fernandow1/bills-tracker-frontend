import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, resource } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { ConfigService } from '@core/services/config.service';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn?: number;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly config = inject(ConfigService);

  // Configuración del API usando ConfigService
  private get apiUrl(): string {
    return this.config.apiUrl;
  }

  private get tokenKey(): string {
    return this.config.authConfig.tokenKey;
  }

  private get userKey(): string {
    return this.config.authConfig.userKey;
  }

  // Estado reactivo usando signals
  public readonly isAuthenticated = signal<boolean>(this.hasValidToken());
  public readonly currentUser = signal<User | null>(this.getStoredUser());

  // Signal para controlar el login request (httpResource experimental)
  private readonly loginRequest = signal<LoginRequest | null>(null);

  // BehaviorSubject para compatibilidad con observables
  private readonly authState$ = new BehaviorSubject<AuthState>({
    isAuthenticated: this.hasValidToken(),
    user: this.getStoredUser(),
    token: this.getStoredToken(),
  });

  public readonly authState = this.authState$.asObservable();

  // HttpResource experimental para login usando fetch
  public readonly loginResource = resource({
    loader: async () => {
      const request = this.loginRequest();

      if (!request) {
        return null;
      }

      const response = await fetch(this.config.buildApiUrl(this.config.authEndpoints.login), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
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

      const loginResponse: LoginResponse = await response.json();
      this.handleLoginSuccess(loginResponse);
      return loginResponse;
    },
  });

  constructor() {
    // Verificar token al inicializar el servicio
    this.checkTokenValidity();
  }

  /**
   * Realiza el login del usuario (método original con RxJS)
   */
  public login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(this.config.buildApiUrl(this.config.authEndpoints.login), credentials)
      .pipe(
        tap((response) => this.handleLoginSuccess(response)),
        catchError((error): Observable<never> => this.handleAuthError(error))
      );
  }

  /**
   * Realiza el login usando httpResource experimental (alternativa moderna sin RxJS)
   */
  public loginWithResource(credentials: LoginRequest): void {
    this.loginRequest.set(credentials);
    this.loginResource.reload();
  }

  /**
   * Resetea el estado del login resource
   */
  public resetLoginResource(): void {
    this.loginRequest.set(null);
  }

  /**
   * Cierra la sesión del usuario
   */
  public logout(): void {
    // Opcional: llamar al endpoint de logout si existe
    // this.http.post(`${this.apiUrl}/logout`, {}).subscribe();

    this.clearAuthData();
    this.updateAuthState(false, null, null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Obtiene el token almacenado
   */
  public getToken(): string | null {
    return this.getStoredToken();
  }

  /**
   * Obtiene el usuario actual
   */
  public getUser(): User | null {
    return this.currentUser();
  }

  /**
   * Verifica si el usuario está autenticado
   */
  public isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Refresca el token (si el backend lo soporta)
   */
  public refreshToken(): Observable<LoginResponse> {
    const currentToken = this.getToken();

    if (!currentToken) {
      return throwError(() => new Error('No token available for refresh'));
    }

    return this.http
      .post<LoginResponse>(this.config.buildApiUrl(this.config.authEndpoints.refresh), {
        refreshToken: currentToken,
      })
      .pipe(
        tap((response) => this.handleLoginSuccess(response)),
        catchError((error): Observable<never> => {
          this.logout(); // Si falla el refresh, cerrar sesión
          return throwError(() => error);
        })
      );
  }

  /**
   * Maneja el éxito del login
   */
  private handleLoginSuccess(response: LoginResponse): void {
    this.storeToken(response.token);
    this.storeUser(response.user);
    this.updateAuthState(true, response.user, response.token);
  }

  /**
   * Maneja errores de autenticación
   */
  private handleAuthError(error: unknown): Observable<never> {
    ConfigService.error('Authentication error:', error);
    // Aquí puedes agregar logging más sofisticado
    return throwError(() => error);
  }

  /**
   * Actualiza el estado de autenticación
   */
  private updateAuthState(isAuthenticated: boolean, user: User | null, token: string | null): void {
    this.isAuthenticated.set(isAuthenticated);
    this.currentUser.set(user);
    this.authState$.next({
      isAuthenticated,
      user,
      token,
    });
  }

  /**
   * Almacena el token en localStorage
   */
  private storeToken(token: string): void {
    try {
      localStorage.setItem(this.tokenKey, token);
    } catch (error) {
      ConfigService.error('Error storing token:', error);
    }
  }

  /**
   * Almacena los datos del usuario en localStorage
   */
  private storeUser(user: User): void {
    try {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } catch (error) {
      ConfigService.error('Error storing user:', error);
    }
  }

  /**
   * Obtiene el token almacenado
   */
  private getStoredToken(): string | null {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch (error) {
      ConfigService.error('Error getting token:', error);
      return null;
    }
  }

  /**
   * Obtiene el usuario almacenado
   */
  private getStoredUser(): User | null {
    try {
      const userJson = localStorage.getItem(this.userKey);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      ConfigService.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Verifica si existe un token válido
   */
  private hasValidToken(): boolean {
    const token = this.getStoredToken();
    if (!token) {
      return false;
    }

    // Aquí puedes agregar validación adicional del token
    // Por ejemplo, verificar si ha expirado
    return true;
  }

  /**
   * Verifica la validez del token actual
   */
  private checkTokenValidity(): void {
    const token = this.getStoredToken();
    const user = this.getStoredUser();

    if (token && user) {
      // Opcional: validar token con el backend
      this.updateAuthState(true, user, token);
    } else {
      this.clearAuthData();
      this.updateAuthState(false, null, null);
    }
  }

  /**
   * Limpia todos los datos de autenticación
   */
  private clearAuthData(): void {
    try {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    } catch (error) {
      ConfigService.error('Error clearing auth data:', error);
    }
  }
}
