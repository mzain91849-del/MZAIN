export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready for Dispatch'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface ProductSizeOption {
  label: string; // e.g., "Regular", "Double Patty", "10-inch Medium", "13-inch Large"
  priceDelta: number; // PKR added to base/sale price
}

export interface ProductAddonOption {
  id: string;
  name: string; // e.g., "Extra Cheddar Slice", "Crispy Onion Rings", "Jalapeños"
  price: number; // PKR
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  description: string;
  price: number; // Base price in PKR
  salePrice?: number | null; // Optional sale price in PKR
  imageKey: string; // Key in imageRegistry or custom URL
  isAvailable: boolean;
  trackStock: boolean;
  stockQuantity: number;
  prepEstimateMinutes: number;
  sizes: ProductSizeOption[];
  spiceLevels: string[]; // e.g., ["Mild", "Medium", "Fiery Hot"]
  addons: ProductAddonOption[];
  isFeatured: boolean;
  isCombo: boolean;
  isDemoData: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // % or PKR
  minOrderAmount: number; // PKR
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  logoUrl?: string;
  deliveryFee: number; // PKR
  freeDeliveryThreshold: number; // PKR
  minOrderAmount: number; // PKR
  phone: string;
  email: string;
  address: string;
  openingHours: string;
  deliveryCoverage: string;
  noticeBanner: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  defaultAddress: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

export interface CartItemInput {
  cartItemId: string;
  productId: string;
  quantity: number;
  selectedSize?: string;
  selectedSpice?: string;
  selectedAddonIds: string[];
}

export interface CalculatedCartItem {
  cartItemId: string;
  productId: string;
  productName: string;
  productSlug: string;
  imageKey: string;
  baseUnitPrice: number;
  sizeLabel?: string;
  sizeDelta: number;
  spiceLevel?: string;
  addons: ProductAddonOption[];
  addonsTotal: number;
  finalUnitPrice: number;
  quantity: number;
  lineTotal: number;
  isAvailable: boolean;
  maxAvailableStock: number;
}

export interface CartCalculationResponse {
  items: CalculatedCartItem[];
  subtotal: number;
  discountAmount: number;
  appliedCoupon?: {
    code: string;
    description: string;
  } | null;
  couponError?: string | null;
  deliveryFee: number;
  total: number;
  minOrderAmount: number;
  meetsMinOrder: boolean;
  amountNeededForMinOrder: number;
  amountNeededForFreeDelivery: number;
}

export interface OrderItemSnapshot {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  selectedSize?: string;
  selectedSpice?: string;
  selectedAddons: { name: string; price: number }[];
  lineTotal: number;
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  postalCode?: string;
  deliveryNotes?: string;
  paymentMethod: 'COD';
  items: OrderItemSnapshot[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string | null;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  statusHistory: OrderStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}
