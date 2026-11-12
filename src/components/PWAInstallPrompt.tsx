'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DownloadIcon,
  XIcon,
  SparklesIcon,
  SmartphoneIcon,
  LaptopIcon,
  CheckIcon,
} from './icons';

const DISMISS_KEY = 'zenexis_pwa_dismissed_until';
const LEGACY_DISMISS_KEY = 'zenexis_pwa_dismissed';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  // Detect running in standalone PWA mode
  const checkIsStandalone = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  }, []);

  // Detect platform (iOS, Android, or Desktop)
  const detectPlatform = (): 'ios' | 'android' | 'desktop' => {
    if (typeof window === 'undefined') return 'desktop';
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    return 'desktop';
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect device platform
    const detected = detectPlatform();
    setPlatform(detected);

    // Register Service Worker for PWA compliance
    if ('serviceWorker' in navigator) {
      const isGhPages = window.location.pathname.startsWith('/zenexis-online');
      const swPath = isGhPages ? '/zenexis-online/sw.js' : 'sw.js';
      const scope = isGhPages ? '/zenexis-online/' : './';
      navigator.serviceWorker
        .register(swPath, { scope })
        .then(() => {
          // SW registered successfully
        })
        .catch((err) => {
          console.debug('SW registration skipped:', err);
        });
    }

    // Check if already installed
    if (checkIsStandalone()) {
      setIsInstalled(true);
      return;
    }

    // Clear legacy permanent dismissal flag so users can see the prompt again
    localStorage.removeItem(LEGACY_DISMISS_KEY);

    // Listen for browser's native beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check 24-hour dismissal cooldown
      const dismissedUntil = localStorage.getItem(DISMISS_KEY);
      if (!dismissedUntil || Date.now() > Number(dismissedUntil)) {
        setShowPrompt(true);
      }
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setShowModal(false);
      setDeferredPrompt(null);
    };

    // Global event listener to allow Navbar / Buttons anywhere to open install prompt
    const handleManualOpen = () => {
      if (checkIsStandalone()) {
        alert('Zenexis App is already installed on your device!');
        return;
      }
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('zenexis_open_install_prompt', handleManualOpen);

    // Auto-show banner after 2.5 seconds on desktop & mobile if not in cooldown
    const timer = setTimeout(() => {
      if (checkIsStandalone()) return;

      const dismissedUntil = localStorage.getItem(DISMISS_KEY);
      const inCooldown = dismissedUntil && Date.now() < Number(dismissedUntil);

      if (!inCooldown) {
        setShowPrompt(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('zenexis_open_install_prompt', handleManualOpen);
      clearTimeout(timer);
    };
  }, [checkIsStandalone]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowPrompt(false);
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error invoking install prompt:', err);
        setShowModal(true);
      }
    } else {
      // Show friendly interactive instruction guide modal
      setShowModal(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Dismiss for 24 hours only
    localStorage.setItem(DISMISS_KEY, (Date.now() + 24 * 60 * 60 * 1000).toString());
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Floating PWA Download / Install Popup Banner */}
      {showPrompt && (
        <aside
          role="dialog"
          aria-label="Install Zenexis Online App"
          className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
        >
          <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl flex items-center justify-between gap-3 text-slate-100">
            {/* App Icon & Badge */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/30">
                <span className="text-xl font-black text-slate-950">Z</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    Install Zenexis App
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded font-semibold border border-cyan-500/30 flex items-center gap-0.5">
                    <SparklesIcon className="w-2.5 h-2.5" /> Fast App
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-2">
                  1-Tap fast access, offline catalog & instant WhatsApp alerts on your phone or PC!
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-cyan-500/30 transition transform active:scale-95 flex items-center gap-1.5"
                title="Download and install app"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition hover:bg-slate-800"
                aria-label="Dismiss install banner"
                title="Remind me later"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Interactive Install Instructions Modal (For iOS / unsupported browsers) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl shadow-cyan-950/50 space-y-5 text-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-slate-950 text-lg shadow-md">
                  Z
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">How to Install Zenexis</h3>
                  <p className="text-xs text-slate-400">Download directly to your device</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Steps Based on Platform */}
            <div className="space-y-4">
              {platform === 'ios' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                    <SmartphoneIcon className="w-4 h-4" />
                    <span>iPhone & iPad (Safari) Install Steps:</span>
                  </div>
                  <ol className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2.5 bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        1
                      </span>
                      <span>
                        Tap the <strong>Share</strong> button (the square with an arrow pointing up) at the bottom of Safari.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        2
                      </span>
                      <span>
                        Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        3
                      </span>
                      <span>
                        Tap <strong>&ldquo;Add&rdquo;</strong> at the top right. Zenexis is now on your home screen!
                      </span>
                    </li>
                  </ol>
                </div>
              ) : platform === 'android' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                    <SmartphoneIcon className="w-4 h-4" />
                    <span>Android (Chrome) Install Steps:</span>
                  </div>
                  <ol className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2.5 bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        1
                      </span>
                      <span>
                        Tap the <strong>Three Dots menu (⋮)</strong> at the top right of Chrome.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        2
                      </span>
                      <span>
                        Select <strong>&ldquo;Install App&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        3
                      </span>
                      <span>
                        Confirm <strong>&ldquo;Install&rdquo;</strong> to add the Zenexis App to your phone.
                      </span>
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                    <LaptopIcon className="w-4 h-4" />
                    <span>PC & Laptop (Chrome / Edge) Install:</span>
                  </div>
                  <ol className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2.5 bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        1
                      </span>
                      <span>
                        Look at the right side of your browser URL address bar for the <strong>Install App icon (⊕ or download icon)</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        2
                      </span>
                      <span>
                        Or click the browser menu <strong>(⋮) ➔ &ldquo;Install Zenexis Online&rdquo;</strong>.
                      </span>
                    </li>
                  </ol>
                </div>
              )}
            </div>

            {/* Bottom Got it Button */}
            <div className="pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition"
              >
                <CheckIcon className="w-4 h-4" />
                <span>Got it / හරි තේරුණා</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
