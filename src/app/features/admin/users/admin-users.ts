import { NgClass } from '@angular/common';
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

import { User } from '../../../core/models';
import { roleLabel } from '../../../core/utils/roles';
import { UserStore } from '../../data-access/user.store';

@Component({
  selector: 'app-admin-users',
  imports: [ReactiveFormsModule, NgClass],
  styleUrl: './admin-users.scss',
  templateUrl: './admin-users.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsers implements OnInit {
  private readonly userStore = inject(UserStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly users = this.userStore.users;
  protected readonly isLoading = this.userStore.isLoading;

  protected readonly editingId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly deletingId = signal<string | null>(null);

  protected readonly isEditing = computed(() => this.editingId() !== null);

  protected readonly form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', { nonNullable: true }),
  });

  protected readonly roleLabel = roleLabel;

  ngOnInit(): void {
    this.userStore.getUsers().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected initialsOf(user: User): string {
    const source = user.fullName?.trim() || user.email;
    const parts = source.split(/[\s@._-]+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  protected startEdit(user: User): void {
    this.editingId.set(user.id);
    this.form.setValue({
      fullName: user.fullName ?? '',
      email: user.email,
      password: '',
    });
  }

  protected resetForm(): void {
    this.editingId.set(null);
    this.form.reset({ fullName: '', email: '', password: '' });
  }

  protected handleSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const { fullName, email, password } = this.form.getRawValue();
    const editingId = this.editingId();

    const request = editingId
      ? this.userStore.updateUser(editingId, {
          fullName: fullName || undefined,
          email: email || undefined,
          password: password || undefined,
        })
      : this.userStore.createUser({ fullName: fullName || undefined, email, password });

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

    this.userStore
      .deleteUser(id)
      .pipe(
        finalize(() => this.deletingId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
