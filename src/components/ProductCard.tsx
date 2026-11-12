'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/types';
import { ShoppingCartIcon, WhatsAppIcon, StarIcon, CheckIcon, EyeIcon, HeartIcon } from './icons';
import { addToCart, toggleWishlist, isInWishlist, addRecentlyViewed } from '@/lib/storage';
import { generateDirectWhatsAppQueryUrl } from '@/lib/whatsapp';
import { getProductDisplayImage, getCategoryFallbackImage } from '@/lib/constants';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetails }) => {
  const [added, setAdded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    setIsFavorited(isInWishlist(product.id));
    const handleWishlistChange = () => {
      setIsFavorited(isInWishlist(product.id));
    };
    window.addEventListener('zenexis_wishlist_updated', handleWishlistChange);
    return () => window.removeEventListener('zenexis_wishlist_updated', handleWishlistChange);
  }, [product.id]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleCardClick = () => {
    addRecentlyViewed(product.id);
    onOpenDetails(product);
  };

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const whatsappUrl = generateDirectWhatsAppQueryUrl(product.name);

  return (
    <div
      onClick={handleCardClick}
      id={`product-${product.id}`}
      className="group relative bg-white dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-cyan-500/50 rounded-2xl sm:rounded-3xl p-3 sm:p-4 transition-all duration-300 flex flex-col justify-between shadow-md dark:shadow-lg hover:shadow-cyan-950/20 cursor-pointer overflow-hidden"
    >
      {/* Top badges */}
      <div className="absolute top-4 left-4 right-14 z-10 flex items-center gap-1.5 pointer-events-none">
        {discountPercent > 0 ? (
          <span className="px-2 py-0.5 rounded-lg bg-red-500/90 text-white font-black text-[10px] tracking-wide shadow-md">
            -{discountPercent}% OFF
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 text-cyan-700 dark:text-cyan-400 font-bold text-[10px] border border-slate-200 dark:border-slate-700">
            {product.category.replace('_', ' ')}
          </span>
        )}

        {product.inStock ? (
          product.stockCount <= 5 ? (
            <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 backdrop-blur-md animate-pulse">
              <span>⚡ Only {product.stockCount} left!</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>In Stock</span>
            </span>
          )
        ) : (
          <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-medium backdrop-blur-md">
            Out of Stock
          </span>
        )}
      </div>

      {/* Wishlist Heart Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          const nowFav = toggleWishlist(product.id);
          setIsFavorited(nowFav);
        }}
        className={`absolute top-3.5 right-3.5 z-20 p-2 rounded-xl backdrop-blur-md transition-all duration-200 ${
          isFavorited
            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-105'
            : 'bg-white/80 dark:bg-slate-900/80 text-slate-400 hover:text-rose-500 border border-slate-200/80 dark:border-slate-800'
        }`}
        title={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <HeartIcon className="w-3.5 h-3.5" filled={isFavorited} />
      </button>

      {/* Image Container */}
      <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 mb-3 sm:mb-4 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getProductDisplayImage(product)}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getCategoryFallbackImage(product.category);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
          <span className="text-[11px] text-cyan-300 font-medium flex items-center gap-1 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700">
            Click to inspect specs
          </span>
        </div>
      </div>

      {/* Product Information */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="flex text-amber-400">
              <StarIcon className="w-3.5 h-3.5 fill-amber-400" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{product.rating}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">({product.reviewsCount})</span>
            {product.isSchoolSeason && (
              <span className="ml-auto text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                School Pack
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
            {product.name}
          </h3>

          {/* Sinhala Sub-label */}
          {product.nameSi && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-light">
              {product.nameSi}
            </p>
          )}

          {/* Short Specs / Description */}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed hidden sm:block">
            {product.description}
          </p>
        </div>

        {/* Price & Action Buttons */}
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-col gap-2.5">
          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Rs. {product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-slate-400 dark:text-slate-500 line-through">
                Rs. {product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md ${
                !product.inStock
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                  : added
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/20 active:scale-95'
              }`}
            >
              {added ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <ShoppingCartIcon className="w-3.5 h-3.5 text-slate-950" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            {/* Direct WhatsApp Inquire */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="py-2 px-2.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition flex items-center justify-center gap-1.5"
              title="Ask about this item on WhatsApp"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 fill-emerald-500" />
              <span>Ask WP</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

