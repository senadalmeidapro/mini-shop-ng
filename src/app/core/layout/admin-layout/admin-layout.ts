import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../../auth/auth.service';
import { roleLabel } from '../../utils/roles';
import { readSidebarCollapsed, writeSidebarCollapsed } from '../sidebar-storage';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  styleUrl: './admin-layout.scss',
  templateUrl: './admin-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly collapsed = signal(readSidebarCollapsed());
  protected readonly mobileOpen = signal(false);

  protected readonly user = computed(() => this.auth.getUser());
  protected readonly initials = computed(() => {
    const source = this.user()?.fullName ?? this.user()?.email ?? 'A';
    return source.trim().charAt(0).toUpperCase() || 'A';
  });
  protected readonly role = computed(() => roleLabel(this.auth.role()));

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeMobile());
  }

  protected toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
    writeSidebarCollapsed(this.collapsed());
  }

  protected toggleMobile(): void {
    this.mobileOpen.update((value) => !value);
  }

  protected closeMobile(): void {
    this.mobileOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeMobile();
  }

  protected signOut(): void {
    this.closeMobile();
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: () => this.router.navigateByUrl('/'),
    });
  }
}
