'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BellIcon, XIcon, CheckIcon, SparklesIcon, PackageIcon, BookOpenIcon } from './icons';
import { AppNotification } from '@/types';
import { getStoredNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/storage';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadNotifications = () => {
    setNotifications(getStoredNotifications());
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAll = () => {
    markAllNotificationsRead();
    loadNotifications();
  };

  const handleItemClick = (id: string) => {
    markNotificationRead(id);
    loadNotifications();
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'order':
        return <PackageIcon className="w-5 h-5 text-cyan-400" />;
      case 'school':
        return <BookOpenIcon className="w-5 h-5 text-amber-400" />;
      case 'product':
        return <SparklesIcon className="w-5 h-5 text-emerald-400" />;
      default:
        return <BellIcon className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <BellIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Store Notifications</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Updates, new items & school offers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.read) && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 transition"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-100 dark:divide-slate-800/40">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BellIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2 opacity-50" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No notifications right now.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif.id)}
                className={`pt-3 first:pt-0 flex gap-3.5 p-3 rounded-2xl transition cursor-pointer ${
                  notif.read ? 'bg-slate-50 dark:bg-slate-900/20 opacity-80' : 'bg-cyan-50/50 dark:bg-slate-800/50 border border-cyan-500/20 dark:border-slate-700/50'
                }`}
              >
                <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">{notif.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                  {notif.link && (
                    <Link
                      href={notif.link}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 hover:underline mt-2 font-bold"
                    >
                      <span>View details</span>
                      <span>→</span>
                    </Link>
                  )}
                </div>
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-cyan-500 mt-2 shrink-0 animate-pulse" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Zenexis Online Showroom • Ambalangoda • WhatsApp: 0701120945
          </p>
        </div>
      </div>
    </div>
  );
};

