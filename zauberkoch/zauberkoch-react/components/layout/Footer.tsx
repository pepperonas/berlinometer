'use client';

import React from 'react';
import Link from 'next/link';
import { FiHeart, FiGithub, FiMail, FiTwitter } from 'react-icons/fi';
import { APP_CONFIG } from '@/lib/constants';
import { usePWA } from '@/contexts/PWAContext';

export function Footer() {
  const { isOnline } = usePWA();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { href: '/recipes', label: 'Rezepte' },
      { href: '/cocktails', label: 'Cocktails' },
      { href: '/premium', label: 'Premium' },
      { href: '/features', label: 'Features' },
    ],
    support: [
      { href: '/help', label: 'Hilfe' },
      { href: '/contact', label: 'Kontakt' },
      { href: '/faq', label: 'FAQ' },
      { href: '/feedback', label: 'Feedback' },
    ],
    legal: [
      { href: '/privacy', label: 'Datenschutz' },
      { href: '/terms', label: 'AGB' },
      { href: '/imprint', label: 'Impressum' },
      { href: '/cookies', label: 'Cookies' },
    ],
    social: [
      { href: 'https://github.com/zauberkoch', label: 'GitHub', icon: FiGithub },
      { href: 'https://twitter.com/zauberkoch', label: 'Twitter', icon: FiTwitter },
      { href: 'mailto:hello@zauberkoch.com', label: 'E-Mail', icon: FiMail },
    ],
  };

  return (
    <footer className="bg-surface border-t border-outline mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-xl text-primary">
              🍳 <span>ZauberKoch</span>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {APP_CONFIG.description}
            </p>
            <p className="text-xs text-on-surface-variant">
              Version {APP_CONFIG.version}
            </p>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success' : 'bg-error'}`} />
              <span className="text-on-surface-variant">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-on-surface mb-4">Produkt</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold text-on-surface mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Social */}
          <div className="space-y-6">
            {/* Legal Links */}
            <div>
              <h3 className="font-semibold text-on-surface mb-4">Rechtliches</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="font-semibold text-on-surface mb-4">Social</h3>
              <div className="flex gap-4">
                {footerLinks.social.map((link) => {
                  const IconComponent = link.icon;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-on-surface-variant hover:text-primary transition-colors"
                      aria-label={link.label}
                    >
                      <IconComponent size={20} />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-outline">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-on-surface-variant">
              © {currentYear} {APP_CONFIG.name}. Alle Rechte vorbehalten.
            </p>
            
            <div className="flex items-center gap-1 text-sm text-on-surface-variant">
              Made with <FiHeart className="text-error w-4 h-4 mx-1" /> by{' '}
              <span className="font-medium text-primary">{APP_CONFIG.author}</span>
            </div>
          </div>
        </div>

        {/* PWA Installation Note */}
        <div className="mt-4 pt-4 border-t border-outline">
          <p className="text-xs text-center text-on-surface-variant">
            💡 Installiere ZauberKoch als App auf deinem Gerät für die beste Erfahrung
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;