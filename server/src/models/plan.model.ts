import { Schema, model } from 'mongoose';
import type { IPlan, IPricingOption, IProviderPricing } from '../shared/types/index.js';

const providerPricingSchema = new Schema<IProviderPricing>(
    {
        provider: {
            type: String,
            enum: ['stripe', 'razorpay', 'paypal'],
            required: true,
        },
        providerPlanId: {
            type: String,
            required: true,
        },
    },
    { _id: false },
);

const pricingOptionSchema = new Schema<IPricingOption>(
    {
        paymentType: {
            type: String,
            enum: ['subscription', 'one_time'],
            required: true,
        },
        billingCycle: {
            type: String,
            enum: ['monthly', 'quarterly', 'yearly', 'lifetime'],
            default: null,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: 'INR',
        },
        providers: [providerPricingSchema],
    },
    { _id: false },
);

const planSchema = new Schema<IPlan>(
    {
        name: {
            type: String,
            enum: ['basic', 'intermediate', 'pro'],
            required: true,
        },
        storageLimitInGB: { type: Number },
        features: [String],
        pricingOptions: [pricingOptionSchema],
    },
    {
        timestamps: true,
    },
);

const Plan = model<IPlan>('Plan', planSchema);
export default Plan;
