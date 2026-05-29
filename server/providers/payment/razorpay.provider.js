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
    async createSubscription({ planId, userInfo }) {
        const subscription = await this.razorpay.subscriptions.create({
            plan_id: planId,
            notes: userInfo,
            quantity: 1,
            total_count: 120,
        });
        return subscription;
    }

    createOneTimePayment = async ({ userInfo, selectedPlanPricing }) => {
        console.log(
            'in create payment ',
            typeof selectedPlanPricing.amount,
            selectedPlanPricing,
        );
        const oneTimePayment = await this.razorpay.orders.create({
            amount: 10000,
            currency: 'INR',
            notes: userInfo,
        });
        console.log(oneTimePayment);
        return oneTimePayment;
    };

    verifyWebhook({ data, signature }) {
        const isValidRequest = Razorpay.validateWebhookSignature(
            data,
            signature,
            'mysecret',
        );
        return isValidRequest;
    }
}
