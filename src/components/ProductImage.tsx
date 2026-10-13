import React, { useState } from 'react';
import { Utensils } from 'lucide-react';
import { resolveProductImage } from '../assets/imageRegistry';

interface ProductImageProps {
  imageKey: string;
  alt: string;
  className?: string;
  lazy?: boolean;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  imageKey,
  alt,
  className = 'w-full h-full object-cover',
  lazy = true,
}) => {
  const [hasError, setHasError] = useState(false);
  const src = resolveProductImage(imageKey);

  React.useEffect(() => {
    setHasError(false);
  }, [imageKey]);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#F4ECE1] text-[#202124]/60 p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Utensils className="w-8 h-8 mb-2 text-[#D92332]" />
        <span className="text-xs font-medium line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={lazy ? 'lazy' : 'eager'}
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
