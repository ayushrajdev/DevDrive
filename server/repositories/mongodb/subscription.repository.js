import Subscription from '../../models/subscription.model.js';

export default class MongoSubscriptionRepository {
    constructor() {
        this.Subscription = Subscription;
    }
    async createSubcription({
        status,
        billingCycle,
        paymentType,
        planId,
        provider,
        userId,
        cancelAtPeriodEnd,
        cancelledAt,
        trialEndsAt,
        providerSubscriptionId,
        currentPeriodEnd,
        metadata,
        currentPeriodStart,
        providerCustomerId,
        providerPlanId,
    }) {
        const subscription = await this.Subscription.findOneAndUpdate(
            { userId },
            {
                $set: {
                    status,
                    billingCycle,
                    paymentType,
                    planId,
                    provider,
                    userId,
                    cancelAtPeriodEnd,
                    cancelledAt,
                    trialEndsAt,
                    providerSubscriptionId,
                    currentPeriodEnd,
                    metadata,
                    currentPeriodStart,
                    providerCustomerId,
                    providerPlanId,
                },
            },
            { upsert: true },
        );
        return subscription;
    }

 
    updateByProviderSubscriptionId = async (providerSubscriptionId, update) => {
        return Subscription.findOneAndUpdate(
            { providerSubscriptionId },
            { $set: update },
            { new: true },
        );
    };
}
