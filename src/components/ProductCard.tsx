import React from 'react';
import { Plus } from 'lucide-react';
import { Product } from '../types';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product, e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  onQuickAdd,
}) => {
  const isAvailable = product.isAvailable && (!product.trackStock || product.stockQuantity > 0);
  const hasSale =
    typeof product.salePrice === 'number' &&
    product.salePrice > 0 &&
    product.salePrice < product.price;
  const effectivePrice = hasSale ? product.salePrice! : product.price;

  return (
    <article
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-xl border border-[#202124]/10 overflow-hidden flex flex-col cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-[#D92332]"
    >
      {/* 4:3 Image Container (65%-75% visual dominance) */}
      <div className="relative aspect-[4/3] w-full bg-[#F5EFE6] overflow-hidden">
        <ProductImage
          imageKey={product.imageKey}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02] ${
            !isAvailable ? 'opacity-50 grayscale' : ''
          }`}
        />
        {!isAvailable && (
          <div className="absolute inset-0 bg-[#202124]/60 flex items-center justify-center">
            <span className="text-xs font-semibold tracking-wide text-white bg-[#202124] px-3 py-1.5 rounded">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          {/* Clean unboxed metadata with typographic separators */}
          <div className="flex items-center gap-1.5 text-xs text-[#202124]/60 mb-1.5">
            <span>{product.categoryName}</span>
            <span aria-hidden="true">·</span>
            <span>{product.prepEstimateMinutes} mins</span>
            {hasSale && isAvailable && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[#D92332]">Special Offer</span>
              </>
            )}
            {product.trackStock && product.stockQuantity > 0 && product.stockQuantity <= 5 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-[#B45309]">Only {product.stockQuantity} left</span>
              </>
            )}
          </div>

          <h3 className="text-base font-semibold text-[#202124] group-hover:text-[#D92332] transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-sm text-[#202124]/70 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Baseline-aligned Price & Action Row */}
        <div className="pt-3 border-t border-[#202124]/8 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold text-[#202124] font-mono-tabular">
              PKR {effectivePrice.toLocaleString()}
            </span>
            {hasSale && (
              <span className="text-xs text-[#202124]/45 line-through font-mono-tabular">
                PKR {product.price.toLocaleString()}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={!isAvailable}
            onClick={(e) => onQuickAdd(product, e)}
            aria-label={isAvailable ? `Add ${product.name} to cart` : `${product.name} is out of stock`}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D92332] ${
              isAvailable
                ? 'bg-[#D92332] text-white hover:bg-[#B81B28]'
                : 'bg-[#202124]/10 text-[#202124]/40 cursor-not-allowed'
            }`}
          >
            {isAvailable ? (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </>
            ) : (
              <span>Unavailable</span>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
