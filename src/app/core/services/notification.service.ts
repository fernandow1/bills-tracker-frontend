import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorResponse } from '@core/interfaces/error-response.interface';

/**
 * Servicio centralizado para mostrar notificaciones
 * Reemplaza el uso directo de MatSnackBar en los componentes
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Muestra un mensaje de éxito
   */
  public success(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Cerrar', {
      duration,
      panelClass: ['success-snackbar'],
      verticalPosition: 'top',
    });
  }

  /**
   * Muestra un mensaje de error simple
   */
  public error(message: string, duration = 5000): void {
    this.snackBar.open(message, 'Cerrar', {
      duration,
      panelClass: ['error-snackbar'],
      verticalPosition: 'top',
    });
  }

  /**
   * Muestra un ErrorResponse estructurado del backend
   */
  public showError(errorResponse: ErrorResponse, duration = 5000): void {
    this.snackBar.open(errorResponse.detail, 'Cerrar', {
      duration,
      panelClass: ['error-snackbar'],
      verticalPosition: 'top',
    });
  }

  /**
   * Muestra un mensaje informativo
   */
  public info(message: string, duration = 4000): void {
    this.snackBar.open(message, 'Cerrar', {
      duration,
      panelClass: ['info-snackbar'],
      verticalPosition: 'top',
    });
  }

  /**
   * Muestra un mensaje de advertencia
   */
  public warning(message: string, duration = 5000): void {
    this.snackBar.open(message, 'Cerrar', {
      duration,
      panelClass: ['warning-snackbar'],
      verticalPosition: 'top',
    });
  }
}
