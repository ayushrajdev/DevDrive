import Razorpay from 'razorpay';
import PaymentProvider from './payment.provider.js';

export default class RazorpayProvider extends PaymentProvider {
    constructor() {
        super();
        this.razorpay = new Razorpay({
            key_id: 'rzp_test_SreKkWHYNxa7dk',
            key_secret: '3LOIWxR88LhXqTDH9LO9I456',
        });
    }
    async createSubscription({ planId, userInfo, metadata }) {
        const subscription = await this.razorpay.subscriptions.create({
            plan_id: planId,
            quantity: 1,
            total_count: 36,
            notes: metadata,
        });
        return subscription;
    }

    createOneTimePayment = async ({
        selectedPlanPricing,
        userInfo,
        planId,
        metadata,
    }) => {
        const orderSession = await this.razorpay.orders.create({
            amount: selectedPlanPricing.amount,
            currency: selectedPlanPricing.currency,
            notes: metadata,
        });
        return orderSession;
    };

    verifyWebhook({ data, signature }) {
        const isValidRequest = Razorpay.validateWebhookSignature(
            data,
            signature,
            '1234',
        );
        return isValidRequest;
    }
}
