import express, { Router } from 'express';
import RazorpayWebhooks from '../../webhooks/razorpay.webhook.js';
import StripeWebhooks from '../../webhooks/stripe.webhook.js';
const router = Router();

const razorpayWebhooks = new RazorpayWebhooks();
const stripeWebhooks = new StripeWebhooks();


router.post(
    '/subscriptions/razorpay',
    express.raw({ type: 'application/json' }),
    razorpayWebhooks.handleWebhook,
);

router.post(
    '/subscriptions/stripe',
    express.raw({ type: 'application/json' }),
    stripeWebhooks.handleSubscriptions,
);

export default router;
