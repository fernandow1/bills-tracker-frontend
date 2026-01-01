import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly themeKey = 'app-theme';

  // Signal para el tema actual
  public readonly currentTheme = signal<Theme>(this.getStoredTheme());

  constructor() {
    // Effect para aplicar el tema cuando cambie
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
      this.storeTheme(theme);
    });

    // Aplicar tema inicial
    this.applyTheme(this.currentTheme());
  }

  /**
   * Alterna entre light y dark mode
   */
  public toggleTheme(): void {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.currentTheme.set(newTheme);
  }

  /**
   * Establece un tema específico
   */
  public setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
  }

  /**
   * Verifica si está en dark mode
   */
  public get isDarkMode(): boolean {
    return this.currentTheme() === 'dark';
  }

  /**
   * Aplica el tema al body
   */
  private applyTheme(theme: Theme): void {
    document.body.setAttribute('data-theme', theme);
    document.body.style.colorScheme = theme;
  }

  /**
   * Obtiene el tema almacenado en localStorage
   */
  private getStoredTheme(): Theme {
    try {
      const stored = localStorage.getItem(this.themeKey);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }

      // Si no hay tema guardado, usar preferencia del sistema
      return this.getSystemPreference();
    } catch (error) {
      console.error('Error getting stored theme:', error);
      return this.getSystemPreference();
    }
  }

  /**
   * Almacena el tema en localStorage
   */
  private storeTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.themeKey, theme);
    } catch (error) {
      console.error('Error storing theme:', error);
    }
  }

  /**
   * Obtiene la preferencia del sistema
   */
  private getSystemPreference(): Theme {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
}
