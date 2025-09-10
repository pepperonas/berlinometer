'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAContextType {
  isInstalled: boolean;
  canInstall: boolean;
  isOnline: boolean;
  isStandalone: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  install: () => Promise<void>;
  isUpdateAvailable: boolean;
  updateApp: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function usePWA(): PWAContextType {
  const context = useContext(PWAContext);
  if (!context) {
    console.warn('usePWA used outside of PWAInstallProvider, returning default values');
    return {
      isInstalled: false,
      canInstall: false,
      isOnline: true,
      isStandalone: false,
      installPrompt: null,
      install: async () => {},
      isUpdateAvailable: false,
      updateApp: async () => {}
    };
  }
  return context;
}

interface PWAInstallProviderProps {
  children: ReactNode;
}

export function PWAInstallProvider({ children }: PWAInstallProviderProps): JSX.Element {
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if app is running in standalone mode
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    };

    checkStandalone();

    // Check online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateOnlineStatus();

    // Event listeners
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setInstallPrompt(installEvent);
      setCanInstall(true);
      
      // Show custom install notification
      toast.success('ZauberKoch can be installed as an app!', {
        duration: 5000,
        position: 'bottom-center',
      });
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setInstallPrompt(null);
      
      toast.success('ZauberKoch has been installed successfully! 🎉');
      
      // Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'pwa_install', {
          method: 'browser_prompt',
        });
      }
    };

    const handleConnectionChange = (event: any) => {
      const online = event.detail?.online ?? navigator.onLine;
      setIsOnline(online);
      
      if (online) {
        toast.success('Connection restored! 🌐');
      } else {
        toast.error('You are offline. Some features may be limited.', {
          duration: 6000,
        });
      }
    };

    // Service Worker registration and update handling
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          setServiceWorkerRegistration(registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New version available
                    setIsUpdateAvailable(true);
                    toast.success('New version available! Refresh to update.', {
                      duration: 8000,
                    });
                  }
                }
              });
            }
          });
        } catch (error) {
          console.warn('Service Worker registration failed:', error);
          // Don't block the app if service worker fails
        }
      } else {
        console.warn('Service Worker not supported in this browser');
      }
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('connection-change', handleConnectionChange);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Register service worker
    registerServiceWorker();

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('connection-change', handleConnectionChange);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const install = async (): Promise<void> => {
    if (!installPrompt) {
      toast.error('Installation not available');
      return;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('Installing ZauberKoch...');
        setCanInstall(false);
        setInstallPrompt(null);
      } else {
        toast.error('Installation cancelled');
      }

      // Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'pwa_install_prompt', {
          outcome,
        });
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
      toast.error('Installation failed. Please try again.');
    }
  };

  const updateApp = async (): Promise<void> => {
    if (!serviceWorkerRegistration) {
      return;
    }

    try {
      const waitingWorker = serviceWorkerRegistration.waiting;
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
        
        toast.success('Updating ZauberKoch...');
      }
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Update failed. Please refresh manually.');
    }
  };

  // Add to home screen for iOS
  const addToHomeScreenIOS = () => {
    if (!isIOS() || isStandalone) return;

    toast((t) => (
      <div className="flex flex-col gap-2">
        <div className="font-medium">Install ZauberKoch</div>
        <div className="text-sm text-on-surface-variant">
          Tap the share button and select "Add to Home Screen"
        </div>
        <button 
          onClick={() => toast.dismiss(t.id)}
          className="btn btn-sm btn-primary self-end"
        >
          Got it
        </button>
      </div>
    ), {
      duration: 8000,
      position: 'bottom-center',
    });
  };

  // Check if device is iOS
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };

  // Show iOS install hint if applicable
  useEffect(() => {
    if (isIOS() && !isStandalone && !localStorage.getItem('ios-install-prompted')) {
      const timer = setTimeout(() => {
        addToHomeScreenIOS();
        localStorage.setItem('ios-install-prompted', 'true');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isStandalone]);

  const value: PWAContextType = {
    isInstalled,
    canInstall,
    isOnline,
    isStandalone,
    installPrompt,
    install,
    isUpdateAvailable,
    updateApp,
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
      
      {/* Connection Status Indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 bg-warning text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-slide-in-up">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">Offline Mode</span>
          </div>
        </div>
      )}
      
      {/* Update Available Indicator */}
      {isUpdateAvailable && (
        <div className="fixed top-4 right-4 bg-info text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Update available</span>
            <button
              onClick={updateApp}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded text-xs transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      )}
    </PWAContext.Provider>
  );
}

// Hook for offline detection
export function useOnlineStatus() {
  const { isOnline } = usePWA();
  return isOnline;
}

// Hook for installation status
export function useInstallation() {
  const { canInstall, install, isInstalled, isStandalone } = usePWA();
  
  return {
    canInstall,
    install,
    isInstalled,
    isStandalone,
    shouldShowInstallPrompt: canInstall && !isInstalled && !isStandalone,
  };
}

export default PWAInstallProvider;