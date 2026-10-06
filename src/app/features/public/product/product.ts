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

import { CategoryStore } from '../../data-access/category.store';
import { ProductStore } from '../../data-access/product.store';
import { ProductCard } from '../../../shared/product-card/product-card';

@Component({
  selector: 'app-product',
  imports: [FormsModule, ProductCard],
  styleUrl: './product.scss',
  templateUrl: './product.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Product implements OnInit {
  private readonly productStore = inject(ProductStore);
  private readonly categoryStore = inject(CategoryStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly searchQuery = signal('');
  protected readonly selectedCategoryId = signal('');

  protected readonly categories = this.categoryStore.categories;

  protected readonly hasFilters = computed(
    () => this.searchQuery().trim() !== '' || this.selectedCategoryId() !== '',
  );

  protected readonly hasBothFilters = computed(
    () => this.searchQuery().trim() !== '' && this.selectedCategoryId() !== '',
  );

  protected readonly filteredProducts = computed(() => {
    let result = this.productStore.products();

    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query),
      );
    }

    const categoryId = this.selectedCategoryId();
    if (categoryId) {
      result = result.filter((product) => product.categoryId === categoryId);
    }

    return result;
  });

  ngOnInit(): void {
    this.productStore.getProducts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.categoryStore.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected onSearch(value: string): void {
    this.searchQuery.set(value);
  }

  protected onCategoryChange(value: string): void {
    this.selectedCategoryId.set(value);
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategoryId.set('');
  }
}
