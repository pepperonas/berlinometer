'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  FiMenu, 
  FiX, 
  FiUser, 
  FiSettings, 
  FiLogOut,
  FiSun,
  FiMoon,
  FiMonitor,
  FiDownload,
  FiWifi,
  FiWifiOff
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePWA } from '@/contexts/PWAContext';
import { Button } from '@/components/ui/Button';
import { cn, getInitials } from '@/lib/utils';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  
  const router = useRouter();
  
  // Use hooks (now with built-in defensive fallbacks)
  const { user, logout, isPremium } = useAuth();
  const { theme, setTheme, effectiveTheme } = useTheme();
  const { canInstall, install, isOnline } = usePWA();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);
  const toggleThemeMenu = () => setIsThemeMenuOpen(!isThemeMenuOpen);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const themeIcons = {
    light: FiSun,
    dark: FiMoon,
    system: FiMonitor,
  };

  const ThemeIcon = themeIcons[theme] || FiSun;

  // Navigation items
  const navigationItems = [
    { href: '/recipes', label: 'Rezepte', auth: true },
    { href: '/cocktails', label: 'Cocktails', auth: true },
    { href: '/favorites', label: 'Favoriten', auth: true },
    { href: '/history', label: 'Verlauf', auth: true },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-outline">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            🍳 <span>ZauberKoch</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navigationItems.map((item) => (
              (!item.auth || user) && (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-on-surface hover:text-primary transition-colors font-medium"
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <div className={cn(
              'w-2 h-2 rounded-full',
              isOnline ? 'bg-success' : 'bg-error'
            )} />

            {/* PWA Install Button */}
            {canInstall && (
              <Button
                variant="ghost"
                size="sm"
                onClick={install}
                leftIcon={<FiDownload />}
                className="hidden sm:flex"
              >
                Installieren
              </Button>
            )}

            {/* Theme Toggle */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleThemeMenu}
                className="p-2"
              >
                <ThemeIcon size={20} />
              </Button>

              {isThemeMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-36 bg-surface border border-outline rounded-lg shadow-lg overflow-hidden z-50"
                >
                  {(['light', 'dark', 'system'] as const).map((themeOption) => {
                    const Icon = themeIcons[themeOption];
                    const labels = {
                      light: 'Hell',
                      dark: 'Dunkel',
                      system: 'System',
                    };
                    
                    return (
                      <button
                        key={themeOption}
                        onClick={() => {
                          setTheme(themeOption);
                          setIsThemeMenuOpen(false);
                        }}
                        className={cn(
                          'w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-surface-variant transition-colors',
                          theme === themeOption && 'bg-primary text-white'
                        )}
                      >
                        <Icon size={16} />
                        {labels[themeOption]}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </div>

            {user ? (
              <>
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-variant transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {user ? getInitials(`${user.firstName || ''} ${user.lastName || ''}`) : 'U'}
                    </div>
                    {isPremium && (
                      <span className="text-xs bg-secondary text-white px-2 py-0.5 rounded-full">
                        Premium
                      </span>
                    )}
                  </button>

                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-surface border border-outline rounded-lg shadow-lg overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-outline">
                        <p className="text-sm font-medium">
                          {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Benutzer' : 'Benutzer'}
                        </p>
                        <p className="text-xs text-on-surface-variant">{user?.email || ''}</p>
                      </div>
                      
                      <Link
                        href="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-surface-variant transition-colors"
                      >
                        <FiUser size={16} />
                        Profil
                      </Link>
                      
                      <Link
                        href="/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-surface-variant transition-colors"
                      >
                        <FiSettings size={16} />
                        Einstellungen
                      </Link>

                      {!isPremium && (
                        <Link
                          href="/premium"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-surface-variant transition-colors text-secondary"
                        >
                          ⭐ Premium
                        </Link>
                      )}
                      
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-surface-variant transition-colors text-error w-full text-left"
                      >
                        <FiLogOut size={16} />
                        Abmelden
                      </button>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Anmelden
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">
                    Registrieren
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="md:hidden p-2"
            >
              {isMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-outline bg-surface"
          >
            <nav className="py-4 space-y-2">
              {navigationItems.map((item) => (
                (!item.auth || user) && (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={toggleMenu}
                    className="block px-4 py-2 text-on-surface hover:bg-surface-variant rounded-lg transition-colors"
                  >
                    {item.label}
                  </Link>
                )
              ))}
              
              {!user && (
                <div className="px-4 pt-4 border-t border-outline">
                  <div className="flex flex-col gap-2">
                    <Link href="/auth/login" onClick={toggleMenu}>
                      <Button variant="ghost" size="sm" fullWidth>
                        Anmelden
                      </Button>
                    </Link>
                    <Link href="/auth/register" onClick={toggleMenu}>
                      <Button variant="primary" size="sm" fullWidth>
                        Registrieren
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
}

export default Header;