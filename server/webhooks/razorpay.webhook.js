// subscription.authenticated  → customer auth'd their card (mandate created, no charge yet)
// subscription.activated      → first charge succeeded, subscription is live
// subscription.charged        → recurring charge succeeded
// subscription.pending        → charge failed, Razorpay will retry
// subscription.halted         → all retries exhausted, subscription stopped
// subscription.paused         → manually paused
// subscription.resumed        → resumed after pause
// subscription.cancelled      → cancelled (won't renew)
// subscription.completed      → all billing cycles done naturally
// subscription.updated        → plan/quantity/schedule changed

import RazorpayProvider from '../providers/payment/razorpay.provider.js';
import MongoSubscriptionRepository from '../repositories/mongodb/subscription.repository.js';

export default class RazorpayWebhooks {
    constructor() {
        this.razorpayProvider = new RazorpayProvider();
        this.subscriptionRepository = new MongoSubscriptionRepository();
    }
    handleWebhook = async (req, res) => {
        // req.body must be a raw Buffer — register this route with express.raw()
        const data = req.body;
        const signature = req.headers['x-razorpay-signature'];

        const isValidRequest = this.verifyWebhook({ data, signature });
        if (!isValidRequest) {
            console.error('Razorpay webhook signature verification failed');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        let event;
        try {
            event = JSON.parse(data.toString());
        } catch (err) {
            console.error('Failed to parse Razorpay webhook payload:', err);
            return res.status(400).json({ error: 'Invalid JSON payload' });
        }

        console.log(`Razorpay event received: ${event.event}`);

        try {
            switch (event.event) {
                // ── One-Time Payment ──────────────────────────────────────────

                case 'payment.captured': {
                    await this.#handlePaymentCaptured(event.payload);
                    break;
                }

                case 'payment.failed': {
                    await this.#handlePaymentFailed(event.payload);
                    break;
                }

                case 'order.paid': {
                    // Fires after payment.captured — use for logging only
                    // Activation already handled in payment.captured
                    console.log(
                        `Order paid: ${event.payload?.order?.entity?.id}`,
                    );
                    break;
                }

                // ── Subscriptions ─────────────────────────────────────────────

                case 'subscription.authenticated': {
                    // Card mandate created, first charge hasn't happened yet
                    await this.#handleSubscriptionAuthenticated(event.payload);
                    break;
                }

                case 'subscription.activated': {
                    // First charge succeeded — subscription is now live
                    await this.#handleSubscriptionActivated(event.payload);
                    break;
                }

                case 'subscription.charged': {
                    // Recurring charge succeeded
                    await this.#handleSubscriptionCharged(event.payload);
                    break;
                }

                case 'subscription.pending': {
                    // Charge failed, Razorpay will auto-retry
                    await this.#handleSubscriptionPending(event.payload);
                    break;
                }

                case 'subscription.halted': {
                    // All retries exhausted — hard failure
                    await this.#handleSubscriptionHalted(event.payload);
                    break;
                }

                case 'subscription.paused': {
                    await this.#handleSubscriptionPaused(event.payload);
                    break;
                }

                case 'subscription.resumed': {
                    await this.#handleSubscriptionResumed(event.payload);
                    break;
                }

                case 'subscription.cancelled': {
                    await this.#handleSubscriptionCancelled(event.payload);
                    break;
                }

                case 'subscription.completed': {
                    // All billing cycles naturally finished
                    await this.#handleSubscriptionCompleted(event.payload);
                    break;
                }

                case 'subscription.updated': {
                    await this.#handleSubscriptionUpdated(event.payload);
                    break;
                }

                default:
                    console.log(`Unhandled Razorpay event: ${event.event}`);
            }

            return res.json({ received: true });
        } catch (err) {
            console.error(`Error handling Razorpay event ${event.event}:`, err);
            // Return 200 so Razorpay doesn't keep retrying — handle failure internally
            return res.status(500).json({ error: 'Internal handler error' });
        }
    };

    // ─── One-Time Payment Handlers ────────────────────────────────────────────

    #handlePaymentCaptured = async (payload) => {
        const payment = payload.payment.entity;
        const {
            id, // pay_xxx  — used as providerSubscriptionId for one-time
            order_id, // order_xxx
            notes, // { userId, planId, paymentType, billingCycle } set at order creation
            customer_id, // cust_xxx
        } = payment;

        const { userId, planId, billingCycle } = notes;

        await this.subscriptionRepository.createSubcription({
            userId,
            planId,
            paymentType: 'one_time',
            billingCycle, // 'lifetime'
            provider: 'razorpay',
            providerSubscriptionId: id, // payment ID serves as the unique ref
            providerCustomerId: customer_id ?? null,
            providerPlanId: order_id ?? null,
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: null, // lifetime — never expires
            cancelAtPeriodEnd: false,
            metadata: notes,
        });
    };

    #handlePaymentFailed = async (payload) => {
        const payment = payload.payment.entity;
        const { id, error_code, error_description, notes } = payment;

        // Only log — no subscription record should exist yet for a failed one-time payment
        console.error(
            `One-time payment failed | id: ${id} | reason: ${error_description} (${error_code})`,
        );

        // TODO: notify user if you have their contact from notes
    };

    // ─── Subscription Handlers ────────────────────────────────────────────────

    #handleSubscriptionAuthenticated = async (payload) => {
        const sub = payload.subscription.entity;
        const { userId, planId, billingCycle } = sub.notes;

        // Mandate created, first charge pending — create record as 'pending'
        await this.subscriptionRepository.createSubcription({
            userId,
            planId,
            paymentType: 'subscription',
            billingCycle,
            provider: 'razorpay',
            providerSubscriptionId: sub.id,
            providerCustomerId: sub.customer_id ?? null,
            providerPlanId: sub.plan_id ?? null,
            status: 'pending',
            currentPeriodStart: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            metadata: sub.notes,
        });
    };

    #handleSubscriptionActivated = async (payload) => {
        const sub = payload.subscription.entity;

        // First charge succeeded — flip status to active and fill in the period
        await this.subscriptionRepository.updateByProviderSubscriptionId(
            sub.id,
            {
                status: 'active',
                currentPeriodStart: sub.current_start
                    ? new Date(sub.current_start * 1000)
                    : new Date(),
                currentPeriodEnd: sub.current_end
                    ? new Date(sub.current_end * 1000)
                    : null,
            },
        );
    };

    #handleSubscriptionCharged = async (payload) => {
        const sub = payload.subscription.entity;

        // Recurring renewal — extend the billing period
        await this.subscriptionRepository.updateByProviderSubscriptionId(
            sub.id,
            {
                status: 'active',
                currentPeriodStart: new Date(sub.current_start * 1000),
                currentPeriodEnd: new Date(sub.current_end * 1000),
            },
        );
    };

    #handleSubscriptionPending = async (payload) => {
        const sub = payload.subscription.entity;

        // Charge failed, Razorpay is still retrying — soft failure
        await this.subscriptionRepository.updateByProviderSubscriptionId(
            sub.id,
            { status: 'failed' },
        );

        // TODO: notify user that payment failed and will be retried
    };

    #handleSubscriptionHalted = async (payload) => {
        const sub = payload.subscription.entity;

        // All retries exhausted — hard stop
        await this.subscriptionRepository.updateByProviderSubscriptionId(
            sub.id,
            {
                status: 'failed',
                cancelledAt: sub.halted_at
                    ? new Date(sub.halted_at * 1000)
                    : new Date(),
            },
        );

        // TODO: revoke user access + notify user
    };

    #handleSubscriptionPaused = async (payload) => {
        const sub = payload.subscription.entity;

        await this.subscriptionRepository.updateByProviderSubscriptionId(
            sub.id,
            { status: 'paused' },
        );
    };

    #handleSubscriptionResumed = async (payload) => {
        const sub = payload.subscription.entity;

        await this.subscriptionRepository.updateByProviderSubscriptionId(
            sub.id,
            {
                status: 'active',
                currentPeriodStart: sub.current_start
                    ? new Date(sub.current_start * 1000)
                    : new Date(),
                currentPeriodEnd: sub.current_end
                    ? new Date(sub.current_end * 1000)
                    : null,
            },
        );
    };

    #handleSubscriptionCancelled = async (payload) => {
        const sub = payload.subscription.entity;

        await this.subscriptionRepository.updateByProviderSubscriptionId(
            sub.id,
            {
                status: 'cancelled',
                cancelledAt: sub.ended_at
                    ? new Date(sub.ended_at * 1000)
                    : new Date(),
                cancelAtPeriodEnd: false,
            },
        );

        // TODO: revoke user access
    };

    #handleSubscriptionCompleted = async (payload) => {
        const sub = payload.subscription.entity;

        // All billing cycles naturally finished
        await this.subscriptionRepository.updateByProviderSubscriptionId(
            sub.id,
            {
                status: 'expired',
                currentPeriodEnd: sub.ended_at
                    ? new Date(sub.ended_at * 1000)
                    : new Date(),
            },
        );

        // TODO: prompt user to renew
    };

    #handleSubscriptionUpdated = async (payload) => {
        const sub = payload.subscription.entity;

        const update = {};

        if (sub.current_start) {
            update.currentPeriodStart = new Date(sub.current_start * 1000);
        }
        if (sub.current_end) {
            update.currentPeriodEnd = new Date(sub.current_end * 1000);
        }
        if (sub.plan_id) {
            update.providerPlanId = sub.plan_id;
        }

        await this.subscriptionRepository.updateByProviderSubscriptionId(
            sub.id,
            update,
        );
    };

    // ─── Signature Verification ───────────────────────────────────────────────

    verifyWebhook({ data, signature }) {
        return this.razorpayProvider.verifyWebhook({ data, signature });
    }
}
