"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Sparkles,
  CreditCard,
  ShieldCheck,
  HardDrive,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { apiService } from '@/services/api.service';
import { useAuth } from '@/context/AuthContext';
import {
  IPlan,
  ISubscription,
  PaymentProviderType,
  PaymentType,
  BillingCycle,
} from '@/types';

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(0)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [plans, setPlans] = useState<IPlan[]>([]);
  const [currentSub, setCurrentSub] = useState<ISubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLink, setCheckoutLink] = useState<string | null>(null);

  const [paymentType, setPaymentType] = useState<PaymentType>('subscription');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [provider, setProvider] = useState<PaymentProviderType>('razorpay');

  useEffect(() => {
    const loadPricingData = async () => {
      setLoading(true);
      try {
        const plansRes = await apiService.getPlans();
        setPlans(plansRes.data || []);

        if (user) {
          const subRes = await apiService.getMySubscription().catch(() => ({ data: null }));
          setCurrentSub(subRes.data || null);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load plans');
      } finally {
        setLoading(false);
      }
    };
    loadPricingData();
  }, [user]);

  const handlePaymentTypeChange = (type: PaymentType) => {
    setPaymentType(type);
    if (type === 'one_time' && billingCycle === 'monthly') {
      // keep monthly or allow lifetime
    } else if (type === 'subscription' && billingCycle === 'lifetime') {
      setBillingCycle('monthly');
    }
  };

  const getPriceForPlan = (plan: IPlan): number | null => {
    if (plan.pricingOptions && Array.isArray(plan.pricingOptions)) {
      const match = plan.pricingOptions.find(
        (opt) => opt.paymentType === paymentType && opt.billingCycle === billingCycle
      );
      if (match) return match.amount;
    }
    if (paymentType === 'subscription') {
      if (billingCycle === 'lifetime') return null;
      return plan.pricing?.subscription?.[billingCycle]?.amount ?? null;
    } else {
      return plan.pricing?.one_time?.[billingCycle]?.amount ?? null;
    }
  };

  const getQuotaBytesForPlan = (plan: IPlan): number => {
    if (plan.storageQuotaBytes) return plan.storageQuotaBytes;
    if (plan.storageLimitInGB) return plan.storageLimitInGB * 1024 * 1024 * 1024;
    return 0;
  };

  const handleSubscribe = async (plan: IPlan) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setProcessingPlan(plan._id);
    setError(null);
    setCheckoutLink(null);

    try {
      const res = await apiService.createSubscription({
        planId: plan._id,
        provider,
        paymentType,
        billingCycle,
      });

      const data = res.data as
        | { url?: string; shortUrl?: string; checkoutUrl?: string }
        | undefined;
      const url = data?.url || data?.shortUrl || data?.checkoutUrl;
      if (url) {
        setCheckoutLink(url);
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to initialize payment session. Ensure provider API keys are configured in server .env.'
      );
    } finally {
      setProcessingPlan(null);
    }
  };

  const availableCycles: BillingCycle[] =
    paymentType === 'subscription'
      ? ['monthly', 'quarterly', 'yearly']
      : ['monthly', 'quarterly', 'yearly', 'lifetime'];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-950/80 border border-brand-800/60 text-brand-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          Flexible Cloud Storage Plans
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-fg tracking-tight">
          Scale your DevDrive storage
        </h1>
        <p className="text-fg-muted text-sm sm:text-base">
          Choose between recurring subscriptions or one-time passes powered by Razorpay and Stripe.
        </p>
      </div>

      {/* Active Subscription Banner */}
      {currentSub && (
        <div className="bg-success-950/40 border border-success-950/60 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-success-400 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-fg">
                Current Subscription Status:{' '}
                <span className="uppercase text-success-400">{currentSub.status}</span>
              </h3>
              <p className="text-xs text-fg mt-0.5">
                Provider: <span className="capitalize">{currentSub.provider}</span> • Billing:{' '}
                <span className="capitalize">{currentSub.billingCycle}</span> (
                {currentSub.paymentType === 'one_time' ? 'One-Time' : 'Recurring'})
                {currentSub.storageQuotaBytes
                  ? ` • Bonus Quota: ${formatBytes(currentSub.storageQuotaBytes)}`
                  : ''}
              </p>
            </div>
          </div>
          {currentSub.shortUrl && (
            <a
              href={currentSub.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-success-300 hover:text-success-300 bg-success-950/40 px-3.5 py-2 rounded-xl border border-success-600/50"
            >
              Payment Link <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-surface/90 border border-line rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Payment Mode */}
        <div className="flex items-center gap-2 bg-canvas p-1.5 rounded-xl border border-line">
          <button
            type="button"
            onClick={() => handlePaymentTypeChange('subscription')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              paymentType === 'subscription'
                ? 'bg-brand-600 text-fg'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            Recurring Subscription
          </button>
          <button
            type="button"
            onClick={() => handlePaymentTypeChange('one_time')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              paymentType === 'one_time'
                ? 'bg-brand-600 text-fg'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            One-Time Pass
          </button>
        </div>

        {/* Billing Cycle */}
        <div className="flex flex-wrap items-center gap-1.5 bg-canvas p-1.5 rounded-xl border border-line">
          {availableCycles.map((cycle) => (
            <button
              key={cycle}
              type="button"
              onClick={() => setBillingCycle(cycle)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                billingCycle === cycle
                  ? 'bg-surface-raised text-fg border border-line-strong'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              {cycle}
            </button>
          ))}
        </div>

        {/* Payment Gateway Provider */}
        <div className="flex items-center gap-2 bg-canvas p-1.5 rounded-xl border border-line">
          <span className="text-xs text-fg-muted pl-2">Gateway:</span>
          {(['razorpay', 'stripe'] as PaymentProviderType[]).map((gw) => (
            <button
              key={gw}
              type="button"
              onClick={() => setProvider(gw)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                provider === gw
                  ? 'bg-success-600 text-fg'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              {gw}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-danger-950/60 border border-danger-700 text-danger-300 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 text-danger-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {checkoutLink && (
        <div className="flex items-center justify-between bg-brand-950/60 border border-brand-700 text-brand-200 px-4 py-3 rounded-xl text-sm">
          <span>Checkout session created! If the popup was blocked, click the link to proceed:</span>
          <a
            href={checkoutLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-fg underline"
          >
            Open Checkout <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-fg-muted gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
          <span>Loading storage plans...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const amount = getPriceForPlan(plan);
            const isPopular = plan.name === 'intermediate';

            return (
              <div
                key={plan._id}
                className={`relative flex flex-col justify-between rounded-2xl p-6 border transition-all ${
                  isPopular
                    ? 'bg-surface border-brand-500/80 shadow-xl shadow-brand-950/30'
                    : 'bg-surface/60 border-line hover:border-line-strong'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 right-6 bg-brand-600 text-fg text-[11px] font-semibold px-3 py-0.5 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-fg capitalize">{plan.name}</h2>
                    <div className="flex items-center gap-1.5 text-brand-400 bg-brand-950/60 border border-brand-800/50 px-2.5 py-1 rounded-lg text-xs font-semibold">
                      <HardDrive className="w-3.5 h-3.5" />
                      {formatBytes(getQuotaBytesForPlan(plan))}
                    </div>
                  </div>

                  <div className="mb-6">
                    {amount !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-fg">₹{amount}</span>
                        <span className="text-xs text-fg-muted">
                          / {billingCycle} ({paymentType === 'one_time' ? 'one-time' : 'auto-renew'})
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm text-fg-muted">Not available for this cycle</div>
                    )}
                  </div>

                  <ul className="space-y-2.5 border-t border-line/80 pt-5 mb-8">
                    {(plan.features || []).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-fg">
                        <Check className="w-4 h-4 text-success-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={amount === null || processingPlan === plan._id}
                  onClick={() => handleSubscribe(plan)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                    isPopular
                      ? 'bg-brand-600 hover:bg-brand-500 text-fg'
                      : 'bg-surface-raised hover:bg-surface-hover text-fg border border-line-strong'
                  }`}
                >
                  {processingPlan === plan._id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Choose {plan.name} with {provider}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
