import express, { Router } from 'express';
import type { RazorpayWebhookHandler } from './razorpay.webhook.js';
import type { StripeWebhookHandler } from './stripe.webhook.js';

export function createWebhookRouter(
    razorpayWebhook: RazorpayWebhookHandler,
    stripeWebhook: StripeWebhookHandler,
): Router {
    const router = Router();
    const rawJsonMiddleware = express.raw({ type: 'application/json' });

    router.post('/subscriptions/razorpay', rawJsonMiddleware, razorpayWebhook.handleWebhook);
    router.post('/subscriptions/stripe', rawJsonMiddleware, stripeWebhook.handleWebhook);

    return router;
}
