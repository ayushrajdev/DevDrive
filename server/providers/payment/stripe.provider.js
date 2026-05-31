import { Stripe } from 'stripe';
import PaymentProvider from './payment.provider.js';

export default class StripePaymentProvider extends PaymentProvider {
    constructor() {
        super();
        this.stripe = new Stripe(
            'sk_test_51TZ4zU314gNOOU07CVlj3yScdeLYBUPimoeNw9eBBUFYuU2uwnMhML7pqJlEBPHtfrQCqvFo4QQOTy7bFPAjWP2t00izTrCYOW',
        );
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
