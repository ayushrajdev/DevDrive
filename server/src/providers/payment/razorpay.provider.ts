import Razorpay from 'razorpay';
import { ENV } from '../../shared/utils/env.js';
import {
    PaymentProvider,
    type CreateSubscriptionParams,
    type CreateOneTimePaymentParams,
    type VerifyWebhookParams,
} from './payment.provider.js';

export class RazorpayProvider extends PaymentProvider {
    private client: Razorpay | null = null;

    private getRazorpay(): Razorpay {
        if (!this.client) {
            if (!ENV.RAZORPAY_KEY_ID || !ENV.RAZORPAY_KEY_SECRET) {
                throw new Error(
                    'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required for Razorpay payments',
                );
            }
            this.client = new Razorpay({
                key_id: ENV.RAZORPAY_KEY_ID,
                key_secret: ENV.RAZORPAY_KEY_SECRET,
            });
        }
        return this.client;
    }

    async createSubscription({ planId, metadata }: CreateSubscriptionParams): Promise<unknown> {
        const client = this.getRazorpay();
        const subscription = await client.subscriptions.create({
            plan_id: planId,
            quantity: 1,
            total_count: 36,
            notes: metadata as Record<string, string>,
        });
        return subscription;
    }

    async createOneTimePayment({
        selectedPlanPricing,
        metadata,
    }: CreateOneTimePaymentParams): Promise<unknown> {
        const client = this.getRazorpay();
        const order = await client.orders.create({
            amount: selectedPlanPricing.amount,
            currency: selectedPlanPricing.currency,
            notes: metadata as Record<string, string>,
        });
        return order;
    }

    verifyWebhook({ data, signature }: VerifyWebhookParams): boolean {
        if (!ENV.RAZORPAY_WEBHOOK_SECRET) {
            throw new Error('RAZORPAY_WEBHOOK_SECRET is required to verify Razorpay webhooks');
        }
        return Razorpay.validateWebhookSignature(
            data.toString(),
            signature,
            ENV.RAZORPAY_WEBHOOK_SECRET,
        );
    }
}
