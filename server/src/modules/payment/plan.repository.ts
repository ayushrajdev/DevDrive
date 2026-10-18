import { Types } from 'mongoose';
import Plan from '../../models/plan.model.js';
import type { IPlan } from '../../shared/types/index.js';

export interface IPlanRepository {
    getPlanById(planId: string): Promise<IPlan | null>;
    getAllPlans(): Promise<IPlan[]>;
    createPlan(planData: Partial<IPlan>): Promise<IPlan>;
}

const DEFAULT_PLANS: Array<Partial<IPlan>> = [
    {
        name: 'basic',
        storageLimitInGB: 5,
        features: [
            '5 GB Cloud Storage',
            'Up to 10 Projects',
            'Standard Upload Speed',
            'Community Support',
        ],
        pricingOptions: [
            {
                paymentType: 'subscription',
                billingCycle: 'monthly',
                amount: 900,
                currency: 'INR',
                providers: [
                    { provider: 'razorpay', providerPlanId: 'plan_basic_monthly' },
                    { provider: 'stripe', providerPlanId: 'price_basic_monthly' },
                ],
            },
            {
                paymentType: 'subscription',
                billingCycle: 'quarterly',
                amount: 2400,
                currency: 'INR',
                providers: [
                    { provider: 'razorpay', providerPlanId: 'plan_basic_quarterly' },
                    { provider: 'stripe', providerPlanId: 'price_basic_quarterly' },
                ],
            },
            {
                paymentType: 'subscription',
                billingCycle: 'yearly',
                amount: 8900,
                currency: 'INR',
                providers: [
                    { provider: 'razorpay', providerPlanId: 'plan_basic_yearly' },
                    { provider: 'stripe', providerPlanId: 'price_basic_yearly' },
                ],
            },
            {
                paymentType: 'one_time',
                billingCycle: 'lifetime',
                amount: 19900,
                currency: 'INR',
                providers: [
                    { provider: 'razorpay', providerPlanId: 'plan_basic_lifetime' },
                    { provider: 'stripe', providerPlanId: 'price_basic_lifetime' },
                ],
            },
        ],
    },
    {
        name: 'intermediate',
        storageLimitInGB: 100,
        features: [
            '100 GB Cloud Storage',
            'Unlimited Projects',
            'Priority Upload Bandwidth',
            'Team Folder Sharing',
            'Priority Email Support',
        ],
        pricingOptions: [
            {
                paymentType: 'subscription',
                billingCycle: 'monthly',
                amount: 2900,
                currency: 'INR',
                providers: [
                    { provider: 'razorpay', providerPlanId: 'plan_inter_monthly' },
                    { provider: 'stripe', providerPlanId: 'price_inter_monthly' },
                ],
            },
            {
                paymentType: 'subscription',
                billingCycle: 'quarterly',
                amount: 7900,
                currency: 'INR',
                providers: [
                    { provider: 'razorpay', providerPlanId: 'plan_inter_quarterly' },
                    { provider: 'stripe', providerPlanId: 'price_inter_quarterly' },
                ],
            },
            {
                paymentType: 'subscription',
                billingCycle: 'yearly',
                amount: 27900,
                currency: 'INR',
                providers: [
                    { provider: 'razorpay', providerPlanId: 'plan_inter_yearly' },
                    { provider: 'stripe', providerPlanId: 'price_inter_yearly' },
                ],
            },
            {
                paymentType: 'one_time',
                billingCycle: 'lifetime',
                amount: 59900,
                currency: 'INR',
                providers: [
                    { provider: 'razorpay', providerPlanId: 'plan_inter_lifetime' },
                    { provider: 'stripe', providerPlanId: 'price_inter_lifetime' },
                ],
            },
        ],
    },
    {
        name: 'pro',
        storageLimitInGB: 1024,
        features: [
            '1 TB Cloud Storage',
            'Unlimited Everything',
            '24/7 Dedicated Support',
            'Advanced Security & Audit Logs',
            'S3 Direct Presigned Uploads',
            'Custom Integrations',
        ],
        pricingOptions: [
            {
                paymentType: 'subscription',
                billingCycle: 'monthly',
                amount: 9900,
                currency: 'INR',
                providers: [
                    { provider: 'razorpay', providerPlanId: 'plan_pro_monthly' },
                    { provider: 'stripe', providerPlanId: 'price_pro_monthly' },
                ],
            },
            {
                paymentType: 'subscription',
                billingCycle: 'quarterly',
                amount: 26900,
                currency: 'INR',
                providers: [
                    { provider: 'razorpay', providerPlanId: 'plan_pro_quarterly' },
                    { provider: 'stripe', providerPlanId: 'price_pro_quarterly' },
                ],
            },
            {
                paymentType: 'subscription',
                billingCycle: 'yearly',
                amount: 94900,
                currency: 'INR',
                providers: [
                    { provider: 'razorpay', providerPlanId: 'plan_pro_yearly' },
                    { provider: 'stripe', providerPlanId: 'price_pro_yearly' },
                ],
            },
            {
                paymentType: 'one_time',
                billingCycle: 'lifetime',
                amount: 199900,
                currency: 'INR',
                providers: [
                    { provider: 'razorpay', providerPlanId: 'plan_pro_lifetime' },
                    { provider: 'stripe', providerPlanId: 'price_pro_lifetime' },
                ],
            },
        ],
    },
];

export class MongoPlanRepository implements IPlanRepository {
    private async ensureDefaultPlans(): Promise<void> {
        const count = await Plan.countDocuments();
        if (count === 0) {
            await Plan.insertMany(DEFAULT_PLANS);
        }
    }

    async getPlanById(planId: string): Promise<IPlan | null> {
        await this.ensureDefaultPlans();
        if (Types.ObjectId.isValid(planId)) {
            const byId = await Plan.findById(planId).lean();
            if (byId) return byId as unknown as IPlan;
        }
        return Plan.findOne({ name: planId.toLowerCase() }).lean() as Promise<IPlan | null>;
    }

    async getAllPlans(): Promise<IPlan[]> {
        await this.ensureDefaultPlans();
        return Plan.find().lean() as Promise<IPlan[]>;
    }

    async createPlan(planData: Partial<IPlan>): Promise<IPlan> {
        const plan = await Plan.create(planData);
        return plan.toObject() as unknown as IPlan;
    }
}
