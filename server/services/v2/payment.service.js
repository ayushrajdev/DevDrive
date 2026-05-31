import PaymentProviderFactory from '../../factories/payment-provider.factory.js';
import MongoPlanRepository from '../../repositories/mongodb/plan.repository.js';

export default class V2PaymentService {
    constructor() {
        this.planRepository = new MongoPlanRepository();
    }

    createSubscription = async ({
        planId,
        paymentType,
        billingCycle,
        provider,
        userInfo,
    }) => {
        const selectedPlan = await this.planRepository.getPlanById({ planId });
        if (!selectedPlan) {
            throw new Error('Plan not found');
        }

        var selectedPlanPricing = selectedPlan.pricingOptions.find(
            (pricingOption) => {
                return (
                    pricingOption.billingCycle == billingCycle &&
                    pricingOption.paymentType == paymentType
                );
            },
        );
        if (!selectedPlanPricing) {
            throw new Error(
                'billing cycle and payment type confi do not match',
            );
        }

        const providerConfig = selectedPlanPricing.providers.find(
            (p) => p.provider === provider,
        );

        var providerPlanId = providerConfig.providerPlanId;

        var providerPlanId = 'plan_Suii8V3yAIThMT';
        var providerPlanId = 'price_1TbzSQ314gNOOU07neClnDTf';

        const payementProvider = PaymentProviderFactory.create(provider);

        // paymentType = 'one_time';
        // billingCycle = 'lifetime';
        // console.log({ paymentType, billingCycle });

        if (paymentType == 'one_time' && billingCycle == 'lifetime') {
            console.warn('inside the oneTimePAyemnt');
            const oneTimePayment = payementProvider.createOneTimePayment({
                // selectedPlanPricing,
                selectedPlanPricing: {
                    amount: selectedPlanPricing.amount,
                    currency: selectedPlanPricing.currency,
                },
                userInfo,
                planId: providerPlanId,
                metadata: {
                    planId,
                    paymentType,
                    billingCycle,
                    userId: userInfo._id,
                },
            });
            return oneTimePayment;
        } else {
            console.warn('inside the subscripttion');
            const subscription = await payementProvider.createSubscription({
                planId: providerPlanId,
                userInfo,
                metadata: {
                    planId,
                    paymentType,
                    billingCycle,
                    userId: userInfo._id,
                },
            });

            return subscription;
        }
    };

    createOneTimePayment = async ({}) => {};

    createPayment() {}
}
