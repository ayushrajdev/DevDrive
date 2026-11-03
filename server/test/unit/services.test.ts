import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Request, Response } from 'express';
import { InMemorySessionRepository } from '../../src/modules/session/session.repository.js';
import { SessionService } from '../../src/modules/session/session.service.js';
import { SessionRepositoryFactory } from '../../src/factories/session-repository.factory.js';
import { OAuthProviderFactory } from '../../src/factories/oauth-provider.factory.js';
import { PaymentProviderFactory } from '../../src/factories/payment-provider.factory.js';
import { GoogleOAuthProvider } from '../../src/providers/oauth/google.provider.js';
import { GithubOAuthProvider } from '../../src/providers/oauth/github.provider.js';
import { RazorpayProvider } from '../../src/providers/payment/razorpay.provider.js';
import { StripeProvider } from '../../src/providers/payment/stripe.provider.js';
import { LocalDiskStorage } from '../../src/providers/storage/file-storage.js';
import { authorizeRoles } from '../../src/middlewares/authorize-roles.middleware.js';
import { UserService } from '../../src/modules/user/user.service.js';
import { PaymentService } from '../../src/modules/payment/payment.service.js';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { OtpService } from '../../src/modules/otp/otp.service.js';
import { FileService } from '../../src/modules/file/file.service.js';
import { AppError } from '../../src/shared/errors/AppError.js';

const rejectsWith = (promise: Promise<unknown>, status: number) =>
    assert.rejects(promise, (e: any) => e instanceof AppError && e.statusCode === status);

describe('InMemorySessionRepository / SessionService', () => {
    it('creates, verifies and deletes sessions', async () => {
        const svc = new SessionService(new InMemorySessionRepository());
        const id = await svc.createSession('u1');
        assert.equal(await svc.verifySession(id), 'u1');
        await svc.deleteSession(id);
        assert.equal(await svc.verifySession(id), null);
    });

    it('expires sessions and deletes all sessions of one user', async () => {
        const expiring = new InMemorySessionRepository(1);
        const id = await expiring.createSession('u1');
        await new Promise((r) => setTimeout(r, 10));
        assert.equal(await expiring.verifySession(id), null);

        const repo = new InMemorySessionRepository();
        const a = await repo.createSession('u1');
        const b = await repo.createSession('u1');
        const c = await repo.createSession('u2');
        await repo.deleteAllUserSessions('u1');
        assert.equal(await repo.verifySession(a), null);
        assert.equal(await repo.verifySession(b), null);
        assert.equal(await repo.verifySession(c), 'u2');
    });
});

describe('factories', () => {
    it('create the right strategy and reject unknown ones', () => {
        assert.ok(SessionRepositoryFactory.create('memory') instanceof InMemorySessionRepository);
        assert.ok(OAuthProviderFactory.create('google') instanceof GoogleOAuthProvider);
        assert.ok(OAuthProviderFactory.create('github') instanceof GithubOAuthProvider);
        assert.ok(PaymentProviderFactory.create('razorpay') instanceof RazorpayProvider);
        assert.ok(PaymentProviderFactory.create('stripe') instanceof StripeProvider);
        assert.throws(() => OAuthProviderFactory.create('myspace'), /Unsupported/);
        assert.throws(() => PaymentProviderFactory.create('paypal'), /Unsupported/);
        assert.throws(() => SessionRepositoryFactory.create('nope' as any), /Unsupported/);
    });
});

describe('LocalDiskStorage', () => {
    it('never resolves outside its base directory', () => {
        const base = mkdtempSync(path.join(tmpdir(), 'dd-storage-'));
        const storage = new LocalDiskStorage(base);
        assert.equal(path.dirname(storage.resolvePath('../../etc/passwd')), path.resolve(base));
        assert.equal(storage.exists('missing.txt'), false);
    });
});

describe('authorizeRoles', () => {
    const run = (role: string | undefined, ...allowed: any[]) => {
        let status = 0;
        let nexted = false;
        const res = { status: (s: number) => ((status = s), { json: () => undefined }) } as unknown as Response;
        authorizeRoles(...allowed)({ user: role ? { role } : undefined } as unknown as Request, res, () => {
            nexted = true;
        });
        return { status, nexted };
    };

    it('allows listed roles and lets owner inherit admin/manager access', () => {
        assert.equal(run('admin', 'admin').nexted, true);
        assert.equal(run('owner', 'admin').nexted, true);
        assert.equal(run('owner', 'manager').nexted, true);
    });

    it('denies others with 403 and anonymous with 401', () => {
        assert.equal(run('user', 'admin').status, 403);
        assert.equal(run('admin', 'owner').status, 403);
        assert.equal(run(undefined, 'admin').status, 401);
    });
});

describe('UserService business rules', () => {
    const user = (role: string, id = role) => ({ _id: id, role, email: `${id}@x.io`, deleted: false }) as any;
    const repoWith = (target: any) =>
        ({
            findUserById: async () => target,
            softDeleteUser: async () => target,
            hardDeleteUser: async () => target,
            updateRole: async () => target,
            findUserByEmail: async () => null,
            createUser: async (d: any) => ({ _id: 'new', ...d }),
        }) as any;
    const sessions = new SessionService(new InMemorySessionRepository());
    const svc = (target: any) => new UserService(repoWith(target), sessions);

    it('soft delete guards', async () => {
        await rejectsWith(svc(user('owner', 't')).softDeleteUser(user('admin', 'o'), 't'), 403);
        await rejectsWith(svc(user('admin', 't')).softDeleteUser(user('admin', 'o'), 't'), 403);
        assert.ok(await svc(user('user', 't')).softDeleteUser(user('admin', 'o'), 't'));
        assert.ok(await svc(user('admin', 't')).softDeleteUser(user('owner', 'o'), 't'));
    });

    it('hard delete is owner-only and never targets owners', async () => {
        await rejectsWith(svc(user('user', 't')).hardDeleteUser(user('admin', 'o'), 't'), 403);
        await rejectsWith(svc(user('owner', 't')).hardDeleteUser(user('owner', 'o'), 't'), 403);
        assert.ok(await svc(user('user', 't')).hardDeleteUser(user('owner', 'o'), 't'));
    });

    it('role changes', async () => {
        await rejectsWith(svc(user('user', 't')).updateRole(user('admin', 'o'), 't', 'x' as any), 400);
        await rejectsWith(svc(user('user', 'same')).updateRole(user('admin', 'same'), 'same', 'user'), 400);
        await rejectsWith(svc(user('user', 't')).updateRole(user('admin', 'o'), 't', 'owner'), 403);
        await rejectsWith(svc(user('admin', 't')).updateRole(user('admin', 'o'), 't', 'user'), 403);
        await rejectsWith(svc(user('admin', 't')).updateRole(user('manager', 'o'), 't', 'user'), 403);
        await rejectsWith(svc(user('user', 't')).updateRole(user('manager', 'o'), 't', 'admin'), 403);
        assert.ok(await svc(user('user', 't')).updateRole(user('manager', 'o'), 't', 'manager'));
        assert.ok(await svc(user('admin', 't')).updateRole(user('owner', 'o'), 't', 'user'));
    });

    it('registration validation', async () => {
        const s = svc(null);
        await rejectsWith(s.registerWithEmail({ email: 'bad', password: 'secret1' }), 400);
        await rejectsWith(s.registerWithEmail({ email: 'a@b.co', password: '123' }), 400);
        const ok = await s.registerWithEmail({ email: 'a@b.co', password: 'secret1' });
        assert.equal((ok.user as any).password, undefined);
        assert.ok(ok.sessionId);
    });
});

describe('PaymentService', () => {
    const plan = {
        _id: 'p1',
        pricingOptions: [
            { paymentType: 'subscription', billingCycle: 'monthly', amount: 100, currency: 'INR', providers: [{ provider: 'razorpay', providerPlanId: 'rp_1' }] },
            { paymentType: 'one_time', billingCycle: 'lifetime', amount: 900, currency: 'INR', providers: [{ provider: 'stripe', providerPlanId: 'price_1' }] },
        ],
    };
    const calls: string[] = [];
    const fake = {
        createSubscription: async (p: any) => (calls.push(`sub:${p.planId}`), { id: 's' }),
        createOneTimePayment: async (p: any) => (calls.push(`once:${p.planId}`), { id: 'o' }),
    } as any;
    const service = new PaymentService({ getPlanById: async (id: string) => (id === 'p1' ? plan : null), getAllPlans: async () => [plan] } as any, { findByUserId: async () => null } as any, () => fake);
    const user = { _id: 'u', email: 'e@x.io' };

    it('routes lifetime purchases to one-time payments and the rest to subscriptions', async () => {
        await service.createSubscription({ planId: 'p1', paymentType: 'subscription', billingCycle: 'monthly', provider: 'razorpay', userInfo: user });
        await service.createSubscription({ planId: 'p1', paymentType: 'one_time', billingCycle: 'lifetime', provider: 'stripe', userInfo: user });
        assert.deepEqual(calls, ['sub:rp_1', 'once:price_1']);
    });

    it('rejects unknown plans and unavailable combinations', async () => {
        await rejectsWith(service.createSubscription({ planId: 'nope', paymentType: 'subscription', billingCycle: 'monthly', provider: 'razorpay', userInfo: user }), 404);
        await rejectsWith(service.createSubscription({ planId: 'p1', paymentType: 'subscription', billingCycle: 'yearly', provider: 'razorpay', userInfo: user }), 400);
        await rejectsWith(service.createSubscription({ planId: 'p1', paymentType: 'subscription', billingCycle: 'monthly', provider: 'stripe', userInfo: user }), 400);
    });
});

describe('AuthService (OAuth via strategy)', () => {
    const made: any[] = [];
    const users = new Map<string, any>();
    const repo = {
        findUserByEmail: async (e: string) => users.get(e) ?? null,
        upsertOAuthUser: async (d: any) => (users.set(d.email, { _id: `id-${users.size}`, deleted: false, ...d }), users.get(d.email)),
        updateUser: async () => null,
    } as any;
    const dirs = { getOrCreateRootDirectory: async (id: string) => (made.push(id), {}) } as any;
    const provider = (profile: any) => ({ authenticate: async (c: string) => { if (c !== 'ok') throw new Error('bad'); return profile; }, getAuthorizationUrl: () => 'u' }) as any;
    const sessions = new SessionService(new InMemorySessionRepository());

    it('creates the user and root directory once, then reuses the account', async () => {
        const svc = new AuthService(repo, sessions, dirs, () => provider({ email: 'g@x.io', name: 'G', avatar: 'a' }));
        const first = await svc.loginWithGoogle('ok');
        const second = await svc.handleGithubCallback('ok');
        assert.equal(first.user._id, second.user._id);
        assert.equal(made.length, 1);
        assert.equal(await sessions.verifySession(first.sessionId), first.user._id);
    });

    it('maps provider failures to 401, missing emails to 400, disabled users to 403', async () => {
        const svc = new AuthService(repo, sessions, dirs, () => provider({ email: 'g@x.io' }));
        await rejectsWith(svc.loginWithGoogle('bad'), 401);
        await rejectsWith(new AuthService(repo, sessions, dirs, () => provider({ email: '' })).loginWithGoogle('ok'), 400);
        users.get('g@x.io').deleted = true;
        await rejectsWith(svc.loginWithGoogle('ok'), 403);
    });
});

describe('OtpService', () => {
    it('stores a 6 digit code and verifies it once', async () => {
        const store = new Map<string, string>();
        const sent: any[] = [];
        const svc = new OtpService(
            {
                upsertOtp: async ({ email, otp }: any) => void store.set(email, otp),
                getOtp: async (email: string) => (store.has(email) ? { email, otp: store.get(email) } : null),
                deleteOtp: async (email: string) => void store.delete(email),
            } as any,
            { sendMail: async (m: any) => sent.push(m) } as any,
        );
        await svc.sendOtpToEmail('a@b.co');
        const code = store.get('a@b.co')!;
        assert.match(code, /^\d{6}$/);
        assert.equal(sent.length, 1);
        assert.equal(await svc.verifyOtp({ email: 'a@b.co', otpSentByClient: 'x' }), false);
        assert.equal(await svc.verifyOtp({ email: 'a@b.co', otpSentByClient: code }), true);
        assert.equal(await svc.verifyOtp({ email: 'a@b.co', otpSentByClient: code }), false);
    });
});

describe('FileService presigned uploads', () => {
    it('requires a configured signer and valid input', async () => {
        const user = { _id: '507f1f77bcf86cd799439013', email: 'e@x', maxStorageInBytes: 100 } as any;
        const base = { findUserRootDirectory: async () => ({ _id: '507f1f77bcf86cd799439011', parentDirId: null }), incrementDirectorySize: async () => null } as any;
        const files = { getTotalStorageUsed: async () => 0, createFile: async (d: any) => ({ _id: '507f1f77bcf86cd799439012', ...d }) } as any;
        const storage = new LocalDiskStorage(mkdtempSync(path.join(tmpdir(), 'dd-fs-')));
        const none = new FileService(files, base, storage, null);
        await rejectsWith(none.generatePresignedUrl({ fileName: 'a', contentLength: 1, contentType: 't', user }), 400);
        const withSigner = new FileService(files, base, storage, { createUploadUrl: async (r) => `https://s3.test/${r.key}` });
        await rejectsWith(withSigner.generatePresignedUrl({ fileName: '', contentLength: 1, contentType: 't', user }), 400);
        const ok = await withSigner.generatePresignedUrl({ fileName: 'a.txt', contentLength: 5, contentType: 't', user });
        assert.match(ok.url, /^https:\/\/s3\.test\/507f1f77bcf86cd799439013\//);
    });
});
