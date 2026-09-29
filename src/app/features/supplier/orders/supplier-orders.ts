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
import { FormsModule } from '@angular/forms';
import { finalize, tap } from 'rxjs';

import { OrderStatus } from '../../../core/models';
import { OrderStore } from '../../data-access/order.store';

@Component({
  selector: 'app-supplier-orders',
  imports: [FormsModule, DatePipe, DecimalPipe, NgClass],
  styleUrl: './supplier-orders.scss',
  templateUrl: './supplier-orders.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierOrders implements OnInit {
  private readonly orderStore = inject(OrderStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly orders = this.orderStore.orders;
  protected readonly loading = signal(true);
  protected readonly trackingInputs = signal<Record<string, string>>({});
  protected readonly busyId = signal<string | null>(null);

  protected readonly pendingCount = computed(
    () => this.orders().filter((order) => order.status === 'pending').length,
  );

  protected readonly statusLabels: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    completed: 'Terminée',
    cancelled: 'Annulée',
  };

  ngOnInit(): void {
    this.orderStore
      .getOrders()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected statusLabel(status: string): string {
    return this.statusLabels[status] ?? status;
  }

  protected statusTone(status: string): string {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
      case 'shipped':
        return 'info';
      case 'delivered':
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  protected canManage(status: string): boolean {
    return status !== 'cancelled' && status !== 'completed';
  }

  protected nextStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Confirmer';
      case 'confirmed':
        return 'Expédier';
      case 'shipped':
        return 'Marquer livrée';
      case 'delivered':
        return 'Terminer';
      default:
        return '';
    }
  }

  protected nextStatus(status: string): OrderStatus | undefined {
    switch (status) {
      case 'pending':
        return 'confirmed';
      case 'confirmed':
        return 'shipped';
      case 'shipped':
        return 'delivered';
      case 'delivered':
        return 'completed';
      default:
        return undefined;
    }
  }

  protected canCancel(status: string): boolean {
    return status === 'pending' || status === 'confirmed';
  }

  protected setTracking(id: string, value: string): void {
    this.trackingInputs.update((inputs) => ({ ...inputs, [id]: value }));
  }

  protected advanceStatus(id: string, current: string): void {
    const next = this.nextStatus(current);

    if (!next) {
      return;
    }

    const data: { status: OrderStatus; trackingNumber?: string } = { status: next };

    if (next === 'shipped' && this.trackingInputs()[id]?.trim()) {
      data.trackingNumber = this.trackingInputs()[id].trim();
    }

    this.busyId.set(id);

    this.orderStore
      .updateOrder(id, data)
      .pipe(
        tap(() => {
          if (next === 'shipped') {
            this.setTracking(id, '');
          }
        }),
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected cancelOrder(id: string): void {
    this.busyId.set(id);

    this.orderStore
      .updateOrder(id, { status: 'cancelled' })
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
