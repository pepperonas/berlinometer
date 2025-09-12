import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'HandwerkOS - ModularERP für kleine Unternehmen',
  description: 'E-Rechnung-konformes ERP-System für Handwerker, Gastro und Dienstleister',
  keywords: ['ERP', 'Handwerk', 'E-Rechnung', 'Rechnungssoftware', 'XRechnung', 'ZUGFeRD'],
  authors: [{ name: 'HandwerkOS Team' }],
  creator: 'HandwerkOS',
  publisher: 'HandwerkOS',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'HandwerkOS - ModularERP',
    description: 'E-Rechnung-konformes ERP-System für kleine Unternehmen',
    url: '/',
    siteName: 'HandwerkOS',
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HandwerkOS - ModularERP',
    description: 'E-Rechnung-konformes ERP-System für kleine Unternehmen',
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
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster 
                position="bottom-right"
                expand={false}
                richColors
              />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}