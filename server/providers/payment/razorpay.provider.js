import Razorpay from 'razorpay';
import PaymentProvider from './payment.provider.js';

export default class RazorpayProvider extends PaymentProvider {
    constructor() {
        super();
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required for Razorpay payments');
        }
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
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
            process.env.RAZORPAY_WEBHOOK_SECRET,
        );
        return isValidRequest;
    }
}
