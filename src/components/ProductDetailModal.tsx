'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import {
  XIcon,
  ShoppingCartIcon,
  WhatsAppIcon,
  StarIcon,
  CheckIcon,
  PlusIcon,
  MinusIcon,
  ShieldCheckIcon,
  TruckIcon,
  MapPinIcon,
} from './icons';
import { addToCart } from '@/lib/storage';
import { generateDirectWhatsAppQueryUrl } from '@/lib/whatsapp';
import { SHOP_CONFIG } from '@/lib/constants';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenCart: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onOpenCart,
}) => {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const handleAdd = () => {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
      onOpenCart();
    }, 900);
  };

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const whatsappUrl = generateDirectWhatsAppQueryUrl(product.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100 dark:bg-slate-950/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 backdrop-blur-md transition"
        >
          <XIcon className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {discountPercent > 0 && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-red-500 text-white font-black text-xs shadow-md">
                  {discountPercent}% DISCOUNT
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                  {product.category.replace('_', ' ')}
                </span>

                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-3 leading-snug">
                  {product.name}
                </h2>

                {product.nameSi && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-light">{product.nameSi}</p>
                )}

                {/* Rating & Stock */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    <StarIcon className="w-4 h-4 fill-amber-400" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{product.rating}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">({product.reviewsCount} reviews)</span>
                  </div>

                  {product.inStock ? (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      In Stock ({product.stockCount} units)
                    </span>
                  ) : (
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Out of Stock</span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3 mt-4">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    Rs. {product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && (
                    <span className="text-base text-slate-400 dark:text-slate-500 line-through">
                      Rs. {product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="mt-5 flex items-center gap-3">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Quantity:</span>
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                    >
                      <MinusIcon className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 text-sm font-bold text-slate-900 dark:text-white">{qty}</span>
                    <button
                      onClick={() => setQty((q) => Math.min(product.stockCount || 50, q + 1))}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  onClick={handleAdd}
                  disabled={!product.inStock}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg ${
                    !product.inStock
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                      : added
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/20 active:scale-95'
                  }`}
                >
                  {added ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCartIcon className="w-4 h-4 text-slate-950" />
                      <span>Add to Cart (Rs. {(product.price * qty).toLocaleString()})</span>
                    </>
                  )}
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition flex items-center justify-center gap-2"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-emerald-500" />
                  <span>Ask Instant Question on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Description</h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Specifications */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Key Specifications</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(product.specs).map(([k, v]) => (
                  <div key={k} className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">{k}</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guarantee & Location Badges */}
          <div className="grid grid-cols-3 gap-3 border-t border-slate-200 dark:border-slate-800 pt-5 text-center text-[11px] text-slate-600 dark:text-slate-400">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60 flex flex-col items-center">
              <TruckIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mb-1" />
              <span>Island-wide Delivery</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60 flex flex-col items-center">
              <ShieldCheckIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-1" />
              <span>Genuine Warranty</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60 flex flex-col items-center">
              <MapPinIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-1" />
              <span>Ambalangoda, Sri Lanka</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

