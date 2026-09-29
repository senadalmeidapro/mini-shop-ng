import { HttpInterceptorFn } from '@angular/common/http';
import { API_CONFIG } from '../api/config';

const ABSOLUTE_URL = /^https?:\/\//i;

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (ABSOLUTE_URL.test(req.url)) {
    return next(req);
  }

  return next(
    req.clone({
      url: `${API_CONFIG.baseURL}${req.url}`,
      setHeaders: API_CONFIG.headers,
    }),
  );
};
