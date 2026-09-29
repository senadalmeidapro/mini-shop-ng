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
import { SupplierStore } from '../../data-access/supplier.store';

@Component({
  selector: 'app-supplier-products',
  imports: [ReactiveFormsModule, DecimalPipe, NgClass],
  styleUrl: './supplier-products.scss',
  templateUrl: './supplier-products.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierProducts implements OnInit {
  private readonly supplierStore = inject(SupplierStore);
  private readonly categoryStore = inject(CategoryStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly apiBaseUrl = API_CONFIG.baseURL;
  protected readonly products = this.supplierStore.myProducts;
  protected readonly productsLoading = this.supplierStore.productsLoading;
  protected readonly categories = this.categoryStore.categories;

  protected readonly showForm = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteId = signal<string | null>(null);
  protected readonly file = signal<File | null>(null);

  protected readonly isEditing = computed(() => this.editingId() !== null);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    price: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    stock: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    categoryId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    this.supplierStore.getMyProducts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.categoryStore.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected categoryName(id: string): string {
    return this.categories().find((category) => category.id === id)?.name ?? '—';
  }

  protected openCreate(): void {
    this.resetForm();
    this.showForm.set(true);
  }

  protected startEdit(product: Product): void {
    this.editingId.set(product.id);
    this.file.set(null);
    this.form.setValue({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId,
    });
    this.showForm.set(true);
  }

  protected resetForm(): void {
    this.editingId.set(null);
    this.file.set(null);
    this.form.reset({ name: '', description: '', price: 0, stock: 0, categoryId: '' });
  }

  protected handleFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file.set(input.files?.[0] ?? null);
  }

  protected handleSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

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
      ? this.supplierStore.updateProduct(editingId, data)
      : this.supplierStore.createProduct(categoryId, data);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.showForm.set(false);
      this.resetForm();
    });
  }

  protected confirmDelete(id: string): void {
    this.deleteId.set(id);
  }

  protected handleDelete(): void {
    const id = this.deleteId();

    if (!id) {
      return;
    }

    this.supplierStore
      .deleteProduct(id)
      .pipe(
        finalize(() => this.deleteId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
