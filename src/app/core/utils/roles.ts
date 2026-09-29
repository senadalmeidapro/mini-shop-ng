import { Role } from '../models';

const ROLE_LABELS: Record<Role, string> = {
  user: 'Client',
  admin: 'Administrateur',
  supplier: 'Fournisseur',
};

export function roleLabel(role: Role | string | null | undefined): string {
  if (!role) {
    return '';
  }

  return ROLE_LABELS[role as Role] ?? role;
}
