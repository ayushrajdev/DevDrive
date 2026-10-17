import { Request } from 'express';
import type { Types } from 'mongoose';

// ── User Types ────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin' | 'manager' | 'owner';
export type AuthProvider = 'google' | 'email' | 'github' | 'facebook';

export interface IUser {
    _id: Types.ObjectId;
    name?: string;
    email: string;
    password?: string;
    rootDirId?: Types.ObjectId;
    picture: string;
    authProvider?: AuthProvider;
    role: UserRole;
    deleted: boolean;
    maxStorageInBytes: number;
    providerSubscriptionId?: string;
}

// ── Session / Auth Types ──────────────────────────────────────────────────────

export interface ISession {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    createdAt: Date;
}

// ── OTP Types ─────────────────────────────────────────────────────────────────

export interface IOtp {
    email: string;
    otp: string;
    createdAt: Date;
}

// ── Plan / Payment Types ──────────────────────────────────────────────────────

export type PaymentProvider = 'stripe' | 'razorpay' | 'paypal';
export type PaymentType = 'subscription' | 'one_time';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
export type SubscriptionStatus =
    | 'pending'
    | 'active'
    | 'cancelled'
    | 'expired'
    | 'paused'
    | 'failed'
    | 'past_due';

export interface IProviderPricing {
    provider: PaymentProvider;
    providerPlanId: string;
}

export interface IPricingOption {
    paymentType: PaymentType;
    billingCycle: BillingCycle;
    amount: number;
    currency: string;
    providers: IProviderPricing[];
}

export interface IPlan {
    _id: Types.ObjectId;
    name: 'basic' | 'intermediate' | 'pro';
    storageLimitInGB?: number;
    features: string[];
    pricingOptions: IPricingOption[];
}

export interface ISubscription {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    planId: Types.ObjectId;
    provider: PaymentProvider;
    providerSubscriptionId?: string;
    providerCustomerId?: string;
    providerPlanId?: string;
    paymentType: PaymentType;
    billingCycle?: BillingCycle;
    status: SubscriptionStatus;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd: boolean;
    cancelledAt?: Date;
    trialEndsAt?: Date;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

// ── File / Directory Types ────────────────────────────────────────────────────

export interface IDirectory {
    _id: Types.ObjectId;
    name?: string;
    userId: Types.ObjectId;
    parentDirId?: Types.ObjectId | null;
    size?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IFile {
    _id: Types.ObjectId;
    name?: string;
    extension?: string;
    parentDirId?: Types.ObjectId;
    userId?: Types.ObjectId;
    size: number;
    createdAt: Date;
    updatedAt: Date;
}

// ── Express Request Extension ─────────────────────────────────────────────────

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
            userId?: string;
        }
    }
}

// ── API Response Types ────────────────────────────────────────────────────────

export interface ApiResponse<T = undefined> {
    success: boolean;
    message?: string;
    data?: T;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationQuery {
    page?: number;
    limit?: number;
}
