'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle, FileText, Shield, Zap } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">HandwerkOS</h1>
              <p className="text-xs text-muted-foreground">ModularERP</p>
            </div>
          </div>
          <nav className="flex items-center space-x-4">
            <ThemeToggle />
            <Link 
              href="/login" 
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Anmelden
            </Link>
            <Link 
              href="/register" 
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Registrieren
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              E-Rechnung-konformes{' '}
              <span className="text-primary">ERP-System</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              ModularERP für Handwerk, Gastro und Dienstleister. 
              XRechnung 3.0.1 und ZUGFeRD 2.3 konform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register"
                className="inline-flex items-center px-6 py-3 text-lg font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Kostenlos starten
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link 
                href="/login?demo=true"
                className="inline-flex items-center px-6 py-3 text-lg font-medium text-foreground bg-background border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Demo testen
              </Link>
            </div>
            
            {/* Demo credentials info */}
            <div className="mt-8 p-4 bg-card border border-border rounded-lg text-center max-w-md mx-auto">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Demo-Zugang:</strong>
              </p>
              <p className="text-sm font-mono text-foreground">
                admin@demo-handwerk.de
              </p>
              <p className="text-sm font-mono text-foreground">
                demo123
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-card-foreground mb-4">
              Warum HandwerkOS?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Die erste E-Rechnung-konforme ERP-Lösung speziell für kleine Unternehmen in Deutschland
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                E-Rechnung Konform
              </h3>
              <p className="text-muted-foreground">
                XRechnung 3.0.1 und ZUGFeRD 2.3 Standards erfüllt. 
                Bereit für die Pflicht ab 2025.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Einfach & Schnell
              </h3>
              <p className="text-muted-foreground">
                Intuitive Bedienung, schnelle Einrichtung. 
                Keine komplizierte Software mehr.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/50 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Vollständige Lösung
              </h3>
              <p className="text-muted-foreground">
                Rechnungen, Angebote, Kunden, Lager - 
                alles in einem System.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">
              Perfekt für Ihr Unternehmen
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Multi-Tenant Architektur
                    </h3>
                    <p className="text-muted-foreground">
                      Sichere Datentrennung zwischen Mandanten
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Automatische Backups
                    </h3>
                    <p className="text-muted-foreground">
                      Ihre Daten sind immer sicher und verfügbar
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Deutsche Server
                    </h3>
                    <p className="text-muted-foreground">
                      DSGVO-konforme Datenhaltung in Deutschland
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Leitweg-ID Support
                    </h3>
                    <p className="text-muted-foreground">
                      Direkte Übertragung an Behörden und Großunternehmen
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      API-First Design
                    </h3>
                    <p className="text-muted-foreground">
                      Einfache Integration in bestehende Systeme
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Kostenloser Start
                    </h3>
                    <p className="text-muted-foreground">
                      30 Tage kostenlos testen, keine Kreditkarte erforderlich
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Bereit für die E-Rechnung-Pflicht?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Starten Sie noch heute und seien Sie vorbereitet, wenn die E-Rechnung-Pflicht kommt.
          </p>
          <Link 
            href="/register"
            className="inline-flex items-center px-8 py-4 text-lg font-medium bg-background text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            Jetzt kostenlos starten
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border text-muted-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">HandwerkOS</span>
              </div>
              <p className="text-muted-foreground">
                E-Rechnung-konformes ERP-System für kleine Unternehmen
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Produkt</h3>
              <ul className="space-y-2">
                <li><Link href="/features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Preise</Link></li>
                <li><Link href="/demo" className="hover:text-foreground transition-colors">Demo</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Unternehmen</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-foreground transition-colors">Über uns</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Kontakt</Link></li>
                <li><Link href="/support" className="hover:text-foreground transition-colors">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Datenschutz</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">AGB</Link></li>
                <li><Link href="/imprint" className="hover:text-foreground transition-colors">Impressum</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 HandwerkOS. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}