import React, { useState, useEffect, useCallback } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Search,
  LogOut,
} from 'lucide-react';
import {
  CartCalculationResponse,
  Order,
  StoreSettings,
  UserProfile,
} from '../types';
import { ProductImage } from './ProductImage';
import { BrandLogo } from './BrandLogo';
import { apiFetch } from '../services/localStoreEngine';

interface CartAndCheckoutViewProps {
  calc: CartCalculationResponse;
  couponInput: string;
  onCouponInputChange: (val: string) => void;
  onApplyCoupon: (code: string) => void;
  onUpdateQty: (cartItemId: string, nextQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  user: UserProfile | null;
  token: string | null;
  settings: StoreSettings;
  onOrderCreated: (order: Order) => void;
  onNavigateMenu: () => void;
}

export const CartAndCheckoutView: React.FC<CartAndCheckoutViewProps> = ({
  calc,
  couponInput,
  onCouponInputChange,
  onApplyCoupon,
  onUpdateQty,
  onRemoveItem,
  user,
  token,
  settings,
  onOrderCreated,
  onNavigateMenu,
}) => {
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [deliveryAddress, setDeliveryAddress] = useState(
    user?.defaultAddress || ''
  );
  const [postalCode, setPostalCode] = useState('54000');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || user.name);
      setCustomerPhone((prev) => prev || user.phone);
      setCustomerEmail((prev) => prev || user.email);
      setDeliveryAddress((prev) => prev || user.defaultAddress);
    }
  }, [user]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!calc.meetsMinOrder) {
      setCheckoutError(
        `Minimum order subtotal is PKR ${settings.minOrderAmount.toLocaleString()}. Add PKR ${calc.amountNeededForMinOrder.toLocaleString()} more to proceed.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const payloadItems = calc.items.map((item) => ({
        cartItemId: item.cartItemId,
        productId: item.productId,
        quantity: item.quantity,
        selectedSize: item.sizeLabel,
        selectedSpice: item.spiceLevel,
        selectedAddonIds: item.addons.map((a) => a.id),
      }));

      const res = await apiFetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: payloadItems,
          couponCode: calc.appliedCoupon ? calc.appliedCoupon.code : couponInput,
          customerName,
          customerPhone,
          customerEmail,
          deliveryAddress,
          postalCode,
          deliveryNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not place order.');
      }
      onOrderCreated(data.order);
    } catch (err: unknown) {
      setCheckoutError(
        err instanceof Error ? err.message : 'Order submission failed.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (calc.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-white p-10 sm:p-12 rounded-2xl border border-[#202124]/10 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFF8EE] text-[#D92332] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#202124]">Your Cart is Empty</h1>
          <p className="text-sm text-[#202124]/70 max-w-md mx-auto">
            Explore our freshly seared smash burgers, stone-oven pizzas, crispy chicken, and value combo deals to start your order.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onNavigateMenu}
              className="px-6 py-3 bg-[#D92332] text-white text-xs font-bold rounded-xl hover:bg-[#B81B28] transition-colors"
            >
              Browse Full Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#202124]">
          Your Order & Cash on Delivery Checkout
        </h1>
        <p className="text-sm text-[#202124]/70 mt-1">
          All item prices, promotional discounts, and delivery fees are verified server-side in PKR.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Cols: Cart Items & Coupon */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-[#202124]/10 divide-y divide-[#202124]/8">
            {calc.items.map((item) => (
              <div
                key={item.cartItemId}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-20 h-16 rounded-lg overflow-hidden bg-[#F5EFE6] shrink-0">
                    <ProductImage
                      imageKey={item.imageKey}
                      alt={item.productName}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#202124]">
                      {item.productName}
                    </h3>
                    <div className="text-xs text-[#202124]/65 mt-0.5">
                      {[
                        item.sizeLabel,
                        item.spiceLevel ? `Spice: ${item.spiceLevel}` : null,
                        ...item.addons.map((a) => `+ ${a.name}`),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    <div className="text-xs font-mono-tabular text-[#202124]/70 mt-1">
                      PKR {item.finalUnitPrice.toLocaleString()} each
                    </div>
                    {!item.isAvailable && (
                      <div className="text-xs font-semibold text-[#D92332] mt-1">
                        Currently unavailable or exceeds stock ({item.maxAvailableStock} left). Please remove or reduce quantity.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#202124]/8">
                  <div className="inline-flex items-center border border-[#202124]/20 rounded-lg bg-[#FFF8EE]">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.cartItemId, item.quantity - 1)}
                      className="p-1.5 text-[#202124] hover:bg-[#202124]/5"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold font-mono-tabular">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateQty(
                          item.cartItemId,
                          Math.min(item.maxAvailableStock, item.quantity + 1)
                        )
                      }
                      className="p-1.5 text-[#202124] hover:bg-[#202124]/5"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[85px] font-mono-tabular text-sm font-bold text-[#202124]">
                    PKR {item.lineTotal.toLocaleString()}
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.cartItemId)}
                    className="p-1.5 text-[#202124]/50 hover:text-[#D92332] transition-colors"
                    aria-label={`Remove ${item.productName}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Promotional Coupon Box */}
          <div className="bg-white p-5 rounded-2xl border border-[#202124]/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#202124]">
                Have a Promotional Coupon?
              </label>
              <span className="text-xs text-[#202124]/60">
                Try demo codes:{' '}
                <button
                  type="button"
                  onClick={() => {
                    onCouponInputChange('ZAIN15');
                    onApplyCoupon('ZAIN15');
                  }}
                  className="font-mono-tabular font-semibold text-[#D92332] underline"
                >
                  ZAIN15
                </button>{' '}
                or{' '}
                <button
                  type="button"
                  onClick={() => {
                    onCouponInputChange('WELCOME200');
                    onApplyCoupon('WELCOME200');
                  }}
                  className="font-mono-tabular font-semibold text-[#D92332] underline"
                >
                  WELCOME200
                </button>
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => onCouponInputChange(e.target.value.toUpperCase())}
                placeholder="Enter promo code (e.g. ZAIN15)"
                className="flex-1 px-3.5 py-2 text-xs font-mono-tabular uppercase border border-[#202124]/20 rounded-lg bg-[#FFF8EE]/50"
              />
              <button
                type="button"
                onClick={() => onApplyCoupon(couponInput)}
                className="px-4 py-2 bg-[#202124] text-white text-xs font-semibold rounded-lg hover:bg-[#202124]/85 whitespace-nowrap shrink-0"
              >
                Apply Coupon
              </button>
              {calc.appliedCoupon && (
                <button
                  type="button"
                  onClick={() => {
                    onCouponInputChange('');
                    onApplyCoupon('');
                  }}
                  className="px-3 py-2 text-xs font-semibold text-[#D92332] hover:underline whitespace-nowrap"
                >
                  Remove
                </button>
              )}
            </div>

            {calc.appliedCoupon && (
              <p className="text-xs font-semibold text-[#15803D]">
                Applied {calc.appliedCoupon.code}: {calc.appliedCoupon.description} (-PKR{' '}
                {calc.discountAmount.toLocaleString()})
              </p>
            )}
            {calc.couponError && (
              <p className="text-xs font-semibold text-[#D92332]">
                {calc.couponError}
              </p>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Order Totals & Delivery Details Form */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-[#202124]/10 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#202124] mb-4">
              Order Summary
            </h2>
            <div className="space-y-2.5 text-sm border-b border-[#202124]/10 pb-4">
              <div className="flex justify-between">
                <span className="text-[#202124]/70">Items Subtotal</span>
                <span className="font-mono-tabular font-semibold">
                  PKR {calc.subtotal.toLocaleString()}
                </span>
              </div>
              {calc.discountAmount > 0 && (
                <div className="flex justify-between text-[#15803D]">
                  <span>
                    Promo Discount ({calc.appliedCoupon?.code})
                  </span>
                  <span className="font-mono-tabular font-semibold">
                    -PKR {calc.discountAmount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#202124]/70">
                  Delivery Fee
                  {calc.deliveryFee === 0 && calc.subtotal > 0 ? ' (Free)' : ''}
                </span>
                <span className="font-mono-tabular font-semibold">
                  {calc.deliveryFee === 0
                    ? 'PKR 0'
                    : `PKR ${calc.deliveryFee.toLocaleString()}`}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-4">
              <span className="text-base font-bold text-[#202124]">
                Final Total (Cash on Delivery)
              </span>
              <span className="text-xl font-bold text-[#D92332] font-mono-tabular">
                PKR {calc.total.toLocaleString()}
              </span>
            </div>

            {calc.amountNeededForFreeDelivery > 0 && (
              <p className="text-xs text-[#202124]/60 mt-2">
                Add{' '}
                <span className="font-mono-tabular font-semibold text-[#202124]">
                  PKR {calc.amountNeededForFreeDelivery.toLocaleString()}
                </span>{' '}
                more for Free Delivery (orders over PKR{' '}
                {settings.freeDeliveryThreshold.toLocaleString()}).
              </p>
            )}
            {!calc.meetsMinOrder && (
              <p className="text-xs font-semibold text-[#D92332] mt-2">
                Minimum order subtotal is PKR{' '}
                {settings.minOrderAmount.toLocaleString()}. Please add PKR{' '}
                {calc.amountNeededForMinOrder.toLocaleString()} more to place your order.
              </p>
            )}
          </div>

          {/* Delivery Details Form */}
          <form onSubmit={handlePlaceOrder} className="space-y-4 pt-2 border-t border-[#202124]/10">
            <h3 className="text-base font-bold text-[#202124]">
              Delivery & Verification Details
            </h3>

            {checkoutError && (
              <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#D92332]/30 text-xs text-[#991B1B] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{checkoutError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g., Bilal Ahmed"
                className="w-full px-3.5 py-2.5 text-sm border border-[#202124]/20 rounded-xl bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Active Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="03XX-XXXXXXX"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#202124]/20 rounded-xl bg-white font-mono-tabular"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="54000"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#202124]/20 rounded-xl bg-white font-mono-tabular"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-1">
                Complete Delivery Address *
              </label>
              <textarea
                rows={2}
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="House #, Street #, Block / Sector, Area (e.g., Gulberg II, Lahore)"
                className="w-full px-3.5 py-2.5 text-sm border border-[#202124]/20 rounded-xl bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-1">
                Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Gate bell instructions, landmark, etc."
                className="w-full px-3.5 py-2 text-sm border border-[#202124]/20 rounded-xl bg-white"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-[#FFF8EE] border border-[#202124]/10 text-xs text-[#202124]/80">
              <div className="font-bold text-[#202124]">
                Payment Method: Cash on Delivery (COD)
              </div>
              <p className="mt-0.5">
                Pay PKR {calc.total.toLocaleString()} in cash directly to the rider upon receiving your hot meal.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || !calc.meetsMinOrder}
              className="w-full py-3.5 px-6 bg-[#D92332] text-white text-sm font-bold rounded-xl hover:bg-[#B81B28] disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <span>
                {submitting
                  ? 'Confirming Order...'
                  : `Place Order — PKR ${calc.total.toLocaleString()}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

interface MyOrdersViewProps {
  user: UserProfile | null;
  token: string | null;
  recentConfirmedOrder: Order | null;
  onNavigateLogin: () => void;
  onNavigateMenu: () => void;
}

export const MyOrdersView: React.FC<MyOrdersViewProps> = ({
  user,
  token,
  recentConfirmedOrder,
  onNavigateLogin,
  onNavigateMenu,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Guest / Direct Order Lookup by Order Number + Phone
  const [lookupOrderNum, setLookupOrderNum] = useState(
    recentConfirmedOrder?.orderNumber || 'ZFF-1041'
  );
  const [lookupPhone, setLookupPhone] = useState(
    recentConfirmedOrder?.customerPhone || '0321-4567890'
  );
  const [lookedUpOrder, setLookedUpOrder] = useState<Order | null>(
    recentConfirmedOrder
  );
  const [lookupError, setLookupError] = useState<string | null>(null);

  const fetchMyOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/orders/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  useEffect(() => {
    if (recentConfirmedOrder) {
      setLookedUpOrder(recentConfirmedOrder);
      setLookupOrderNum(recentConfirmedOrder.orderNumber);
      setLookupPhone(recentConfirmedOrder.customerPhone);
    }
  }, [recentConfirmedOrder]);

  const handleLookupOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await apiFetch(
        `/api/orders/lookup/${encodeURIComponent(
          lookupOrderNum.trim()
        )}?phone=${encodeURIComponent(lookupPhone.trim())}`,
        { headers }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Order not found.');
      }
      setLookedUpOrder(data.order);
    } catch (err: unknown) {
      setLookedUpOrder(null);
      setLookupError(
        err instanceof Error ? err.message : 'Unable to find order.'
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#202124]">
          Order Status Tracking & History
        </h1>
        <p className="text-sm text-[#202124]/70 mt-1">
          Track live kitchen preparation and rider dispatch, or review your past order receipts.
        </p>
      </div>

      {/* Post-Order Confirmation Banner if just placed */}
      {recentConfirmedOrder && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#15803D]/30 space-y-4">
          <div className="flex items-center gap-2.5 text-[#15803D]">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-bold">
              Order {recentConfirmedOrder.orderNumber} Confirmed — {recentConfirmedOrder.status}
            </span>
          </div>
          <p className="text-xs text-[#202124]/75">
            Thank you, {recentConfirmedOrder.customerName}. Your Cash on Delivery order totaling{' '}
            <span className="font-mono-tabular font-bold text-[#202124]">
              PKR {recentConfirmedOrder.total.toLocaleString()}
            </span>{' '}
            has been sent to our kitchen for{' '}
            <span className="font-semibold text-[#202124]">
              {recentConfirmedOrder.deliveryAddress}
            </span>
            .
          </p>
        </div>
      )}

      {/* Order Number + Phone Tracker */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#202124]/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-[#202124]">
            Track an Order by Number
          </h2>
          <span className="text-xs text-[#202124]/60">
            Demo Order: <strong className="font-mono-tabular">ZFF-1041</strong> · Phone:{' '}
            <strong className="font-mono-tabular">0321-4567890</strong>
          </span>
        </div>

        <form
          onSubmit={handleLookupOrder}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <input
            type="text"
            required
            value={lookupOrderNum}
            onChange={(e) => setLookupOrderNum(e.target.value.toUpperCase())}
            placeholder="Order # (e.g. ZFF-1041)"
            className="px-3.5 py-2.5 text-sm border border-[#202124]/20 rounded-xl font-mono-tabular uppercase"
          />
          <input
            type="text"
            required
            value={lookupPhone}
            onChange={(e) => setLookupPhone(e.target.value)}
            placeholder="Phone # used on order"
            className="px-3.5 py-2.5 text-sm border border-[#202124]/20 rounded-xl font-mono-tabular"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#202124] text-white text-xs font-semibold rounded-xl hover:bg-[#202124]/85 flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Track Order Status</span>
          </button>
        </form>

        {lookupError && (
          <p className="text-xs font-semibold text-[#D92332]">{lookupError}</p>
        )}

        {lookedUpOrder && (
          <div className="pt-4 border-t border-[#202124]/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs text-[#202124]/60 font-mono-tabular">
                  {lookedUpOrder.orderNumber} · Placed{' '}
                  {new Date(lookedUpOrder.createdAt).toLocaleString()}
                </div>
                <div className="text-base font-bold text-[#202124] mt-0.5">
                  Current Status:{' '}
                  <span className="text-[#D92332]">{lookedUpOrder.status}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#202124]/60">Total (COD)</div>
                <div className="text-lg font-bold text-[#202124] font-mono-tabular">
                  PKR {lookedUpOrder.total.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Status Progress Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
              {(
                [
                  'Pending',
                  'Confirmed',
                  'Preparing',
                  'Ready for Dispatch',
                  'Out for Delivery',
                  'Delivered',
                ] as const
              ).map((step, i, arr) => {
                const currentIdx = arr.indexOf(
                  lookedUpOrder.status as typeof step
                );
                const reached = currentIdx >= i;
                return (
                  <div
                    key={step}
                    className={`p-2.5 rounded-lg border text-xs font-semibold ${
                      reached
                        ? 'border-[#D92332] bg-[#D92332]/8 text-[#202124]'
                        : 'border-[#202124]/10 text-[#202124]/40'
                    }`}
                  >
                    <div className="font-mono-tabular text-[11px]">0{i + 1}</div>
                    <div className="mt-0.5 truncate">{step}</div>
                  </div>
                );
              })}
            </div>

            {/* Itemized Snapshot */}
            <div className="pt-2 space-y-1.5 text-xs">
              {lookedUpOrder.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between py-1 border-b border-[#202124]/6"
                >
                  <span>
                    <strong className="font-mono-tabular">{item.quantity}x</strong>{' '}
                    {item.productName}{' '}
                    <span className="text-[#202124]/60">
                      ({[item.selectedSize, item.selectedSpice].filter(Boolean).join(', ')})
                    </span>
                  </span>
                  <span className="font-mono-tabular font-semibold">
                    PKR {item.lineTotal.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Signed-in Customer's Private Order History */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#202124]">
          My Account Order History
        </h2>
        {!user ? (
          <div className="bg-white p-8 rounded-2xl border border-[#202124]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#202124]">
                Sign in to view your private order history
              </h3>
              <p className="text-xs text-[#202124]/70 mt-1">
                For security and privacy, order history is restricted to the owning customer account.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateLogin}
              className="px-5 py-2.5 bg-[#D92332] text-white text-xs font-semibold rounded-xl hover:bg-[#B81B28] whitespace-nowrap shrink-0"
            >
              Sign In / Register
            </button>
          </div>
        ) : loading ? (
          <p className="text-sm text-[#202124]/60">Loading your orders...</p>
        ) : orders.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-[#202124]/10 text-center space-y-3">
            <p className="text-sm font-semibold text-[#202124]">
              You haven’t placed any orders under {user.email} yet.
            </p>
            <button
              type="button"
              onClick={onNavigateMenu}
              className="px-5 py-2 bg-[#D92332] text-white text-xs font-semibold rounded-lg"
            >
              Order Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white p-6 rounded-2xl border border-[#202124]/10 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#202124]/8">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono-tabular font-bold text-sm text-[#202124]">
                      {ord.orderNumber}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#202124]/65">
                      {new Date(ord.createdAt).toLocaleString()}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#D92332]">
                      {ord.status}
                    </span>
                  </div>
                  <div className="font-mono-tabular font-bold text-sm text-[#202124]">
                    PKR {ord.total.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1 text-xs text-[#202124]/80">
                  {ord.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {it.quantity}x {it.productName} ({it.selectedSize || 'Standard'})
                      </span>
                      <span className="font-mono-tabular">
                        PKR {it.lineTotal.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface AuthViewProps {
  user: UserProfile | null;
  onAuthSuccess: (token: string, user: UserProfile) => void;
  onLogout: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  user,
  onAuthSuccess,
  onLogout,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultAddress, setDefaultAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login'
          ? { email, password }
          : { name, email, phone, defaultAddress, password };

      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }
      onAuthSuccess(data.token, data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Demo login failed');
      onAuthSuccess(data.token, data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white p-8 rounded-2xl border border-[#202124]/10 space-y-5">
          <div className="text-xs text-[#202124]/60">
            Signed in as {user.role === 'admin' ? 'Store Administrator' : 'Customer'}
          </div>
          <h1 className="text-2xl font-bold text-[#202124]">{user.name}</h1>
          <div className="space-y-2 text-sm text-[#202124]/80 pt-2 border-t border-[#202124]/10">
            <p>
              <span className="font-semibold text-[#202124]">Email:</span>{' '}
              {user.email}
            </p>
            <p>
              <span className="font-semibold text-[#202124]">Phone:</span>{' '}
              {user.phone}
            </p>
            <p>
              <span className="font-semibold text-[#202124]">Saved Address:</span>{' '}
              {user.defaultAddress || 'None set'}
            </p>
          </div>
          <div className="pt-4">
            <button
              type="button"
              onClick={onLogout}
              className="px-5 py-2.5 bg-[#202124] text-white text-xs font-semibold rounded-xl hover:bg-[#202124]/85 inline-flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#202124]/10 space-y-6">
        <div className="flex items-center gap-1 p-1 bg-[#202124]/8 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'login'
                ? 'bg-white text-[#202124] shadow-xs'
                : 'text-[#202124]/70'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'register'
                ? 'bg-white text-[#202124] shadow-xs'
                : 'text-[#202124]/70'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#202124]">
              {mode === 'login' ? 'Welcome Back to Zain Fast Food' : 'Create Customer Account'}
            </h1>
            <p className="text-xs text-[#202124]/65 mt-1">
              {mode === 'login'
                ? 'Sign in to view your private order history or access store administration.'
                : 'Save your delivery details and track every order in real time.'}
            </p>
          </div>
          <BrandLogo size="md" showTextLockup={false} />
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#D92332]/30 text-xs text-[#991B1B]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bilal Ahmed"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#202124]/20 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0321-4567890"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#202124]/20 rounded-xl font-mono-tabular"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Default Delivery Address
                </label>
                <input
                  type="text"
                  value={defaultAddress}
                  onChange={(e) => setDefaultAddress(e.target.value)}
                  placeholder="House 42, Street 7, Gulberg II, Lahore"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#202124]/20 rounded-xl"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#202124] mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 text-sm border border-[#202124]/20 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#202124] mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-sm border border-[#202124]/20 rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#D92332] text-white text-xs font-bold rounded-xl hover:bg-[#B81B28] transition-colors"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        {/* One-Click Demo Accounts for Quick Evaluation */}
        <div className="pt-4 border-t border-[#202124]/10 space-y-2.5">
          <div className="text-[11px] font-semibold text-[#202124]/60">
            Quick Demo Sign-In (Development Testing):
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() =>
                quickLogin('customer@zainfastfood.demo', 'Customer123!')
              }
              className="p-2.5 text-xs font-semibold bg-[#FFF8EE] border border-[#202124]/15 rounded-xl hover:bg-[#202124]/5 text-[#202124]"
            >
              Demo Customer
            </button>
            <button
              type="button"
              onClick={() => quickLogin('admin@zainfastfood.demo', 'Admin123!')}
              className="p-2.5 text-xs font-semibold bg-[#202124] text-white rounded-xl hover:bg-[#202124]/85"
            >
              Demo Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
