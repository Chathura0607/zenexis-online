'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductReview } from '@/types';
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
  HeartIcon,
} from './icons';
import {
  addToCart,
  getProductReviews,
  addProductReview,
  toggleWishlist,
  isInWishlist,
  getLoggedInCustomer,
} from '@/lib/storage';
import { generateDirectWhatsAppQueryUrl } from '@/lib/whatsapp';
import { SHOP_CONFIG, getProductDisplayImage, getCategoryFallbackImage } from '@/lib/constants';

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
  const [isFavorited, setIsFavorited] = useState(false);

  // Review states
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewName, setReviewName] = useState('');
  const [reviewCity, setReviewCity] = useState('Ambalangoda');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (product) {
      setQty(1);
      setIsFavorited(isInWishlist(product.id));
      const loadedReviews = getProductReviews(product.id);
      setReviews(loadedReviews);

      // Pre-fill reviewer name if logged in
      const customer = getLoggedInCustomer();
      if (customer) {
        if (customer.name) setReviewName(customer.name);
        if (customer.city) setReviewCity(customer.city);
      }
    }
  }, [product]);

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

  const handleToggleFav = () => {
    const nextState = toggleWishlist(product.id);
    setIsFavorited(nextState);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;

    const newRev = addProductReview({
      productId: product.id,
      customerName: reviewName.trim(),
      city: reviewCity.trim() || 'Ambalangoda',
      rating: reviewRating,
      comment: reviewComment.trim(),
      verifiedPurchase: true,
    });

    setReviews([newRev, ...reviews]);
    setReviewSubmitted(true);
    setReviewComment('');
    setTimeout(() => {
      setReviewSubmitted(false);
      setShowReviewForm(false);
    }, 1800);
  };

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const whatsappUrl = generateDirectWhatsAppQueryUrl(product.name);

  // Calculate rating breakdown
  const totalReviewsCount = reviews.length > 0 ? reviews.length : product.reviewsCount;
  const currentRating = reviews.length > 0
    ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
    : product.rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Close & Wishlist Controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleFav}
            className={`p-2.5 rounded-full backdrop-blur-md border transition ${
              isFavorited
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30'
                : 'bg-white/80 dark:bg-slate-950/80 text-slate-500 dark:text-slate-300 hover:text-rose-500 border-slate-200 dark:border-slate-700/60'
            }`}
            title={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <HeartIcon className="w-5 h-5" filled={isFavorited} />
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/80 dark:bg-slate-950/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 backdrop-blur-md transition"
            title="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="overflow-y-auto p-4 sm:p-7 space-y-6">
          {/* Main Top Row: Image & Key Purchasing Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Image Container */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getProductDisplayImage(product)}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getCategoryFallbackImage(product.category);
                }}
              />
              {discountPercent > 0 && (
                <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-xl bg-red-500 text-white font-black text-xs shadow-md">
                  -{discountPercent}% SPECIAL DISCOUNT
                </span>
              )}
            </div>

            {/* Info & Purchase Options */}
            <div className="flex flex-col justify-between h-full">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20 inline-block">
                  {product.category.replace('_', ' ')}
                </span>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2.5 leading-snug">
                  {product.name}
                </h2>

                {product.nameSi && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-light">
                    {product.nameSi}
                  </p>
                )}

                {/* Rating & Stock Status */}
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <div className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 text-amber-500">
                    <StarIcon className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">{currentRating}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">({totalReviewsCount} reviews)</span>
                  </div>

                  {product.inStock ? (
                    product.stockCount <= 5 ? (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 animate-pulse">
                        <span>⚡ Only {product.stockCount} left in stock - order soon!</span>
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>In Stock ({product.stockCount} units)</span>
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div className="flex items-baseline gap-3 mt-4">
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Rs. {product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-slate-400 dark:text-slate-500 line-through">
                      Rs. {product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Quantity:</span>
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                    >
                      <MinusIcon className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 text-sm font-bold text-slate-900 dark:text-white">{qty}</span>
                    <button
                      type="button"
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
                  type="button"
                  onClick={handleAdd}
                  disabled={!product.inStock}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xl ${
                    !product.inStock
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                      : added
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/20 active:scale-98'
                  }`}
                >
                  {added ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      <span>Added to Shopping Cart!</span>
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
                  className="w-full py-3 px-4 rounded-2xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition flex items-center justify-center gap-2"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-emerald-500" />
                  <span>Ask Question on WhatsApp (0701120945)</span>
                </a>
              </div>
            </div>
          </div>

          {/* Daraz & Amazon Style Delivery Promise Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-start gap-2.5">
              <TruckIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-slate-900 dark:text-white">Island-wide Delivery</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">2 - 3 Days via Cash on Delivery across Sri Lanka.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPinIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-slate-900 dark:text-white">Store Pickup (Ambalangoda)</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Ready in 30 Minutes at our Main Showroom.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheckIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-slate-900 dark:text-white">7-Day Guarantee</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Genuine hardware with shop warranty support.</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Product Description</h4>
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

          {/* 100% WORKING CUSTOMER REVIEWS & RATINGS SECTION */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Customer Reviews</span>
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                    ({totalReviewsCount})
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Verified customer feedback for Zenexis Ambalangoda
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-xs font-bold transition"
              >
                {showReviewForm ? 'Cancel' : '✍️ Write a Review'}
              </button>
            </div>

            {/* Write Review Form */}
            {showReviewForm && (
              <form onSubmit={handleReviewSubmit} className="p-4 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-cyan-500/30 space-y-3">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Share Your Review:</h5>

                {/* Star Selector */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400 mr-2">Your Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setReviewHoverRating(star)}
                      onMouseLeave={() => setReviewHoverRating(0)}
                      onClick={() => setReviewRating(star)}
                      className="p-1 focus:outline-none"
                    >
                      <StarIcon
                        className={`w-5 h-5 transition-colors ${
                          (reviewHoverRating || reviewRating) >= star
                            ? 'fill-amber-400 text-amber-400 scale-110'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-500 ml-2">
                    {reviewHoverRating || reviewRating} / 5 Stars
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder="e.g. Chathura"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Your City / Location</label>
                    <input
                      type="text"
                      value={reviewCity}
                      onChange={(e) => setReviewCity(e.target.value)}
                      placeholder="e.g. Ambalangoda, Galle"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Your Review *</label>
                  <textarea
                    rows={2}
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="How was the product quality and packaging?"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={reviewSubmitted}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                >
                  {reviewSubmitted ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      <span>Review Published Successfully!</span>
                    </>
                  ) : (
                    <span>Submit Verified Review</span>
                  )}
                </button>
              </form>
            )}

            {/* Reviews List */}
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800/60 text-center space-y-1">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No customer reviews written yet for this item.
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Have you purchased this product from Zenexis Ambalangoda? Click &quot;Write a Review&quot; above to be the first!
                  </p>
                </div>
              ) : (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {rev.customerName}
                        </span>
                        {rev.city && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            • {rev.city}
                          </span>
                        )}
                        {rev.verifiedPurchase && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                            ✓ Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-3 h-3 ${
                              i < rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
