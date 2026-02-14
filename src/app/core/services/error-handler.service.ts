import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ErrorResponse,
  ApiErrorResponse,
  FormattedError,
  LegacyValidationError,
} from '@core/interfaces/error-response.interface';
import { NotificationService } from '@core/services/notification.service';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  private readonly notificationService = inject(NotificationService);

  /**
   * Formatea un error HTTP a la nueva estructura ErrorResponse
   */
  public formatErrorResponse(error: unknown): ErrorResponse {
    // Si es un HttpErrorResponse con la nueva estructura del backend
    if (error instanceof HttpErrorResponse && error.error) {
      const backendError = error.error;

      // Si el backend ya devuelve ErrorResponse
      if (backendError.status && backendError.title && backendError.detail) {
        return backendError as ErrorResponse;
      }

      // Fallback: construir ErrorResponse desde estructura legacy
      return {
        status: error.status || 500,
        title: this.getErrorTitle(error.status || 500),
        detail: this.extractMessage(backendError),
        errors: backendError.errors || backendError.validationErrors || undefined,
        path: backendError.path,
        timestamp: backendError.timestamp,
      };
    }

    // Si es un Error que contiene un HttpErrorResponse (ResourceError de Angular)
    if (error instanceof Error && 'cause' in error && error.cause instanceof HttpErrorResponse) {
      return this.formatErrorResponse(error.cause);
    }

    // Si es un Error con estructura de HttpErrorResponse (httpResource de Angular)
    if (
      error instanceof Error &&
      'status' in error &&
      'error' in error &&
      typeof error.status === 'number'
    ) {
      const httpLikeError = error as Error & { status: number; statusText?: string; error: any };
      const backendError = httpLikeError.error;

      // Si el backend ya devuelve ErrorResponse
      if (backendError?.status && backendError?.title && backendError?.detail) {
        return backendError as ErrorResponse;
      }

      // Fallback: construir ErrorResponse desde estructura legacy
      return {
        status: httpLikeError.status || 500,
        title: this.getErrorTitle(httpLikeError.status || 500),
        detail: this.extractMessage(backendError),
        errors: backendError?.errors || backendError?.validationErrors || undefined,
        path: backendError?.path,
        timestamp: backendError?.timestamp,
      };
    }

    // Error genérico
    if (error instanceof Error) {
      return {
        status: 500,
        title: 'Error inesperado',
        detail: error.message,
      };
    }

    // Error desconocido
    return {
      status: 500,
      title: 'Error desconocido',
      detail: 'Ha ocurrido un error inesperado',
    };
  }

  /**
   * Extrae el mensaje de diferentes estructuras de error
   */
  private extractMessage(errorBody: any): string {
    // Priorizar el campo 'detail' si existe (nuevo formato)
    if (errorBody.detail) {
      return errorBody.detail;
    }
    // Luego intentar con 'message' (formato legacy)
    if (typeof errorBody.message === 'string') {
      return errorBody.message;
    }
    if (Array.isArray(errorBody.message)) {
      return errorBody.message[0] || 'Error en la operación';
    }
    return 'Error en la operación';
  }

  /**
   * @deprecated Use formatErrorResponse instead
   * Formatea un error del backend a una estructura consistente (legacy)
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
  private mapValidationErrors(errors: LegacyValidationError[]): Map<string, string[]> {
    const errorMap = new Map<string, string[]>();

    errors.forEach((error) => {
      const messages: string[] = [];

      if (error.message) {
        messages.push(error.message);
      }

      if (error.constraints) {
        Object.values(error.constraints).forEach((constraint: string) => {
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
   * Muestra un ErrorResponse usando NotificationService
   */
  public showError(errorResponse: ErrorResponse, duration = 5000): void {
    this.notificationService.showError(errorResponse, duration);
  }

  /**
   * @deprecated Use showError with ErrorResponse instead
   * Muestra un error legacy en un snackbar
   */
  public showErrorLegacy(error: FormattedError, duration = 5000): void {
    let message = error.message;

    if (error.details && error.details.length > 0) {
      message += '\n' + error.details.join('\n');
    }

    this.notificationService.error(message, duration);
  }

  /**
   * @deprecated Use showError with ErrorResponse instead
   * Muestra errores de validación en un snackbar (legacy)
   */
  public showValidationErrors(errors: Map<string, string[]>, duration = 7000): void {
    const messages: string[] = [];

    errors.forEach((fieldErrors, field) => {
      messages.push(`${field}: ${fieldErrors.join(', ')}`);
    });

    this.notificationService.error(messages.join('\n'), duration);
  }

  /**
   * Loguea un ErrorResponse en consola con formato
   */
  public logError(error: ErrorResponse | FormattedError, context?: string): void {
    const prefix = context ? `[${context}]` : '[Error]';

    console.error(`${prefix} ${error.title} (${error.status}):`);

    // Manejar ErrorResponse
    if ('detail' in error) {
      console.error(`  Detail: ${error.detail}`);

      if (error.errors && error.errors.length > 0) {
        console.error('  Validation Errors:');
        error.errors.forEach((err) => {
          console.error(`    ${err.field}: ${err.message}`);
        });
      }

      if (error.path) {
        console.error(`  Path: ${error.path}`);
      }

      if (error.timestamp) {
        console.error(`  Timestamp: ${error.timestamp}`);
      }
    }
    // Manejar FormattedError (legacy)
    else if ('message' in error) {
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
  }

  /**
   * Maneja un error completo: formatea, loguea y muestra
   */
  public handleError(error: unknown, context?: string, showSnackbar = true): ErrorResponse {
    const formatted = this.formatErrorResponse(error);
    this.logError(formatted, context);

    if (showSnackbar) {
      this.showError(formatted);
    }

    return formatted;
  }

  /**
   * @deprecated Use handleError instead
   * Maneja un error completo con estructura legacy
   */
  public handleErrorLegacy(error: unknown, context?: string, showSnackbar = true): FormattedError {
    const formatted = this.formatError(error);
    this.logError(formatted, context);

    if (showSnackbar) {
      if (formatted.validationErrors && formatted.validationErrors.size > 0) {
        this.showValidationErrors(formatted.validationErrors);
      } else {
        this.showErrorLegacy(formatted);
      }
    }

    return formatted;
  }
}
