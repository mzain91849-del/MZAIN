import React, { useState } from 'react';
import { ArrowLeft, Minus, Plus, ShoppingBag, Check } from 'lucide-react';
import { Product } from '../types';
import { ProductImage } from './ProductImage';
import { ProductCard } from './ProductCard';

interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
  onBack: () => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    selectedSize?: string,
    selectedSpice?: string,
    selectedAddonIds?: string[]
  ) => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  relatedProducts,
  onBack,
  onAddToCart,
  onSelectProduct,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes?.[0]?.label || 'Regular'
  );
  const [selectedSpice, setSelectedSpice] = useState<string>(
    product.spiceLevels?.[0] || ''
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [justAdded, setJustAdded] = useState(false);

  // Reset options when switching to a related product
  React.useEffect(() => {
    setSelectedSize(product.sizes?.[0]?.label || 'Regular');
    setSelectedSpice(product.spiceLevels?.[0] || '');
    setSelectedAddonIds([]);
    setQuantity(1);
    setJustAdded(false);
  }, [product]);

  const isAvailable =
    product.isAvailable && (!product.trackStock || product.stockQuantity > 0);
  const maxQty = product.trackStock
    ? Math.max(1, Math.min(20, product.stockQuantity))
    : 20;

  const hasSale =
    typeof product.salePrice === 'number' &&
    product.salePrice > 0 &&
    product.salePrice < product.price;
  const basePrice = hasSale ? product.salePrice! : product.price;

  const sizeObj =
    product.sizes?.find((s) => s.label === selectedSize) || product.sizes?.[0];
  const sizeDelta = sizeObj ? Number(sizeObj.priceDelta) || 0 : 0;

  const addonsTotal = (product.addons || [])
    .filter((a) => selectedAddonIds.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);

  const unitTotal = basePrice + sizeDelta + addonsTotal;
  const lineTotal = unitTotal * quantity;

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddClick = () => {
    if (!isAvailable) return;
    onAddToCart(
      product,
      quantity,
      selectedSize,
      selectedSpice || undefined,
      selectedAddonIds
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#202124]/70 hover:text-[#202124] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Menu</span>
      </button>

      {/* Contiguous Purchase Module: Sticky Gallery Left, Sticky Purchase Module Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Product Photography */}
        <div className="lg:col-span-7 lg:sticky lg:top-24">
          <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-white border border-[#202124]/10">
            <ProductImage
              imageKey={product.imageKey}
              alt={product.name}
              lazy={false}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-xs text-[#202124]/55 mt-3">
            Note: Sample menu item and pricing shown for development demonstration. Verify ingredients and allergen details directly with the store before public launch.
          </p>
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-[#202124]/10 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#202124]/60 mb-2">
              <span>{product.categoryName}</span>
              <span aria-hidden="true">·</span>
              <span>Est. {product.prepEstimateMinutes} mins prep</span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  isAvailable
                    ? 'text-[#15803D] font-semibold'
                    : 'text-[#D92332] font-semibold'
                }
              >
                {isAvailable
                  ? product.trackStock
                    ? `In Stock (${product.stockQuantity} available)`
                    : 'In Stock'
                  : 'Sold Out'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#202124] leading-tight">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-2xl font-bold text-[#202124] font-mono-tabular">
                PKR {unitTotal.toLocaleString()}
              </span>
              {hasSale && (
                <span className="text-sm text-[#202124]/45 line-through font-mono-tabular">
                  PKR {(product.price + sizeDelta + addonsTotal).toLocaleString()}
                </span>
              )}
            </div>

            <p className="text-sm text-[#202124]/75 mt-4 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Size / Portion Options */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="pt-4 border-t border-[#202124]/10">
              <label className="block text-xs font-bold text-[#202124] mb-2.5">
                Select Size / Portion
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.sizes.map((sz) => {
                  const active = selectedSize === sz.label;
                  return (
                    <button
                      key={sz.label}
                      type="button"
                      onClick={() => setSelectedSize(sz.label)}
                      className={`p-3 rounded-xl border text-left transition-colors flex items-center justify-between gap-2 ${
                        active
                          ? 'border-[#D92332] bg-[#D92332]/5 text-[#202124]'
                          : 'border-[#202124]/15 hover:border-[#202124]/35 text-[#202124]/80'
                      }`}
                    >
                      <span className="text-xs font-semibold">{sz.label}</span>
                      <span className="text-xs font-mono-tabular text-[#202124]/65 whitespace-nowrap">
                        {sz.priceDelta > 0
                          ? `+PKR ${sz.priceDelta.toLocaleString()}`
                          : 'Included'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spice Level Selector */}
          {product.spiceLevels && product.spiceLevels.length > 0 && (
            <div className="pt-4 border-t border-[#202124]/10">
              <label className="block text-xs font-bold text-[#202124] mb-2.5">
                Spice Preference
              </label>
              <div className="flex flex-wrap gap-2">
                {product.spiceLevels.map((sp) => {
                  const active = selectedSpice === sp;
                  return (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => setSelectedSpice(sp)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-[#202124] text-white border-[#202124]'
                          : 'bg-white text-[#202124]/75 border-[#202124]/15 hover:border-[#202124]/35'
                      }`}
                    >
                      {sp}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional Add-ons */}
          {product.addons && product.addons.length > 0 && (
            <div className="pt-4 border-t border-[#202124]/10">
              <label className="block text-xs font-bold text-[#202124] mb-2.5">
                Optional Add-ons
              </label>
              <div className="space-y-2">
                {product.addons.map((addon) => {
                  const checked = selectedAddonIds.includes(addon.id);
                  return (
                    <label
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        checked
                          ? 'border-[#D92332] bg-[#D92332]/5'
                          : 'border-[#202124]/15 hover:border-[#202124]/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            checked
                              ? 'bg-[#D92332] border-[#D92332] text-white'
                              : 'border-[#202124]/30 bg-white'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-semibold text-[#202124]">
                          {addon.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono-tabular text-[#202124]/70">
                        +PKR {addon.price.toLocaleString()}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & Primary Add to Cart CTA */}
          <div className="pt-5 border-t border-[#202124]/10 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold text-[#202124]">Quantity</span>
              <div className="inline-flex items-center border border-[#202124]/20 rounded-xl bg-[#FFF8EE]">
                <button
                  type="button"
                  disabled={!isAvailable || quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2.5 text-[#202124] disabled:opacity-40 hover:bg-[#202124]/5 rounded-l-xl"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-bold font-mono-tabular">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={!isAvailable || quantity >= maxQty}
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  className="p-2.5 text-[#202124] disabled:opacity-40 hover:bg-[#202124]/5 rounded-r-xl"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={!isAvailable}
              onClick={handleAddClick}
              className={`w-full py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                !isAvailable
                  ? 'bg-[#202124]/15 text-[#202124]/45 cursor-not-allowed'
                  : justAdded
                  ? 'bg-[#15803D] text-white'
                  : 'bg-[#D92332] text-white hover:bg-[#B81B28]'
              }`}
            >
              {!isAvailable ? (
                <span>Currently Out of Stock</span>
              ) : justAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Cart · PKR {lineTotal.toLocaleString()}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    Add to Cart — PKR {lineTotal.toLocaleString()}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Related Items */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 pt-12 border-t border-[#202124]/10">
          <h2 className="text-xl font-bold text-[#202124] mb-6">
            More from {product.categoryName}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.slice(0, 3).map((rp) => (
              <ProductCard
                key={rp.id}
                product={rp}
                onSelectProduct={onSelectProduct}
                onQuickAdd={(p, e) => {
                  e.stopPropagation();
                  onAddToCart(
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
      )}
    </div>
  );
};
