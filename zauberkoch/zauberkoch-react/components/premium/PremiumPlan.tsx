'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiCheck, 
  FiX, 
  FiStar,
  FiZap,
  FiShield,
  FiGift
} from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import type { SubscriptionPlan } from '@/types';

interface PremiumPlanProps {
  plan: SubscriptionPlan;
  currentPlan?: string;
  isPopular?: boolean;
  onSelectPlan: (planId: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function PremiumPlan({ 
  plan, 
  currentPlan, 
  isPopular = false, 
  onSelectPlan, 
  loading = false,
  disabled = false 
}: PremiumPlanProps) {
  
  const isCurrentPlan = currentPlan === plan.id;
  const isFree = plan.id === 'free';
  
  const handleSelectPlan = () => {
    if (!disabled && !loading && !isCurrentPlan) {
      onSelectPlan(plan.id);
    }
  };

  const getPlanIcon = () => {
    switch (plan.id) {
      case 'free':
        return <FiGift className="text-info" size={24} />;
      case 'monthly':
        return <FiZap className="text-primary" size={24} />;
      case 'yearly':
        return <FiCrown className="text-warning" size={24} />;
      default:
        return <FiStar className="text-primary" size={24} />;
    }
  };

  const getFeatureIcon = (included: boolean) => {
    return included 
      ? <FiCheck className="text-success" size={16} />
      : <FiX className="text-error opacity-50" size={16} />;
  };

  const formatPrice = (price: number, interval: string) => {
    if (price === 0) return 'Kostenlos';
    return `€${price.toFixed(2)}/${interval === 'month' ? 'Monat' : 'Jahr'}`;
  };

  const getYearlySavings = () => {
    // For now, only show premium plan without yearly savings calculation
    return null;
  };

  const savings = getYearlySavings();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="relative h-full"
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground px-4 py-1 rounded-full text-sm font-bold shadow-lg">
            <FiStar className="inline mr-1" size={14} />
            Beliebt
          </div>
        </div>
      )}

      {/* Savings Badge */}
      {savings && (
        <div className="absolute -top-3 -right-3 z-10">
          <div className="bg-success text-success-foreground px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            {savings.percentage}% sparen
          </div>
        </div>
      )}

      <Card className={`h-full transition-all duration-300 ${
        isPopular 
          ? 'border-primary shadow-xl scale-105' 
          : isCurrentPlan
          ? 'border-success shadow-lg'
          : 'shadow-md hover:shadow-lg'
      } ${disabled ? 'opacity-60' : ''}`}>
        <CardHeader className={`text-center pb-4 ${
          isPopular ? 'bg-gradient-to-br from-primary/5 to-primary/10' : ''
        }`}>
          {/* Plan Icon */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex justify-center mb-2"
          >
            {getPlanIcon()}
          </motion.div>

          {/* Plan Name */}
          <CardTitle className={`text-xl font-bold mb-2 ${
            isPopular ? 'text-primary' : ''
          }`}>
            {plan.name}
          </CardTitle>

          {/* Price */}
          <div className="mb-2">
            <div className={`text-3xl font-bold ${
              isFree ? 'text-info' : isPopular ? 'text-primary' : 'text-on-surface'
            }`}>
              {formatPrice(plan.price, 'month')}
            </div>
            {!isFree && (
              <div className="text-sm text-on-surface-variant">
                {'Monatlich abgerechnet'}
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-on-surface-variant">
            {plan.id === 'free' ? 'Ideal zum Ausprobieren' : 'Unbegrenzte Rezept-Generierung'}
          </p>

          {/* Current Plan Badge */}
          {isCurrentPlan && (
            <div className="mt-3">
              <span className="inline-flex items-center gap-1 bg-success/10 text-success px-2 py-1 rounded-full text-xs font-medium">
                <FiCheck size={12} />
                Aktueller Plan
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          {/* Features List */}
          <div className="space-y-3 mb-6 flex-1">
            <h4 className="font-semibold text-sm text-on-surface mb-3">
              Enthaltene Features:
            </h4>
            
            {plan.features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-2 rounded-lg transition-colors bg-success/5"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <FiCheck className="w-4 h-4 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {feature}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              size="lg"
              fullWidth
              onClick={handleSelectPlan}
              loading={loading}
              disabled={disabled || isCurrentPlan}
              variant={isPopular ? 'default' : isCurrentPlan ? 'outline' : 'outline'}
              className={`${
                isPopular 
                  ? 'bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary' 
                  : ''
              }`}
            >
              {isCurrentPlan 
                ? 'Aktueller Plan'
                : isFree
                ? 'Kostenlos bleiben'
                : loading
                ? 'Wird geladen...'
                : `${plan.name} auswählen`
              }
            </Button>
          </motion.div>

          {/* Additional Info */}
          {!isFree && (
            <div className="text-center mt-3">
              <p className="text-xs text-on-surface-variant">
                <FiShield className="inline mr-1" size={12} />
                Jederzeit kündbar
              </p>
              {savings && (
                <p className="text-xs text-success mt-1 font-medium">
                  Spare €{savings.amount.toFixed(2)} im Jahr!
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default PremiumPlan;