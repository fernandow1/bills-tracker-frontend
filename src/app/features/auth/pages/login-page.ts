import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  effect,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService, LoginRequest } from '@features/auth/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, Observable, throwError } from 'rxjs';

@Component({
  selector: 'app-login-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage implements OnInit {
  public form: FormGroup | null = null;
  public isLoading = signal<boolean>(false);

  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {
    // Effect para monitorear el estado del loginResource
    effect(() => {
      const resource = this.authService.loginResource;

      if (resource.isLoading()) {
        this.isLoading.set(true);
      } else {
        this.isLoading.set(false);
      }

      if (resource.hasValue() && resource.value()) {
        this.handleLoginSuccess();
      }

      if (resource.error()) {
        this.handleLoginError(resource.error());
      }
    });
  }

  public ngOnInit(): void {
    this.buildForm();
  }

  public get isFormValid(): boolean {
    return this.form?.valid ?? false;
  }

  public get isFormReady(): boolean {
    return this.form !== null;
  }

  // Computed para determinar si está cargando (combina ambos métodos)
  public get isCurrentlyLoading(): boolean {
    return this.isLoading() || this.authService.loginResource.isLoading();
  }

  /**
   * Método experimental con httpResource (sin RxJS)
   */
  public onSubmit(): void {
    if (this.form?.valid && !this.isCurrentlyLoading) {
      const credentials: LoginRequest = this.form.value;
      this.authService.resetLoginResource();
      this.authService.loginWithResource(credentials);
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Método original con RxJS (mantener como respaldo)
   */
  public onSubmitRxJS(): void {
    if (this.form?.valid && !this.isCurrentlyLoading) {
      this.isLoading.set(true);
      const credentials: LoginRequest = this.form.value;

      this.authService
        .login(credentials)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError((error): Observable<never> => {
            return throwError(() => error);
          })
        )
        .subscribe({
          next: () => {
            this.isLoading.set(false);
            this.handleLoginSuccess();
          },
          error: (error) => {
            this.isLoading.set(false);
            this.handleLoginError(error);
          },
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    if (this.form) {
      Object.keys(this.form.controls).forEach((key) => {
        const control = this.form?.get(key);
        control?.markAsTouched();
      });
    }
  }

  private buildForm(): void {
    this.form = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  /**
   * Maneja el login exitoso (común para ambos métodos)
   */
  private handleLoginSuccess(): void {
    // Mostrar mensaje de éxito
    this.snackBar.open('¡Bienvenido!', 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });

    // Redirigir a la URL original o al dashboard
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.router.navigate([returnUrl]);
  }

  /**
   * Maneja errores de login (común para ambos métodos)
   */
  private handleLoginError(error: unknown): void {
    const credentials: LoginRequest = this.form?.value || { username: 'unknown', password: '' };

    // Type guard para error HTTP
    const httpError = error as { error?: { message?: string }; status?: number };

    // Log del error para debugging
    console.error('Error en autenticación:', {
      username: credentials.username,
      error: httpError.error,
      status: httpError.status,
      timestamp: new Date().toISOString(),
    });

    // Mostrar mensaje de error
    const errorMessage =
      httpError.error?.message || 'Credenciales incorrectas. Inténtalo de nuevo.';
    this.snackBar.open(errorMessage, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }
}
