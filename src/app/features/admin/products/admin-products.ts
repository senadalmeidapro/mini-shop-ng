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
import { finalize } from 'rxjs';

import { API_CONFIG } from '../../../core/api/config';
import { Product } from '../../../core/models';
import { CategoryStore } from '../../data-access/category.store';
import { ProductStore } from '../../data-access/product.store';

@Component({
  selector: 'app-admin-products',
  imports: [ReactiveFormsModule, DecimalPipe, NgClass],
  styleUrl: './admin-products.scss',
  templateUrl: './admin-products.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProducts implements OnInit {
  private readonly productStore = inject(ProductStore);
  private readonly categoryStore = inject(CategoryStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly apiBaseUrl = API_CONFIG.baseURL;
  protected readonly products = this.productStore.products;
  protected readonly categories = this.categoryStore.categories;
  protected readonly isLoading = this.productStore.isLoading;

  protected readonly editingId = signal<string | null>(null);
  protected readonly file = signal<File | null>(null);
  protected readonly saving = signal(false);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly stockAdjust = signal<Record<string, number>>({});

  protected readonly isEditing = computed(() => this.editingId() !== null);

  protected readonly outOfStockCount = computed(
    () => this.products().filter((product) => product.stock === 0).length,
  );

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    price: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    stock: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    categoryId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    this.productStore.getProducts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.categoryStore.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected categoryName(id: string): string {
    return this.categories().find((category) => category.id === id)?.name ?? '—';
  }

  protected handleFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file.set(input.files?.[0] ?? null);
  }

  protected startEdit(product: Product): void {
    this.editingId.set(product.id);
    this.form.setValue({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId,
    });
    this.file.set(null);
  }

  protected resetForm(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', description: '', price: 0, stock: 0, categoryId: '' });
    this.file.set(null);
  }

  protected handleSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const { name, description, price, stock, categoryId } = this.form.getRawValue();

    const data = new FormData();
    data.append('name', name);
    data.append('description', description);
    data.append('price', String(price));
    data.append('stock', String(stock));

    const file = this.file();
    if (file) {
      data.append('file', file);
    }

    const editingId = this.editingId();
    const request = editingId
      ? this.productStore.updateProduct(editingId, data)
      : this.productStore.createProduct(categoryId, data);

    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.resetForm(),
        complete: () => this.resetForm(),
      });
  }

  protected handleDelete(id: string): void {
    this.deletingId.set(id);

    this.productStore
      .deleteProduct(id)
      .pipe(
        finalize(() => this.deletingId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected setStockAdjust(id: string, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value) || 0;
    this.stockAdjust.update((current) => ({ ...current, [id]: value }));
  }

  protected adjustStock(product: Product): void {
    const delta = this.stockAdjust()[product.id];

    if (!delta) {
      return;
    }

    const data = new FormData();
    data.append('stock', String(Math.max(0, product.stock + delta)));

    this.productStore
      .updateProduct(product.id, data)
      .pipe(
        finalize(() => this.stockAdjust.update((current) => ({ ...current, [product.id]: 0 }))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
