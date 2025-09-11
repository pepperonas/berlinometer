'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      staggerChildren: 0.12,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 100,
      damping: 10,
      duration: 0.6
    }
  }
};

const heroVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 12,
      duration: 1
    }
  }
};

const statsVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
      staggerChildren: 0.1
    }
  }
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen relative">
      {/* Epic Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-background to-secondary-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(237,112,20,0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.04),transparent_70%)]" />
      
      {/* Floating Elements */}
      <div className="absolute top-24 left-8 w-4 h-4 bg-primary-400 rounded-full animate-pulse opacity-40" />
      <div className="absolute top-48 right-12 w-3 h-3 bg-secondary-400 rounded-full animate-bounce opacity-50" />
      <div className="absolute bottom-64 left-16 w-5 h-5 bg-success-400 rounded-full animate-ping opacity-30" />
      <div className="absolute bottom-32 right-24 w-2 h-2 bg-primary-300 rounded-full animate-pulse opacity-60" />
      
      {/* Spectacular Hero Section */}
      <div className="relative z-10 min-h-[85vh] flex items-center">
        <div className="container py-20 lg:py-28">
          <motion.div 
            className="text-center max-w-6xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={heroVariants}
          >
            {/* Welcome Badge */}
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15, 
                delay: 0.2 
              }}
              className="inline-flex items-center gap-3 bg-primary/15 backdrop-blur-xl border border-primary/30 px-6 py-3 rounded-full text-sm font-bold text-primary mb-8 shadow-lg"
            >
              <span className="text-xl animate-bounce">🏠</span>
              <span>Willkommen zurück im Küchenuniversum!</span>
              <span className="text-xl animate-pulse">✨</span>
            </motion.div>
            
            {/* Epic Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-5xl lg:text-8xl font-black mb-8 leading-tight"
            >
              <span className="bg-gradient-to-r from-text-primary via-primary-300 to-secondary-400 bg-clip-text text-transparent">
                Dein Kulinarisches
              </span>
              <br />
              <span className="bg-gradient-to-r from-secondary-400 via-primary-400 to-success-400 bg-clip-text text-transparent">
                Kommandozentrum
              </span>
              <motion.span 
                initial={{ rotate: -10, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 200 }}
                className="text-6xl lg:text-7xl ml-4 inline-block"
              >
                👨‍🍳
              </motion.span>
            </motion.h1>
            
            {/* Description */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-xl lg:text-2xl text-text-secondary mb-10 leading-relaxed max-w-4xl mx-auto font-light"
            >
              Von <span className="text-primary font-semibold">KI-generierten Meisterwerken</span> bis zu 
              <span className="text-secondary font-semibold"> personalisierten Favoriten</span> – 
              hier beginnt deine kulinarische Reise.
            </motion.p>
            
            {/* Hero Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Link href="/recipes/generate">
                <Button 
                  variant="primary" 
                  size="xl" 
                  className="px-12 py-5 text-xl font-black shadow-primary hover:shadow-2xl transform hover:scale-105 min-w-[280px]"
                  glow={true}
                >
                  <span className="flex items-center gap-4">
                    <span className="text-2xl animate-pulse">🎨</span>
                    <span>Rezept generieren</span>
                    <span className="text-2xl animate-bounce">✨</span>
                  </span>
                </Button>
              </Link>
              
              <Link href="/recipes">
                <Button 
                  variant="outline" 
                  size="xl" 
                  className="px-12 py-5 text-xl font-black hover:shadow-xl transform hover:scale-105 min-w-[280px] border-2"
                >
                  <span className="flex items-center gap-4">
                    <span className="text-2xl">📚</span>
                    <span>Meine Rezepte</span>
                  </span>
                </Button>
              </Link>
            </motion.div>
            
            {/* Quick Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.6 }}
              className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-border-primary/20"
            >
              <div className="flex items-center gap-3 text-text-tertiary">
                <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-medium">12 Rezepte generiert</span>
              </div>
              <div className="flex items-center gap-3 text-text-tertiary">
                <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-medium">8 Favoriten gespeichert</span>
              </div>
              <div className="flex items-center gap-3 text-text-tertiary">
                <div className="w-3 h-3 bg-secondary-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-medium">3 diese Woche</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="relative z-10 container py-20 lg:py-28">
        <motion.div 
          className="grid grid-cols-1 xl:grid-cols-3 gap-12 lg:gap-16"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Enhanced Quick Actions */}
          <motion.div 
            className="xl:col-span-2 space-y-12"
            variants={itemVariants}
          >
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-primary/15 to-secondary/15 text-primary border border-primary/20 px-6 py-3 rounded-full text-sm font-bold mb-6"
              >
                <span className="text-lg animate-spin">⚡</span>
                <span>Schnellzugriff</span>
              </motion.div>
              <h2 className="text-4xl lg:text-5xl font-black text-text-primary mb-4">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Deine Küchentools
                </span>
              </h2>
              <p className="text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto">
                Alles was du für kulinarische Höchstleistungen brauchst
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: 'KI Rezept Generator',
                  description: 'Erschaffe kulinarische Meisterwerke mit fortschrittlicher AI-Technologie',
                  icon: '🤖',
                  href: '/recipes/generate',
                  bgColor: 'from-primary/10 to-primary/5',
                  borderColor: 'border-primary/30',
                  iconBg: 'from-primary to-primary-hover',
                  accentColor: 'text-primary'
                },
                {
                  title: 'Cocktail Labor',
                  description: 'Mixe einzigartige Drinks und entdecke neue Geschmackskombinationen',
                  icon: '🧪',
                  href: '/cocktails',
                  bgColor: 'from-secondary/10 to-secondary/5',
                  borderColor: 'border-secondary/30',
                  iconBg: 'from-secondary to-secondary-hover',
                  accentColor: 'text-secondary'
                },
                {
                  title: 'Rezept Bibliothek',
                  description: 'Durchstöbere und organisiere deine gesammelte kulinarische Weisheit',
                  icon: '📖',
                  href: '/recipes',
                  bgColor: 'from-info/10 to-info/5',
                  borderColor: 'border-info/30',
                  iconBg: 'from-info to-info-hover',
                  accentColor: 'text-info'
                },
                {
                  title: 'Hall of Fame',
                  description: 'Deine auserwählten Lieblingsrezepte in einer exklusiven Sammlung',
                  icon: '🏆',
                  href: '/favorites',
                  bgColor: 'from-warning/10 to-warning/5',
                  borderColor: 'border-warning/30',
                  iconBg: 'from-warning to-warning-hover',
                  accentColor: 'text-warning'
                }
              ].map((action, index) => (
                <Link key={index} href={action.href}>
                  <motion.div 
                    className={`group relative card card-interactive p-8 shadow-xl bg-gradient-to-br ${action.bgColor} border ${action.borderColor} hover:border-opacity-60 cursor-pointer overflow-hidden`}
                    variants={itemVariants}
                    whileHover={{ 
                      y: -8, 
                      scale: 1.02,
                      transition: { type: "spring", stiffness: 300, damping: 20 }
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Animated Background Glow */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    
                    <div className="relative z-10 flex items-start gap-6">
                      <motion.div 
                        className={`w-16 h-16 bg-gradient-to-br ${action.iconBg} rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg group-hover:scale-110 transition-all duration-300`}
                        whileHover={{ rotate: 10 }}
                      >
                        {action.icon}
                      </motion.div>
                      
                      <div className="flex-1">
                        <h3 className={`text-2xl font-black mb-3 ${action.accentColor} group-hover:scale-105 transition-transform duration-300`}>
                          {action.title}
                        </h3>
                        <p className="text-text-secondary leading-relaxed text-lg font-medium">
                          {action.description}
                        </p>
                        
                        {/* Arrow Icon */}
                        <motion.div 
                          className={`inline-flex items-center gap-2 mt-4 ${action.accentColor} font-semibold text-sm opacity-0 group-hover:opacity-100 transition-all duration-300`}
                          initial={{ x: -10 }}
                          whileHover={{ x: 0 }}
                        >
                          <span>Entdecken</span>
                          <motion.span
                            animate={{ x: [0, 4, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            →
                          </motion.span>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Enhanced Stats & Widgets */}
          <motion.div 
            className="space-y-10"
            variants={itemVariants}
          >
            <motion.div 
              className="card card-elevated p-8 shadow-2xl bg-gradient-to-br from-surface to-surface-secondary border border-primary/20 group"
              variants={statsVariants}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-hover rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl">📊</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-text-primary group-hover:text-primary transition-colors">
                    Deine Performance
                  </h3>
                  <p className="text-text-tertiary text-sm">Kulinarische Erfolgsstatistiken</p>
                </div>
              </div>
              
              <div className="space-y-5">
                {[
                  { label: 'Generierte Rezepte', value: '12', icon: '🍳', color: 'from-primary to-primary-hover', progress: 75 },
                  { label: 'Favoriten', value: '8', icon: '⭐', color: 'from-warning to-warning-hover', progress: 60 },
                  { label: 'Diese Woche', value: '3', icon: '📅', color: 'from-success to-success-hover', progress: 30 }
                ].map((stat, index) => (
                  <motion.div 
                    key={index} 
                    className="group/stat relative p-4 rounded-xl bg-surface-variant/30 hover:bg-surface-variant/50 transition-all duration-300"
                    variants={itemVariants}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl group-hover/stat:scale-110 transition-transform duration-300">{stat.icon}</span>
                        <span className="font-semibold text-text-secondary">{stat.label}</span>
                      </div>
                      <span className="text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent">
                        {stat.value}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-border-primary/20 rounded-full h-2">
                      <motion.div 
                        className={`h-2 bg-gradient-to-r ${stat.color} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.progress}%` }}
                        transition={{ delay: index * 0.2, duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              className="card card-glow p-8 shadow-xl bg-gradient-to-br from-secondary/8 to-secondary/3 border border-secondary/30 group overflow-hidden relative"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
            >
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-warning/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary-hover rounded-2xl flex items-center justify-center shadow-lg"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  >
                    <span className="text-white text-xl">💡</span>
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-black text-secondary">
                      Profi-Tipp
                    </h3>
                    <p className="text-secondary/70 text-sm font-medium">Vom Küchenchef empfohlen</p>
                  </div>
                </div>
                
                <p className="text-text-secondary leading-relaxed mb-6 text-lg font-medium">
                  Experimentiere mit verschiedenen <span className="text-secondary font-bold">KI-Providern</span>! 
                  Jeder hat seinen eigenen Kochstil und kann dir einzigartige Rezeptideen liefern.
                </p>
                
                <Link href="/settings">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-white transform hover:scale-105"
                  >
                    <span className="flex items-center gap-2">
                      <span>⚙️</span>
                      <span>KI-Einstellungen</span>
                    </span>
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div 
              className="card card-glow p-8 shadow-xl bg-gradient-to-br from-success/8 via-primary/4 to-secondary/8 border border-success/30 group overflow-hidden relative"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
            >
              {/* Premium Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-1000" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-br from-success via-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg"
                    animate={{ 
                      boxShadow: [
                        "0 0 20px rgba(16, 185, 129, 0.3)",
                        "0 0 30px rgba(99, 102, 241, 0.4)", 
                        "0 0 20px rgba(237, 112, 20, 0.3)",
                        "0 0 20px rgba(16, 185, 129, 0.3)"
                      ]
                    }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  >
                    <span className="text-white text-xl">🚀</span>
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-black bg-gradient-to-r from-success via-primary to-secondary bg-clip-text text-transparent">
                      Premium Upgrade
                    </h3>
                    <p className="text-success/70 text-sm font-medium">Entfessle dein volles Potenzial</p>
                  </div>
                </div>
                
                <p className="text-text-secondary leading-relaxed mb-6 text-lg font-medium">
                  Upgrade zu <span className="bg-gradient-to-r from-success to-primary bg-clip-text text-transparent font-bold">Premium</span> 
                  für unbegrenzte Rezepte, alle KI-Provider und exklusive Features.
                </p>
                
                <Link href="/premium">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="shadow-primary hover:shadow-xl transform hover:scale-105"
                    glow={true}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg animate-pulse">✨</span>
                      <span>Jetzt upgraden</span>
                      <span className="text-lg animate-bounce">🚀</span>
                    </span>
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Spectacular Recent Activity Timeline */}
        <motion.div 
          className="mt-20"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div 
            className="relative card card-elevated p-12 shadow-2xl border border-primary/20 bg-gradient-to-br from-surface via-surface-secondary to-surface-tertiary overflow-hidden"
            variants={itemVariants}
          >
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-secondary/3 opacity-50" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-success animate-pulse" />
            
            <div className="relative z-10">
              {/* Section Header */}
              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                  className="inline-flex items-center gap-4 bg-gradient-to-r from-primary/15 to-secondary/15 text-primary border border-primary/20 px-8 py-4 rounded-full text-sm font-bold mb-8 backdrop-blur-xl"
                >
                  <span className="text-2xl animate-spin">🕒</span>
                  <span>Aktivitäts-Timeline</span>
                  <span className="text-2xl animate-pulse">✨</span>
                </motion.div>
                
                <h2 className="text-4xl lg:text-5xl font-black mb-4">
                  <span className="bg-gradient-to-r from-primary via-secondary to-success bg-clip-text text-transparent">
                    Deine kulinarische Reise
                  </span>
                </h2>
                <p className="text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto">
                  Verfolge deine Fortschritte und entdecke deine Koch-Evolution
                </p>
              </div>
              
              {/* Enhanced Activity Timeline */}
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-success rounded-full opacity-30" />
                
                <div className="space-y-8">
                  {[
                    {
                      action: 'Pasta Carbonara Meisterwerk',
                      description: 'Mit KI-Technologie ein perfektes Carbonara-Rezept erstellt',
                      time: 'vor 2 Stunden',
                      icon: '🍝',
                      color: 'from-primary to-primary-hover',
                      bgColor: 'from-primary/10 to-primary/5',
                      borderColor: 'border-primary/30'
                    },
                    {
                      action: 'Mojito zu Hall of Fame',
                      description: 'Der perfekte Mojito landete in deinen Favoriten',
                      time: 'vor 1 Tag',
                      icon: '🍸',
                      color: 'from-secondary to-secondary-hover',
                      bgColor: 'from-secondary/10 to-secondary/5',
                      borderColor: 'border-secondary/30'
                    },
                    {
                      action: 'Profil-Update erfolgreich',
                      description: 'Geschmacksprofil für bessere Rezeptempfehlungen optimiert',
                      time: 'vor 3 Tagen',
                      icon: '👤',
                      color: 'from-success to-success-hover',
                      bgColor: 'from-success/10 to-success/5',
                      borderColor: 'border-success/30'
                    }
                  ].map((activity, index) => (
                    <motion.div 
                      key={index} 
                      className={`group relative flex items-start gap-8 p-8 rounded-2xl bg-gradient-to-br ${activity.bgColor} border ${activity.borderColor} hover:border-opacity-60 shadow-lg hover:shadow-2xl transition-all duration-500`}
                      variants={itemVariants}
                      whileHover={{ x: 8, scale: 1.02 }}
                    >
                      {/* Timeline Node */}
                      <div className="absolute -left-4 top-8">
                        <motion.div 
                          className={`w-8 h-8 bg-gradient-to-br ${activity.color} rounded-full shadow-lg flex items-center justify-center group-hover:scale-125 transition-all duration-300`}
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <div className="w-3 h-3 bg-white rounded-full" />
                        </motion.div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 ml-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <motion.div 
                              className={`w-12 h-12 bg-gradient-to-br ${activity.color} rounded-2xl flex items-center justify-center text-white text-xl shadow-lg group-hover:scale-110 transition-all duration-300`}
                              whileHover={{ rotate: 15 }}
                            >
                              {activity.icon}
                            </motion.div>
                            <div>
                              <h3 className={`text-2xl font-black group-hover:scale-105 transition-transform duration-300 bg-gradient-to-r ${activity.color} bg-clip-text text-transparent`}>
                                {activity.action}
                              </h3>
                              <p className="text-text-secondary text-lg font-medium leading-relaxed">
                                {activity.description}
                              </p>
                            </div>
                          </div>
                          <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${activity.bgColor} border ${activity.borderColor} text-sm font-bold text-text-tertiary`}>
                            {activity.time}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* View All Activities Button */}
              <motion.div 
                className="text-center mt-12"
                variants={itemVariants}
              >
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-8 py-4 text-lg font-bold border-2 hover:shadow-xl transform hover:scale-105"
                >
                  <span className="flex items-center gap-3">
                    <span>📈</span>
                    <span>Komplette Aktivitäts-Historie</span>
                    <span>→</span>
                  </span>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}