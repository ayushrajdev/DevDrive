export type UserRole = 'user' | 'admin' | 'manager' | 'owner';
export type AuthProvider = 'google' | 'email' | 'github' | 'facebook';

export interface IUser {
    _id: string;
    name?: string;
    email: string;
    rootDirId?: string;
    picture: string;
    authProvider?: AuthProvider;
    role: UserRole;
    deleted: boolean;
    maxStorageInBytes: number;
    providerSubscriptionId?: string;
    createdAt?: string;
}

export interface IDirectory {
    _id: string;
    name: string;
    userId: string;
    parentDirId: string | null;
    size?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface IFile {
    _id: string;
    name: string;
    extension?: string;
    parentDirId: string;
    userId: string;
    size: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface DirectoryContents {
    directory: IDirectory;
    directories: IDirectory[];
    files: IFile[];
}

export interface IStorageUsage {
    usedBytes: number;
    maxBytes: number;
}

export type PaymentProvider = 'stripe' | 'razorpay';
export type PaymentProviderType = PaymentProvider;
export type PaymentType = 'subscription' | 'one_time';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly' | 'lifetime';

export interface IPricingOption {
    paymentType: PaymentType;
    billingCycle: BillingCycle;
    amount: number;
    currency: string;
    providers: Array<{
        provider: PaymentProvider;
        providerPlanId: string;
    }>;
}

export interface IPlanPricingTier {
    amount: number;
    razorpayPlanId?: string;
    stripePriceId?: string;
}

export interface IPlan {
    _id: string;
    name: 'basic' | 'intermediate' | 'pro';
    storageLimitInGB?: number;
    storageQuotaBytes?: number;
    features: string[];
    pricingOptions?: IPricingOption[];
    pricing?: {
        subscription?: {
            monthly?: IPlanPricingTier;
            quarterly?: IPlanPricingTier;
            yearly?: IPlanPricingTier;
        };
        one_time?: {
            monthly?: IPlanPricingTier;
            quarterly?: IPlanPricingTier;
            yearly?: IPlanPricingTier;
            lifetime?: IPlanPricingTier;
        };
    };
}

export interface ISubscription {
    _id: string;
    userId: string;
    planId: IPlan | string;
    provider: PaymentProvider;
    providerSubscriptionId?: string;
    paymentType: PaymentType;
    billingCycle?: BillingCycle;
    storageQuotaBytes?: number;
    shortUrl?: string;
    checkoutUrl?: string;
    status: 'pending' | 'active' | 'cancelled' | 'expired' | 'paused' | 'failed' | 'past_due' | 'created';
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
}
