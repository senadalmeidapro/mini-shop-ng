import { roleLabel } from './roles';

describe('roleLabel', () => {
  it('translates the known roles', () => {
    expect(roleLabel('user')).toBe('Client');
    expect(roleLabel('admin')).toBe('Administrateur');
    expect(roleLabel('supplier')).toBe('Fournisseur');
  });

  it('falls back to the raw value for an unknown role', () => {
    expect(roleLabel('superadmin')).toBe('superadmin');
  });

  it('returns an empty string without a role', () => {
    expect(roleLabel(null)).toBe('');
    expect(roleLabel(undefined)).toBe('');
  });
});
