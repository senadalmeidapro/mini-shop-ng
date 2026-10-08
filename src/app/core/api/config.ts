const resolveBaseURL = (): string => {
  // Same-origin in every environment: the dev server forwards /api to the
  // backend (proxy.conf.json) and nginx does the same in production
  // (nginx/default.conf.template).
  return '/api';
};

export const API_CONFIG = {
  baseURL: resolveBaseURL(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
} as const;

export const TOKEN_STORAGE_KEYS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
} as const;
