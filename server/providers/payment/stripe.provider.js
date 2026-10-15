import { Stripe } from 'stripe';
import PaymentProvider from './payment.provider.js';

export default class StripePaymentProvider extends PaymentProvider {
    constructor() {
        super();
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY is required for Stripe payments');
        }
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    async createSubscription({
        planId,
        userInfo,
        selectedPlanPricing,
        mode = 'subscription',
        metadata,
    }) {

        const subscription = await this.stripe.checkout.sessions.create({
            mode,
            line_items: [
                {
                    price: planId,
                    quantity: 1,
                    metadata: {},
                },
            ],
            metadata,
            success_url: 'http://localhost:4000/success',
            cancel_url: 'http://localhost:4000/cancel',
            currency: selectedPlanPricing?.currency || 'INR',
            client_reference_id: userInfo._id,
        });
        return subscription;
    }

    createOneTimePayment = async ({
        planId,
        userInfo,
        selectedPlanPricing,
        metadata,
    }) => {
        const session = await this.createSubscription({
            planId,
            userInfo,
            selectedPlanPricing,
            mode: 'payment',
            metadata,
        });
        return session;
    };

    verifyWebhook() {
        throw 'Not Implemented';
    }
}
