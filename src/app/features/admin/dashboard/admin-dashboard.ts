import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { CategoryStore } from '../../data-access/category.store';
import { OrderStore } from '../../data-access/order.store';
import { PaymentStore } from '../../data-access/payment.store';
import { ProductStore } from '../../data-access/product.store';
import { ReviewStore } from '../../data-access/review.store';
import { UserStore } from '../../data-access/user.store';

interface Stat {
  key: string;
  label: string;
  value: number;
  hint: string;
  path: string;
  icon: string;
  accent?: boolean;
}

interface QuickLink {
  label: string;
  description: string;
  path: string;
  icon: string;
}

const ICONS: Record<string, string> = {
  users:
    '<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7a3 3 0 0 1 0 6 3 3 0 0 1 0-6ZM2 17a6 6 0 0 1 12 0v1H2v-1Zm14.5 1H22v-1a5.5 5.5 0 0 0-4.2-5.36A7 7 0 0 1 16.5 18Z"/>',
  products:
    '<path fill-rule="evenodd" d="M10 2a1 1 0 0 1 .6.2l6 4A1 1 0 0 1 17 7v6a1 1 0 0 1-.4.8l-6 4a1 1 0 0 1-1.2 0l-6-4A1 1 0 0 1 3 13V7a1 1 0 0 1 .4-.8l6-4A1 1 0 0 1 10 2Zm0 2.2L5.5 7 10 9.8 14.5 7 10 4.2ZM5 8.7v4.6l4 2.7v-4.6L5 8.7Zm6 7.3 4-2.7V8.7l-4 2.7V16Z" clip-rule="evenodd"/>',
  categories:
    '<path fill-rule="evenodd" d="M3 4a1 1 0 0 1 1-1h4l2 2h6a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4Z" clip-rule="evenodd"/>',
  orders:
    '<path fill-rule="evenodd" d="M4 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1h1a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h1V3Zm2 1h8V3H6v1Zm9 3v9H5V7h10Z" clip-rule="evenodd"/>',
  payments:
    '<path fill-rule="evenodd" d="M2 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v3H2V5Zm0 5h16v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-5Zm3 6h2v1H5v-1Z" clip-rule="evenodd"/>',
  reviews:
    '<path fill-rule="evenodd" d="M10 2l2.47 5.01 5.53.8-4 3.9.94 5.51L10 14.68l-4.94 2.6.94-5.5-4-3.9 5.53-.81L10 2Zm-3.5 15.3 3.5-1.85 3.5 1.85a1 1 0 0 1-1.05 1.8L10 17.9l-1.95.2a1 1 0 0 1-1.05-1.8Z" clip-rule="evenodd"/>',
  revenue:
    '<path d="M10 1a1 1 0 0 1 1 1v1.06A6 6 0 0 1 16.94 9H18a1 1 0 1 1 0 2h-1.06A6 6 0 0 1 11 16.94V18a1 1 0 1 1-2 0v-1.06A6 6 0 0 1 3.06 11H2a1 1 0 1 1 0-2h1.06A6 6 0 0 1 9 3.06V2a1 1 0 0 1 1-1Z"/>',
  people:
    '<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7a3 3 0 0 1 0 6 3 3 0 0 1 0-6ZM2 17a6 6 0 0 1 12 0v1H2v-1Zm14.5 1H22v-1a5.5 5.5 0 0 0-4.2-5.36A7 7 0 0 1 16.5 18Z"/>',
  store:
    '<path fill-rule="evenodd" d="M3 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2a3 3 0 0 1-2 2.83V17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7.83A3 3 0 0 1 2 5V3Zm1 4.83V16h10V7.83A3 3 0 0 0 15 5H5a3 3 0 0 0-1 2.83ZM5 4v1h10V4H5Z" clip-rule="evenodd"/>',
  order:
    '<path fill-rule="evenodd" d="M4 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1h1a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h1V3Zm2 1h8V3H6v1Zm9 3v9H5V7h10Z" clip-rule="evenodd"/>',
  payment:
    '<path fill-rule="evenodd" d="M2 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v3H2V5Zm0 5h16v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-5Zm3 6h2v1H5v-1Z" clip-rule="evenodd"/>',
};

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, DecimalPipe],
  styleUrl: './admin-dashboard.scss',
  templateUrl: './admin-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard implements OnInit {
  private readonly userStore = inject(UserStore);
  private readonly categoryStore = inject(CategoryStore);
  private readonly productStore = inject(ProductStore);
  private readonly orderStore = inject(OrderStore);
  private readonly paymentStore = inject(PaymentStore);
  private readonly reviewStore = inject(ReviewStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly totalUsers = computed(() => this.userStore.users().length);
  protected readonly totalOrders = computed(() => this.orderStore.orders().length);
  protected readonly totalProducts = computed(() => this.productStore.products().length);
  protected readonly totalPayments = computed(() => this.paymentStore.payments().length);
  protected readonly totalCategories = computed(() => this.categoryStore.categories().length);
  protected readonly totalReviews = computed(() => this.reviewStore.reviews().length);

  protected readonly isLoading = computed(
    () =>
      this.userStore.isLoading() || this.categoryStore.isLoading() || this.productStore.isLoading(),
  );

  protected readonly totalRevenue = computed(() =>
    this.paymentStore
      .payments()
      .filter((payment) => payment.status === 'succeeded')
      .reduce((sum, payment) => sum + payment.amount, 0),
  );

  protected readonly pendingOrders = computed(
    () => this.orderStore.orders().filter((order) => order.status === 'pending').length,
  );

  protected readonly averageBasket = computed(() => {
    const orders = this.orderStore.orders();
    if (orders.length === 0) {
      return 0;
    }

    const total = orders.reduce((sum, order) => sum + order.total, 0);
    return Math.round(total / orders.length);
  });

  protected readonly successRate = computed(() => {
    const payments = this.paymentStore.payments();
    if (payments.length === 0) {
      return 0;
    }

    const succeeded = payments.filter((payment) => payment.status === 'succeeded').length;
    return Math.round((succeeded / payments.length) * 100);
  });

  protected readonly stats = computed<Stat[]>(() => [
    {
      key: 'users',
      label: 'Utilisateurs',
      value: this.totalUsers(),
      hint: 'Comptes enregistrés',
      path: '/admin/users',
      icon: ICONS['users'],
    },
    {
      key: 'orders',
      label: 'Commandes',
      value: this.totalOrders(),
      hint: `${this.pendingOrders()} en attente`,
      path: '/admin/orders',
      icon: ICONS['orders'],
    },
    {
      key: 'products',
      label: 'Produits',
      value: this.totalProducts(),
      hint: `${this.totalCategories()} catégories`,
      path: '/admin/products',
      icon: ICONS['products'],
    },
    {
      key: 'payments',
      label: 'Paiements',
      value: this.totalPayments(),
      hint: `${this.successRate()} % réussis`,
      path: '/admin/payments',
      icon: ICONS['payments'],
    },
  ]);

  protected readonly quickLinks = computed<QuickLink[]>(() => [
    {
      label: 'Gérer les produits',
      description: `${this.totalProducts()} références en catalogue`,
      path: '/admin/products',
      icon: ICONS['store'],
    },
    {
      label: 'Traiter les commandes',
      description: `${this.pendingOrders()} commandes en attente`,
      path: '/admin/orders',
      icon: ICONS['order'],
    },
    {
      label: 'Suivre les paiements',
      description: `${this.totalPayments()} transactions enregistrées`,
      path: '/admin/payments',
      icon: ICONS['payment'],
    },
    {
      label: 'Administrer les comptes',
      description: `${this.totalUsers()} utilisateurs dans la base`,
      path: '/admin/users',
      icon: ICONS['people'],
    },
  ]);

  ngOnInit(): void {
    this.userStore.getUsers().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.categoryStore.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.productStore.getProducts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.orderStore.getOrders().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.paymentStore.getPayments().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.reviewStore.getReviews().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
