import { Routes } from '@angular/router';

import { adminGuard, authGuard, guestGuard, supplierGuard } from './core/auth/guards';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./core/layout/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/public/home/home').then((m) => m.Home),
      },
      {
        path: 'products',
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () => import('./features/public/product/product').then((m) => m.Product),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/public/product-detail/product-detail').then(
                (m) => m.ProductDetail,
              ),
          },
        ],
      },
      {
        path: 'shops',
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () => import('./features/public/shop/shop').then((m) => m.Shop),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/public/shop-detail/shop-detail').then((m) => m.ShopDetail),
          },
        ],
      },
      {
        path: 'about',
        loadComponent: () => import('./features/public/about/about').then((m) => m.About),
      },
      {
        path: 'contact',
        loadComponent: () => import('./features/public/contact/contact').then((m) => m.Contact),
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('./features/account/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'notifications',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/account/notifications/notifications').then((m) => m.Notifications),
      },
      {
        path: 'orders',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/account/orders/orders-view/orders-view').then((m) => m.OrdersView),
      },
      {
        path: 'admin',
        canActivate: [authGuard, adminGuard],
        loadComponent: () =>
          import('./core/layout/admin-layout/admin-layout').then((m) => m.AdminLayout),
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./features/admin/dashboard/admin-dashboard').then((m) => m.AdminDashboard),
          },
          {
            path: 'users',
            loadComponent: () =>
              import('./features/admin/users/admin-users').then((m) => m.AdminUsers),
          },
          {
            path: 'categories',
            loadComponent: () =>
              import('./features/admin/categories/admin-categories').then((m) => m.AdminCategories),
          },
          {
            path: 'products',
            loadComponent: () =>
              import('./features/admin/products/admin-products').then((m) => m.AdminProducts),
          },
          {
            path: 'orders',
            loadComponent: () =>
              import('./features/admin/orders/admin-orders').then((m) => m.AdminOrders),
          },
          {
            path: 'payments',
            loadComponent: () =>
              import('./features/admin/payments/admin-payments').then((m) => m.AdminPayments),
          },
          {
            path: 'reviews',
            loadComponent: () =>
              import('./features/admin/reviews/admin-reviews').then((m) => m.AdminReviews),
          },
        ],
      },
      {
        path: 'supplier',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./core/layout/supplier-layout/supplier-layout').then((m) => m.SupplierLayout),
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./features/supplier/dashboard/supplier-dashboard').then(
                (m) => m.SupplierDashboard,
              ),
          },
          {
            path: 'products',
            canActivate: [supplierGuard],
            loadComponent: () =>
              import('./features/supplier/products/supplier-products').then(
                (m) => m.SupplierProducts,
              ),
          },
          {
            path: 'orders',
            canActivate: [supplierGuard],
            loadComponent: () =>
              import('./features/supplier/orders/supplier-orders').then((m) => m.SupplierOrders),
          },
        ],
      },
    ],
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () => import('./core/layout/auth-layout/auth-layout').then((m) => m.AuthLayout),
    children: [
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
      },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'verify-email',
        loadComponent: () =>
          import('./features/auth/verify-email/verify-email').then((m) => m.VerifyEmail),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
      },
      {
        path: 'reset-password-request',
        loadComponent: () =>
          import('./features/auth/reset-password-request/reset-password-request').then(
            (m) => m.ResetPasswordRequest,
          ),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
