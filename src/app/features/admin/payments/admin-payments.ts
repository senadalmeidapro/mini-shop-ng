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

import { PaymentMethod, PaymentStatus } from '../../../core/models';
import { PaymentStore } from '../../data-access/payment.store';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  succeeded: 'Réussi',
  failed: 'Échoué',
  cancelled: 'Annulé',
};

const STATUS_TONES: Record<string, string> = {
  pending: 'warning',
  succeeded: 'success',
  failed: 'danger',
  cancelled: 'neutral',
};

const METHOD_LABELS: Record<string, string> = {
  mobile_money: 'Mobile Money',
  card: 'Carte bancaire',
  cash: 'Espèces',
  bank_transfer: 'Virement',
};

@Component({
  selector: 'app-admin-payments',
  imports: [DatePipe, DecimalPipe, NgClass],
  styleUrl: './admin-payments.scss',
  templateUrl: './admin-payments.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPayments implements OnInit {
  private readonly paymentStore = inject(PaymentStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly payments = this.paymentStore.payments;
  protected readonly loading = signal(true);
  protected readonly busyId = signal<string | null>(null);

  protected readonly succeededCount = computed(
    () => this.payments().filter((payment) => payment.status === 'succeeded').length,
  );

  protected readonly failedCount = computed(
    () => this.payments().filter((payment) => payment.status === 'failed').length,
  );

  protected readonly succeededTotal = computed(() =>
    this.payments()
      .filter((payment) => payment.status === 'succeeded')
      .reduce((sum, payment) => sum + payment.amount, 0),
  );

  protected readonly successRate = computed(() => {
    const total = this.payments().length;
    if (total === 0) {
      return 0;
    }

    return Math.round((this.succeededCount() / total) * 100);
  });

  ngOnInit(): void {
    this.paymentStore
      .getPayments()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected shortId(id: string): string {
    return id.slice(-6).toUpperCase();
  }

  protected statusLabel(status: PaymentStatus): string {
    return STATUS_LABELS[status] ?? status;
  }

  protected tone(status: PaymentStatus): string {
    return STATUS_TONES[status] ?? 'neutral';
  }

  protected methodLabel(method: PaymentMethod): string {
    return METHOD_LABELS[method] ?? method;
  }

  protected cancelPayment(id: string): void {
    this.busyId.set(id);

    this.paymentStore
      .cancelPayment(id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
