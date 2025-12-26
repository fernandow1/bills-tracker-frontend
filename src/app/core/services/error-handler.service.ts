import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ApiErrorResponse,
  FormattedError,
  ValidationError,
} from '@core/interfaces/error-response.interface';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Formatea un error del backend a una estructura consistente
   */
  public formatError(error: unknown): FormattedError {
    // Error de red o fetch
    if (error instanceof Error && 'status' in error) {
      const httpError = error as Error & { status?: number; error?: ApiErrorResponse };
      const apiError = httpError.error;

      if (apiError) {
        return this.formatApiError(apiError, httpError.status || 500);
      }

      return {
        status: httpError.status || 500,
        title: 'Error de conexión',
        message: httpError.message || 'No se pudo conectar con el servidor',
        originalError: error,
      };
    }

    // Error genérico
    if (error instanceof Error) {
      return {
        status: 500,
        title: 'Error inesperado',
        message: error.message,
        originalError: error,
      };
    }

    // Error desconocido
    return {
      status: 500,
      title: 'Error desconocido',
      message: 'Ha ocurrido un error inesperado',
      originalError: error,
    };
  }

  /**
   * Formatea un error de API del backend
   */
  private formatApiError(apiError: ApiErrorResponse, status: number): FormattedError {
    const messages = Array.isArray(apiError.message) ? apiError.message : [apiError.message];

    const formatted: FormattedError = {
      status: apiError.statusCode || status,
      title: this.getErrorTitle(apiError.statusCode || status),
      message: messages[0] || 'Error en la operación',
      details: messages.length > 1 ? messages.slice(1) : undefined,
      originalError: apiError,
    };

    // Procesar errores de validación
    if (apiError.validationErrors && apiError.validationErrors.length > 0) {
      formatted.validationErrors = this.mapValidationErrors(apiError.validationErrors);
    }

    return formatted;
  }

  /**
   * Mapea errores de validación a un Map por campo
   */
  private mapValidationErrors(errors: ValidationError[]): Map<string, string[]> {
    const errorMap = new Map<string, string[]>();

    errors.forEach((error) => {
      const messages: string[] = [];

      if (error.message) {
        messages.push(error.message);
      }

      if (error.constraints) {
        Object.values(error.constraints).forEach((constraint) => {
          if (!messages.includes(constraint)) {
            messages.push(constraint);
          }
        });
      }

      if (messages.length > 0) {
        errorMap.set(error.field, messages);
      }
    });

    return errorMap;
  }

  /**
   * Obtiene un título descriptivo según el código de estado
   */
  private getErrorTitle(status: number): string {
    switch (status) {
      case 400:
        return 'Datos inválidos';
      case 401:
        return 'No autorizado';
      case 403:
        return 'Acceso denegado';
      case 404:
        return 'No encontrado';
      case 409:
        return 'Conflicto';
      case 422:
        return 'Error de validación';
      case 500:
        return 'Error del servidor';
      case 503:
        return 'Servicio no disponible';
      default:
        return 'Error';
    }
  }

  /**
   * Muestra un error en un snackbar
   */
  public showError(error: FormattedError, duration = 5000): void {
    let message = error.message;

    if (error.details && error.details.length > 0) {
      message += '\n' + error.details.join('\n');
    }

    this.snackBar.open(message, 'Cerrar', {
      duration,
      panelClass: ['error-snackbar'],
      verticalPosition: 'top',
    });
  }

  /**
   * Muestra errores de validación en un snackbar
   */
  public showValidationErrors(errors: Map<string, string[]>, duration = 7000): void {
    const messages: string[] = [];

    errors.forEach((fieldErrors, field) => {
      messages.push(`${field}: ${fieldErrors.join(', ')}`);
    });

    this.snackBar.open(messages.join('\n'), 'Cerrar', {
      duration,
      panelClass: ['error-snackbar'],
      verticalPosition: 'top',
    });
  }

  /**
   * Loguea un error en consola con formato
   */
  public logError(error: FormattedError, context?: string): void {
    const prefix = context ? `[${context}]` : '[Error]';

    console.error(`${prefix} ${error.title} (${error.status}):`);
    console.error(`  Message: ${error.message}`);

    if (error.details) {
      console.error('  Details:', error.details);
    }

    if (error.validationErrors) {
      console.error('  Validation Errors:');
      error.validationErrors.forEach((messages, field) => {
        console.error(`    ${field}:`, messages);
      });
    }

    if (error.originalError) {
      console.error('  Original Error:', error.originalError);
    }
  }

  /**
   * Maneja un error completo: formatea, loguea y muestra
   */
  public handleError(error: unknown, context?: string, showSnackbar = true): FormattedError {
    const formatted = this.formatError(error);
    this.logError(formatted, context);

    if (showSnackbar) {
      if (formatted.validationErrors && formatted.validationErrors.size > 0) {
        this.showValidationErrors(formatted.validationErrors);
      } else {
        this.showError(formatted);
      }
    }

    return formatted;
  }
}
