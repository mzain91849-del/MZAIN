import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  ArrowRight,
  Menu as MenuIcon,
  X,
  Check,
} from 'lucide-react';
import {
  Category,
  Product,
  StoreSettings,
  UserProfile,
  CartItemInput,
  CartCalculationResponse,
  Order,
} from './types';
import { ProductImage } from './components/ProductImage';
import { ProductCard } from './components/ProductCard';
import { ProductDetailView } from './components/ProductDetailView';
import {
  CartAndCheckoutView,
  MyOrdersView,
  AuthView,
} from './components/CartCheckoutOrdersView';
import { AboutFaqPoliciesView } from './components/InfoViews';
import { AdminDashboard } from './components/AdminDashboard';
import { BrandLogo } from './components/BrandLogo';
import { apiFetch } from './services/localStoreEngine';

type ActivePage =
  | 'home'
  | 'menu'
  | 'product-detail'
  | 'cart'
  | 'orders'
  | 'about'
  | 'auth'
  | 'admin';

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Zain Fast Food',
  tagline: 'Fresh. Hot. Delivered.',
  deliveryFee: 180,
  freeDeliveryThreshold: 2500,
  minOrderAmount: 600,
  phone: '+92 300 0000000 (Demo Support Line)',
  email: 'orders@zainfastfood.demo',
  address: 'Plot 14-B, Commercial Kitchen District, Lahore (Demo Address)',
  openingHours: 'Daily: 12:00 PM – 2:00 AM',
  deliveryCoverage: '35–45 mins within 8 km radius (Demo Zones)',
  noticeBanner:
    'Demo Store Environment: Sample prices in PKR. Free delivery on orders over PKR 2,500 · Use code ZAIN15 for 15% off.',
};

const EMPTY_CALC: CartCalculationResponse = {
  items: [],
  subtotal: 0,
  discountAmount: 0,
  appliedCoupon: null,
  couponError: null,
  deliveryFee: 0,
  total: 0,
  minOrderAmount: 600,
  meetsMinOrder: false,
  amountNeededForMinOrder: 600,
  amountNeededForFreeDelivery: 2500,
};

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Storefront data from server
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loadingStore, setLoadingStore] = useState(true);

  // Auth state persisted in localStorage
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('zain_auth_token')
  );
  const [user, setUser] = useState<UserProfile | null>(null);

  // Cart items persisted in localStorage
  const [cartItems, setCartItems] = useState<CartItemInput[]>(() => {
    try {
      const saved = localStorage.getItem('zain_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [couponInput, setCouponInput] = useState<string>(() => {
    return localStorage.getItem('zain_coupon_code') || '';
  });
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>(() => {
    return localStorage.getItem('zain_coupon_code') || '';
  });
  const [cartCalc, setCartCalc] = useState<CartCalculationResponse>(EMPTY_CALC);

  // Selected product for Product Details page
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // Most recently placed order for confirmation banner
  const [recentConfirmedOrder, setRecentConfirmedOrder] =
    useState<Order | null>(null);

  // Menu Filter & Search state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(4000);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<
    'featured' | 'price-asc' | 'price-desc' | 'name'
  >('featured');

  // Toast feedback for Quick Add
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  };

  // Bootstrap Storefront Data
  const fetchBootstrap = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await apiFetch('/api/bootstrap', { headers });
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories || []);
        setProducts(data.products || []);
        if (data.settings) setSettings(data.settings);
        setUser(data.user || null);
      }
    } finally {
      setLoadingStore(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBootstrap();
  }, [fetchBootstrap]);

  // Recalculate cart server-side whenever cartItems or appliedCouponCode changes
  const recalculateCart = useCallback(
    async (items: CartItemInput[], code: string) => {
      try {
        const res = await apiFetch('/api/cart/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, couponCode: code }),
        });
        const data = await res.json();
        if (res.ok) {
          setCartCalc(data);
        }
      } catch {
        // Keep last valid calculation if offline
      }
    },
    []
  );

  useEffect(() => {
    localStorage.setItem('zain_cart_items', JSON.stringify(cartItems));
    recalculateCart(cartItems, appliedCouponCode);
  }, [cartItems, appliedCouponCode, recalculateCart]);

  // Cart manipulation handlers
  const handleAddToCart = (
    product: Product,
    quantity = 1,
    selectedSize?: string,
    selectedSpice?: string,
    selectedAddonIds: string[] = []
  ) => {
    const sizeLabel = selectedSize || product.sizes?.[0]?.label || 'Regular';
    const spiceLabel = selectedSpice ?? (product.spiceLevels?.[0] || '');
    const sortedAddons = [...selectedAddonIds].sort();
    const cartItemId = `${product.id}__${sizeLabel}__${spiceLabel}__${sortedAddons.join(
      '-'
    )}`;

    setCartItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: Math.min(99, updated[existingIdx].quantity + quantity),
        };
        return updated;
      }
      return [
        ...prev,
        {
          cartItemId,
          productId: product.id,
          quantity,
          selectedSize: sizeLabel,
          selectedSpice: spiceLabel,
          selectedAddonIds: sortedAddons,
        },
      ];
    });

    showToast(`Added ${quantity}x ${product.name} to cart`);
  };

  const handleUpdateCartQty = (cartItemId: string, nextQty: number) => {
    if (nextQty <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: nextQty } : item
      )
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems((prev) =>
      prev.filter((item) => item.cartItemId !== cartItemId)
    );
  };

  const handleApplyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    localStorage.setItem('zain_coupon_code', clean);
    setAppliedCouponCode(clean);
  };

  const totalCartCount = useMemo(
    () => cartCalc.items.reduce((sum, item) => sum + item.quantity, 0),
    [cartCalc.items]
  );

  // Filtered and Sorted Products for Menu / Shop
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (
          selectedCategoryId !== 'all' &&
          p.categoryId !== selectedCategoryId
        ) {
          return false;
        }
        if (onlyAvailable && (!p.isAvailable || (p.trackStock && p.stockQuantity <= 0))) {
          return false;
        }
        const effectivePrice =
          typeof p.salePrice === 'number' && p.salePrice > 0 && p.salePrice < p.price
            ? p.salePrice
            : p.price;
        if (effectivePrice > maxPriceFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchCat = p.categoryName.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const priceA =
          typeof a.salePrice === 'number' && a.salePrice > 0 ? a.salePrice : a.price;
        const priceB =
          typeof b.salePrice === 'number' && b.salePrice > 0 ? b.salePrice : b.price;
        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return Number(b.isFeatured) - Number(a.isFeatured);
      });
  }, [
    products,
    selectedCategoryId,
    onlyAvailable,
    maxPriceFilter,
    searchQuery,
    sortBy,
  ]);

  const featuredProducts = useMemo(
    () => products.filter((p) => p.isFeatured && !p.isCombo).slice(0, 6),
    [products]
  );

  const comboProducts = useMemo(
    () =>
      products.filter(
        (p) => p.isCombo || p.categoryName.toLowerCase().includes('combo')
      ),
    [products]
  );

  const openAdminPanel = useCallback(async () => {
    setActivePage('admin');
    if (user?.role === 'admin' && token) return;
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@zainfastfood.demo',
          password: 'Admin123!',
        }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('zain_auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
      }
    } catch {
      // Fallback to manual sign-in button on the admin gate
    }
  }, [user, token]);

  const navigateToProduct = (product: Product) => {
    setSelectedProduct(product);
    setActivePage('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setActivePage('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8EE] text-[#202124]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-[#FFF8EE]/95 backdrop-blur-xs border-b border-[#202124]/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-16">
          {/* Zone 1: Brand Emblem & Single-line Wordmark */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              setActivePage('home');
            }}
            className="whitespace-nowrap shrink-0"
          >
            <BrandLogo
              size="sm"
              showTextLockup={true}
              storeName={settings.storeName}
              customLogoUrl={settings.logoUrl}
            />
          </a>

          {/* Zone 2: 5 Concise Single-Line Text Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-[#202124]/80"
          >
            <button
              type="button"
              onClick={() => setActivePage('home')}
              className={`hover:text-[#D92332] transition-colors whitespace-nowrap shrink-0 py-1 ${
                activePage === 'home'
                  ? 'text-[#D92332] font-semibold underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryId('all');
                setActivePage('menu');
              }}
              className={`hover:text-[#D92332] transition-colors whitespace-nowrap shrink-0 py-1 ${
                activePage === 'menu' || activePage === 'product-detail'
                  ? 'text-[#D92332] font-semibold underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Menu
            </button>
            <button
              type="button"
              onClick={() => setActivePage('orders')}
              className={`hover:text-[#D92332] transition-colors whitespace-nowrap shrink-0 py-1 ${
                activePage === 'orders'
                  ? 'text-[#D92332] font-semibold underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              My Orders
            </button>
            <button
              type="button"
              onClick={() => setActivePage('about')}
              className={`hover:text-[#D92332] transition-colors whitespace-nowrap shrink-0 py-1 ${
                activePage === 'about'
                  ? 'text-[#D92332] font-semibold underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Story & FAQ
            </button>
            <button
              type="button"
              onClick={openAdminPanel}
              className={`hover:text-[#D92332] transition-colors whitespace-nowrap shrink-0 py-1 ${
                activePage === 'admin'
                  ? 'text-[#D92332] font-semibold underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Admin Panel
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action Button (Cart & Checkout) + Mobile Menu Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActivePage('cart')}
              className="px-4 py-2 text-xs font-bold text-white bg-[#D92332] rounded-lg hover:bg-[#B81B28] transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 font-mono-tabular"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>
                Cart ({totalCartCount})
                {cartCalc.total > 0
                  ? ` · PKR ${cartCalc.total.toLocaleString()}`
                  : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileNavOpen((v) => !v)}
              className="md:hidden p-2 text-[#202124] rounded-lg hover:bg-[#202124]/5"
              aria-label="Toggle navigation menu"
            >
              {mobileNavOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <MenuIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Navigation */}
        {mobileNavOpen && (
          <div className="md:hidden bg-white border-b border-[#202124]/10 px-4 py-4 space-y-2">
            {(
              [
                { id: 'home', label: 'Home' },
                { id: 'menu', label: 'Full Menu' },
                { id: 'orders', label: 'My Orders & Tracker' },
                { id: 'about', label: 'Story, Hours & Policies' },
                { id: 'admin', label: 'Admin Panel (Store Management)' },
                {
                  id: 'auth',
                  label: user
                    ? `Account (${user.name})`
                    : 'Customer Sign In / Register',
                },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'admin') {
                    openAdminPanel();
                  } else {
                    setActivePage(item.id as ActivePage);
                  }
                  setMobileNavOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-[#202124] hover:bg-[#FFF8EE]"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Subtle Toast Notification for Cart Feedback */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 bg-[#202124] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-semibold"
        >
          <Check className="w-4 h-4 text-[#FFC928]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Router */}
      <main className="flex-1">
        {/* HOME PAGE (Max 3 Storefront Sections: Hero -> Featured Menu & Categories -> Combo Deals & Promos) */}
        {activePage === 'home' && (
          <div>
            {/* SECTION 1: Storefront Hero (2-Column Balanced Split + Full-Width 4-Column Highlights Row) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Left Column: Campaign Typography & Primary CTA */}
                <div className="lg:col-span-6 bg-[#202124] text-white rounded-2xl p-8 sm:p-10 lg:p-12 flex flex-col justify-between">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs text-[#FFC928] font-medium">
                        <span>{settings.tagline}</span>
                        <span aria-hidden="true">·</span>
                        <span>Cash on Delivery</span>
                        <span aria-hidden="true">·</span>
                        <span>Demo Menu</span>
                      </div>
                      <BrandLogo
                        size="lg"
                        showTextLockup={false}
                        storeName={settings.storeName}
                        customLogoUrl={settings.logoUrl}
                      />
                    </div>

                    <h1
                      className="font-bold tracking-tight text-white leading-[1.08]"
                      style={{
                        fontSize: 'clamp(2.25rem, 3.8vw, 3.5rem)',
                        textWrap: 'balance',
                      }}
                    >
                      Smashed on the Griddle. Delivered Piping Hot.
                    </h1>

                    <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-xl">
                      Order double smash beef burgers, crispy whole-muscle fillet sandwiches, and stone-baked pepperoni pizzas prepared fresh to order.
                    </p>
                  </div>

                  <div className="pt-8 space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId('all');
                          setActivePage('menu');
                        }}
                        className="px-6 py-3.5 bg-[#D92332] text-white text-sm font-bold rounded-xl hover:bg-[#B81B28] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                      >
                        <span>Explore Full Menu</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setActivePage('orders')}
                        className="px-5 py-3.5 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/15 transition-colors whitespace-nowrap shrink-0"
                      >
                        Track Order Status
                      </button>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/70">
                      <span>
                        Free Delivery over{' '}
                        <strong className="text-[#FFC928] font-mono-tabular">
                          PKR {settings.freeDeliveryThreshold.toLocaleString()}
                        </strong>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Min Order{' '}
                        <strong className="text-white font-mono-tabular">
                          PKR {settings.minOrderAmount.toLocaleString()}
                        </strong>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{settings.openingHours}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: High-Impact 16:9 Food Photography */}
                <div className="lg:col-span-6 rounded-2xl overflow-hidden bg-[#202124] relative min-h-[320px] lg:min-h-full">
                  <ProductImage
                    imageKey="hero_burger"
                    alt="Zain Signature Double Smash Burger and Seasoned Crinkle Fries"
                    lazy={false}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-6 sm:p-8">
                    <div className="text-xs font-medium text-[#FFC928]">
                      Signature Bestseller · Demo Price
                    </div>
                    <div className="flex items-baseline justify-between gap-4 mt-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-white">
                        Zain Signature Double Smash Burger
                      </h2>
                      <span className="text-lg font-bold text-[#FFC928] font-mono-tabular whitespace-nowrap">
                        PKR 990
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full-Width 4-Column Store Highlights Bar Below Hero Split */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="bg-white p-5 rounded-xl border border-[#202124]/10">
                  <div className="text-xs text-[#202124]/60">Kitchen Prep</div>
                  <div className="text-sm font-bold text-[#202124] mt-1">
                    Cooked Fresh to Order
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-[#202124]/10">
                  <div className="text-xs text-[#202124]/60">Promo Code</div>
                  <div className="text-sm font-bold text-[#D92332] font-mono-tabular mt-1">
                    ZAIN15 (15% Off PKR 1,500+)
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-[#202124]/10">
                  <div className="text-xs text-[#202124]/60">Payment Method</div>
                  <div className="text-sm font-bold text-[#202124] mt-1">
                    Cash on Delivery (PKR)
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-[#202124]/10">
                  <div className="text-xs text-[#202124]/60">Support & Hours</div>
                  <div className="text-sm font-bold text-[#202124] mt-1 truncate">
                    {settings.openingHours}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: Featured Bestsellers & Category Quick-Filter */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-[#202124]/10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <div className="text-xs text-[#202124]/60">
                    Curated Menu · Clearly Labelled Demo Data
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#202124] mt-1">
                    Customer Favourites & Categories
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId('all');
                    setActivePage('menu');
                  }}
                  className="text-xs font-bold text-[#D92332] hover:underline inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>View All {products.length} Menu Items</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Interactive Category Filter Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
                <button
                  type="button"
                  onClick={() => navigateToCategory('all')}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#202124] text-white whitespace-nowrap shrink-0"
                >
                  All Categories ({products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => navigateToCategory(cat.id)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-[#202124]/15 text-[#202124] hover:border-[#D92332] hover:text-[#D92332] transition-colors whitespace-nowrap shrink-0"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* 3-Column Featured Product Grid */}
              {loadingStore ? (
                <div className="py-12 text-center text-sm text-[#202124]/60">
                  Loading menu items...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {featuredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelectProduct={navigateToProduct}
                      onQuickAdd={(p, e) => {
                        e.stopPropagation();
                        handleAddToCart(
                          p,
                          1,
                          p.sizes?.[0]?.label,
                          p.spiceLevels?.[0],
                          []
                        );
                      }}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* SECTION 3: Combo Deals & Value Bundles */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-[#202124]/10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <div className="text-xs text-[#202124]/60">
                    Value Meal Bundles · Built for Sharing
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#202124] mt-1">
                    Signature Combo Deals
                  </h2>
                </div>
                <div className="text-xs text-[#202124]/70">
                  Apply code{' '}
                  <strong className="font-mono-tabular text-[#D92332]">
                    WELCOME200
                  </strong>{' '}
                  at checkout for PKR 200 off orders above PKR 1,000.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {comboProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelectProduct={navigateToProduct}
                    onQuickAdd={(p, e) => {
                      e.stopPropagation();
                      handleAddToCart(
                        p,
                        1,
                        p.sizes?.[0]?.label,
                        p.spiceLevels?.[0],
                        []
                      );
                    }}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* MENU / SHOP & CATEGORY PAGE */}
        {activePage === 'menu' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#202124]/10">
              <div>
                <div className="text-xs text-[#202124]/60">
                  Full Menu & Category Explorer · Prices in PKR (Demo Data)
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#202124] mt-1">
                  {selectedCategoryId === 'all'
                    ? 'All Menu Categories'
                    : categories.find((c) => c.id === selectedCategoryId)
                        ?.name || 'Menu'}
                </h1>
              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[#202124]/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search burgers, pizza, wraps..."
                  aria-label="Search menu products"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#202124]/20 rounded-xl focus:outline-2 focus:outline-[#D92332]"
                />
              </div>
            </div>

            {/* Interactive Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-4">
              <button
                type="button"
                onClick={() => setSelectedCategoryId('all')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategoryId === 'all'
                    ? 'bg-[#D92332] text-white'
                    : 'bg-white text-[#202124]/75 border border-[#202124]/15 hover:text-[#202124]'
                }`}
              >
                All Items ({products.length})
              </button>
              {categories.map((cat) => {
                const active = selectedCategoryId === cat.id;
                const count = products.filter(
                  (p) => p.categoryId === cat.id
                ).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#D92332] text-white'
                        : 'bg-white text-[#202124]/75 border border-[#202124]/15 hover:text-[#202124]'
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Filter & Sort Controls Row */}
            <div className="bg-white p-4 rounded-xl border border-[#202124]/10 flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#202124] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="rounded border-[#202124]/30"
                  />
                  <span>In-Stock Only</span>
                </label>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-[#202124]">
                    Max Price:
                  </span>
                  <input
                    type="range"
                    min={300}
                    max={4000}
                    step={100}
                    value={maxPriceFilter}
                    onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                    className="w-28 accent-[#D92332]"
                  />
                  <span className="font-mono-tabular font-bold text-[#202124]">
                    PKR {maxPriceFilter.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#202124]/65 font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as
                        | 'featured'
                        | 'price-asc'
                        | 'price-desc'
                        | 'name'
                    )
                  }
                  className="px-3 py-1.5 bg-[#FFF8EE] border border-[#202124]/20 rounded-lg font-semibold text-[#202124]"
                >
                  <option value="featured">Featured First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Name (A–Z)</option>
                </select>
              </div>
            </div>

            {/* Product Grid or Useful Empty State */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-[#202124]/10 text-center space-y-3">
                <h2 className="text-lg font-bold text-[#202124]">
                  No matching menu items found
                </h2>
                <p className="text-xs text-[#202124]/65 max-w-md mx-auto">
                  Try clearing your search query, increasing the maximum price filter, or switching to “All Items”.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId('all');
                    setSearchQuery('');
                    setMaxPriceFilter(4000);
                    setOnlyAvailable(false);
                  }}
                  className="px-4 py-2 bg-[#D92332] text-white text-xs font-semibold rounded-lg"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelectProduct={navigateToProduct}
                    onQuickAdd={(p, e) => {
                      e.stopPropagation();
                      handleAddToCart(
                        p,
                        1,
                        p.sizes?.[0]?.label,
                        p.spiceLevels?.[0],
                        []
                      );
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRODUCT DETAILS VIEW */}
        {activePage === 'product-detail' && selectedProduct && (
          <ProductDetailView
            product={
              products.find((p) => p.id === selectedProduct.id) ||
              selectedProduct
            }
            relatedProducts={products.filter(
              (p) =>
                p.categoryId === selectedProduct.categoryId &&
                p.id !== selectedProduct.id
            )}
            onBack={() => setActivePage('menu')}
            onAddToCart={handleAddToCart}
            onSelectProduct={navigateToProduct}
          />
        )}

        {/* CART & CHECKOUT VIEW */}
        {activePage === 'cart' && (
          <CartAndCheckoutView
            calc={cartCalc}
            couponInput={couponInput}
            onCouponInputChange={setCouponInput}
            onApplyCoupon={handleApplyCoupon}
            onUpdateQty={handleUpdateCartQty}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={() => setCartItems([])}
            user={user}
            token={token}
            settings={settings}
            onOrderCreated={(newOrder) => {
              setCartItems([]);
              setRecentConfirmedOrder(newOrder);
              fetchBootstrap();
              setActivePage('orders');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateMenu={() => setActivePage('menu')}
          />
        )}

        {/* MY ORDERS & STATUS TRACKER VIEW */}
        {activePage === 'orders' && (
          <MyOrdersView
            user={user}
            token={token}
            recentConfirmedOrder={recentConfirmedOrder}
            onNavigateLogin={() => setActivePage('auth')}
            onNavigateMenu={() => setActivePage('menu')}
          />
        )}

        {/* ABOUT, CONTACT, FAQ & POLICIES VIEW */}
        {activePage === 'about' && (
          <AboutFaqPoliciesView
            settings={settings}
            onNavigateMenu={() => setActivePage('menu')}
          />
        )}

        {/* AUTH (LOGIN / REGISTER) VIEW */}
        {activePage === 'auth' && (
          <AuthView
            user={user}
            onAuthSuccess={(newToken, loggedInUser) => {
              localStorage.setItem('zain_auth_token', newToken);
              setToken(newToken);
              setUser(loggedInUser);
              if (loggedInUser.role === 'admin') {
                setActivePage('admin');
              } else {
                setActivePage('orders');
              }
            }}
            onLogout={async () => {
              if (token) {
                await apiFetch('/api/auth/logout', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` },
                });
              }
              localStorage.removeItem('zain_auth_token');
              setToken(null);
              setUser(null);
              setActivePage('home');
            }}
          />
        )}

        {/* PROTECTED ADMIN DASHBOARD VIEW */}
        {activePage === 'admin' && (
          <div>
            {user?.role === 'admin' && token ? (
              <AdminDashboard
                token={token}
                onStoreUpdated={fetchBootstrap}
                onExitToStorefront={() => setActivePage('home')}
              />
            ) : (
              <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
                <div className="bg-white p-8 rounded-2xl border border-[#202124]/10 space-y-5">
                  <div className="flex justify-center">
                    <BrandLogo
                      size="lg"
                      showTextLockup={false}
                      storeName={settings.storeName}
                      customLogoUrl={settings.logoUrl}
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#202124]">
                      Zain Fast Food — Admin Panel
                    </h2>
                    <p className="text-xs text-[#202124]/70 mt-1 leading-relaxed">
                      Sign in with an administrator account to access Sales Analytics, Live Order & KOT Dispatch, Menu Products, Inventory Stock, Categories, Promo Coupons, Customers, and Store Settings.
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await apiFetch('/api/auth/login', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            email: 'admin@zainfastfood.demo',
                            password: 'Admin123!',
                          }),
                        });
                        const data = await res.json();
                        if (res.ok && data.token) {
                          localStorage.setItem('zain_auth_token', data.token);
                          setToken(data.token);
                          setUser(data.user);
                        }
                      }}
                      className="w-full py-3 px-5 bg-[#D92332] text-white text-xs font-bold rounded-xl hover:bg-[#B81B28] transition-colors"
                    >
                      Enter Admin Panel (1-Click Demo Admin)
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivePage('auth')}
                      className="w-full py-2.5 px-5 bg-[#202124] text-white text-xs font-semibold rounded-xl hover:bg-[#202124]/85 transition-colors"
                    >
                      Sign In with Custom Credentials
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Clean Dark Charcoal Footer */}
      <footer className="bg-[#202124] text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/10">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <BrandLogo
                  size="md"
                  showTextLockup={false}
                  storeName={settings.storeName}
                  customLogoUrl={settings.logoUrl}
                />
                <span className="text-lg font-bold text-white font-display">
                  {settings.storeName}
                </span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                {settings.tagline} — {settings.noticeBanner}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-[#FFC928]">Store Navigation</div>
              <ul className="space-y-1.5 text-white/75">
                <li>
                  <button
                    type="button"
                    onClick={() => setActivePage('home')}
                    className="hover:text-white"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId('all');
                      setActivePage('menu');
                    }}
                    className="hover:text-white"
                  >
                    Full Menu & Combos
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActivePage('orders')}
                    className="hover:text-white"
                  >
                    Track Order Status
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActivePage('about')}
                    className="hover:text-white"
                  >
                    About, FAQ & Policies
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-[#FFC928]">Kitchen & Support</div>
              <p className="text-white/75">{settings.address}</p>
              <p className="text-white/75">{settings.phone}</p>
              <p className="text-white/75">{settings.openingHours}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-[#FFC928]">Account & Admin</div>
              <p className="text-white/70">
                {user
                  ? `Signed in as ${user.name} (${user.role})`
                  : 'Sign in to access your order history or store admin dashboard.'}
              </p>
              <div className="pt-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openAdminPanel}
                  className="px-3.5 py-2 bg-[#D92332] text-white rounded-lg hover:bg-[#B81B28] font-semibold"
                >
                  Open Admin Panel
                </button>
                <button
                  type="button"
                  onClick={() => setActivePage('auth')}
                  className="px-3.5 py-2 bg-white/10 text-white rounded-lg hover:bg-white/15 font-semibold"
                >
                  {user ? 'Account Profile' : 'Customer Sign In'}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
            <p>
              © {new Date().getFullYear()} {settings.storeName} (Working Brand Name). Demo menu items and prices for development.
            </p>
            <p>Cash on Delivery · Server-Validated Pricing</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
