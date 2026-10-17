import { Schema, model } from 'mongoose';
import type { ISubscription } from '../shared/types/index.js';

const subscriptionSchema = new Schema<ISubscription>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        planId: {
            type: Schema.Types.ObjectId,
            ref: 'Plan',
            required: true,
        },
        provider: {
            type: String,
            enum: ['stripe', 'razorpay', 'paypal'],
            required: true,
        },
        providerSubscriptionId: { type: String },
        providerCustomerId: { type: String },
        providerPlanId: { type: String },
        paymentType: {
            type: String,
            enum: ['subscription', 'one_time'],
            required: true,
        },
        billingCycle: {
            type: String,
            enum: ['monthly', 'quarterly', 'yearly', 'lifetime'],
        },
        status: {
            type: String,
            enum: ['pending', 'active', 'cancelled', 'expired', 'paused', 'failed', 'past_due'],
            default: 'pending',
        },
        currentPeriodStart: { type: Date },
        currentPeriodEnd: { type: Date },
        cancelAtPeriodEnd: {
            type: Boolean,
            default: false,
        },
        cancelledAt: { type: Date },
        trialEndsAt: { type: Date },
        metadata: { type: Schema.Types.Mixed },
    },
    {
        timestamps: true,
    },
);

const Subscription = model<ISubscription>('Subscription', subscriptionSchema);
export default Subscription;
