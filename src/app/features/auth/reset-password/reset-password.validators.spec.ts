import { FormControl, FormGroup } from '@angular/forms';

import { passwordMatchValidator } from './reset-password.validators';

function makeGroup(password: string, confirm: string) {
  return new FormGroup(
    {
      password: new FormControl(password, { nonNullable: true }),
      confirm: new FormControl(confirm, { nonNullable: true }),
    },
    { validators: passwordMatchValidator },
  );
}

describe('passwordMatchValidator', () => {
  it('accepts matching passwords', () => {
    expect(makeGroup('password123', 'password123').valid).toBe(true);
  });

  it('flags a mismatch on the group', () => {
    expect(makeGroup('password123', 'password1234').hasError('passwordMismatch')).toBe(true);
  });

  it('stays valid once the mismatch is fixed', () => {
    const group = makeGroup('password123', 'nope');
    expect(group.hasError('passwordMismatch')).toBe(true);

    group.controls.confirm.setValue('password123');

    expect(group.hasError('passwordMismatch')).toBe(false);
  });
});
