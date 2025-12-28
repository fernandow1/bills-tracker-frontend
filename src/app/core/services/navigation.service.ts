import { Injectable, signal } from '@angular/core';

export interface NavigationItem {
  id: string;
  label: string;
  route: string;
  icon: string;
  isActive?: boolean;
  children?: NavigationItem[];
}

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  // Signal para la navegación actual
  private readonly _navigationItems = signal<NavigationItem[]>([
    {
      id: 'dashboard',
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'dashboard',
    },
    {
      id: 'shops',
      label: 'Tiendas',
      route: '/shops',
      icon: 'storefront',
    },
    {
      id: 'brands',
      label: 'Marcas',
      route: '/brands',
      icon: 'business',
    },
    {
      id: 'categories',
      label: 'Categorías',
      route: '/categories',
      icon: 'category',
    },
    {
      id: 'products',
      label: 'Productos',
      route: '/products',
      icon: 'inventory_2',
    },
    {
      id: 'bills',
      label: 'Facturas',
      route: '/bills',
      icon: 'receipt_long',
    },
    {
      id: 'reports',
      label: 'Reportes',
      route: '/reports',
      icon: 'analytics',
    },
    {
      id: 'currencies',
      label: 'Monedas',
      route: '/currencies',
      icon: 'currency_exchange',
    },
    {
      id: 'payment-methods',
      label: 'Métodos de Pago',
      route: '/payment-methods',
      icon: 'payment',
    },
    {
      id: 'settings',
      label: 'Configuración',
      route: '/settings',
      icon: 'settings',
    },
  ]);

  // Getter público para los items de navegación
  public get navigationItems() {
    return this._navigationItems.asReadonly();
  }

  /**
   * Actualiza los items de navegación (para cuando venga de BD)
   */
  public updateNavigationItems(items: NavigationItem[]): void {
    this._navigationItems.set(items);
  }

  /**
   * Marca un item como activo basado en la ruta actual
   */
  public setActiveItem(route: string): void {
    const items = this._navigationItems().map((item) => ({
      ...item,
      isActive: item.route === route,
    }));
    this._navigationItems.set(items);
  }
}
