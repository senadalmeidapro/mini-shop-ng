import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { Order, OrderStatus } from '../../../core/models';
import { OrderStore } from '../../data-access/order.store';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const STATUS_TONES: Record<string, string> = {
  pending: 'warning',
  confirmed: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
};

@Component({
  selector: 'app-admin-orders',
  imports: [DatePipe, DecimalPipe, NgClass],
  styleUrl: './admin-orders.scss',
  templateUrl: './admin-orders.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrders implements OnInit {
  private readonly orderStore = inject(OrderStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly orders = this.orderStore.orders;
  protected readonly loading = signal(true);
  protected readonly busyId = signal<string | null>(null);

  protected readonly pendingCount = computed(
    () => this.orders().filter((order) => order.status === 'pending').length,
  );

  ngOnInit(): void {
    this.orderStore
      .getOrders()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected shortId(id: string): string {
    return id.slice(-6).toUpperCase();
  }

  protected statusLabel(status: OrderStatus): string {
    return STATUS_LABELS[status] ?? status;
  }

  protected statusTone(status: OrderStatus): string {
    return STATUS_TONES[status] ?? 'neutral';
  }

  protected confirmOrder(id: string): void {
    this.busyId.set(id);

    this.orderStore
      .updateOrder(id, { status: 'confirmed' })
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected customerEmail(order: Order): string {
    return order.user?.email ?? order.userId;
  }
}
