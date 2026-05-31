import express, { Router } from 'express';
import RazorpayWebhooks from '../../webhooks/razorpay.webhook.js';
import StripeWebhooks from '../../webhooks/stripe.webhook.js';
const router = Router();

const razorpayWebhooks = new RazorpayWebhooks();
const stripeWebhooks = new StripeWebhooks();


router.post(
    '/subscriptions/razorpay',
    express.raw({ type: 'application/json' }),
    razorpayWebhooks.handleSubscriptions,
);

router.use(express.json())

router.post('/subscriptions/stripe', stripeWebhooks.handleSubscriptions);

export default router;
