import type { IPlan, ISubscription, PaymentProvider, PaymentType, BillingCycle } from '../../shared/types/index.js';
import type { IPlanRepository } from './plan.repository.js';
import type { ISubscriptionRepository } from './subscription.repository.js';
import { PaymentProviderFactory } from '../../factories/payment-provider.factory.js';
import { BadRequestError, NotFoundError } from '../../shared/errors/AppError.js';

export interface CreateSubscriptionParams {
    planId: string;
    paymentType: PaymentType;
    billingCycle: BillingCycle;
    provider: PaymentProvider;
    userInfo: { _id: string; email: string; name?: string };
}

export interface IPaymentService {
    createSubscription(params: CreateSubscriptionParams): Promise<any>;
    getAllPlans(): Promise<IPlan[]>;
    getUserSubscription(userId: string): Promise<ISubscription | null>;
}

export class PaymentService implements IPaymentService {
    constructor(
        private readonly planRepository: IPlanRepository,
        private readonly subscriptionRepository: ISubscriptionRepository,
    ) {}

    async getAllPlans(): Promise<IPlan[]> {
        return this.planRepository.getAllPlans();
    }

    async getUserSubscription(userId: string): Promise<ISubscription | null> {
        return this.subscriptionRepository.findByUserId(userId);
    }

    async createSubscription({
        planId,
        paymentType,
        billingCycle,
        provider,
        userInfo,
    }: CreateSubscriptionParams): Promise<any> {
        const selectedPlan = await this.planRepository.getPlanById(planId);
        if (!selectedPlan) {
            throw new NotFoundError('Subscription plan not found');
        }

        const selectedPlanPricing = selectedPlan.pricingOptions.find(
            (opt) => opt.billingCycle === billingCycle && opt.paymentType === paymentType,
        );

        if (!selectedPlanPricing) {
            throw new BadRequestError('Selected billing cycle and payment type combination is not available for this plan');
        }

        const providerConfig = selectedPlanPricing.providers.find((p) => p.provider === provider);
        if (!providerConfig?.providerPlanId) {
            throw new BadRequestError(`No configuration found for payment provider: ${provider}`);
        }

        const providerPlanId = providerConfig.providerPlanId;
        const paymentProvider = PaymentProviderFactory.create(provider);

        const metadata = {
            planId,
            paymentType,
            billingCycle,
            userId: String(userInfo._id),
            userEmail: userInfo.email,
        };

        if (paymentType === 'one_time' && billingCycle === 'lifetime') {
            return paymentProvider.createOneTimePayment({
                selectedPlanPricing: {
                    amount: selectedPlanPricing.amount,
                    currency: selectedPlanPricing.currency,
                },
                userInfo,
                planId: providerPlanId,
                metadata,
            });
        } else {
            return paymentProvider.createSubscription({
                planId: providerPlanId,
                userInfo,
                selectedPlanPricing: {
                    amount: selectedPlanPricing.amount,
                    currency: selectedPlanPricing.currency,
                },
                metadata,
            });
        }
    }
}
