import StripePaymentProvider from '../providers/payment/stripe.provider.js';
import MongoSubscriptionRepository from '../repositories/mongodb/subscription.repository.js';

export default class StripeWebhooks {
    constructor() {
        this.stripeService = new StripePaymentProvider();
        this.subscriptionRepository = new MongoSubscriptionRepository();
    }

    handleSubscriptions = async (req, res) => {
        // req.body must be raw Buffer — register this route with express.raw()
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = this.stripeService.stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET,
            );
        } catch (err) {
            console.error(
                'Stripe webhook signature verification failed:',
                err.message,
            );
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        try {
            switch (event.type) {
                case 'checkout.session.completed': {
                    await this.#handleCheckoutSessionCompleted(
                        event.data.object,
                    );
                    break;
                }

                case 'invoice.payment_succeeded': {
                    await this.#handleInvoicePaymentSucceeded(
                        event.data.object,
                    );
                    break;
                }

                case 'invoice.payment_failed': {
                    await this.#handleInvoicePaymentFailed(event.data.object);
                    break;
                }

                case 'customer.subscription.updated': {
                    await this.#handleSubscriptionUpdated(event.data.object);
                    break;
                }

                case 'customer.subscription.deleted': {
                    await this.#handleSubscriptionDeleted(event.data.object);
                    break;
                }

                default:
                    console.log(`Unhandled Stripe event type: ${event.type}`);
            }

            return res.json({ received: true });
        } catch (err) {
            console.error(`Error handling Stripe event ${event.type}:`, err);
            // Still return 200 so Stripe doesn't retry — log and handle internally
            return res.status(500).json({ error: 'Internal handler error' });
        }
    };

    // ─── Private Handlers ────────────────────────────────────────────────────

    #handleCheckoutSessionCompleted = async (session) => {
        const {
            id,
            mode,
            customer, // Stripe customer ID e.g. cus_xxx
            subscription, // Present only when mode === 'subscription'
            payment_intent, // Present only when mode === 'payment'
            metadata,
            payment_status,
            client_reference_id,
        } = session;

        // Guard: only proceed if payment is actually paid
        if (payment_status !== 'paid') {
            console.warn(
                `checkout.session.completed with payment_status: ${payment_status}, skipping.`,
            );
            return;
        }

        const { userId, planId, paymentType, billingCycle } = metadata;

        switch (mode) {
            case 'payment': {
                // One-time / lifetime payment
                await this.subscriptionRepository.createSubcription({
                    userId,
                    planId,
                    paymentType, // 'one_time'
                    billingCycle, // 'lifetime'
                    provider: 'stripe',
                    providerSubscriptionId: payment_intent ?? id, // no subscription object for one-time
                    providerCustomerId: customer,
                    status: 'active',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: null, // lifetime — never expires
                    cancelAtPeriodEnd: false,
                });
                break;
            }

            case 'subscription': {
                // Subscription payment — Stripe will also fire invoice.payment_succeeded
                // so we just record the subscription mapping here; full activation
                // happens on invoice.payment_succeeded to avoid double-processing.
                // However, we create the record here in 'pending' state and activate it there.
                await this.subscriptionRepository.createSubcription({
                    userId,
                    planId,
                    paymentType, // 'subscription'
                    billingCycle,
                    provider: 'stripe',
                    providerSubscriptionId: subscription, // sub_xxx
                    providerCustomerId: customer,
                    status: 'pending', // activated on invoice.payment_succeeded
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: null, // filled in on invoice.payment_succeeded
                    cancelAtPeriodEnd: false,
                });
                break;
            }

            default:
                console.warn(`Unknown checkout session mode: ${mode}`);
        }
    };

    #handleInvoicePaymentSucceeded = async (invoice) => {
        const {
            subscription, // sub_xxx
            customer, // cus_xxx
            period_start,
            period_end,
            billing_reason, // 'subscription_create' | 'subscription_cycle' | 'subscription_update'
        } = invoice;

        if (!subscription) {
            // One-time invoice, nothing to update
            return;
        }

        const currentPeriodStart = new Date(period_start * 1000);
        const currentPeriodEnd = new Date(period_end * 1000);

        if (billing_reason === 'subscription_create') {
            // First payment — activate the subscription created in checkout.session.completed
            await this.subscriptionRepository.updateByProviderSubscriptionId(
                subscription,
                {
                    status: 'active',
                    currentPeriodStart,
                    currentPeriodEnd,
                },
            );
        } else if (billing_reason === 'subscription_cycle') {
            // Recurring renewal — extend the period
            await this.subscriptionRepository.updateByProviderSubscriptionId(
                subscription,
                {
                    status: 'active',
                    currentPeriodStart,
                    currentPeriodEnd,
                },
            );
        }
    };

    #handleInvoicePaymentFailed = async (invoice) => {
        const { subscription, next_payment_attempt } = invoice;

        if (!subscription) return;

        // If Stripe has exhausted all retries, next_payment_attempt will be null
        const status = next_payment_attempt ? 'past_due' : 'failed';

        await this.subscriptionRepository.updateByProviderSubscriptionId(
            subscription,
            { status },
        );

        // TODO: trigger a notification to the user here
    };

    #handleSubscriptionUpdated = async (stripeSubscription) => {
        const {
            id,
            status,
            current_period_start,
            current_period_end,
            cancel_at_period_end,
            pause_collection,
            trial_end,
        } = stripeSubscription;

        const update = {
            currentPeriodStart: new Date(current_period_start * 1000),
            currentPeriodEnd: new Date(current_period_end * 1000),
            cancelAtPeriodEnd: cancel_at_period_end,
            trialEndsAt: trial_end ? new Date(trial_end * 1000) : null,
        };

        if (pause_collection) {
            update.status = 'paused';
        } 
        else if (status === 'active') {
            update.status = 'active';
        }
         else if (status === 'past_due' || status === 'unpaid') {
            update.status = 'past_due';
        }
         else if (status === 'trialing') {
            update.status = 'active'; // treat trialing as active in your system
        }
        

        await this.subscriptionRepository.updateByProviderSubscriptionId(
            id,
            update,
        );
    };

    #handleSubscriptionDeleted = async (stripeSubscription) => {
        const { id, ended_at } = stripeSubscription;

        await this.subscriptionRepository.updateByProviderSubscriptionId(id, {
            status: 'cancelled',
            cancelledAt: ended_at ? new Date(ended_at * 1000) : new Date(),
            cancelAtPeriodEnd: false,
        });

        // TODO: revoke user access here
    };
}

// a = {
//     entity: 'payload',
//     account_id: 'acc_SrWlNVMlzS4W3n',
//     payload: 'subscription.cancelled',
//     contains: ['subscription'],
//     payload: {
//         subscription: {
//             entity: {
//                 id: 'sub_Sv8MNPXV34PpwS',
//                 entity: 'subscription',
//                 plan_id: 'plan_Suii8V3yAIThMT',
//                 customer_id: 'cust_Sv8Vz9OIYErUNj',
//                 customer_email: 'abc@example.com',
//                 customer_contact: '+919955283389',
//                 status: 'cancelled',
//                 type: 1,
//                 current_start: null,
//                 current_end: null,
//                 ended_at: 1780061899,
//                 quantity: 1,
//                 notes: { _id: 'ayush' },
//                 charge_at: null,
//                 start_at: null,
//                 end_at: null,
//                 auth_attempts: 0,
//                 total_count: 10,
//                 paid_count: 0,
//                 customer_notify: true,
//                 created_at: 1780047653,
//                 expire_by: null,
//                 short_url: null,
//                 has_scheduled_changes: false,
//                 change_scheduled_at: null,
//                 source: 'api',
//                 payment_method: null,
//                 offer_id: null,
//                 halted_at: null,
//                 remaining_count: 9,
//             },
//         },
//     },
//     created_at: 1780061899,
// };

b = {
    id: 'evt_1NsA2xLkdE7Bv6vN6J9k8L0m',
    object: 'event',
    api_version: '2023-10-16',
    created: 1695213600,
    data: {
        object: {
            id: 'cs_test_a1b2c3d4e5f6g7h8i9j0',
            object: 'checkout.session',
            amount_subtotal: 3000,
            amount_total: 3000,
            automatic_tax: {
                enabled: false,
                status: null,
            },
            billing_address_collection: null,
            cancel_url: 'https://example.com',
            client_reference_id: 'user_12345',
            currency: 'usd',
            customer: 'cus_9s8f7D6s5A',
            customer_details: {
                email: 'customer@example.com',
                name: 'Jane Doe',
                phone: '+15555555555',
                tax_exempt: 'none',
            },
            invoice: 'in_1NsA2wLkdE7Bv6vN7M8k9P0q',
            line_items: null,
            livemode: false,
            metadata: {
                order_id: 'XYZ-98765',
            },
            mode: 'payment',
            payment_intent: 'pi_3NsA2vLkdE7Bv6vN0A1b2C3d',
            payment_status: 'paid',
            status: 'complete',
            success_url: 'https://example.com',
        },
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
        id: 'req_XyZ123abc789',
        idempotency_key: '4a7b5c8d-9e0f-1a2b-3c4d-5e6f7a8b9c0d',
    },
    type: 'checkout.session.completed',
};

c = {
    id: 'evt_1N2x3y4z5A6B7C8D',
    object: 'event',
    api_version: '2023-10-16',
    created: 1683012345,
    data: {
        object: {
            id: 'cs_test_a1B2c3D4e5F6g7H8i9J0k1L2m3',
            object: 'checkout.session',
            amount_subtotal: 2999,
            amount_total: 2999,
            automatic_tax: {
                enabled: false,
                status: null,
            },
            billing_address_collection: null,
            cancel_url: 'https://example.com',
            client_reference_id: 'user_123456789',
            consent: null,
            consent_collection: null,
            created: 1683012300,
            currency: 'usd',
            currency_conversion: null,
            custom_fields: [],
            custom_text: {
                after_submit: null,
                shipping_address: null,
                submit: null,
                terms_of_service: null,
            },
            customer: 'cus_O1p2q3r4s5t6u7',
            customer_creation: 'if_required',
            customer_details: {
                address: {
                    city: 'San Francisco',
                    country: 'US',
                    line1: '123 Market St',
                    line2: null,
                    postal_code: '94105',
                    state: 'CA',
                },
                email: 'customer@example.com',
                name: 'Jane Doe',
                phone: null,
                tax_exempt: 'none',
                tax_ids: [],
            },
            customer_email: null,
            expires_at: 1683098700,
            invoice: 'in_1N2x3y4z5A6B7C8E',
            invoice_creation: null,
            livemode: false,
            locale: null,
            metadata: {
                internal_order_id: 'xyz_98765',
            },
            mode: 'subscription',
            payment_intent: null,
            payment_link: null,
            payment_method_collection: 'always',
            payment_method_configuration_details: null,
            payment_method_options: {},
            payment_method_types: ['card'],
            payment_status: 'paid',
            phone_number_collection: {
                enabled: false,
            },
            recovered_from: null,
            setup_intent: null,
            shipping_address_collection: null,
            shipping_cost: null,
            shipping_details: null,
            shipping_options: [],
            status: 'complete',
            submit_type: null,
            subscription: 'sub_1N2x3y4z5A6B7C8F',
            success_url: 'https://example.com{CHECKOUT_SESSION_ID}',
            total_details: {
                amount_discount: 0,
                amount_shipping: 0,
                amount_tax: 0,
            },
            url: null,
        },
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
        id: 'req_X1y2Z3w4V5u6',
        idempotency_key: '7b9b12c4-8392-494b-9721-3965b380ad91',
    },
    type: 'checkout.session.completed',
};
