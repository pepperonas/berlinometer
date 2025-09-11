'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiChevronRight, FiHome } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const breadcrumbLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  recipes: 'Rezepte',
  generate: 'Generator',
  cocktails: 'Cocktails',
  favorites: 'Favoriten',
  profile: 'Profil',
  settings: 'Einstellungen',
  auth: 'Authentifizierung',
  login: 'Anmelden',
  register: 'Registrieren',
  premium: 'Premium',
  help: 'Hilfe',
};

const breadcrumbIcons: Record<string, React.ReactNode> = {
  dashboard: '🏠',
  recipes: '📚',
  generate: '🎨',
  cocktails: '🍸',
  favorites: '⭐',
  profile: '👤',
  settings: '⚙️',
  auth: '🔐',
  premium: '💎',
  help: '❓',
};

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Auto-generate breadcrumbs from pathname if no items provided
  const breadcrumbs = items || generateBreadcrumbsFromPath(pathname);
  
  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs for home page or single-level pages
  }

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Breadcrumb">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center space-x-1"
      >
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <FiChevronRight className="text-on-surface-variant w-4 h-4" />
            )}
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {item.href && index < breadcrumbs.length - 1 ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors px-2 py-1 rounded hover:bg-surface-variant/50"
                >
                  {item.icon && <span className="text-xs">{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span className="flex items-center gap-1 text-on-surface font-medium px-2 py-1">
                  {item.icon && <span className="text-xs">{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
              )}
            </motion.div>
          </React.Fragment>
        ))}
      </motion.div>
    </nav>
  );
}

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: 'Start',
      href: '/',
      icon: <FiHome className="w-3 h-3" />
    }
  ];

  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = breadcrumbLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const icon = breadcrumbIcons[segment];
    
    breadcrumbs.push({
      label,
      href: index < segments.length - 1 ? currentPath : undefined,
      icon
    });
  });

  return breadcrumbs;
}