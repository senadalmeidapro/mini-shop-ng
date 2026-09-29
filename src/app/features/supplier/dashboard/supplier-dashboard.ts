import { DecimalPipe, NgClass } from '@angular/common';
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
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, tap } from 'rxjs';

import { ShopStore } from '../../data-access/shop.store';
import { SupplierStore } from '../../data-access/supplier.store';

@Component({
  selector: 'app-supplier-dashboard',
  imports: [ReactiveFormsModule, DecimalPipe, NgClass, RouterLink],
  styleUrl: './supplier-dashboard.scss',
  templateUrl: './supplier-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierDashboard implements OnInit {
  private readonly supplierStore = inject(SupplierStore);
  private readonly shopStore = inject(ShopStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly dashboard = this.supplierStore.dashboard;
  protected readonly loading = this.supplierStore.loading;
  protected readonly hasShop = this.supplierStore.hasShop;

  protected readonly creatingShop = signal(false);

  protected readonly shopForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    slug: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
  });

  protected readonly ordersByStatus = computed(() =>
    Object.entries(this.dashboard()?.ordersByStatus ?? {}),
  );

  ngOnInit(): void {
    this.supplierStore.getDashboard().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected autofillSlug(): void {
    const name = this.shopForm.controls.name.value;

    if (!this.shopForm.controls.slug.dirty) {
      this.shopForm.controls.slug.setValue(this.slugify(name));
    }
  }

  protected createShop(): void {
    if (this.shopForm.invalid) {
      this.shopForm.markAllAsTouched();
      return;
    }

    this.creatingShop.set(true);

    const { name, slug, description } = this.shopForm.getRawValue();

    this.shopStore
      .createShop({ name, slug: slug || this.slugify(name), description: description || undefined })
      .pipe(
        tap(() => {
          if (this.shopStore.myShop()) {
            this.supplierStore.getDashboard().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
          }
        }),
        finalize(() => this.creatingShop.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected relativeDate(date: string | undefined): string {
    const value = new Date(date ?? Date.now());
    const diff = Date.now() - value.getTime();
    const mins = Math.floor(diff / 60000);

    if (mins < 1) {
      return "à l'instant";
    }

    if (mins < 60) {
      return `il y a ${mins} min`;
    }

    const hrs = Math.floor(mins / 60);

    if (hrs < 24) {
      return `il y a ${hrs} h`;
    }

    return value.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  protected statusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
      completed: 'Terminée',
    };

    return labels[status] ?? status;
  }

  protected statusTone(status: string): string {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
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

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }
}
