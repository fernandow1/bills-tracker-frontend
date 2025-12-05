import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { NavigationItem } from '@core/services/navigation.service';

@Component({
  selector: 'app-nav-item',
  imports: [MatListModule, MatIconModule, RouterLink, RouterLinkActive],
  template: `
    <a
      mat-list-item
      [routerLink]="route"
      routerLinkActive="active-nav-item"
      class="nav-item"
      [class.active]="isActive"
    >
      <mat-icon matListItemIcon>{{ icon }}</mat-icon>
      <span matListItemTitle>{{ label }}</span>
    </a>
  `,
  styles: [
    `
      .nav-item {
        border-radius: 8px;
        margin: 4px 8px;
        transition: all 0.2s ease-in-out;

        &:hover {
          background-color: rgba(0, 0, 0, 0.04);
        }

        &.active,
        &.active-nav-item {
          background-color: var(--mat-sys-primary-container);
          color: var(--mat-sys-on-primary-container);

          mat-icon {
            color: var(--mat-sys-on-primary-container);
          }
        }
      }

      mat-icon {
        margin-right: 16px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavItemComponent {
  public readonly item = input.required<NavigationItem>();

  // Getters para evitar calls de funciones en template
  protected get route(): string {
    return this.item().route;
  }

  protected get isActive(): boolean {
    return this.item().isActive || false;
  }

  protected get icon(): string {
    return this.item().icon;
  }

  protected get label(): string {
    return this.item().label;
  }
}
