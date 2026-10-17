import { PaymentProvider } from '../providers/payment/payment.provider.js';
import { RazorpayProvider } from '../providers/payment/razorpay.provider.js';
import { StripeProvider } from '../providers/payment/stripe.provider.js';

type SupportedProvider = 'razorpay' | 'stripe';

/**
 * Factory for creating payment provider instances.
 * Open/Closed principle: add new providers without modifying existing ones.
 */
export class PaymentProviderFactory {
    private static readonly registry: Record<SupportedProvider, new () => PaymentProvider> = {
        razorpay: RazorpayProvider,
        stripe: StripeProvider,
    };

    static create(provider: string): PaymentProvider {
        const Provider = this.registry[provider as SupportedProvider];
        if (!Provider) {
            throw new Error(`Unsupported payment provider: ${provider}`);
        }
        return new Provider();
    }
}
