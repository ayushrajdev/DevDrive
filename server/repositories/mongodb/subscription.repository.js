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
                },
            },
            { upsert: true },
        );
        return subscription;
    }
}
