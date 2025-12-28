import { Routes } from '@angular/router';
import { Layout } from '@layouts/layout/layout';
import { authGuard } from '@core/guards/auth.guard';

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
        loadComponent: () => import('@features/product/pages/list/product').then((m) => m.Product),
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
      {
        path: 'shops',
        loadComponent: () => import('@features/shop/pages/list/shop').then((m) => m.Shop),
        title: 'Tiendas',
      },
      {
        path: 'currencies',
        loadComponent: () =>
          import('@features/currency/pages/list/list').then((m) => m.CurrencyList),
        title: 'Monedas',
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
