import RazorpayProvider from '../providers/payment/razorpay.provider.js';
import StripePaymentProvider from '../providers/payment/stripe.provider.js';

export default class PaymentProviderFactory {
    static create = (provider) => {
        switch (provider) {
            case 'razorpay':
                return new RazorpayProvider();
            case 'stripe':
                return new StripePaymentProvider();

            default:
                throw 'no payment provider is provided';
        }
    };
}
