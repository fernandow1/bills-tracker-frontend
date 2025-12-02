import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
// import { AuthService } from '@core/services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  // const authService = inject(AuthService);

  // TODO: Implementar lógica de autenticación
  const isAuthenticated = false; // authService.isAuthenticated();

  if (!isAuthenticated) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  return true;
};

export const guestGuard: CanActivateFn = (_route, _state) => {
  const router = inject(Router);
  // const authService = inject(AuthService);

  // TODO: Implementar lógica de autenticación
  const isAuthenticated = false; // authService.isAuthenticated();

  if (isAuthenticated) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
