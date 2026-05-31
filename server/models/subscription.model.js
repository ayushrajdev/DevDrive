import mongoose, { Schema, model } from 'mongoose';

const subscriptionSchema = new Schema(
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

        providerSubscriptionId: {
            type: String,
        },

        providerCustomerId: {
            type: String,
        },
        providerCustomerId: {
            type: String,
        },
        providerPlanId: {
            type: String,
        },

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
            enum: [
                'pending',
                'active',
                'cancelled',
                'expired',
                'paused',
                'failed',
            ],
            default: 'pending',
        },

        currentPeriodStart: Date,

        currentPeriodEnd: Date,

        cancelAtPeriodEnd: {
            type: Boolean,
            default: false,
        },

        cancelledAt: Date,

        trialEndsAt: Date,

        metadata: {},
    },
    {
        timestamps: true,
    },
);

const Subscription = model('Subscription', subscriptionSchema);
export default Subscription;
