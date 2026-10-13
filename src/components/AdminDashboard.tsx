import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Printer,
  ArrowRight,
  LayoutDashboard,
  ShoppingBag,
  Utensils,
  Boxes,
  FolderKanban,
  TicketPercent,
  Users,
  Settings,
  ExternalLink,
} from 'lucide-react';
import {
  Category,
  Product,
  Coupon,
  StoreSettings,
  Order,
  OrderStatus,
  UserProfile,
} from '../types';
import { ProductImage } from './ProductImage';
import { BrandLogo } from './BrandLogo';
import { apiFetch } from '../services/localStoreEngine';

interface AdminDashboardProps {
  token: string;
  onStoreUpdated: () => void;
  onExitToStorefront?: () => void;
}

interface AdminMetrics {
  totalOrders: number;
  pendingOrders: number;
  activeOrders: number;
  deliveredRevenue: number;
  outOfStockCount: number;
  lowStockCount: number;
}

interface CustomerSummary extends UserProfile {
  orderCount: number;
  totalSpent: number;
}

type AdminSection =
  | 'overview'
  | 'orders'
  | 'products'
  | 'inventory'
  | 'categories'
  | 'coupons'
  | 'customers'
  | 'settings';

const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Ready for Dispatch',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

const NEXT_STATUS_MAP: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  Pending: { next: 'Confirmed', label: 'Confirm Order' },
  Confirmed: { next: 'Preparing', label: 'Start Kitchen Prep' },
  Preparing: { next: 'Ready for Dispatch', label: 'Mark Ready for Dispatch' },
  'Ready for Dispatch': { next: 'Out for Delivery', label: 'Dispatch Rider' },
  'Out for Delivery': { next: 'Delivered', label: 'Mark Delivered (COD Collected)' },
};

const IMAGE_PRESETS = [
  { key: 'smash_burger', label: 'Double Smash Beef Burger' },
  { key: 'crispy_chicken', label: 'Crispy Fried Chicken / Fillet' },
  { key: 'woodfired_pizza', label: 'Stone-Oven Pepperoni Pizza' },
  { key: 'loaded_fries', label: 'Cheddar Crinkle Fries & Sides' },
  { key: 'hero_burger', label: 'Signature Burger & Fries Feast' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  onStoreUpdated,
  onExitToStorefront,
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalOrders: 0,
    pendingOrders: 0,
    activeOrders: 0,
    deliveredRevenue: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);

  // Order Filters & KOT Ticket Modal
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [orderSearch, setOrderSearch] = useState('');
  const [dispatchNoteByOrder, setDispatchNoteByOrder] = useState<Record<string, string>>({});
  const [kotOrder, setKotOrder] = useState<Order | null>(null);

  // Product Filters & Modal
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [sizesInput, setSizesInput] = useState('Regular:0, Large:250');
  const [spiceInput, setSpiceInput] = useState('Mild, Medium, Fiery Hot');
  const [addonsInput, setAddonsInput] = useState('Extra Cheese:120, Pickled Jalapeños:80');

  // Category Form & Edit State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [newCategorySort, setNewCategorySort] = useState('1');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Coupon Form State
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState('15');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState('1200');
  const [newCouponMaxUses, setNewCouponMaxUses] = useState('100');

  // Confirmation modal for destructive actions
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'product' | 'category' | 'coupon';
    id: string;
    name: string;
  } | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load admin dashboard.');
      }
      setMetrics(data.metrics);
      setOrders(data.orders || []);
      setProducts(data.products || []);
      setCategories(data.categories || []);
      setCoupons(data.coupons || []);
      setSettings(data.settings || null);
      setCustomers(data.customers || []);
      setNewCategorySort(String((data.categories?.length || 0) + 1));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const showNotice = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  // --- Derived Analytics for Overview ---
  const analytics = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'Cancelled');
    const avgOrderValue =
      validOrders.length > 0
        ? Math.round(metrics.deliveredRevenue / validOrders.length)
        : 0;
    const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;
    const cancelledCount = orders.filter((o) => o.status === 'Cancelled').length;

    // Top Selling Items from Order Item Snapshots
    const itemMap: Record<
      string,
      { productId: string; name: string; qtySold: number; revenue: number }
    > = {};
    validOrders.forEach((ord) => {
      ord.items.forEach((it) => {
        if (!itemMap[it.productId]) {
          itemMap[it.productId] = {
            productId: it.productId,
            name: it.productName,
            qtySold: 0,
            revenue: 0,
          };
        }
        itemMap[it.productId].qtySold += it.quantity;
        itemMap[it.productId].revenue += it.lineTotal;
      });
    });
    const topProducts = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue);

    // Category Sales Breakdown
    const catSales = categories.map((cat) => {
      const catProductIds = new Set(
        products.filter((p) => p.categoryId === cat.id).map((p) => p.id)
      );
      let unitsSold = 0;
      let revenue = 0;
      validOrders.forEach((ord) => {
        ord.items.forEach((it) => {
          if (catProductIds.has(it.productId)) {
            unitsSold += it.quantity;
            revenue += it.lineTotal;
          }
        });
      });
      return {
        id: cat.id,
        name: cat.name,
        productCount: catProductIds.size,
        unitsSold,
        revenue,
      };
    });

    const lowOrOutProducts = products.filter(
      (p) => !p.isAvailable || (p.trackStock && p.stockQuantity <= 8)
    );

    return {
      avgOrderValue,
      deliveredCount,
      cancelledCount,
      topProducts,
      catSales,
      lowOrOutProducts,
    };
  }, [orders, products, categories, metrics.deliveredRevenue]);

  // --- Filtered Orders ---
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderStatusFilter !== 'All' && o.status !== orderStatusFilter) {
        return false;
      }
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const matchNum = o.orderNumber.toLowerCase().includes(q);
        const matchName = o.customerName.toLowerCase().includes(q);
        const matchPhone = o.customerPhone.toLowerCase().includes(q);
        const matchAddr = o.deliveryAddress.toLowerCase().includes(q);
        if (!matchNum && !matchName && !matchPhone && !matchAddr) return false;
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  // --- Filtered Products ---
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (
        productCategoryFilter !== 'all' &&
        p.categoryId !== productCategoryFilter
      ) {
        return false;
      }
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.categoryName.toLowerCase().includes(q) &&
          !p.description.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [products, productCategoryFilter, productSearch]);

  // --- Order Status Handler ---
  const handleUpdateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    customNote?: string
  ) => {
    try {
      const noteToUse =
        customNote ??
        dispatchNoteByOrder[orderId] ??
        `Status updated to ${status} by Admin`;
      const res = await apiFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, note: noteToUse }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      setDispatchNoteByOrder((prev) => ({ ...prev, [orderId]: '' }));
      await fetchDashboard();
      onStoreUpdated();
      showNotice(`Order ${data.order.orderNumber} updated to "${status}".`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating order.');
    }
  };

  // --- Product Handlers ---
  const openCreateProduct = () => {
    setEditingProduct({
      name: '',
      categoryId: categories[0]?.id || '',
      description: 'Demo Menu Item: Freshly prepared to order.',
      price: 890,
      salePrice: null,
      imageKey: 'smash_burger',
      isAvailable: true,
      trackStock: true,
      stockQuantity: 25,
      prepEstimateMinutes: 15,
      isFeatured: false,
      isCombo: false,
      isDemoData: true,
    });
    setSizesInput('Regular:0, Large:250');
    setSpiceInput('Mild, Spicy');
    setAddonsInput('Extra Cheese Slice:120');
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct({ ...p });
    setSizesInput(
      (p.sizes || []).map((s) => `${s.label}:${s.priceDelta}`).join(', ')
    );
    setSpiceInput((p.spiceLevels || []).join(', '));
    setAddonsInput(
      (p.addons || []).map((a) => `${a.name}:${a.price}`).join(', ')
    );
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const basePrice = Number(editingProduct.price) || 0;
    const salePrice = editingProduct.salePrice ? Number(editingProduct.salePrice) : null;
    if (salePrice !== null && salePrice >= basePrice) {
      setError('Sale price must be lower than the base price.');
      return;
    }

    const parsedSizes = sizesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((pair) => {
        const [label, delta] = pair.split(':');
        return {
          label: (label || 'Regular').trim(),
          priceDelta: Math.max(0, Math.round(Number(delta) || 0)),
        };
      });

    const parsedSpice = spiceInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedAddons = addonsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((pair, idx) => {
        const [name, price] = pair.split(':');
        return {
          id: `addon-${idx}-${(name || 'extra').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          name: (name || 'Extra Topping').trim(),
          price: Math.max(10, Math.round(Number(price) || 100)),
        };
      });

    const payload = {
      ...editingProduct,
      sizes: parsedSizes.length > 0 ? parsedSizes : [{ label: 'Regular', priceDelta: 0 }],
      spiceLevels: parsedSpice,
      addons: parsedAddons,
    };

    try {
      const isEdit = Boolean(editingProduct.id);
      const url = isEdit
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product.');

      setEditingProduct(null);
      await fetchDashboard();
      onStoreUpdated();
      showNotice(isEdit ? 'Product updated.' : 'New product created.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save product.');
    }
  };

  const handleQuickProductPatch = async (p: Product, patch: Partial<Product>, msg?: string) => {
    try {
      const res = await apiFetch(`/api/admin/products/${p.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('Could not update product');
      await fetchDashboard();
      onStoreUpdated();
      if (msg) showNotice(msg);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating product.');
    }
  };

  const handleAdjustStock = async (p: Product, delta: number) => {
    const nextQty = Math.max(0, p.stockQuantity + delta);
    await handleQuickProductPatch(
      p,
      {
        stockQuantity: nextQty,
        isAvailable: nextQty > 0 ? true : false,
      },
      `Updated stock for "${p.name}" to ${nextQty}.`
    );
  };

  const handleBulkRestockLow = async () => {
    try {
      const res = await apiFetch('/api/admin/inventory/restock-low', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk restock failed.');
      await fetchDashboard();
      onStoreUpdated();
      showNotice(
        `Restocked ${data.updatedCount} low/out-of-stock products to 25 units and marked available.`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bulk restock failed.');
    }
  };

  // --- Destructive Delete Confirmation Execution ---
  const executeConfirmedDelete = async () => {
    if (!confirmDelete) return;
    try {
      const endpoint =
        confirmDelete.type === 'product'
          ? `/api/admin/products/${confirmDelete.id}`
          : confirmDelete.type === 'category'
          ? `/api/admin/categories/${confirmDelete.id}`
          : `/api/admin/coupons/${confirmDelete.id}`;

      const res = await apiFetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete item.');

      setConfirmDelete(null);
      await fetchDashboard();
      onStoreUpdated();
      showNotice(`Deleted "${confirmDelete.name}".`);
    } catch (err: unknown) {
      setConfirmDelete(null);
      setError(err instanceof Error ? err.message : 'Delete operation failed.');
    }
  };

  // --- Category Create & Update ---
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const res = await apiFetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCategoryName,
          description: newCategoryDesc,
          sortOrder: Number(newCategorySort) || categories.length + 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create category');
      setNewCategoryName('');
      setNewCategoryDesc('');
      await fetchDashboard();
      onStoreUpdated();
      showNotice(`Category "${data.category.name}" created.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create category.');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      const res = await apiFetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingCategory.name,
          description: editingCategory.description,
          sortOrder: editingCategory.sortOrder,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update category');
      setEditingCategory(null);
      await fetchDashboard();
      onStoreUpdated();
      showNotice(`Category "${data.category.name}" updated.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update category.');
    }
  };

  // --- Coupon Create & Toggle ---
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    try {
      const res = await apiFetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: newCouponCode,
          description: newCouponDesc,
          discountType: newCouponType,
          discountValue: Number(newCouponValue),
          minOrderAmount: Number(newCouponMinOrder),
          maxUses: Number(newCouponMaxUses),
          isActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create coupon');
      setNewCouponCode('');
      setNewCouponDesc('');
      await fetchDashboard();
      onStoreUpdated();
      showNotice(`Coupon "${data.coupon.code}" added.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create coupon.');
    }
  };

  const handleToggleCoupon = async (c: Coupon) => {
    try {
      const res = await apiFetch(`/api/admin/coupons/${c.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      if (!res.ok) throw new Error('Failed to update coupon');
      await fetchDashboard();
      onStoreUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating coupon.');
    }
  };

  // --- Settings Save ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      setSettings(data.settings);
      onStoreUpdated();
      showNotice('Store configuration updated.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving store settings.');
    }
  };

  const navItems: {
    id: AdminSection;
    label: string;
    count?: number;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'overview', label: '01. Overview & Sales', icon: LayoutDashboard },
    {
      id: 'orders',
      label: '02. Live Orders & KOT',
      count: metrics.pendingOrders > 0 ? metrics.pendingOrders : orders.length,
      icon: ShoppingBag,
    },
    {
      id: 'products',
      label: '03. Menu Products',
      count: products.length,
      icon: Utensils,
    },
    {
      id: 'inventory',
      label: '04. Stock & Inventory',
      count: metrics.outOfStockCount + metrics.lowStockCount,
      icon: Boxes,
    },
    {
      id: 'categories',
      label: '05. Categories',
      count: categories.length,
      icon: FolderKanban,
    },
    {
      id: 'coupons',
      label: '06. Promo Coupons',
      count: coupons.length,
      icon: TicketPercent,
    },
    {
      id: 'customers',
      label: '07. Customers & Roles',
      count: customers.length,
      icon: Users,
    },
    { id: 'settings', label: '08. Store Settings', icon: Settings },
  ];

  const sectionLabels: Record<AdminSection, string> = {
    overview: 'Executive Overview & Sales Analytics',
    orders: 'Live Order Management & Kitchen Dispatch',
    products: 'Products & Menu Catalog Management',
    inventory: 'Inventory Ledger & Stock Alerts',
    categories: 'Menu Category Organization',
    coupons: 'Promotions & Discount Coupon Engine',
    customers: 'Customer Accounts & Access Directory',
    settings: 'Store Rules, Brand Logo & Configuration',
  };

  if (loading && orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-sm text-[#202124]/70">Loading store management workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-[#FFF8EE]">
      {/* Left Sidebar Navigation (260px on Desktop, horizontal scrollable strip on Mobile) */}
      <aside className="w-full lg:w-[268px] shrink-0 bg-[#202124] text-white border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between">
        <div className="p-4 lg:p-5 space-y-5">
          {/* Brand Admin Lockup */}
          <div className="flex items-center justify-between lg:justify-start gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <BrandLogo
                size="sm"
                showTextLockup={false}
                storeName={settings?.storeName || 'Zain Fast Food'}
                customLogoUrl={settings?.logoUrl}
              />
              <div>
                <div className="text-sm font-bold text-white leading-tight">
                  Zain Admin Console
                </div>
                <div className="text-[11px] text-[#FFC928]">
                  Store & Kitchen Control
                </div>
              </div>
            </div>
            {onExitToStorefront && (
              <button
                type="button"
                onClick={onExitToStorefront}
                className="lg:hidden px-3 py-1.5 text-xs font-semibold bg-white/10 rounded-lg text-white"
              >
                View Store
              </button>
            )}
          </div>

          {/* Navigation Menu */}
          <nav
            aria-label="Admin Console Sections"
            className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 text-left ${
                    active
                      ? 'bg-[#D92332] text-white'
                      : 'text-white/75 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`font-mono-tabular text-[11px] px-1.5 py-0.5 rounded ${
                        active
                          ? 'bg-black/25 text-white'
                          : 'bg-white/10 text-white/80'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Storefront Link */}
        <div className="hidden lg:block p-5 border-t border-white/10 space-y-3">
          <div className="text-[11px] text-white/60">
            Delivery Fee:{' '}
            <strong className="text-white font-mono-tabular">
              PKR {settings?.deliveryFee ?? 180}
            </strong>{' '}
            · Min Order:{' '}
            <strong className="text-white font-mono-tabular">
              PKR {settings?.minOrderAmount ?? 600}
            </strong>
          </div>
          {onExitToStorefront && (
            <button
              type="button"
              onClick={onExitToStorefront}
              className="w-full py-2 px-3 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Return to Live Storefront</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Admin Workspace Content Viewport */}
      <div className="flex-1 min-w-0">
        {/* Top Contextual Breadcrumb Bar */}
        <div className="bg-white border-b border-[#202124]/10 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-[#202124]/55">
              <span>Admin Console</span>
              <span aria-hidden="true"> / </span>
              <span className="font-semibold text-[#202124]">
                {sectionLabels[activeSection]}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#202124] mt-0.5">
              {sectionLabels[activeSection]}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveSection('products');
                openCreateProduct();
              }}
              className="px-3.5 py-2 text-xs font-semibold bg-[#D92332] text-white rounded-lg hover:bg-[#B81B28] flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
            <button
              type="button"
              onClick={fetchDashboard}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-[#202124]/15 rounded-lg hover:bg-[#202124]/5 flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Data</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-8 space-y-6 max-w-6xl">
          {/* Feedback / Error Banners */}
          {feedback && (
            <div className="p-4 bg-white border border-[#15803D]/30 rounded-xl flex items-center gap-3 text-sm text-[#202124]">
              <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
              <span>{feedback}</span>
            </div>
          )}
          {error && (
            <div className="p-4 bg-[#FEF2F2] border border-[#D92332]/30 rounded-xl flex items-center justify-between gap-3 text-sm text-[#991B1B]">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-xs font-semibold underline whitespace-nowrap"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* =========================================================
              SECTION 01: EXECUTIVE OVERVIEW & SALES ANALYTICS
             ========================================================= */}
          {activeSection === 'overview' && (
            <div className="space-y-8">
              {/* 6-Card Executive KPI Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-xl border border-[#202124]/10">
                  <div className="text-xs text-[#202124]/60">Active Sales (PKR)</div>
                  <div className="text-lg font-bold text-[#202124] font-mono-tabular mt-1">
                    PKR {metrics.deliveredRevenue.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#202124]/10">
                  <div className="text-xs text-[#202124]/60">Avg. Order Value</div>
                  <div className="text-lg font-bold text-[#202124] font-mono-tabular mt-1">
                    PKR {analytics.avgOrderValue.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#202124]/10">
                  <div className="text-xs text-[#202124]/60">Total Orders</div>
                  <div className="text-lg font-bold text-[#202124] font-mono-tabular mt-1">
                    {metrics.totalOrders}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#202124]/10">
                  <div className="text-xs text-[#202124]/60">Pending Kitchen</div>
                  <div className="text-lg font-bold text-[#D92332] font-mono-tabular mt-1">
                    {metrics.pendingOrders}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#202124]/10">
                  <div className="text-xs text-[#202124]/60">Active Prep/Rider</div>
                  <div className="text-lg font-bold text-[#B45309] font-mono-tabular mt-1">
                    {metrics.activeOrders}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#202124]/10">
                  <div className="text-xs text-[#202124]/60">Delivered / Cancelled</div>
                  <div className="text-lg font-bold text-[#15803D] font-mono-tabular mt-1">
                    {analytics.deliveredCount}{' '}
                    <span className="text-xs text-[#202124]/45 font-normal">
                      / {analytics.cancelledCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2-Column Split: Top Selling Products & Category Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Selling Products */}
                <div className="bg-white rounded-xl border border-[#202124]/10 overflow-hidden">
                  <div className="p-5 border-b border-[#202124]/10 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[#202124]">
                      Top Selling Menu Items (Real Order Snapshots)
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveSection('products')}
                      className="text-xs font-semibold text-[#D92332] hover:underline"
                    >
                      Manage Menu
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#202124]/10 bg-[#FFF8EE]/50 text-[#202124]/65">
                          <th className="py-2.5 px-4 font-semibold">Item Name</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Units Sold</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Revenue (PKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#202124]/8">
                        {analytics.topProducts.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-6 text-center text-[#202124]/55">
                              No order items recorded yet.
                            </td>
                          </tr>
                        ) : (
                          analytics.topProducts.map((tp) => (
                            <tr key={tp.productId} className="hover:bg-[#FFF8EE]/30">
                              <td className="py-2.5 px-4 font-semibold text-[#202124]">
                                {tp.name}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono-tabular">
                                {tp.qtySold}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono-tabular font-semibold">
                                PKR {tp.revenue.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Category Sales Breakdown */}
                <div className="bg-white rounded-xl border border-[#202124]/10 overflow-hidden">
                  <div className="p-5 border-b border-[#202124]/10 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[#202124]">
                      Sales & Catalog by Category
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveSection('categories')}
                      className="text-xs font-semibold text-[#D92332] hover:underline"
                    >
                      Manage Categories
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#202124]/10 bg-[#FFF8EE]/50 text-[#202124]/65">
                          <th className="py-2.5 px-4 font-semibold">Category</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Menu Items</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Units Sold</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Sales (PKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#202124]/8">
                        {analytics.catSales.map((cs) => (
                          <tr key={cs.id} className="hover:bg-[#FFF8EE]/30">
                            <td className="py-2.5 px-4 font-semibold text-[#202124]">
                              {cs.name}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono-tabular">
                              {cs.productCount}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono-tabular">
                              {cs.unitsSold}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono-tabular font-semibold">
                              PKR {cs.revenue.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Low-Stock & Out-of-Stock Action Queue */}
              <div className="bg-white rounded-xl border border-[#202124]/10 overflow-hidden">
                <div className="p-5 border-b border-[#202124]/10 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-[#202124]">
                      Low Stock & Sold-Out Alert Queue ({analytics.lowOrOutProducts.length})
                    </h2>
                    <p className="text-xs text-[#202124]/60 mt-0.5">
                      Items with 8 or fewer units remaining or currently marked unavailable.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleBulkRestockLow}
                    className="px-3.5 py-2 bg-[#202124] text-white text-xs font-semibold rounded-lg hover:bg-[#202124]/85 whitespace-nowrap"
                  >
                    Restock All Low/Sold-Out Items (+25)
                  </button>
                </div>

                {analytics.lowOrOutProducts.length === 0 ? (
                  <div className="p-6 text-xs text-[#15803D] font-semibold">
                    All menu items are well stocked and available for ordering.
                  </div>
                ) : (
                  <div className="divide-y divide-[#202124]/8">
                    {analytics.lowOrOutProducts.map((p) => (
                      <div
                        key={p.id}
                        className="p-4 flex flex-wrap items-center justify-between gap-4"
                      >
                        <div>
                          <div className="text-xs font-bold text-[#202124]">
                            {p.name}
                          </div>
                          <div className="text-[11px] text-[#202124]/60 font-mono-tabular mt-0.5">
                            {p.categoryName} · Stock: {p.stockQuantity} units · Status:{' '}
                            <span
                              className={
                                p.isAvailable && p.stockQuantity > 0
                                  ? 'text-[#B45309] font-semibold'
                                  : 'text-[#D92332] font-semibold'
                              }
                            >
                              {p.isAvailable && p.stockQuantity > 0
                                ? 'Low Stock'
                                : 'Sold Out / Unavailable'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(p, 15)}
                            className="px-3 py-1.5 bg-[#D92332] text-white text-xs font-semibold rounded-lg hover:bg-[#B81B28]"
                          >
                            +15 Stock & Enable
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              SECTION 02: LIVE ORDERS & KITCHEN DISPATCH (WITH KOT PRINT)
             ========================================================= */}
          {activeSection === 'orders' && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="bg-white p-4 rounded-xl border border-[#202124]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  {(['All', ...ORDER_STATUSES] as const).map((st) => {
                    const count =
                      st === 'All'
                        ? orders.length
                        : orders.filter((o) => o.status === st).length;
                    const active = orderStatusFilter === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setOrderStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                          active
                            ? 'bg-[#202124] text-white'
                            : 'bg-[#FFF8EE] text-[#202124]/75 hover:text-[#202124]'
                        }`}
                      >
                        {st} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-full md:w-64 shrink-0">
                  <Search className="w-3.5 h-3.5 text-[#202124]/45 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search Order #, Name, Phone..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#202124]/20 rounded-lg"
                  />
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-[#202124]/10 text-center">
                  <p className="text-base font-semibold text-[#202124]">
                    No matching orders found
                  </p>
                  <p className="text-xs text-[#202124]/60 mt-1">
                    Try switching the status filter to “All” or clearing the search box.
                  </p>
                </div>
              ) : (
                filteredOrders.map((ord) => {
                  const nextAction = NEXT_STATUS_MAP[ord.status];
                  return (
                    <div
                      key={ord.id}
                      className="bg-white p-6 rounded-xl border border-[#202124]/10 space-y-4"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-[#202124]/8">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#202124]/60">
                            <span className="font-mono-tabular font-bold text-sm text-[#202124]">
                              {ord.orderNumber}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{new Date(ord.createdAt).toLocaleString()}</span>
                            <span aria-hidden="true">·</span>
                            <span>Payment: {ord.paymentMethod}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-[#D92332]">
                              Status: {ord.status}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-[#202124] mt-1">
                            {ord.customerName} —{' '}
                            <span className="font-mono-tabular">{ord.customerPhone}</span>
                          </h3>
                          <p className="text-xs text-[#202124]/75 mt-0.5">
                            Delivery Address: {ord.deliveryAddress}
                            {ord.postalCode ? ` (${ord.postalCode})` : ''}
                          </p>
                          {ord.deliveryNotes && (
                            <p className="text-xs text-[#B45309] font-medium mt-1">
                              Customer Note: “{ord.deliveryNotes}”
                            </p>
                          )}
                        </div>

                        {/* Action Bar: Next Stage Button + Status Select + Print KOT */}
                        <div className="flex flex-wrap items-center gap-2.5">
                          {nextAction && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateOrderStatus(ord.id, nextAction.next)
                              }
                              className="px-3.5 py-2 bg-[#D92332] text-white text-xs font-semibold rounded-lg hover:bg-[#B81B28] inline-flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <span>{nextAction.label}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <select
                            value={ord.status}
                            onChange={(e) =>
                              handleUpdateOrderStatus(
                                ord.id,
                                e.target.value as OrderStatus
                              )
                            }
                            aria-label={`Change status for order ${ord.orderNumber}`}
                            className="px-3 py-2 bg-[#FFF8EE] border border-[#202124]/20 rounded-lg text-xs font-semibold text-[#202124]"
                          >
                            {ORDER_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => setKotOrder(ord)}
                            className="px-3 py-2 bg-white border border-[#202124]/20 text-[#202124] text-xs font-semibold rounded-lg hover:bg-[#202124]/5 inline-flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>KOT / Receipt</span>
                          </button>
                        </div>
                      </div>

                      {/* Order Item Snapshots Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-[#202124]/10 text-[#202124]/60">
                              <th className="py-2 pr-4 font-medium">Item (Snapshot)</th>
                              <th className="py-2 px-4 font-medium">Size, Spice & Add-ons</th>
                              <th className="py-2 px-4 font-medium text-right">Qty</th>
                              <th className="py-2 px-4 font-medium text-right">Unit Price</th>
                              <th className="py-2 pl-4 font-medium text-right">Line Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#202124]/6">
                            {ord.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="py-2.5 pr-4 font-semibold text-[#202124]">
                                  {item.productName}
                                </td>
                                <td className="py-2.5 px-4 text-[#202124]/70">
                                  {[
                                    item.selectedSize,
                                    item.selectedSpice ? `Spice: ${item.selectedSpice}` : null,
                                    ...(item.selectedAddons || []).map((a) => `+ ${a.name}`),
                                  ]
                                    .filter(Boolean)
                                    .join(' · ') || 'Standard'}
                                </td>
                                <td className="py-2.5 px-4 text-right font-mono-tabular">
                                  {item.quantity}
                                </td>
                                <td className="py-2.5 px-4 text-right font-mono-tabular">
                                  PKR {item.unitPrice.toLocaleString()}
                                </td>
                                <td className="py-2.5 pl-4 text-right font-semibold font-mono-tabular">
                                  PKR {item.lineTotal.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Dispatch Note & Totals Footer */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#202124]/8 text-xs">
                        <div className="text-[#202124]/65 font-mono-tabular">
                          Timeline:{' '}
                          {ord.statusHistory
                            .map(
                              (h) =>
                                `${h.status} (${new Date(h.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })})`
                            )
                            .join(' → ')}
                        </div>
                        <div className="font-mono-tabular font-bold text-[#202124] whitespace-nowrap">
                          Subtotal: PKR {ord.subtotal.toLocaleString()}
                          {ord.discountAmount > 0
                            ? ` · Promo (${ord.couponCode}): -PKR ${ord.discountAmount.toLocaleString()}`
                            : ''}{' '}
                          · Delivery: PKR {ord.deliveryFee.toLocaleString()} ·{' '}
                          <span className="text-[#D92332]">
                            Total: PKR {ord.total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* =========================================================
              SECTION 03: PRODUCTS & MENU CATALOG MANAGEMENT
             ========================================================= */}
          {activeSection === 'products' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl border border-[#202124]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold bg-[#FFF8EE] border border-[#202124]/20 rounded-lg"
                  >
                    <option value="all">All Categories ({products.length})</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="relative w-60">
                    <Search className="w-3.5 h-3.5 text-[#202124]/45 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search product name..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#202124]/20 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openCreateProduct}
                  className="px-4 py-2 bg-[#D92332] text-white text-xs font-semibold rounded-lg hover:bg-[#B81B28] inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Menu Item</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-[#202124]/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#202124]/10 bg-[#FFF8EE]/60 text-[#202124]/70">
                        <th className="py-3.5 px-4 font-semibold">Product</th>
                        <th className="py-3.5 px-4 font-semibold">Category</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Base Price</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Sale Price</th>
                        <th className="py-3.5 px-4 font-semibold text-center">Featured</th>
                        <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#202124]/8">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-[#FFF8EE]/40">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-9 rounded overflow-hidden bg-[#F5EFE6] shrink-0">
                                <ProductImage imageKey={p.imageKey} alt={p.name} />
                              </div>
                              <div>
                                <div className="font-semibold text-[#202124]">{p.name}</div>
                                <div className="text-[11px] text-[#202124]/55">
                                  {p.sizes.length} sizes · {p.addons.length} add-ons ·{' '}
                                  {p.prepEstimateMinutes}m prep
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#202124]/80">{p.categoryName}</td>
                          <td className="py-3 px-4 text-right font-mono-tabular">
                            PKR {p.price.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono-tabular">
                            {p.salePrice ? `PKR ${p.salePrice.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickProductPatch(
                                  p,
                                  { isFeatured: !p.isFeatured },
                                  `Updated featured state for "${p.name}".`
                                )
                              }
                              className={`text-xs font-semibold underline ${
                                p.isFeatured ? 'text-[#15803D]' : 'text-[#202124]/45'
                              }`}
                            >
                              {p.isFeatured ? 'Featured' : 'Standard'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickProductPatch(
                                  p,
                                  { isAvailable: !p.isAvailable },
                                  `"${p.name}" marked ${
                                    !p.isAvailable ? 'Available' : 'Unavailable'
                                  }.`
                                )
                              }
                              className={`text-xs font-semibold underline whitespace-nowrap ${
                                p.isAvailable && p.stockQuantity > 0
                                  ? 'text-[#15803D]'
                                  : 'text-[#D92332]'
                              }`}
                            >
                              {p.isAvailable && p.stockQuantity > 0
                                ? 'Available'
                                : 'Unavailable'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditProduct(p)}
                                className="p-1.5 text-[#202124]/70 hover:text-[#202124] rounded hover:bg-[#202124]/8"
                                title="Edit Product"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmDelete({
                                    type: 'product',
                                    id: p.id,
                                    name: p.name,
                                  })
                                }
                                className="p-1.5 text-[#D92332]/80 hover:text-[#D92332] rounded hover:bg-[#D92332]/10"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              SECTION 04: INVENTORY & STOCK CONTROL LEDGER
             ========================================================= */}
          {activeSection === 'inventory' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-[#202124]/10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-[#202124]">
                    Live Kitchen Stock Control
                  </h2>
                  <p className="text-xs text-[#202124]/65 mt-0.5">
                    Every customer order automatically decrements stock. When stock hits 0, ordering is blocked automatically.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBulkRestockLow}
                  className="px-4 py-2.5 bg-[#D92332] text-white text-xs font-semibold rounded-lg hover:bg-[#B81B28] whitespace-nowrap"
                >
                  Restock All Low / Out-of-Stock Items to 25
                </button>
              </div>

              <div className="bg-white rounded-xl border border-[#202124]/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#202124]/10 bg-[#FFF8EE]/60 text-[#202124]/70">
                        <th className="py-3 px-4 font-semibold">Item Name</th>
                        <th className="py-3 px-4 font-semibold">Category</th>
                        <th className="py-3 px-4 font-semibold text-center">Track Stock</th>
                        <th className="py-3 px-4 font-semibold text-center">Current Qty</th>
                        <th className="py-3 px-4 font-semibold text-center">Quick Adjust</th>
                        <th className="py-3 px-4 font-semibold text-right">Stock Health</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#202124]/8">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-[#FFF8EE]/40">
                          <td className="py-3 px-4 font-semibold text-[#202124]">
                            {p.name}
                          </td>
                          <td className="py-3 px-4 text-[#202124]/75">
                            {p.categoryName}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={p.trackStock}
                              onChange={(e) =>
                                handleQuickProductPatch(p, {
                                  trackStock: e.target.checked,
                                })
                              }
                              className="rounded border-[#202124]/30"
                            />
                          </td>
                          <td className="py-3 px-4 text-center font-mono-tabular font-bold text-sm">
                            {p.stockQuantity}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1 font-mono-tabular">
                              <button
                                type="button"
                                onClick={() => handleAdjustStock(p, -5)}
                                className="px-2 py-1 bg-[#202124]/8 rounded hover:bg-[#202124]/15"
                              >
                                -5
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustStock(p, -1)}
                                className="px-2 py-1 bg-[#202124]/8 rounded hover:bg-[#202124]/15"
                              >
                                -1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustStock(p, 1)}
                                className="px-2 py-1 bg-[#202124]/8 rounded hover:bg-[#202124]/15"
                              >
                                +1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustStock(p, 5)}
                                className="px-2 py-1 bg-[#202124]/8 rounded hover:bg-[#202124]/15"
                              >
                                +5
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustStock(p, 15)}
                                className="px-2 py-1 bg-[#D92332] text-white rounded hover:bg-[#B81B28]"
                              >
                                +15
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">
                            {!p.isAvailable || p.stockQuantity === 0 ? (
                              <span className="text-[#D92332]">Out of Stock</span>
                            ) : p.stockQuantity <= 5 ? (
                              <span className="text-[#B45309]">Low ({p.stockQuantity})</span>
                            ) : (
                              <span className="text-[#15803D]">Healthy</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              SECTION 05: CATEGORIES MANAGEMENT
             ========================================================= */}
          {activeSection === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <form
                onSubmit={handleCreateCategory}
                className="bg-white p-6 rounded-xl border border-[#202124]/10 space-y-4 self-start"
              >
                <h3 className="text-base font-bold text-[#202124]">
                  Create Menu Category
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., Loaded Wraps"
                    className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                    placeholder="Grilled tortilla wraps..."
                    className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newCategorySort}
                    onChange={(e) => setNewCategorySort(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg bg-white font-mono-tabular"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#D92332] text-white text-xs font-semibold rounded-lg hover:bg-[#B81B28] transition-colors"
                >
                  Save Category
                </button>
              </form>

              <div className="lg:col-span-2 bg-white rounded-xl border border-[#202124]/10 divide-y divide-[#202124]/8">
                {categories.map((cat) => {
                  const count = products.filter((p) => p.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      className="p-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="text-sm font-bold text-[#202124]">
                          <span className="font-mono-tabular text-xs text-[#202124]/50 mr-2">
                            #{cat.sortOrder}
                          </span>
                          {cat.name}{' '}
                          <span className="text-xs font-normal text-[#202124]/60 font-mono-tabular">
                            ({count} items)
                          </span>
                        </div>
                        <p className="text-xs text-[#202124]/70 mt-0.5">
                          {cat.description || 'No description'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingCategory({ ...cat })}
                          className="p-2 text-[#202124]/70 hover:text-[#202124] hover:bg-[#202124]/8 rounded-lg"
                          title="Edit Category"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDelete({
                              type: 'category',
                              id: cat.id,
                              name: cat.name,
                            })
                          }
                          className="p-2 text-[#D92332] hover:bg-[#D92332]/10 rounded-lg transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================
              SECTION 06: PROMOTIONS & COUPONS
             ========================================================= */}
          {activeSection === 'coupons' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <form
                onSubmit={handleCreateCoupon}
                className="bg-white p-6 rounded-xl border border-[#202124]/10 space-y-4 self-start"
              >
                <h3 className="text-base font-bold text-[#202124]">
                  Create Coupon Code
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Promo Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g., FRIYAY20"
                    className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg uppercase font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCouponDesc}
                    onChange={(e) => setNewCouponDesc(e.target.value)}
                    placeholder="20% off weekend orders"
                    className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">
                      Discount Type
                    </label>
                    <select
                      value={newCouponType}
                      onChange={(e) =>
                        setNewCouponType(e.target.value as 'percentage' | 'fixed')
                      }
                      className="w-full px-3 py-2 text-sm border border-[#202124]/20 rounded-lg bg-white"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed PKR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">
                      Discount Value
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={newCouponValue}
                      onChange={(e) => setNewCouponValue(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#202124]/20 rounded-lg font-mono-tabular"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">
                      Min Order (PKR)
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={newCouponMinOrder}
                      onChange={(e) => setNewCouponMinOrder(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#202124]/20 rounded-lg font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={newCouponMaxUses}
                      onChange={(e) => setNewCouponMaxUses(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#202124]/20 rounded-lg font-mono-tabular"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#D92332] text-white text-xs font-semibold rounded-lg hover:bg-[#B81B28] transition-colors"
                >
                  Create Promotion
                </button>
              </form>

              <div className="lg:col-span-2 bg-white rounded-xl border border-[#202124]/10 divide-y divide-[#202124]/8">
                {coupons.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-tabular font-bold text-sm text-[#202124]">
                          {c.code}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-xs font-semibold text-[#D92332] font-mono-tabular">
                          {c.discountType === 'percentage'
                            ? `${c.discountValue}% OFF`
                            : `PKR ${c.discountValue} OFF`}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-xs text-[#202124]/60 font-mono-tabular">
                          Min PKR {c.minOrderAmount.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#202124]/70 mt-1">{c.description}</p>
                      <p className="text-[11px] text-[#202124]/50 mt-1 font-mono-tabular">
                        Redemptions: {c.usedCount} / {c.maxUses}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleToggleCoupon(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                          c.isActive
                            ? 'border-[#15803D]/30 text-[#15803D] bg-[#15803D]/5'
                            : 'border-[#202124]/20 text-[#202124]/50'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Paused'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDelete({
                            type: 'coupon',
                            id: c.id,
                            name: c.code,
                          })
                        }
                        className="p-2 text-[#D92332] hover:bg-[#D92332]/10 rounded-lg"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================
              SECTION 07: CUSTOMERS & ACCESS DIRECTORY
             ========================================================= */}
          {activeSection === 'customers' && (
            <div className="bg-white rounded-xl border border-[#202124]/10 overflow-hidden">
              <div className="p-5 border-b border-[#202124]/10">
                <h2 className="text-base font-bold text-[#202124]">
                  Registered Accounts & Customer Order Summary
                </h2>
                <p className="text-xs text-[#202124]/60 mt-0.5">
                  Customer order history is strictly scoped to each owning account.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#202124]/10 bg-[#FFF8EE]/60 text-[#202124]/70">
                      <th className="py-3.5 px-4 font-semibold">Name & Email</th>
                      <th className="py-3.5 px-4 font-semibold">Role</th>
                      <th className="py-3.5 px-4 font-semibold">Phone</th>
                      <th className="py-3.5 px-4 font-semibold">Default Delivery Address</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Orders</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Total Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202124]/8">
                    {customers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#FFF8EE]/40">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#202124]">{u.name}</div>
                          <div className="text-[11px] text-[#202124]/60">{u.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={
                              u.role === 'admin'
                                ? 'font-bold text-[#D92332]'
                                : 'text-[#202124]/75'
                            }
                          >
                            {u.role === 'admin' ? 'Administrator' : 'Customer'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono-tabular">{u.phone}</td>
                        <td className="py-3 px-4 text-[#202124]/75 max-w-xs truncate">
                          {u.defaultAddress || '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-tabular font-semibold">
                          {u.orderCount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-tabular font-bold text-[#202124]">
                          PKR {u.totalSpent.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================
              SECTION 08: STORE CONFIGURATION & BRAND SETTINGS
             ========================================================= */}
          {activeSection === 'settings' && settings && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-white p-6 sm:p-8 rounded-xl border border-[#202124]/10 max-w-3xl space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#202124]/10">
                <div>
                  <h3 className="text-lg font-bold text-[#202124]">
                    Store Rules, Brand Logo & Business Details
                  </h3>
                  <p className="text-xs text-[#202124]/65 mt-0.5">
                    Configure your active brand crest, delivery charges, and store contact details.
                  </p>
                </div>
                <BrandLogo
                  size="lg"
                  showTextLockup={false}
                  storeName={settings.storeName}
                  customLogoUrl={settings.logoUrl}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Custom Logo Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={settings.logoUrl || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, logoUrl: e.target.value })
                    }
                    placeholder="Leave blank for official Zain Crest SVG"
                    className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Or Upload Logo Image File
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          setSettings({ ...settings, logoUrl: reader.result });
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="w-full text-xs text-[#202124]/70 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#202124] file:text-white hover:file:bg-[#202124]/85"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Store Brand Name
                  </label>
                  <input
                    type="text"
                    value={settings.storeName}
                    onChange={(e) =>
                      setSettings({ ...settings, storeName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Brand Tagline
                  </label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={(e) =>
                      setSettings({ ...settings, tagline: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Standard Delivery Fee (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={settings.deliveryFee}
                    onChange={(e) =>
                      setSettings({ ...settings, deliveryFee: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Free Delivery Threshold (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={settings.freeDeliveryThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        freeDeliveryThreshold: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Minimum Order Subtotal (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={settings.minOrderAmount}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        minOrderAmount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg font-mono-tabular"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Support Phone Number
                  </label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) =>
                      setSettings({ ...settings, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Opening Hours
                  </label>
                  <input
                    type="text"
                    value={settings.openingHours}
                    onChange={(e) =>
                      setSettings({ ...settings, openingHours: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Store Kitchen Address
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) =>
                    setSettings({ ...settings, address: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Delivery Coverage Areas
                </label>
                <input
                  type="text"
                  value={settings.deliveryCoverage}
                  onChange={(e) =>
                    setSettings({ ...settings, deliveryCoverage: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Top Store Notice Banner
                </label>
                <input
                  type="text"
                  value={settings.noticeBanner}
                  onChange={(e) =>
                    setSettings({ ...settings, noticeBanner: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-[#D92332] text-white text-xs font-semibold rounded-lg hover:bg-[#B81B28] transition-colors"
              >
                Save Store Configuration
              </button>
            </form>
          )}
        </div>
      </div>

      {/* PRINTABLE KITCHEN ORDER TICKET (KOT) / RIDER RECEIPT MODAL */}
      {kotOrder && (
        <div className="fixed inset-0 z-50 bg-[#202124]/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-[#202124]/20 space-y-4 font-mono-tabular">
            <div className="text-center border-b border-dashed border-[#202124]/30 pb-3">
              <div className="text-base font-bold text-[#202124] font-display">
                {settings?.storeName || 'Zain Fast Food'} — KOT & COD Slip
              </div>
              <div className="text-xs text-[#202124]/70">
                Order: <strong>{kotOrder.orderNumber}</strong> · Status:{' '}
                <strong>{kotOrder.status}</strong>
              </div>
              <div className="text-[11px] text-[#202124]/60">
                {new Date(kotOrder.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="text-xs space-y-1 border-b border-dashed border-[#202124]/30 pb-3">
              <div>
                <strong>Customer:</strong> {kotOrder.customerName}
              </div>
              <div>
                <strong>Phone:</strong> {kotOrder.customerPhone}
              </div>
              <div>
                <strong>Address:</strong> {kotOrder.deliveryAddress}
              </div>
              {kotOrder.deliveryNotes && (
                <div>
                  <strong>Note:</strong> {kotOrder.deliveryNotes}
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs border-b border-dashed border-[#202124]/30 pb-3">
              {kotOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between gap-2">
                  <div>
                    <strong>{it.quantity}x</strong> {it.productName}
                    <div className="text-[11px] text-[#202124]/65">
                      {[
                        it.selectedSize,
                        it.selectedSpice,
                        ...(it.selectedAddons || []).map((a) => `+${a.name}`),
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                  <div className="shrink-0">PKR {it.lineTotal.toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>PKR {kotOrder.subtotal.toLocaleString()}</span>
              </div>
              {kotOrder.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span>Promo ({kotOrder.couponCode}):</span>
                  <span>-PKR {kotOrder.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span>PKR {kotOrder.deliveryFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-[#202124]/15">
                <span>Collect Cash (COD):</span>
                <span>PKR {kotOrder.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#202124] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => setKotOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-[#202124]/70 hover:text-[#202124]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY EDIT MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-[#202124]/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateCategory}
            className="bg-white rounded-xl max-w-md w-full p-6 border border-[#202124]/15 space-y-4"
          >
            <h3 className="text-lg font-bold text-[#202124]">Edit Category</h3>
            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={editingCategory.name}
                onChange={(e) =>
                  setEditingCategory({ ...editingCategory, name: e.target.value })
                }
                className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-1">
                Description
              </label>
              <input
                type="text"
                value={editingCategory.description}
                onChange={(e) =>
                  setEditingCategory({
                    ...editingCategory,
                    description: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-1">
                Sort Order
              </label>
              <input
                type="number"
                min={1}
                value={editingCategory.sortOrder}
                onChange={(e) =>
                  setEditingCategory({
                    ...editingCategory,
                    sortOrder: Number(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg font-mono-tabular"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 text-xs font-semibold text-[#202124]/70"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#D92332] text-white text-xs font-semibold rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PRODUCT CREATE / EDIT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-[#202124]/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 sm:p-8 border border-[#202124]/15 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[#202124] mb-4">
              {editingProduct.id ? 'Edit Menu Product' : 'Add New Menu Product'}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Category *
                  </label>
                  <select
                    value={editingProduct.categoryId || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        categoryId: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Base Price (PKR) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#202124]/20 rounded-lg font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Sale Price (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.salePrice || ''}
                    placeholder="Optional"
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        salePrice: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#202124]/20 rounded-lg font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Stock Qty
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.stockQuantity ?? 20}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stockQuantity: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#202124]/20 rounded-lg font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Prep Time (Mins)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editingProduct.prepEstimateMinutes ?? 15}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        prepEstimateMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#202124]/20 rounded-lg font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Product Photography Preset, URL, or Upload
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={
                      IMAGE_PRESETS.some((ip) => ip.key === editingProduct.imageKey)
                        ? editingProduct.imageKey
                        : 'smash_burger'
                    }
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        imageKey: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#202124]/20 rounded-lg bg-white"
                  >
                    {IMAGE_PRESETS.map((ip) => (
                      <option key={ip.key} value={ip.key}>
                        Preset: {ip.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editingProduct.imageKey || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        imageKey: e.target.value,
                      })
                    }
                    placeholder="Or custom image URL..."
                    className="w-full px-3 py-2 text-sm border border-[#202124]/20 rounded-lg"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          setEditingProduct({
                            ...editingProduct,
                            imageKey: reader.result,
                          });
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="w-full text-xs text-[#202124]/70 file:mr-2 file:py-2 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#202124] file:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Sizes (Label:DeltaPKR)
                  </label>
                  <input
                    type="text"
                    value={sizesInput}
                    onChange={(e) => setSizesInput(e.target.value)}
                    placeholder="Regular:0, Large:250"
                    className="w-full px-3 py-2 text-xs border border-[#202124]/20 rounded-lg font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Spice Levels (comma-sep)
                  </label>
                  <input
                    type="text"
                    value={spiceInput}
                    onChange={(e) => setSpiceInput(e.target.value)}
                    placeholder="Mild, Medium, Spicy"
                    className="w-full px-3 py-2 text-xs border border-[#202124]/20 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Add-ons (Name:PricePKR)
                  </label>
                  <input
                    type="text"
                    value={addonsInput}
                    onChange={(e) => setAddonsInput(e.target.value)}
                    placeholder="Extra Cheese:120"
                    className="w-full px-3 py-2 text-xs border border-[#202124]/20 rounded-lg font-mono-tabular"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#202124] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.isAvailable)}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        isAvailable: e.target.checked,
                      })
                    }
                    className="rounded border-[#202124]/30"
                  />
                  <span>Available for Ordering</span>
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#202124] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.isFeatured)}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        isFeatured: e.target.checked,
                      })
                    }
                    className="rounded border-[#202124]/30"
                  />
                  <span>Feature on Homepage</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#202124]/10">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#202124]/70 hover:text-[#202124]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#D92332] text-white text-xs font-semibold rounded-lg hover:bg-[#B81B28]"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DESTRUCTIVE ACTION CONFIRMATION MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-[#202124]/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-[#202124]/15 space-y-4">
            <h3 className="text-lg font-bold text-[#202124]">
              Confirm Deletion
            </h3>
            <p className="text-sm text-[#202124]/75">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-[#202124]">
                “{confirmDelete.name}”
              </span>
              ? Existing customer order snapshots will remain intact.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-[#202124]/70 hover:text-[#202124]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedDelete}
                className="px-4 py-2 bg-[#D92332] text-white text-xs font-semibold rounded-lg hover:bg-[#B81B28]"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
