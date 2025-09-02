'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiDownload, 
  FiSmartphone,
  FiX,
  FiStar,
  FiZap,
  FiWifi
} from 'react-icons/fi';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export function PWAInstallPrompt({ onInstall, onDismiss }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );

    // Check if app is installable
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] Install prompt available');
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Don't show prompt immediately - wait for user interaction
      setTimeout(() => {
        if (!isInstalled && !isStandalone && !hasUserDismissed()) {
          setShowPrompt(true);
        }
      }, 10000); // Show after 10 seconds
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App was installed');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, isStandalone, onInstall]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('[PWA] User choice:', outcome);
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
        setIsInstalled(true);
        onInstall?.();
      } else {
        console.log('[PWA] User dismissed the install prompt');
        handleDismiss();
      }
      
      // Clear the saved prompt since it can only be used once
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('[PWA] Error showing install prompt:', error);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setUserDismissed();
    onDismiss?.();
  };

  const hasUserDismissed = (): boolean => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (!dismissed) return false;
    
    const dismissedDate = new Date(dismissed);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Show again after a week
    return dismissedDate > weekAgo;
  };

  const setUserDismissed = () => {
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  // Don't show if already installed, in standalone mode, or no install prompt available
  if (isInstalled || isStandalone || !showPrompt || !deferredPrompt) {
    return null;
  }

  const benefits = [
    {
      icon: <FiZap className="text-primary" />,
      text: 'Schnellerer Start'
    },
    {
      icon: <FiWifi className="text-primary" />,
      text: 'Offline-Funktionen'
    },
    {
      icon: <FiStar className="text-primary" />,
      text: 'Native App-Erfahrung'
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <Card className="shadow-2xl border-primary/20 bg-surface/95 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                <FiSmartphone className="text-primary" size={20} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-on-surface mb-1">
                  ZauberKoch installieren
                </h3>
                <p className="text-sm text-on-surface-variant mb-3">
                  Installiere ZauberKoch für die beste Erfahrung
                </p>

                {/* Benefits */}
                <div className="flex items-center gap-4 mb-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <div className="flex-shrink-0">
                        {benefit.icon}
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        {benefit.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleInstallClick}
                    leftIcon={<FiDownload />}
                    className="flex-1"
                  >
                    Installieren
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                  >
                    Später
                  </Button>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 hover:bg-surface-variant rounded-lg transition-colors"
                aria-label="Schließen"
              >
                <FiX size={16} className="text-on-surface-variant" />
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

export default PWAInstallPrompt;