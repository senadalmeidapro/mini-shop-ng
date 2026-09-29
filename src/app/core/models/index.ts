export type Role = 'user' | 'admin' | 'supplier';

export type OrderStatus =
  'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'completed';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled';

export type PaymentMethod = 'card' | 'paypal' | 'crypto';

export type NotificationType =
  | 'new_order'
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'low_stock'
  | 'payment_succeeded';

export interface User {
  id: string;
  email: string;
  fullName?: string | null;
  role: Role;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShopDetail extends Shop {
  owner: User;
  products: Product[];
}

export interface Product {
  id: string;
  categoryId: string;
  shopId?: string;
  name: string;
  imageUrl?: string | null;
  description: string;
  price: number;
  stock: number;
  lowStockThreshold?: number;
  createdAt?: string;
  updatedAt?: string;
  shop?: Shop;
}

export interface ShippingAddress {
  fullName?: string;
  phone?: string;
  street?: string;
  city?: string;
  country?: string;
  zip?: string;
}

export interface Cart {
  id: string;
  userId: string;
  cartItems: CartItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  product: Product;
  quantity: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  userId: string;
  user?: User;
  status: OrderStatus;
  total: number;
  shippingAddress?: Record<string, string> | null;
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  orderItems: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  id: string;
  userId?: string;
  street?: string;
  city?: string;
  country?: string;
  zip?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  order?: Order;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  userId: string;
  user: User;
  productId: string;
  product: Product;
  rating?: number;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  read: boolean;
  readAt?: string | null;
  createdAt?: string;
}

export interface AdminDashboard {
  totals: {
    users: number;
    shops: number;
    products: number;
    categories: number;
    orders: number;
    lowStockProducts: number;
    revenue: number;
  };
  ordersByStatus: Record<string, number>;
  topProducts: { productId: string; name: string; quantitySold: number; revenue: number }[];
  topShops: { shopId: string; shopName: string; revenue: number; orderCount: number }[];
  recentOrders: {
    id: string;
    status: OrderStatus;
    total: number;
    customerName: string | null;
    customerEmail: string;
    createdAt: string;
  }[];
}

export interface SupplierDashboard {
  shop: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    isActive: boolean;
  };
  products: { total: number; lowStock: Product[] };
  revenue: number;
  ordersByStatus: Record<string, number>;
  recentOrders: {
    id: string;
    status: OrderStatus;
    total: number;
    customerName: string | null;
    createdAt: string;
  }[];
  notifications: { unread: number; recent: Notification[] };
}

export interface Paginate<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
