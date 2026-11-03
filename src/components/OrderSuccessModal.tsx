'use client';

import React from 'react';
import { Order } from '@/types';
import { CheckIcon, WhatsAppIcon, PackageIcon, MapPinIcon, XIcon } from './icons';
import { generateOrderWhatsAppMessage, createWhatsAppUrl } from '@/lib/whatsapp';
import { SHOP_CONFIG } from '@/lib/constants';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const whatsappMessage = generateOrderWhatsAppMessage(order);
  const whatsappUrl = createWhatsAppUrl(SHOP_CONFIG.whatsappNumber, whatsappMessage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 text-center overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 blur-3xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg transition"
        >
          <XIcon className="w-5 h-5" />
        </button>

        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckIcon className="w-8 h-8 stroke-[3]" />
        </div>

        <h3 className="text-2xl font-black text-white">Order Placed Successfully!</h3>
        <p className="text-sm text-slate-400 mt-1">
          Thank you <strong className="text-white">{order.customerName}</strong>. Your order is registered in our system.
        </p>

        {/* Order Details Box */}
        <div className="my-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left text-xs space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-medium">Order Number:</span>
            <span className="font-mono font-bold text-cyan-400">#{order.orderNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Items Count:</span>
            <span className="text-white font-semibold">
              {order.items.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Delivery Method:</span>
            <span className="text-white font-semibold">
              {order.deliveryMethod === 'store_pickup' ? '🏪 In-Store Pickup' : '🚚 Island-wide Delivery'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Payment Mode:</span>
            <span className="text-emerald-400 font-bold">
              {order.paymentMethod === 'cod' ? '💵 Cash on Delivery (COD)' : '🏪 Pay at Pickup'}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm">
            <span className="text-slate-200 font-bold">Total Amount:</span>
            <span className="text-lg font-black text-cyan-400">
              Rs. {order.total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Crucial WhatsApp Button */}
        <div className="space-y-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 transition transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <WhatsAppIcon className="w-5 h-5 fill-white" />
            <span>Send Order via WhatsApp to Shop (0701120945)</span>
          </a>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Clicking above will open WhatsApp with your full order details to confirm instant preparation!
          </p>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
            >
              Continue Shopping
            </button>
            <a
              href={`/track?order=${order.orderNumber}`}
              className="px-5 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold rounded-xl border border-cyan-500/30 transition flex items-center gap-1.5"
            >
              <PackageIcon className="w-4 h-4" />
              <span>Track Status</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

