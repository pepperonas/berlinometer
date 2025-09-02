'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiWifiOff, 
  FiRefreshCw,
  FiBookmark,
  FiSearch,
  FiArrowRight,
  FiActivity,
  FiCheckCircle
} from 'react-icons/fi';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function OfflineView() {
  const [isOnline, setIsOnline] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsReconnecting(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Set initial status
    setIsOnline(navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    
    try {
      // Try to fetch a simple resource to test connectivity
      const response = await fetch('/api/health', { 
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        // Redirect to home if connection is restored
        window.location.href = '/';
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      console.log('Still offline:', error);
      // Connection is still not available
      setTimeout(() => setIsReconnecting(false), 2000);
    }
  };

  const offlineFeatures = [
    {
      icon: <FiBookmark className="text-primary" />,
      title: 'Gespeicherte Rezepte',
      description: 'Greife auf deine bereits gespeicherten Rezepte zu',
      available: true
    },
    {
      icon: <FiSearch className="text-primary" />,
      title: 'Lokale Suche',
      description: 'Durchsuche deine gecachten Rezepte',
      available: true
    },
    {
      icon: <FiActivity className="text-on-surface-variant" />,
      title: 'Neue Rezepte generieren',
      description: 'Benötigt eine Internetverbindung',
      available: false
    },
    {
      icon: <FiActivity className="text-on-surface-variant" />,
      title: 'Synchronisation',
      description: 'Wird automatisch wiederhergestellt',
      available: false
    }
  ];

  // If user comes back online, redirect to home
  useEffect(() => {
    if (isOnline && !isReconnecting) {
      const timer = setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, isReconnecting]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Connection Status */}
        {isOnline ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="text-success" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-on-surface mb-4">
              Verbindung wiederhergestellt! 🎉
            </h1>
            <p className="text-lg text-on-surface-variant mb-6">
              Du wirst automatisch zur Hauptseite weitergeleitet...
            </p>
            <Link href="/">
              <Button size="lg" rightIcon={<FiArrowRight />}>
                Jetzt weiter
              </Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Offline Status */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="w-20 h-20 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <FiWifiOff className="text-warning" size={40} />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-on-surface mb-4"
              >
                Du bist offline
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-lg text-on-surface-variant mb-8"
              >
                Keine Sorge! Du kannst trotzdem einige ZauberKoch-Features nutzen.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  onClick={handleReconnect}
                  loading={isReconnecting}
                  leftIcon={<FiRefreshCw />}
                  size="lg"
                >
                  {isReconnecting ? 'Verbinde...' : 'Verbindung prüfen'}
                </Button>
              </motion.div>
            </div>

            {/* Available Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-center">
                    Verfügbare Features im Offline-Modus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {offlineFeatures.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2 + index * 0.1 }}
                        className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
                          feature.available 
                            ? 'bg-success/5 border border-success/20' 
                            : 'bg-surface-variant/30 border border-outline/20'
                        }`}
                      >
                        <div className="flex-shrink-0 p-2 bg-surface rounded-lg shadow-sm">
                          {feature.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-semibold mb-1 ${
                            feature.available ? 'text-on-surface' : 'text-on-surface-variant'
                          }`}>
                            {feature.title}
                          </h3>
                          <p className={`text-sm ${
                            feature.available ? 'text-on-surface-variant' : 'text-on-surface-variant opacity-70'
                          }`}>
                            {feature.description}
                          </p>
                        </div>
                        {feature.available && (
                          <div className="flex-shrink-0">
                            <FiCheckCircle className="text-success" size={20} />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <Link href="/recipes">
                <Button
                  size="lg"
                  fullWidth
                  leftIcon={<FiBookmark />}
                  variant="outline"
                >
                  Gespeicherte Rezepte
                </Button>
              </Link>
              <Link href="/">
                <Button
                  size="lg"
                  fullWidth
                  leftIcon={<FiArrowRight />}
                  variant="outline"
                >
                  Zur Startseite
                </Button>
              </Link>
            </motion.div>

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
              className="mt-8"
            >
              <Card className="bg-info/5 border-info/20">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-info mb-3">💡 Offline-Tipps</h3>
                  <div className="space-y-2 text-sm text-info/80">
                    <p>• Deine Aktionen werden automatisch synchronisiert, wenn du wieder online bist</p>
                    <p>• Gespeicherte Rezepte sind auch offline verfügbar</p>
                    <p>• ZauberKoch funktioniert als installierte App noch besser offline</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Auto-retry indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.0 }}
              className="mt-6 text-center"
            >
              <p className="text-sm text-on-surface-variant">
                🔄 Prüfe automatisch alle 30 Sekunden auf Verbindung
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default OfflineView;