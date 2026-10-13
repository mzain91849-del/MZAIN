import React from 'react';
import { StoreSettings } from '../types';
import { BrandLogo } from './BrandLogo';

interface InfoViewsProps {
  settings: StoreSettings;
  onNavigateMenu: () => void;
}

export const AboutFaqPoliciesView: React.FC<InfoViewsProps> = ({
  settings,
  onNavigateMenu,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* 01. About Zain Fast Food */}
      <section className="bg-white p-8 sm:p-10 rounded-2xl border border-[#202124]/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-4">
          <div className="text-xs text-[#202124]/60">
            <span>Brand Story</span>
            <span aria-hidden="true"> · </span>
            <span>Working Brand Name: {settings.storeName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#202124]">
            01. Fresh Kitchen Craftsmanship, Built for Fast Delivery
          </h1>
          <p className="text-sm sm:text-base text-[#202124]/75 leading-relaxed max-w-2xl">
            {settings.storeName} (“{settings.tagline}”) is designed around straightforward culinary standards: freshly seared smash burgers, pressure-fried golden chicken, and stone-baked pizzas prepared to order and dispatched in insulated thermal bags.
          </p>
          <p className="text-xs text-[#202124]/60 pt-2">
            Development Notice: All menu prices, product descriptions, contact details, and policies shown in this environment are clearly labelled demo placeholders and should be replaced with verified business details prior to public launch.
          </p>
        </div>
        <div className="shrink-0 self-center md:self-auto">
          <BrandLogo
            size="xl"
            showTextLockup={false}
            storeName={settings.storeName}
            customLogoUrl={settings.logoUrl}
          />
        </div>
      </section>

      {/* 02. Contact, Hours & Delivery Coverage */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl border border-[#202124]/10 space-y-3">
          <h2 className="text-lg font-bold text-[#202124]">
            02. Contact & Opening Hours
          </h2>
          <div className="space-y-2 text-sm text-[#202124]/80">
            <p>
              <span className="font-semibold text-[#202124]">Phone:</span>{' '}
              {settings.phone}
            </p>
            <p>
              <span className="font-semibold text-[#202124]">Email:</span>{' '}
              {settings.email}
            </p>
            <p>
              <span className="font-semibold text-[#202124]">Kitchen Address:</span>{' '}
              {settings.address}
            </p>
            <p>
              <span className="font-semibold text-[#202124]">Opening Hours:</span>{' '}
              {settings.openingHours}
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-[#202124]/10 space-y-3">
          <h2 className="text-lg font-bold text-[#202124]">
            03. Delivery Rules & Fees
          </h2>
          <div className="space-y-2 text-sm text-[#202124]/80">
            <p>
              <span className="font-semibold text-[#202124]">Standard Delivery Fee:</span>{' '}
              <span className="font-mono-tabular">
                PKR {settings.deliveryFee.toLocaleString()}
              </span>
            </p>
            <p>
              <span className="font-semibold text-[#202124]">Free Delivery Threshold:</span>{' '}
              Orders of{' '}
              <span className="font-mono-tabular font-semibold">
                PKR {settings.freeDeliveryThreshold.toLocaleString()}
              </span>{' '}
              or above (after discounts).
            </p>
            <p>
              <span className="font-semibold text-[#202124]">Minimum Order Subtotal:</span>{' '}
              <span className="font-mono-tabular">
                PKR {settings.minOrderAmount.toLocaleString()}
              </span>
            </p>
            <p>
              <span className="font-semibold text-[#202124]">Coverage Zones:</span>{' '}
              {settings.deliveryCoverage}
            </p>
          </div>
        </div>
      </section>

      {/* 04. Frequently Asked Questions */}
      <section className="bg-white p-8 sm:p-10 rounded-2xl border border-[#202124]/10 space-y-6">
        <h2 className="text-xl font-bold text-[#202124]">
          04. Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-bold text-[#202124]">
              What payment methods are currently supported?
            </h3>
            <p className="text-xs text-[#202124]/70 mt-1 leading-relaxed">
              Cash on Delivery (COD) in PKR is enabled by default. You pay the rider directly upon receiving your order. No payment-card or CVV details are collected or stored.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#202124]">
              How are totals, coupons, and delivery fees calculated?
            </h3>
            <p className="text-xs text-[#202124]/70 mt-1 leading-relaxed">
              Every item price, size option, add-on, promotional discount, and delivery fee is calculated and validated directly on the server before an order is confirmed.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#202124]">
              Can I track my order status after checkout?
            </h3>
            <p className="text-xs text-[#202124]/70 mt-1 leading-relaxed">
              Yes. Signed-in customers can view real-time status updates (Pending, Confirmed, Preparing, Ready for Dispatch, Out for Delivery, Delivered) in “My Orders”, or look up an order using their Order Number and phone number.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#202124]">
              Do product edits affect past order receipts?
            </h3>
            <p className="text-xs text-[#202124]/70 mt-1 leading-relaxed">
              No. When you place an order, the server stores an immutable snapshot of each item’s name, unit price, size, spice level, and add-ons at the moment of purchase.
            </p>
          </div>
        </div>
      </section>

      {/* 05. Store Policies (Demo Placeholder Text) */}
      <section className="bg-white p-8 sm:p-10 rounded-2xl border border-[#202124]/10 space-y-4">
        <h2 className="text-xl font-bold text-[#202124]">
          05. Store Policies (Demo Template — Confirm Before Launch)
        </h2>
        <div className="space-y-3 text-xs text-[#202124]/75 leading-relaxed">
          <p>
            <strong className="text-[#202124]">Cancellation & Refund Policy (Demo):</strong>{' '}
            Orders may be cancelled while in “Pending” status before kitchen preparation begins. Once an order enters “Preparing” or “Out for Delivery”, cancellations require direct phone verification with store support.
          </p>
          <p>
            <strong className="text-[#202124]">Privacy Policy (Demo):</strong>{' '}
            Customer name, phone number, and delivery address are used strictly for order fulfillment, rider dispatch, and customer order history access. Customers can only view their own order records.
          </p>
          <p>
            <strong className="text-[#202124]">Dietary & Allergen Disclaimer:</strong>{' '}
            No allergen, dietary, halal, or nutritional claims are displayed unless formally verified by the business. Customers with food allergies should contact the kitchen directly prior to ordering.
          </p>
        </div>
        <div className="pt-3">
          <button
            type="button"
            onClick={onNavigateMenu}
            className="px-5 py-2.5 bg-[#D92332] text-white text-xs font-semibold rounded-lg hover:bg-[#B81B28] transition-colors"
          >
            Browse Menu
          </button>
        </div>
      </section>
    </div>
  );
};
