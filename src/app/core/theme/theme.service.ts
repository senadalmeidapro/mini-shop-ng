import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'mini-shop-theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly media = this.isBrowser ? this.createMediaQuery() : null;

  private readonly stored = this.readStoredMode();

  readonly mode = signal<ThemeMode>(this.stored ?? (this.prefersDark() ? 'dark' : 'light'));
  readonly isDark = computed(() => this.mode() === 'dark');
  readonly isExplicit = this.stored !== null;

  constructor() {
    effect(() => this.applyMode(this.mode()));

    this.media?.addEventListener('change', this.onSystemThemeChange);
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);

    if (this.isBrowser) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
      } catch {
        /* stockage indisponible */
      }
    }
  }

  toggle(): void {
    this.setMode(this.mode() === 'dark' ? 'light' : 'dark');
  }

  private readonly onSystemThemeChange = (event: MediaQueryListEvent): void => {
    if (this.readStoredMode() !== null) {
      return;
    }

    this.mode.set(event.matches ? 'dark' : 'light');
  };

  private applyMode(mode: ThemeMode): void {
    if (!this.isBrowser) {
      return;
    }

    document.documentElement.dataset['theme'] = mode;
    document.documentElement.style.colorScheme = mode;
  }

  private prefersDark(): boolean {
    return this.media?.matches ?? false;
  }

  private createMediaQuery(): MediaQueryList | null {
    if (typeof window.matchMedia !== 'function') {
      return null;
    }

    return window.matchMedia(DARK_QUERY);
  }

  private readStoredMode(): ThemeMode | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const value = localStorage.getItem(THEME_STORAGE_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch {
      return null;
    }
  }
}
