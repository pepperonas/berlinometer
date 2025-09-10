import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { QueryProvider } from '@/contexts/QueryProvider';
import { PWAInstallProvider } from '@/contexts/PWAContext';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import Header from '@/components/layout/Header';
import { PWA_CONFIG, APP_CONFIG } from '@/lib/constants';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_CONFIG.name}`,
    default: `${APP_CONFIG.name} - AI Recipe Generator`,
  },
  description: APP_CONFIG.description,
  keywords: [
    'recipes',
    'cooking',
    'AI',
    'artificial intelligence',
    'food',
    'cocktails',
    'meal planning',
    'progressive web app',
    'PWA',
  ],
  authors: [{ name: APP_CONFIG.author }],
  creator: APP_CONFIG.author,
  publisher: APP_CONFIG.author,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
    languages: {
      'de-DE': '/de',
      'en-US': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: '/',
    title: `${APP_CONFIG.name} - AI Recipe Generator`,
    description: 'Discover delicious recipes with artificial intelligence. Generate personalized cooking and cocktail recipes tailored to your preferences.',
    siteName: APP_CONFIG.name,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${APP_CONFIG.name} - AI Recipe Generator`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_CONFIG.name} - AI Recipe Generator`,
    description: 'Discover delicious recipes with artificial intelligence.',
    images: ['/twitter-image.png'],
    creator: '@zauberkoch',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_ID,
  },
  category: 'food',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ZauberKoch',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: PWA_CONFIG.themeColor },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
  colorScheme: 'light dark',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="de" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
        
        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Mobile Web App */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={APP_CONFIG.name} />
        
        {/* Microsoft */}
        <meta name="msapplication-TileColor" content={PWA_CONFIG.themeColor} />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://api.openai.com" />
        <link rel="preconnect" href="https://api.deepseek.com" />
        <link rel="preconnect" href="https://api.x.ai" />
        <link rel="preconnect" href="https://www.googleapis.com" />
        <link rel="preconnect" href="https://accounts.google.com" />
        
        {/* Load critical fonts */}
        {/* Inter font is loaded via next/font/google */}
        
        {/* Analytics (if enabled) */}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GA_TRACKING_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_TRACKING_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_TRACKING_ID}', {
                    page_title: document.title,
                    page_location: window.location.href,
                  });
                `,
              }}
            />
          </>
        )}
        
        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: APP_CONFIG.name,
              description: APP_CONFIG.description,
              url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
              applicationCategory: 'FoodAndDrinkApplication',
              operatingSystem: 'Any',
              offers: {
                '@type': 'Offer',
                category: 'Free',
              },
              author: {
                '@type': 'Person',
                name: APP_CONFIG.author,
              },
              screenshot: {
                '@type': 'ImageObject',
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/screenshots/desktop-home.png`,
              },
            }),
          }}
        />
      </head>
      
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider>
            <PWAInstallProvider>
              <AuthProvider>
                {/* Skip to main content link for accessibility */}
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded-md z-50"
                >
                  Skip to main content
                </a>
                
                {/* Main application content */}
                <div id="main-content" className="min-h-screen bg-background">
                  <Header />
                  <main>
                    {children}
                  </main>
                </div>
                
                {/* Toast notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'var(--background)',
                      color: 'var(--foreground)',
                      border: '1px solid var(--border)',
                    },
                    success: {
                      iconTheme: {
                        primary: 'var(--success)',
                        secondary: 'white',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: 'var(--error)',
                        secondary: 'white',
                      },
                    },
                  }}
                />
                
                {/* PWA Install Prompt */}
                <PWAInstallPrompt />
                
                {/* Service Worker Registration */}
                <script
                  dangerouslySetInnerHTML={{
                    __html: `
                      if ('serviceWorker' in navigator) {
                        window.addEventListener('load', function() {
                          navigator.serviceWorker.register('/sw.js')
                            .then(function(registration) {
                              console.log('SW registered: ', registration);
                            })
                            .catch(function(registrationError) {
                              console.log('SW registration failed: ', registrationError);
                            });
                        });
                      }
                      
                      // Install prompt handling
                      let deferredPrompt;
                      window.addEventListener('beforeinstallprompt', function(e) {
                        e.preventDefault();
                        deferredPrompt = e;
                        // Store the event for later use
                        window.dispatchEvent(new CustomEvent('pwa-installable', { detail: e }));
                      });
                      
                      // Handle app installed
                      window.addEventListener('appinstalled', function(e) {
                        console.log('PWA was installed');
                        window.dispatchEvent(new CustomEvent('pwa-installed'));
                      });
                      
                      // Handle online/offline status
                      function updateOnlineStatus() {
                        window.dispatchEvent(new CustomEvent('connection-change', { 
                          detail: { online: navigator.onLine } 
                        }));
                      }
                      
                      window.addEventListener('online', updateOnlineStatus);
                      window.addEventListener('offline', updateOnlineStatus);
                      
                      // Initial status
                      if (typeof navigator !== 'undefined') {
                        updateOnlineStatus();
                      }
                    `,
                  }}
                />
              </AuthProvider>
            </PWAInstallProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}