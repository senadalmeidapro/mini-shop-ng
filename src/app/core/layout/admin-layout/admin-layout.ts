import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { roleLabel } from '../../utils/roles';

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

  protected readonly collapsed = signal(false);
  protected readonly mobileOpen = signal(false);

  protected readonly user = computed(() => this.auth.getUser());
  protected readonly initials = computed(() => this.user()?.fullName ?? this.user()?.email ?? 'A');
  protected readonly role = computed(() => roleLabel(this.auth.role()));

  protected toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
  }

  protected toggleMobile(): void {
    this.mobileOpen.update((value) => !value);
  }

  protected closeMobile(): void {
    this.mobileOpen.set(false);
  }

  protected signOut(): void {
    this.closeMobile();
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: () => this.router.navigateByUrl('/'),
    });
  }
}
