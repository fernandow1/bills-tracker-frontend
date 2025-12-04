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
@Component({
  selector: 'app-layout',
  imports: [
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    RouterOutlet,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout implements OnDestroy {
  protected readonly isMobile = signal(true);

  protected readonly navOptions = Array.from({ length: 5 }, (_, i) => `Nav Option ${i + 1}`);

  protected readonly fillerContent = Array.from(
    { length: 50 },
    () =>
      `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
       labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
       laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
       voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
       cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`
  );

  private readonly _mobileQuery: MediaQueryList;
  private readonly _mobileQueryListener: () => void;
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

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
