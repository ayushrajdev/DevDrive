import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fakePaymentProvider, startTestApp, type HttpClient, type TestContext } from '../helpers/test-app.js';

let ctx: TestContext;

const password = 'secret123';
let counter = 0;
const uniqueEmail = (prefix = 'user') => `${prefix}${Date.now()}${counter++}@example.com`;

async function registerUser(prefix = 'user', client?: HttpClient) {
    const c = client ?? ctx.client();
    const email = uniqueEmail(prefix);
    const res = await c.post('/api/users/register', { name: prefix, email, password });
    assert.equal(res.status, 201, res.text);
    return { client: c, email, id: res.json.data._id as string };
}

async function userWithRole(role: string, prefix = role) {
    const u = await registerUser(prefix);
    await ctx.setRole(u.email, role);
    return u;
}

before(async () => {
    ctx = await startTestApp({ oauthProfile: { email: 'oauth.user@example.com', name: 'OAuth User', avatar: 'http://img/a.png' } });
});
after(async () => {
    await ctx.stop();
});

describe('platform', () => {
    it('GET /health', async () => {
        const res = await ctx.client().get('/health');
        assert.equal(res.status, 200);
        assert.equal(res.json.status, 'ok');
    });

    it('unknown route returns JSON 404', async () => {
        const res = await ctx.client().get('/api/nope');
        assert.equal(res.status, 404);
        assert.equal(res.json.success, false);
    });

    it('malformed JSON returns 400', async () => {
        const res = await ctx.client().request('POST', '/api/users/login', '{bad', { 'Content-Type': 'application/json' });
        assert.equal(res.status, 400);
    });
});

describe('users: registration, login, session', () => {
    it('registers, sets a cookie, hides the password, and gives access to profile', async () => {
        const { client, email } = await registerUser('reg');
        const profile = await client.get('/api/users/profile');
        assert.equal(profile.status, 200);
        assert.equal(profile.json.data.email, email);
        assert.equal(profile.json.data.password, undefined);
        assert.equal(profile.json.data.role, 'user');
    });

    it('rejects invalid registration payloads', async () => {
        const c = ctx.client();
        assert.equal((await c.post('/api/users/register', { email: 'x@example.com' })).status, 400);
        assert.equal((await c.post('/api/users/register', { email: 'not-an-email', password })).status, 400);
        assert.equal((await c.post('/api/users/register', { email: uniqueEmail(), password: '123' })).status, 400);
    });

    it('rejects duplicate registration with 409', async () => {
        const { email } = await registerUser('dup');
        const res = await ctx.client().post('/api/users/register', { email, password });
        assert.equal(res.status, 409);
    });

    it('logs in with valid credentials and rejects invalid ones', async () => {
        const { email } = await registerUser('login');
        const ok = ctx.client();
        assert.equal((await ok.post('/api/users/login', { email, password })).status, 200);
        assert.equal((await ok.get('/api/users/profile')).status, 200);
        assert.equal((await ctx.client().post('/api/users/login', { email, password: 'wrongpass' })).status, 401);
        assert.equal((await ctx.client().post('/api/users/login', { email: 'ghost@example.com', password })).status, 401);
        assert.equal((await ctx.client().post('/api/users/login', {})).status, 400);
    });

    it('protects authenticated routes', async () => {
        const c = ctx.client();
        for (const url of ['/api/users/profile', '/api/directory', '/api/files/storage/usage', '/api/payments/my-subscription']) {
            assert.equal((await c.get(url)).status, 401, url);
        }
    });

    it('logout invalidates the session', async () => {
        const { client } = await registerUser('logout');
        assert.equal((await client.post('/api/users/logout')).status, 200);
        assert.equal((await client.get('/api/users/profile')).status, 401);
    });

    it('logout from all devices invalidates every session', async () => {
        const { client, email } = await registerUser('alldev');
        const second = ctx.client();
        await second.post('/api/users/login', { email, password });
        assert.equal((await second.get('/api/users/profile')).status, 200);
        assert.equal((await client.post('/api/users/logout/all-devices')).status, 200);
        assert.equal((await second.get('/api/users/profile')).status, 401);
        assert.equal((await client.get('/api/users/profile')).status, 401);
    });

    it('set-password validates and updates the password', async () => {
        const { client, email } = await registerUser('setpw');
        assert.equal((await client.post('/api/users/set-password', {})).status, 400);
        assert.equal((await client.post('/api/users/set-password', { password: '1' })).status, 400);
        assert.equal((await client.post('/api/users/set-password', { password: 'brandnew1' })).status, 200);
        assert.equal((await ctx.client().post('/api/users/login', { email, password: 'brandnew1' })).status, 200);
        assert.equal((await ctx.client().post('/api/users/login', { email, password })).status, 401);
    });
});

describe('users: administration & RBAC', () => {
    it('forbids normal users from admin routes', async () => {
        const { client } = await registerUser('plain');
        assert.equal((await client.get('/api/users/admin/all')).status, 403);
    });

    it('manager can list users but not delete', async () => {
        const manager = await userWithRole('manager');
        const target = await registerUser('victim');
        assert.equal((await manager.client.get('/api/users/admin/all')).status, 200);
        assert.equal((await manager.client.get('/api/users/admin/active')).status, 200);
        assert.equal((await manager.client.get('/api/users/admin/disabled')).status, 200);
        assert.equal((await manager.client.delete(`/api/users/admin/${target.id}`)).status, 403);
    });

    it('admin soft deletes and recovers a user; disabled users cannot log in', async () => {
        const admin = await userWithRole('admin');
        const target = await registerUser('soft');

        assert.equal((await admin.client.delete(`/api/users/admin/${target.id}`)).status, 200);
        assert.equal((await target.client.get('/api/users/profile')).status, 403);
        assert.equal((await ctx.client().post('/api/users/login', { email: target.email, password })).status, 403);

        const disabled = await admin.client.get('/api/users/admin/disabled');
        assert.ok(disabled.json.data.some((u: any) => u._id === target.id));

        assert.equal((await admin.client.request('PATCH', `/api/users/admin/${target.id}/recover`)).status, 200);
        assert.equal((await ctx.client().post('/api/users/login', { email: target.email, password })).status, 200);
    });

    it('admin cannot delete another admin or the owner', async () => {
        const admin = await userWithRole('admin');
        const otherAdmin = await userWithRole('admin', 'admin2');
        const owner = await userWithRole('owner');
        assert.equal((await admin.client.delete(`/api/users/admin/${otherAdmin.id}`)).status, 403);
        assert.equal((await admin.client.delete(`/api/users/admin/${owner.id}`)).status, 403);
    });

    it('only an owner can hard delete', async () => {
        const admin = await userWithRole('admin');
        const owner = await userWithRole('owner');
        const target = await registerUser('hard');
        assert.equal((await admin.client.delete(`/api/users/admin/${target.id}/hard`)).status, 403);
        assert.equal((await owner.client.delete(`/api/users/admin/${target.id}/hard`)).status, 200);
        const all = await owner.client.get('/api/users/admin/all');
        assert.ok(!all.json.data.some((u: any) => u._id === target.id));
    });

    it('role updates enforce hierarchy', async () => {
        const admin = await userWithRole('admin');
        const manager = await userWithRole('manager');
        const owner = await userWithRole('owner');
        const user = await registerUser('promote');
        const other = await registerUser('promote2');

        assert.equal((await admin.client.patch(`/api/users/admin/${user.id}/role`, { role: 'manager' })).status, 200);
        assert.equal((await admin.client.patch(`/api/users/admin/${user.id}/role`, { role: 'bogus' })).status, 400);
        assert.equal((await admin.client.patch(`/api/users/admin/${admin.id}/role`, { role: 'user' })).status, 400);
        assert.equal((await admin.client.patch(`/api/users/admin/${other.id}/role`, { role: 'owner' })).status, 403);
        // manager cannot create admins or demote admins
        assert.equal((await manager.client.patch(`/api/users/admin/${other.id}/role`, { role: 'admin' })).status, 403);
        assert.equal((await manager.client.patch(`/api/users/admin/${admin.id}/role`, { role: 'user' })).status, 403);
        // owner can do both
        assert.equal((await owner.client.patch(`/api/users/admin/${other.id}/role`, { role: 'admin' })).status, 200);
        assert.equal((await owner.client.patch(`/api/users/admin/${admin.id}/role`, { role: 'user' })).status, 200);
    });

    it('invalid ids produce 400, unknown ids 404', async () => {
        const owner = await userWithRole('owner');
        assert.equal((await owner.client.delete('/api/users/admin/not-an-id')).status, 400);
        assert.equal((await owner.client.delete('/api/users/admin/64b7f0f0f0f0f0f0f0f0f0f0')).status, 404);
    });
});

describe('oauth', () => {
    it('google login creates a user and session', async () => {
        const c = ctx.client();
        const res = await c.post('/api/auth/google', { idToken: 'valid-credential' });
        assert.equal(res.status, 200, res.text);
        assert.equal(res.json.data.email, 'oauth.user@example.com');
        assert.equal((await c.get('/api/users/profile')).status, 200);
        // second login reuses the user
        const again = await ctx.client().post('/api/auth/google', { credential: 'valid-credential' });
        assert.equal(again.json.data._id, res.json.data._id);
    });

    it('google login rejects missing and invalid tokens', async () => {
        const c = ctx.client();
        assert.equal((await c.post('/api/auth/google', {})).status, 400);
        assert.equal((await c.post('/api/auth/google', { idToken: 'nope' })).status, 401);
    });

    it('github start redirects to the provider', async () => {
        const res = await ctx.client().get('/api/auth/github');
        assert.equal(res.status, 302);
        assert.equal(res.headers.get('location'), 'https://oauth.test/authorize');
    });

    it('github callback without code reports failure to opener', async () => {
        const res = await ctx.client().get('/api/auth/github/callback');
        assert.equal(res.status, 400);
        assert.match(res.text, /Missing auth code/);
    });

    it('github callback with code logs in', async () => {
        const c = ctx.client();
        const res = await c.get('/api/auth/github/callback?code=valid-credential');
        assert.equal(res.status, 200);
        assert.match(res.text, /"success":true/);
        assert.equal((await c.get('/api/users/profile')).status, 200);
    });

    it('set-cookie requires a session id', async () => {
        assert.equal((await ctx.client().post('/api/auth/set-cookie', {})).status, 400);
        assert.equal((await ctx.client().post('/api/auth/set-cookie', { sessionId: 'abc' })).status, 200);
    });
});

describe('otp', () => {
    it('sends an OTP without SMTP configured and rejects a wrong code', async () => {
        const c = ctx.client();
        const email = uniqueEmail('otp');
        assert.equal((await c.post('/api/otp/send-otp', { email })).status, 200);
        const bad = await c.post('/api/otp/verify-otp', { email, otp: '000000' });
        assert.equal(bad.status, 400);
    });

    it('verifies a correct OTP exactly once', async () => {
        const mongoose = (await import('mongoose')).default;
        const c = ctx.client();
        const email = uniqueEmail('otp2');
        await c.post('/api/otp/send-otp', { email });
        const record = await mongoose.connection.collection('otps').findOne({ email });
        assert.ok(record);
        assert.equal((await c.post('/api/otp/verify-otp', { email, otp: record.otp })).status, 200);
        assert.equal((await c.post('/api/otp/verify-otp', { email, otp: record.otp })).status, 400);
    });
});

describe('directories', () => {
    it('creates, lists, renames and deletes directories (recursively)', async () => {
        const { client } = await registerUser('dirs');
        const root = await client.get('/api/directory');
        assert.equal(root.status, 200);
        const rootId = root.json.data.directory._id;

        const docs = await client.post('/api/directory', { name: 'docs' });
        assert.equal(docs.status, 201);
        const docsId = docs.json.data._id;
        const nested = await client.post('/api/directory', { name: 'nested', parentDirId: docsId });
        assert.equal(nested.status, 201);

        const listing = await client.get(`/api/directory/${rootId}`);
        assert.deepEqual(listing.json.data.directories.map((d: any) => d.name), ['docs']);

        // legacy path-parameter style
        assert.equal((await client.post('/api/directory/by-path', {})).status, 201);

        assert.equal((await client.patch(`/api/directory/${docsId}`, { newDirName: 'documents' })).json.data.name, 'documents');
        assert.equal((await client.patch(`/api/directory/${docsId}`, {})).status, 400);
        assert.equal((await client.patch(`/api/directory/${rootId}`, { name: 'x' })).status, 400);

        const del = await client.delete(`/api/directory/${docsId}`);
        assert.equal(del.status, 200);
        assert.equal(del.json.data.deletedDirectories, 2);
        assert.equal((await client.get(`/api/directory/${docsId}`)).status, 404);
        assert.equal((await client.delete(`/api/directory/${rootId}`)).status, 400);
    });

    it('validates names and isolates users', async () => {
        const a = await registerUser('ownerA');
        const b = await registerUser('ownerB');
        assert.equal((await a.client.post('/api/directory', { name: '   ' })).status, 400);
        const dir = await a.client.post('/api/directory', { name: 'private' });
        const id = dir.json.data._id;
        assert.equal((await b.client.get(`/api/directory/${id}`)).status, 403);
        assert.equal((await b.client.patch(`/api/directory/${id}`, { name: 'hack' })).status, 403);
        assert.equal((await b.client.delete(`/api/directory/${id}`)).status, 403);
        assert.equal((await b.client.post('/api/directory', { name: 'x', parentDirId: id })).status, 403);
        assert.equal((await a.client.get('/api/directory/not-an-id')).status, 400);
    });
});

describe('files', () => {
    const upload = (client: HttpClient, name: string, content: string, parentDirId?: string) =>
        client.post(`/api/files/upload-stream/${encodeURIComponent(name)}`, content, {
            'Content-Type': 'application/octet-stream',
            ...(parentDirId ? { parentdirid: parentDirId } : {}),
        });

    it('uploads, reads, downloads, renames and deletes a file with size accounting', async () => {
        const { client } = await registerUser('files');
        const dir = await client.post('/api/directory', { name: 'stuff' });
        const dirId = dir.json.data._id;

        const content = 'hello devdrive';
        const up = await upload(client, 'hello.txt', content, dirId);
        assert.equal(up.status, 201, up.text);
        const fileId = up.json.data._id;
        assert.equal(up.json.data.size, content.length);
        assert.ok(existsSync(path.join(ctx.storageDir, `${fileId}.txt`)));

        const read = await client.get(`/api/files/${fileId}`);
        assert.equal(read.status, 200);
        assert.equal(read.text, content);
        const dl = await client.get(`/api/files/${fileId}?action=download`);
        assert.match(dl.headers.get('content-disposition') ?? '', /hello\.txt/);

        const usage = await client.get('/api/files/storage/usage');
        assert.equal(usage.json.data.usedBytes, content.length);

        const listing = await client.get(`/api/directory/${dirId}`);
        assert.equal(listing.json.data.files.length, 1);
        assert.equal(listing.json.data.directory.size, content.length);

        assert.equal((await client.patch(`/api/files/${fileId}`, { name: 'renamed.txt' })).json.data.name, 'renamed.txt');
        assert.equal((await client.request('PUT', `/api/files/${fileId}`, { newFileName: 'again.txt' })).json.data.name, 'again.txt');
        assert.equal((await client.patch(`/api/files/${fileId}`, {})).status, 400);

        assert.equal((await client.delete(`/api/files/${fileId}`)).status, 200);
        assert.ok(!existsSync(path.join(ctx.storageDir, `${fileId}.txt`)));
        assert.equal((await client.get(`/api/files/${fileId}`)).status, 404);
        assert.equal((await client.get('/api/files/storage/usage')).json.data.usedBytes, 0);
        assert.equal((await client.get(`/api/directory/${dirId}`)).json.data.directory.size, 0);
    });

    it('stores JSON files byte-for-byte even when uploaded with a JSON content type', async () => {
        const { client } = await registerUser('jsonfile');
        const content = '{"a": 1,  "b": [1,2,3]}';
        const up = await client.post('/api/files/upload-stream/data.json', content, { 'Content-Type': 'application/json' });
        assert.equal(up.status, 201, up.text);
        assert.equal(up.json.data.size, content.length);
        const read = await client.get(`/api/files/${up.json.data._id}`);
        assert.equal(read.text, content);
    });

    it('prevents cross-user access', async () => {
        const a = await registerUser('fileA');
        const b = await registerUser('fileB');
        const up = await upload(a.client, 'secret.txt', 'top secret');
        const id = up.json.data._id;
        assert.equal((await b.client.get(`/api/files/${id}`)).status, 403);
        assert.equal((await b.client.patch(`/api/files/${id}`, { name: 'x' })).status, 403);
        assert.equal((await b.client.delete(`/api/files/${id}`)).status, 403);
    });

    it('enforces the storage quota', async () => {
        const { client, email } = await registerUser('quota');
        const mongoose = (await import('mongoose')).default;
        await mongoose.connection.collection('users').updateOne({ email }, { $set: { maxStorageInBytes: 5 } });
        const res = await upload(client, 'big.txt', 'this is more than five bytes');
        assert.equal(res.status, 400);
        assert.match(res.json.message, /Storage limit/);
    });

    it('rejects uploads into someone else’s directory', async () => {
        const a = await registerUser('upA');
        const b = await registerUser('upB');
        const dir = await a.client.post('/api/directory', { name: 'mine' });
        const res = await upload(b.client, 'x.txt', 'x', dir.json.data._id);
        assert.equal(res.status, 403);
    });

    it('presigned uploads report missing S3 configuration', async () => {
        const { client } = await registerUser('s3');
        const res = await client.post('/api/files/presigned-url', { fileName: 'a.bin', ContentLength: 10, ContentType: 'application/octet-stream' });
        assert.equal(res.status, 400);
        assert.match(res.json.message, /S3/);
    });
});

describe('payments', () => {
    it('lists default plans publicly', async () => {
        const res = await ctx.client().get('/api/payments/plans');
        assert.equal(res.status, 200);
        assert.ok(res.json.data.length >= 1);
        assert.ok(res.json.data[0].pricingOptions.length >= 1);
    });

    it('my-subscription is null before purchase', async () => {
        const { client } = await registerUser('nosub');
        const res = await client.get('/api/payments/my-subscription');
        assert.equal(res.status, 200);
        assert.equal(res.json.data, null);
    });

    it('creates a subscription through the provider strategy', async () => {
        const { client } = await registerUser('pay');
        const plans = (await client.get('/api/payments/plans')).json.data;
        let chosen: { plan: any; option: any; provider: string } | null = null;
        for (const plan of plans) {
            for (const option of plan.pricingOptions) {
                const p = option.providers.find((x: any) => x.provider === 'razorpay' && x.providerPlanId);
                if (p && option.paymentType === 'subscription') chosen = { plan, option, provider: 'razorpay' };
            }
        }
        assert.ok(chosen, 'a razorpay subscription pricing option exists');
        fakePaymentProvider.calls.length = 0;
        const res = await client.post('/api/payments/subscriptions', {
            planId: chosen.plan._id,
            paymentType: chosen.option.paymentType,
            billingCycle: chosen.option.billingCycle,
            provider: 'razorpay',
        });
        assert.equal(res.status, 200, res.text);
        assert.equal(res.json.flow, 'popup');
        assert.equal(res.json.data.subscriptionId, 'sub_test');
        assert.equal(fakePaymentProvider.calls.length, 1);
    });

    it('validates subscription requests', async () => {
        const { client } = await registerUser('payval');
        assert.equal((await client.post('/api/payments/subscriptions', { provider: 'paypal' })).status, 400);
        assert.equal((await client.post('/api/payments/subscriptions', { planId: '64b7f0f0f0f0f0f0f0f0f0f0', paymentType: 'subscription', billingCycle: 'monthly', provider: 'stripe' })).status, 404);
        assert.equal((await client.post('/api/payments/subscriptions', { planId: 'bad', paymentType: 'subscription', billingCycle: 'monthly', provider: 'stripe' })).status, 404);
        assert.equal((await ctx.client().post('/api/payments/subscriptions', {})).status, 401);
    });
});

describe('webhooks (no provider credentials configured)', () => {
    it('razorpay webhook refuses unsigned and unverifiable requests', async () => {
        const c = ctx.client();
        const unsigned = await c.post('/api/webhooks/subscriptions/razorpay', { event: 'x' });
        assert.equal(unsigned.status, 400);
        const unverifiable = await c.post('/api/webhooks/subscriptions/razorpay', { event: 'x' }, { 'x-razorpay-signature': 'abc' });
        assert.equal(unverifiable.status, 503);
    });

    it('stripe webhook refuses unsigned and unverifiable requests', async () => {
        const c = ctx.client();
        assert.equal((await c.post('/api/webhooks/subscriptions/stripe', { type: 'x' })).status, 400);
        assert.equal((await c.post('/api/webhooks/subscriptions/stripe', { type: 'x' }, { 'stripe-signature': 'abc' })).status, 400);
    });
});
