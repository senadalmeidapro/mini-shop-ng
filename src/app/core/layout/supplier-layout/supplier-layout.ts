import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { roleLabel } from '../../utils/roles';

@Component({
  selector: 'app-supplier-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styleUrl: './supplier-layout.scss',
  templateUrl: './supplier-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierLayout {
  private readonly auth = inject(AuthService);

  protected readonly collapsed = signal(false);
  protected readonly mobileOpen = signal(false);

  protected readonly user = computed(() => this.auth.getUser());
  protected readonly initials = computed(() => this.user()?.fullName ?? this.user()?.email ?? 'F');
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
}
