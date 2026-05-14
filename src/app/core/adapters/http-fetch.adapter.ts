import { Injectable, inject } from '@angular/core';
import { AuthService } from '@features/auth/services/auth.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { firstValueFrom } from 'rxjs';

export interface FetchOptions extends RequestInit {
  context?: string;
}

@Injectable({
  providedIn: 'root',
})
export class HttpFetchAdapter {
  private readonly authService = inject(AuthService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private isRefreshing = false;

  private async getAuthHeaders(options?: FetchOptions): Promise<Headers> {
    const headers = new Headers(options?.headers);
    const token = this.authService.getToken();

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    return headers;
  }

  private async handleFetch<T>(url: string, options?: FetchOptions): Promise<T> {
    options = options || {};
    options.headers = await this.getAuthHeaders(options);

    let response = await fetch(url, options);

    // Si recibimos 401 o 403, intentar refresh del token
    if ((response.status === 401 || response.status === 403) && !this.isRefreshing) {
      console.warn(`Auth error (${response.status}), attempting token refresh`);
      try {
        this.isRefreshing = true;
        const refreshResponse = await firstValueFrom(this.authService.refreshToken());
        
        // Actualizar el token y reintentar
        const headers = new Headers(options.headers);
        headers.set('Authorization', `Bearer ${refreshResponse.accessToken}`);
        options.headers = headers;
        
        this.isRefreshing = false;
        response = await fetch(url, options);
      } catch (refreshError) {
        this.isRefreshing = false;
        this.errorHandler.handleError(refreshError, 'Token Refresh');
        this.authService.logout();
        throw refreshError;
      }
    }

    if (!response.ok) {
      const errorData = await response.clone().json().catch(() => ({ message: 'Error de red' }));
      const context = options.context || `${options.method || 'GET'} ${url}`;

      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      Object.assign(error, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      const method = options.method?.toUpperCase();
      const showSnackbar =
        method !== 'POST' &&
        method !== 'PUT' &&
        response.status !== 422 &&
        response.status !== 400;
      this.errorHandler.handleError(error, context, showSnackbar);

      throw error;
    }

    if (response.status === 204) {
      return null as any;
    }

    return (await response.json()) as T;
  }

  public get<T>(url: string, options?: FetchOptions): Promise<T> {
    return this.handleFetch<T>(url, { ...options, method: 'GET' });
  }

  public post<T>(url: string, body?: any, options?: FetchOptions): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.handleFetch<T>(url, {
      ...options,
      method: 'POST',
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(url: string, body?: any, options?: FetchOptions): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.handleFetch<T>(url, {
      ...options,
      method: 'PUT',
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(url: string, options?: FetchOptions): Promise<T> {
    return this.handleFetch<T>(url, { ...options, method: 'DELETE' });
  }

  public patch<T>(url: string, body?: any, options?: FetchOptions): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.handleFetch<T>(url, {
      ...options,
      method: 'PATCH',
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
  }
}
