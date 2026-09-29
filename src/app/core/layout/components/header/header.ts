import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { CartStore } from '../../../../features/data-access/cart.store';
import { NotificationStore } from '../../../../features/data-access/notification.store';
import { SupplierStore } from '../../../../features/data-access/supplier.store';

const REFRESH_INTERVAL = 30000;

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  styleUrl: './header.scss',
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly notifications = inject(NotificationStore);
  readonly cart = inject(CartStore);
  private readonly supplier = inject(SupplierStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly publicLinks = [
    { label: 'Accueil', to: '' },
    { label: 'Produits', to: '/products' },
    { label: 'Boutiques', to: '/shops' },
    { label: 'À propos', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  readonly menuOpen = signal(false);

  protected readonly unreadBadge = computed(() => badge(this.notifications.unreadCount()));
  protected readonly cartBadge = computed(() => badge(this.cart.itemCount()));
  protected readonly isAdmin = computed(() => this.auth.role() === 'admin');

  private timer: ReturnType<typeof setInterval> | undefined;

  private readonly onWindowFocus = () => this.refreshCounters();

  ngOnInit(): void {
    if (this.auth.getAccessToken()) {
      this.notifications.refreshUnreadCount().subscribe();
      this.cart.getMyCart().subscribe();
      this.supplier.checkMyShop().subscribe();
    }

    this.timer = setInterval(() => this.refreshCounters(), REFRESH_INTERVAL);
    window.addEventListener('focus', this.onWindowFocus);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    window.removeEventListener('focus', this.onWindowFocus);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  toggleMenu() {
    this.menuOpen.update((open) => !open);
  }

  logout() {
    this.auth
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        complete: () => this.router.navigate(['/auth/login']),
      });
    this.closeMenu();
  }

  private refreshCounters(): void {
    if (!this.auth.getAccessToken()) {
      return;
    }

    this.notifications.refreshUnreadCount().subscribe();
    this.cart.getMyCart().subscribe();
  }
}

function badge(value: number): string | null {
  if (value <= 0) {
    return null;
  }

  return value > 9 ? '9+' : String(value);
}
