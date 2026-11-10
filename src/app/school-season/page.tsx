'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { SchoolSeasonSection } from '@/components/SchoolSeasonSection';
import { CartDrawer } from '@/components/CartDrawer';
import { NotificationModal } from '@/components/NotificationModal';
import { OrderSuccessModal } from '@/components/OrderSuccessModal';
import { AIChatModal } from '@/components/AIChatModal';
import { Order } from '@/types';

export default function SchoolSeasonPage() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 pb-16 sm:pb-0 transition-colors">
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        onOpenNotifications={() => setIsNotifsOpen(true)}
        searchQuery=""
        setSearchQuery={() => {}}
        activeCategory="school_bundles"
        setActiveCategory={() => {}}
      />

      <main className="flex-1">
        <SchoolSeasonSection />
      </main>

      <MobileBottomNav onOpenCart={() => setIsCartOpen(true)} />
      <AIChatModal />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSuccess={(order) => setCompletedOrder(order)}
      />

      <NotificationModal
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
      />

      <OrderSuccessModal
        order={completedOrder}
        onClose={() => setCompletedOrder(null)}
      />
    </div>
  );
}

