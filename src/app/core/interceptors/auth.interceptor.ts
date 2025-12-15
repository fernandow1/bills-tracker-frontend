import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@features/auth/services/auth.service';
import { catchError, Observable, throwError } from 'rxjs';

/**
 * Interceptor funcional para manejar la autenticación en peticiones HTTP
 * Agrega el token JWT a todas las peticiones salientes
 * Maneja errores 401 (no autorizado) automáticamente
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // URLs que no requieren autenticación
  const excludedUrls = ['/auth/login', '/user', '/auth/forgot-password', '/public'];

  // Verificar si la URL actual debe ser excluida
  const shouldSkipAuth = excludedUrls.some((url) => req.url.includes(url));

  // Si no hay token o la URL está excluida, continuar sin modificar
  if (!token || shouldSkipAuth) {
    return next(req);
  }

  // Clonar la petición y agregar el header de autorización
  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });

  // Procesar la petición y manejar errores de autenticación
  return next(authReq).pipe(
    catchError((error): Observable<never> => {
      // Si recibimos un 401, el token probablemente expiró
      if (error.status === 401) {
        console.warn('Token expired or invalid, logging out user');
        authService.logout();
      }

      // Si recibimos un 403, el usuario no tiene permisos - redirigir al login
      if (error.status === 403) {
        console.warn('Forbidden access (403), redirecting to login');
        authService.logout();
      }

      return throwError(() => error);
    })
  );
};

/**
 * Configuración para registrar el interceptor en la aplicación
 * Usar en app.config.ts o en los providers del módulo
 */
export const authInterceptorProvider = {
  provide: 'HTTP_INTERCEPTORS',
  useValue: authInterceptor,
  multi: true,
};
