import Subscription from '../../models/subscription.model.js';
import type { ISubscription } from '../../shared/types/index.js';

export interface ISubscriptionRepository {
    createOrUpdateSubscription(data: Partial<ISubscription>): Promise<ISubscription>;
    updateByProviderSubscriptionId(providerSubscriptionId: string, update: Partial<ISubscription>): Promise<ISubscription | null>;
    findByUserId(userId: string): Promise<ISubscription | null>;
    findByProviderSubscriptionId(providerSubscriptionId: string): Promise<ISubscription | null>;
}

export class MongoSubscriptionRepository implements ISubscriptionRepository {
    async createOrUpdateSubscription(data: Partial<ISubscription>): Promise<ISubscription> {
        const subscription = await Subscription.findOneAndUpdate(
            { userId: data.userId },
            { $set: data },
            { upsert: true, new: true },
        ).lean();
        return subscription as unknown as ISubscription;
    }

    async updateByProviderSubscriptionId(
        providerSubscriptionId: string,
        update: Partial<ISubscription>,
    ): Promise<ISubscription | null> {
        const subscription = await Subscription.findOneAndUpdate(
            { providerSubscriptionId },
            { $set: update },
            { new: true },
        ).lean();
        return subscription as unknown as ISubscription | null;
    }

    async findByUserId(userId: string): Promise<ISubscription | null> {
        return Subscription.findOne({ userId }).populate('planId').lean() as unknown as Promise<ISubscription | null>;
    }

    async findByProviderSubscriptionId(providerSubscriptionId: string): Promise<ISubscription | null> {
        return Subscription.findOne({ providerSubscriptionId }).lean() as unknown as Promise<ISubscription | null>;
    }
}
