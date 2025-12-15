import { Routes } from '@angular/router';
import { Layout } from './layout/layout/layout';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('@features/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'Dashboard',
      },
      {
        path: 'products',
        loadComponent: () => import('@features/product/product').then((m) => m.Product),
        title: 'Productos',
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('@src/app/features/category/pages/list/category-list').then((m) => m.CategoryList),
        title: 'Categorías',
      },
      {
        path: 'brands',
        loadComponent: () => import('@features/brand/pages/list/brand').then((m) => m.Brand),
        title: 'Marcas',
      },
    ],
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'login',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
