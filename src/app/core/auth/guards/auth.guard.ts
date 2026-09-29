import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.getAccessToken() && !auth.isTokenExpired()) {
    return true;
  }

  if (auth.getAccessToken()) {
    auth.clearTokens();
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: { redirect: state.url },
  });
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.getAccessToken() ? router.createUrlTree(['/']) : true;
};
