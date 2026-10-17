import Stripe from 'stripe';
import { ENV } from '../../shared/utils/env.js';
import {
    PaymentProvider,
    type CreateSubscriptionParams,
    type CreateOneTimePaymentParams,
    type VerifyWebhookParams,
} from './payment.provider.js';

export class StripeProvider extends PaymentProvider {
    private client: Stripe | null = null;

    public getStripe(): Stripe {
        if (!this.client) {
            if (!ENV.STRIPE_SECRET_KEY) {
                throw new Error('STRIPE_SECRET_KEY is required for Stripe payments');
            }
            this.client = new Stripe(ENV.STRIPE_SECRET_KEY);
        }
        return this.client;
    }

    async createSubscription({
        planId,
        userInfo,
        selectedPlanPricing,
        metadata,
    }: CreateSubscriptionParams): Promise<Stripe.Checkout.Session> {
        return this.#createCheckoutSession({
            planId,
            userInfo,
            selectedPlanPricing,
            metadata,
            mode: 'subscription',
        });
    }

    async createOneTimePayment({
        planId,
        userInfo,
        selectedPlanPricing,
        metadata,
    }: CreateOneTimePaymentParams): Promise<Stripe.Checkout.Session> {
        return this.#createCheckoutSession({
            planId,
            userInfo,
            selectedPlanPricing,
            metadata,
            mode: 'payment',
        });
    }

    constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
        if (!ENV.STRIPE_WEBHOOK_SECRET) {
            throw new Error('STRIPE_WEBHOOK_SECRET is required to verify Stripe webhooks');
        }
        return this.getStripe().webhooks.constructEvent(
            payload,
            signature,
            ENV.STRIPE_WEBHOOK_SECRET,
        );
    }

    verifyWebhook(_params: VerifyWebhookParams): boolean {
        throw new Error('Use constructWebhookEvent for Stripe webhook verification');
    }

    // ── Private ────────────────────────────────────────────────────────────────

    async #createCheckoutSession({
        planId,
        userInfo,
        selectedPlanPricing,
        metadata,
        mode,
    }: CreateSubscriptionParams & {
        mode: 'subscription' | 'payment';
    }): Promise<Stripe.Checkout.Session> {
        const stripe = this.getStripe();
        const session = await stripe.checkout.sessions.create({
            mode,
            line_items: [{ price: planId, quantity: 1 }],
            metadata: metadata as Record<string, string>,
            success_url: `${ENV.FRONTEND_URL}/payment/success`,
            cancel_url: `${ENV.FRONTEND_URL}/payment/cancel`,
            currency: selectedPlanPricing?.currency ?? 'INR',
            client_reference_id: String((userInfo as { _id: unknown })._id),
        });
        return session;
    }
}
