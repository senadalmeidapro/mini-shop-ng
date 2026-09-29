import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { SupplierStore } from '../../../features/data-access/supplier.store';
import { AuthService } from '../auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.getAccessToken() || auth.isTokenExpired()) {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { redirect: state.url },
    });
  }

  return auth.role() === 'admin' ? true : router.createUrlTree(['/']);
};

export const supplierGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const supplier = inject(SupplierStore);
  const router = inject(Router);

  if (!auth.getAccessToken() || auth.isTokenExpired()) {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { redirect: state.url },
    });
  }

  if (auth.role() === 'admin' || auth.role() === 'supplier') {
    return true;
  }

  if (!supplier.isLoaded()) {
    await firstValueFrom(supplier.checkMyShop());
  }

  return supplier.hasShop() ? true : router.createUrlTree(['/supplier']);
};
