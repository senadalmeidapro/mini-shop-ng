import { DecimalPipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { distinctUntilChanged, filter, finalize, map } from 'rxjs';

import { API_CONFIG } from '../../../core/api/config';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/toast/toast.service';
import { CartStore } from '../../data-access/cart.store';
import { ProductStore } from '../../data-access/product.store';

@Component({
  selector: 'app-product-detail',
  imports: [DecimalPipe, FormsModule, NgClass, RouterLink],
  styleUrl: './product-detail.scss',
  templateUrl: './product-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productStore = inject(ProductStore);
  private readonly cartStore = inject(CartStore);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly apiBaseUrl = API_CONFIG.baseURL;
  protected readonly product = this.productStore.product;
  protected readonly productId = signal<string | null>(null);
  protected readonly quantity = signal(1);
  protected readonly isLoading = signal(true);
  protected readonly isAdding = signal(false);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        filter((id): id is string => id !== null),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((id) => this.loadProduct(id));
  }

  protected onQuantityChange(value: number): void {
    const max = Math.max(this.product()?.stock ?? 1, 1);
    const parsed = Number(value);
    const safe = Number.isFinite(parsed) ? Math.trunc(parsed) : 1;

    this.quantity.set(Math.min(Math.max(safe, 1), max));
  }

  protected addProduct(): void {
    const id = this.productId();

    if (!id || this.isAdding()) {
      return;
    }

    if (!this.auth.getAccessToken()) {
      this.toast.warning('Connectez-vous pour ajouter au panier.');
      return;
    }

    this.isAdding.set(true);

    this.cartStore
      .addItem(id, this.quantity())
      .pipe(
        finalize(() => this.isAdding.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((added) => {
        if (added) {
          this.loadProduct(id);
        }
      });
  }

  private loadProduct(id: string): void {
    this.productId.set(id);
    this.productStore.clearSelected();
    this.quantity.set(1);
    this.isLoading.set(true);

    this.productStore
      .getProduct(id)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
