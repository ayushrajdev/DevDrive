// subscription.authenticated  → customer auth'd their card (mandate created, no charge yet)
// subscription.activated      → first charge succeeded, subscription is live
// subscription.charged        → recurring charge succeeded
// subscription.pending        → charge failed, Razorpay will retry
// subscription.halted         → all retries exhausted, subscription stopped
// subscription.paused         → manually paused
// subscription.resumed        → resumed after pause
// subscription.cancelled      → cancelled (won't renew)
// subscription.completed      → all billing cycles done naturally
// subscription.updated        → plan/quantity/schedule changed
import RazorpayProvider from '../providers/payment/razorpay.provider.js';
import fs from 'node:fs';
export default class RazorpayWebhooks {
    constructor() {
        this.razorpayProvider = new RazorpayProvider();
    }

    handleSubscriptions = async (req, res) => {
        let data = req.body;
        const signature = req.headers['x-razorpay-signature'];
        const isValidRequest = this.verifyWebhook({
            data,
            signature,
        });
        if (!isValidRequest) {
            res.end('not a valid request');
        }

        data = JSON.parse(data.toString());

        switch (data.event) {
            case 'subscription.activated': //first time subscription payement
                break;

            case 'subscription.charged': // reccuring payment charges
                break;

            case 'subscription.resumed':
                break;

            case 'subscription.paused':
                break;

            case 'subscription.pending':
                break;

            case 'subscription.cancelled':
                break;

            case 'subscription.completed':
                break;

            case 'subscription.updated':
                break;

            default:
                break;
        }
        return res.json({});
    };

    verifyWebhook({ data, signature }) {
        const isValidRequest = this.razorpayProvider.verifyWebhook({
            data,
            signature,
        });
        return isValidRequest;
    }
}
