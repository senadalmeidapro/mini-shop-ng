import { TestBed } from '@angular/core/testing';

import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

describe('ThemeService', () => {
  const root = () => document.documentElement;

  beforeEach(() => {
    localStorage.clear();
    delete root().dataset['theme'];
    root().removeAttribute('style');
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('defaults to light when nothing is stored and the system is light', () => {
    const service = TestBed.inject(ThemeService);

    expect(service.mode()).toBe('light');
    expect(service.isDark()).toBe(false);
  });

  it('restores the stored preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    const service = TestBed.inject(ThemeService);

    expect(service.mode()).toBe('dark');
    expect(service.isDark()).toBe(true);
  });

  it('ignores an invalid stored value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'neon');

    expect(TestBed.inject(ThemeService).mode()).toBe('light');
  });

  it('applies the mode on the document element', () => {
    const service = TestBed.inject(ThemeService);
    TestBed.flushEffects();

    expect(root().dataset['theme']).toBe('light');

    service.setMode('dark');
    TestBed.flushEffects();

    expect(root().dataset['theme']).toBe('dark');
    expect(root().style.colorScheme).toBe('dark');
  });

  it('persists the choice when setMode is used', () => {
    TestBed.inject(ThemeService).setMode('dark');

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('toggles between light and dark', () => {
    const service = TestBed.inject(ThemeService);

    service.toggle();
    expect(service.mode()).toBe('dark');

    service.toggle();
    expect(service.mode()).toBe('light');
  });
});
