import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorHandlerService } from '@core/services/error-handler.service';

/**
 * Interceptor para capturar y formatear errores HTTP
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ErrorHandlerService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // No manejar errores de autenticación aquí (lo hace authInterceptor)
      if (error.status !== 401 && error.status !== 403) {
        // Determinar contexto según la URL
        const context = req.method + ' ' + req.url;

        // Solo mostrar snackbar para errores que no son de validación
        // Los errores de validación los maneja el formulario
        const showSnackbar = error.status !== 422 && error.status !== 400;

        errorHandler.handleError(error, context, showSnackbar);
      }

      return throwError(() => error);
    })
  );
};
