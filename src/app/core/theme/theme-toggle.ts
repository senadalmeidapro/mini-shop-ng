import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ThemeMode, ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  styleUrl: './theme-toggle.scss',
  templateUrl: './theme-toggle.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  private readonly theme = inject(ThemeService);

  protected readonly isDark = this.theme.isDark;
  protected readonly label = computed(() => (this.theme.isDark() ? 'Thème sombre' : 'Thème clair'));

  protected setMode(mode: ThemeMode): void {
    this.theme.setMode(mode);
  }
}
