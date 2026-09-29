import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password');
  const confirm = control.get('confirm');

  if (!password || !confirm) {
    return null;
  }

  if (password.value !== confirm.value) {
    return { passwordMismatch: true };
  }

  return null;
};
