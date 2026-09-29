import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { ApiError } from '../../../core/api/errors';

@Component({
  selector: 'app-reset-password-request',
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './reset-password-request.scss',
  templateUrl: './reset-password-request.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordRequest {
  readonly loading = signal(false);
  readonly sent = signal(false);
  readonly error = signal<string | null>(null);

  private auth = inject(AuthService);

  readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  submit() {
    if (this.email.invalid) {
      this.email.markAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth
      .requestPasswordReset(this.email.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.sent.set(true),
        error: (error: ApiError) => this.error.set(error.message),
      });
  }
}
