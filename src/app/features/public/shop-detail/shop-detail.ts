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
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, filter, finalize, map } from 'rxjs';

import { ShopStore } from '../../data-access/shop.store';
import { ProductCard } from '../../../shared/product-card/product-card';

@Component({
  selector: 'app-shop-detail',
  imports: [ProductCard],
  styleUrl: './shop-detail.scss',
  templateUrl: './shop-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly shopStore = inject(ShopStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly shop = this.shopStore.shop;
  protected readonly isLoading = signal(true);
  protected readonly products = computed(() => this.shop()?.products ?? []);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        filter((id): id is string => id !== null),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((id) => this.loadShop(id));
  }

  private loadShop(id: string): void {
    this.shopStore.clearCurrent();
    this.isLoading.set(true);

    this.shopStore
      .getShop(id)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
