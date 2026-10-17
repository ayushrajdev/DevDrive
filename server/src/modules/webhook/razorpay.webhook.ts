import type { Request, Response } from 'express';
import type { ISubscriptionRepository } from '../payment/subscription.repository.js';
import { RazorpayProvider } from '../../providers/payment/razorpay.provider.js';

export class RazorpayWebhookHandler {
    private readonly razorpayProvider: RazorpayProvider;

    constructor(private readonly subscriptionRepository: ISubscriptionRepository) {
        this.razorpayProvider = new RazorpayProvider();
    }

    handleWebhook = async (req: Request, res: Response): Promise<void> => {
        const data = req.body;
        const signature = req.headers['x-razorpay-signature'] as string;

        if (!signature || !data) {
            res.status(400).json({ error: 'Signature and body required' });
            return;
        }

        const isValid = this.razorpayProvider.verifyWebhook({ data, signature });
        if (!isValid) {
            console.error('Razorpay webhook signature verification failed');
            res.status(400).json({ error: 'Invalid signature' });
            return;
        }

        let event: any;
        try {
            event = typeof data === 'string' ? JSON.parse(data) : JSON.parse(data.toString());
        } catch (err) {
            console.error('Failed to parse Razorpay webhook payload:', err);
            res.status(400).json({ error: 'Invalid JSON payload' });
            return;
        }

        console.info(`Razorpay event received: ${event.event}`);

        try {
            switch (event.event) {
                case 'payment.captured':
                    await this.#handlePaymentCaptured(event.payload);
                    break;
                case 'payment.failed':
                    await this.#handlePaymentFailed(event.payload);
                    break;
                case 'subscription.authenticated':
                    await this.#handleSubscriptionAuthenticated(event.payload);
                    break;
                case 'subscription.activated':
                    await this.#handleSubscriptionActivated(event.payload);
                    break;
                case 'subscription.charged':
                    await this.#handleSubscriptionCharged(event.payload);
                    break;
                case 'subscription.pending':
                    await this.#handleSubscriptionPending(event.payload);
                    break;
                case 'subscription.halted':
                    await this.#handleSubscriptionHalted(event.payload);
                    break;
                case 'subscription.paused':
                    await this.#handleSubscriptionPaused(event.payload);
                    break;
                case 'subscription.resumed':
                    await this.#handleSubscriptionResumed(event.payload);
                    break;
                case 'subscription.cancelled':
                    await this.#handleSubscriptionCancelled(event.payload);
                    break;
                case 'subscription.completed':
                    await this.#handleSubscriptionCompleted(event.payload);
                    break;
                case 'subscription.updated':
                    await this.#handleSubscriptionUpdated(event.payload);
                    break;
                default:
                    console.info(`Unhandled Razorpay event: ${event.event}`);
            }

            res.status(200).json({ received: true });
        } catch (err) {
            console.error(`Error handling Razorpay event ${event.event}:`, err);
            res.status(500).json({ error: 'Internal handler error' });
        }
    };

    // ── Private Event Handlers ───────────────────────────────────────────────

    async #handlePaymentCaptured(payload: any): Promise<void> {
        const payment = payload.payment.entity;
        const { id, order_id, notes, customer_id } = payment;
        const { userId, planId, billingCycle } = notes || {};

        if (!userId) return;

        await this.subscriptionRepository.createOrUpdateSubscription({
            userId,
            planId,
            paymentType: 'one_time',
            billingCycle,
            provider: 'razorpay',
            providerSubscriptionId: id,
            providerCustomerId: customer_id ?? null,
            providerPlanId: order_id ?? null,
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: undefined, // lifetime
            cancelAtPeriodEnd: false,
            metadata: notes,
        });
    }

    async #handlePaymentFailed(payload: any): Promise<void> {
        const payment = payload.payment.entity;
        console.warn(`Razorpay payment failed: ${payment.id} | ${payment.error_description}`);
    }

    async #handleSubscriptionAuthenticated(payload: any): Promise<void> {
        const sub = payload.subscription.entity;
        const { userId, planId, billingCycle } = sub.notes || {};

        if (!userId) return;

        await this.subscriptionRepository.createOrUpdateSubscription({
            userId,
            planId,
            paymentType: 'subscription',
            billingCycle,
            provider: 'razorpay',
            providerSubscriptionId: sub.id,
            providerCustomerId: sub.customer_id ?? null,
            providerPlanId: sub.plan_id ?? null,
            status: 'pending',
            cancelAtPeriodEnd: false,
            metadata: sub.notes,
        });
    }

    async #handleSubscriptionActivated(payload: any): Promise<void> {
        const sub = payload.subscription.entity;
        await this.subscriptionRepository.updateByProviderSubscriptionId(sub.id, {
            status: 'active',
            currentPeriodStart: sub.current_start ? new Date(sub.current_start * 1000) : new Date(),
            currentPeriodEnd: sub.current_end ? new Date(sub.current_end * 1000) : undefined,
        });
    }

    async #handleSubscriptionCharged(payload: any): Promise<void> {
        const sub = payload.subscription.entity;
        await this.subscriptionRepository.updateByProviderSubscriptionId(sub.id, {
            status: 'active',
            currentPeriodStart: new Date(sub.current_start * 1000),
            currentPeriodEnd: new Date(sub.current_end * 1000),
        });
    }

    async #handleSubscriptionPending(payload: any): Promise<void> {
        const sub = payload.subscription.entity;
        await this.subscriptionRepository.updateByProviderSubscriptionId(sub.id, {
            status: 'failed',
        });
    }

    async #handleSubscriptionHalted(payload: any): Promise<void> {
        const sub = payload.subscription.entity;
        await this.subscriptionRepository.updateByProviderSubscriptionId(sub.id, {
            status: 'failed',
            cancelledAt: sub.halted_at ? new Date(sub.halted_at * 1000) : new Date(),
        });
    }

    async #handleSubscriptionPaused(payload: any): Promise<void> {
        const sub = payload.subscription.entity;
        await this.subscriptionRepository.updateByProviderSubscriptionId(sub.id, {
            status: 'paused',
        });
    }

    async #handleSubscriptionResumed(payload: any): Promise<void> {
        const sub = payload.subscription.entity;
        await this.subscriptionRepository.updateByProviderSubscriptionId(sub.id, {
            status: 'active',
            currentPeriodStart: sub.current_start ? new Date(sub.current_start * 1000) : new Date(),
            currentPeriodEnd: sub.current_end ? new Date(sub.current_end * 1000) : undefined,
        });
    }

    async #handleSubscriptionCancelled(payload: any): Promise<void> {
        const sub = payload.subscription.entity;
        await this.subscriptionRepository.updateByProviderSubscriptionId(sub.id, {
            status: 'cancelled',
            cancelledAt: sub.ended_at ? new Date(sub.ended_at * 1000) : new Date(),
            cancelAtPeriodEnd: false,
        });
    }

    async #handleSubscriptionCompleted(payload: any): Promise<void> {
        const sub = payload.subscription.entity;
        await this.subscriptionRepository.updateByProviderSubscriptionId(sub.id, {
            status: 'expired',
            currentPeriodEnd: sub.ended_at ? new Date(sub.ended_at * 1000) : new Date(),
        });
    }

    async #handleSubscriptionUpdated(payload: any): Promise<void> {
        const sub = payload.subscription.entity;
        const update: Record<string, any> = {};

        if (sub.current_start) update.currentPeriodStart = new Date(sub.current_start * 1000);
        if (sub.current_end) update.currentPeriodEnd = new Date(sub.current_end * 1000);
        if (sub.plan_id) update.providerPlanId = sub.plan_id;

        await this.subscriptionRepository.updateByProviderSubscriptionId(sub.id, update);
    }
}
