import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
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
import { catchError, throwError } from 'rxjs';
import { ConfigService } from '@src/app/core/services/config.service';

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
  public isLoading = false;

  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  public ngOnInit(): void {
    this.buildForm();
  }

  public get isFormValid(): boolean {
    return this.form?.valid ?? false;
  }

  public get isFormReady(): boolean {
    return this.form !== null;
  }

  public onSubmit(): void {
    if (this.form?.valid && !this.isLoading) {
      this.isLoading = true;
      const credentials: LoginRequest = this.form.value;

      ConfigService.debug('Intentando login para usuario:', credentials.username);

      this.authService
        .login(credentials)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError((error) => {
            ConfigService.error('Error en login:', error);
            return throwError(() => error);
          })
        )
        .subscribe({
          next: () => {
            this.isLoading = false;

            ConfigService.log('Login exitoso para usuario:', credentials.username);

            // Mostrar mensaje de éxito
            this.snackBar.open('¡Bienvenido!', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar'],
            });

            // Redirigir a la URL original o al dashboard
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
            ConfigService.debug('Redirigiendo a:', returnUrl);
            this.router.navigate([returnUrl]);
          },
          error: (error) => {
            this.isLoading = false;

            // Usar ConfigService para logging detallado del error
            ConfigService.error('Error en autenticación:', {
              username: credentials.username,
              error: error.error,
              status: error.status,
              timestamp: new Date().toISOString(),
            });

            // Mostrar mensaje de error
            const errorMessage =
              error.error?.message || 'Credenciales incorrectas. Inténtalo de nuevo.';
            this.snackBar.open(errorMessage, 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar'],
            });
          },
        });
    } else {
      ConfigService.warn('Formulario inválido, marcando campos como touched');
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
    ConfigService.debug('Construyendo formulario de login');

    this.form = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    ConfigService.log('Formulario de login construido exitosamente');
  }
}
