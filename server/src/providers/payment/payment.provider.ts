export interface CreateSubscriptionParams {
    planId: string;
    userInfo: Record<string, unknown>;
    selectedPlanPricing?: { amount: number; currency: string };
    metadata: Record<string, unknown>;
}

export interface CreateOneTimePaymentParams {
    planId: string;
    userInfo: Record<string, unknown>;
    selectedPlanPricing: { amount: number; currency: string };
    metadata: Record<string, unknown>;
}

export interface VerifyWebhookParams {
    data: Buffer | string;
    signature: string;
}

/**
 * Abstract base for all payment providers.
 * Each provider must implement all payment operations.
 * Closed for modification — extend to add new providers.
 */
export abstract class PaymentProvider {
    abstract createSubscription(params: CreateSubscriptionParams): Promise<unknown>;
    abstract createOneTimePayment(params: CreateOneTimePaymentParams): Promise<unknown>;
    abstract verifyWebhook(params: VerifyWebhookParams): boolean;
}
