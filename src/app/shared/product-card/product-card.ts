import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { API_CONFIG } from '../../core/api/config';
import { Product } from '../../core/models';

@Component({
  selector: 'app-product-card',
  imports: [NgClass, RouterLink],
  styleUrl: './product-card.scss',
  templateUrl: './product-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  readonly product = input.required<Product>();

  protected readonly imageUrl = computed(() => {
    const url = this.product().imageUrl;
    return url ? `${API_CONFIG.baseURL}${url}` : null;
  });
}
