import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';

/**
 * Guard que protege rutas que requieren autenticación
 * Redirige a login si el usuario no está autenticado
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Guardar la URL intentada para redirigir después del login
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
  return false;
};

/**
 * Guard que protege rutas que solo deben ser accesibles por usuarios no autenticados
 * Por ejemplo, la página de login no debe ser accesible si ya estás logueado
 */
export const guestGuard: CanActivateFn = (_route, _state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (!authService.isLoggedIn()) {
    return true;
  }

  // Si ya está autenticado, redirigir al dashboard
  router.navigate(['/']);
  return false;
};
