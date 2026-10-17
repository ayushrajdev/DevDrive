import type { Request, Response } from 'express';
import type { ISubscriptionRepository } from '../payment/subscription.repository.js';
import { StripeProvider } from '../../providers/payment/stripe.provider.js';

export class StripeWebhookHandler {
    private readonly stripeProvider: StripeProvider;

    constructor(private readonly subscriptionRepository: ISubscriptionRepository) {
        this.stripeProvider = new StripeProvider();
    }

    handleWebhook = async (req: Request, res: Response): Promise<void> => {
        const signature = req.headers['stripe-signature'] as string;
        let event: any;

        try {
            event = this.stripeProvider.constructWebhookEvent(req.body, signature);
        } catch (err: any) {
            console.error('Stripe webhook signature verification failed:', err.message);
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }

        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    await this.#handleCheckoutSessionCompleted(event.data.object);
                    break;
                case 'invoice.payment_succeeded':
                    await this.#handleInvoicePaymentSucceeded(event.data.object);
                    break;
                case 'invoice.payment_failed':
                    await this.#handleInvoicePaymentFailed(event.data.object);
                    break;
                case 'customer.subscription.updated':
                    await this.#handleSubscriptionUpdated(event.data.object);
                    break;
                case 'customer.subscription.deleted':
                    await this.#handleSubscriptionDeleted(event.data.object);
                    break;
                default:
                    console.info(`Unhandled Stripe event type: ${event.type}`);
            }

            res.status(200).json({ received: true });
        } catch (err) {
            console.error(`Error handling Stripe event ${event.type}:`, err);
            res.status(500).json({ error: 'Internal handler error' });
        }
    };

    // ── Private Event Handlers ───────────────────────────────────────────────

    async #handleCheckoutSessionCompleted(session: any): Promise<void> {
        const {
            id,
            mode,
            customer,
            subscription,
            payment_intent,
            metadata,
            payment_status,
        } = session;

        if (payment_status !== 'paid') {
            console.warn(`Stripe session unpaid, skipping: ${id}`);
            return;
        }

        const { userId, planId, paymentType, billingCycle } = metadata || {};
        if (!userId) return;

        if (mode === 'payment') {
            await this.subscriptionRepository.createOrUpdateSubscription({
                userId,
                planId,
                paymentType: 'one_time',
                billingCycle: billingCycle || 'lifetime',
                provider: 'stripe',
                providerSubscriptionId: payment_intent ?? id,
                providerCustomerId: customer,
                status: 'active',
                currentPeriodStart: new Date(),
                currentPeriodEnd: undefined,
                cancelAtPeriodEnd: false,
                metadata,
            });
        } else if (mode === 'subscription') {
            await this.subscriptionRepository.createOrUpdateSubscription({
                userId,
                planId,
                paymentType: 'subscription',
                billingCycle,
                provider: 'stripe',
                providerSubscriptionId: subscription,
                providerCustomerId: customer,
                status: 'pending',
                currentPeriodStart: new Date(),
                cancelAtPeriodEnd: false,
                metadata,
            });
        }
    }

    async #handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
        const { subscription, period_start, period_end } = invoice;
        if (!subscription) return;

        const currentPeriodStart = new Date(period_start * 1000);
        const currentPeriodEnd = new Date(period_end * 1000);

        await this.subscriptionRepository.updateByProviderSubscriptionId(subscription, {
            status: 'active',
            currentPeriodStart,
            currentPeriodEnd,
        });
    }

    async #handleInvoicePaymentFailed(invoice: any): Promise<void> {
        const { subscription, next_payment_attempt } = invoice;
        if (!subscription) return;

        const status = next_payment_attempt ? 'past_due' : 'failed';
        await this.subscriptionRepository.updateByProviderSubscriptionId(subscription, {
            status,
        });
    }

    async #handleSubscriptionUpdated(stripeSubscription: any): Promise<void> {
        const {
            id,
            status,
            current_period_start,
            current_period_end,
            cancel_at_period_end,
            pause_collection,
            trial_end,
        } = stripeSubscription;

        const update: Record<string, any> = {
            currentPeriodStart: new Date(current_period_start * 1000),
            currentPeriodEnd: new Date(current_period_end * 1000),
            cancelAtPeriodEnd: cancel_at_period_end,
            trialEndsAt: trial_end ? new Date(trial_end * 1000) : undefined,
        };

        if (pause_collection) {
            update.status = 'paused';
        } else if (status === 'active') {
            update.status = 'active';
        } else if (status === 'past_due' || status === 'unpaid') {
            update.status = 'past_due';
        } else if (status === 'trialing') {
            update.status = 'active';
        }

        await this.subscriptionRepository.updateByProviderSubscriptionId(id, update);
    }

    async #handleSubscriptionDeleted(stripeSubscription: any): Promise<void> {
        const { id, ended_at } = stripeSubscription;

        await this.subscriptionRepository.updateByProviderSubscriptionId(id, {
            status: 'cancelled',
            cancelledAt: ended_at ? new Date(ended_at * 1000) : new Date(),
            cancelAtPeriodEnd: false,
        });
    }
}
