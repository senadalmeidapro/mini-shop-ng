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

import { Category } from '../../../core/models';
import { CategoryStore } from '../../data-access/category.store';

@Component({
  selector: 'app-admin-categories',
  imports: [ReactiveFormsModule],
  styleUrl: './admin-categories.scss',
  templateUrl: './admin-categories.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCategories implements OnInit {
  private readonly categoryStore = inject(CategoryStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly categories = this.categoryStore.categories;
  protected readonly isLoading = this.categoryStore.isLoading;

  protected readonly editingId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly deletingId = signal<string | null>(null);

  protected readonly isEditing = computed(() => this.editingId() !== null);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    slug: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.categoryStore.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected startEdit(category: Category): void {
    this.editingId.set(category.id);
    this.form.setValue({ name: category.name, slug: category.slug });
  }

  protected resetForm(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', slug: '' });
  }

  protected handleSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const { name, slug } = this.form.getRawValue();
    const editingId = this.editingId();

    const request = editingId
      ? this.categoryStore.updateCategory(editingId, {
          name: name || undefined,
          slug: slug || undefined,
        })
      : this.categoryStore.createCategory({ name, slug });

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

    this.categoryStore
      .deleteCategory(id)
      .pipe(
        finalize(() => this.deletingId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
