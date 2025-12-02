import { Routes } from '@angular/router';
import { LoginPage } from './pages/login-page';
import { guestGuard } from '@core/guards/auth.guard';

export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginPage,
    title: 'Iniciar Sesión',
    canActivate: [guestGuard],
  },
  //   {
  //     path: 'register',
  //     loadComponent: () => import('./pages/register-page').then((m) => m.RegisterPage),
  //     title: 'Registrarse',
  //     canActivate: [guestGuard],
  //   },
  //   {
  //     path: 'forgot-password',
  //     loadComponent: () => import('./pages/forgot-password-page').then((m) => m.ForgotPasswordPage),
  //     title: 'Recuperar Contraseña',
  //     canActivate: [guestGuard],
  //   },
  //   {
  //     path: 'reset-password',
  //     loadComponent: () => import('./pages/reset-password-page').then((m) => m.ResetPasswordPage),
  //     title: 'Restablecer Contraseña',
  //     canActivate: [guestGuard],
  //   },
];
