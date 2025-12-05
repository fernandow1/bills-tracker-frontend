import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, inject, signal, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AuthService } from '@features/auth/services/auth.service';
import { ConfigService } from '@core/services/config.service';
import { NavigationService } from '@core/services/navigation.service';
import { NavItemComponent } from '@shared/components/nav-item/nav-item.component';
@Component({
  selector: 'app-layout',
  imports: [
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    RouterOutlet,
    NavItemComponent,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout implements OnDestroy {
  protected readonly isMobile = signal(true);

  private readonly _mobileQuery: MediaQueryList;
  private readonly _mobileQueryListener: () => void;
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly navigationService = inject(NavigationService);

  // Exponer los items de navegación al template
  protected get navigationItems() {
    return this.navigationService.navigationItems();
  }

  constructor() {
    const media = inject(MediaMatcher).matchMedia('(max-width: 768px)');
    this._mobileQuery = media;
    this.isMobile.set(media.matches);
    this._mobileQueryListener = () => this.isMobile.set(this._mobileQuery.matches);
    this._mobileQuery.addEventListener('change', this._mobileQueryListener);
  }

  public ngOnDestroy(): void {
    this._mobileQuery.removeEventListener('change', this._mobileQueryListener);
  }

  /**
   * Cierra la sesión del usuario
   */
  public logout(): void {
    ConfigService.log('Usuario iniciando logout desde toolbar');

    try {
      // El AuthService se encarga de limpiar datos y redirigir
      this.authService.logout();
      ConfigService.log('Logout ejecutado exitosamente');
    } catch (error) {
      ConfigService.error('Error durante el logout:', error);
    }
  }
}
