import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@features/auth/services/auth.service';
import { catchError, throwError, switchMap } from 'rxjs';

/**
 * Interceptor funcional para manejar la autenticación en peticiones HTTP
 * Agrega el token JWT a todas las peticiones salientes
 * Maneja errores 401/403 intentando refresh del token antes de hacer logout
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // URLs que no requieren autenticación
  const excludedUrls = [
    '/auth/login',
    '/auth/refresh',
    '/user',
    '/auth/forgot-password',
    '/public',
  ];

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
    catchError((error) => {
      // Si recibimos un 401 o 403, intentar refresh del token
      if (error.status === 401 || error.status === 403) {
        console.warn(`Auth error (${error.status}), attempting token refresh`);

        // Intentar refresh del token
        return authService.refreshToken().pipe(
          switchMap((response) => {
            // Reintentar la petición original con el nuevo token
            const retryReq = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${response.refreshToken}`),
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            // Si el refresh falla, hacer logout
            console.error('Token refresh failed, logging out', refreshError);
            authService.logout();
            return throwError(() => refreshError);
          })
        );
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
