import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import mongoose from 'mongoose';

// ENV is read once at import time, so configure it before loading the app.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET_KEY = 'test-secret';
process.env.SESSION_STORE = 'memory';
process.env.S3_BUCKET = '';
process.env.STRIPE_SECRET_KEY = '';
process.env.STRIPE_WEBHOOK_SECRET = '';
process.env.RAZORPAY_KEY_ID = '';
process.env.RAZORPAY_KEY_SECRET = '';
process.env.RAZORPAY_WEBHOOK_SECRET = '';

async function freePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const srv = net.createServer();
        srv.listen(0, '127.0.0.1', () => {
            const { port } = srv.address() as net.AddressInfo;
            srv.close(() => resolve(port));
        });
        srv.on('error', reject);
    });
}

/** Minimal cookie jar around fetch. */
export class HttpClient {
    private cookies = new Map<string, string>();

    constructor(private readonly baseUrl: string) {}

    async request(method: string, url: string, body?: unknown, headers: Record<string, string> = {}) {
        const isRaw = body instanceof Uint8Array || typeof body === 'string';
        const res = await fetch(`${this.baseUrl}${url}`, {
            method,
            headers: {
                ...(body !== undefined && !isRaw ? { 'Content-Type': 'application/json' } : {}),
                ...(this.cookies.size
                    ? { Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ') }
                    : {}),
                ...headers,
            },
            body: body === undefined ? undefined : isRaw ? (body as BodyInit) : JSON.stringify(body),
            redirect: 'manual',
        });
        for (const raw of res.headers.getSetCookie()) {
            const [pair] = raw.split(';');
            const idx = pair.indexOf('=');
            const name = pair.slice(0, idx);
            const value = pair.slice(idx + 1);
            if (!value || /expires=thu, 01 jan 1970/i.test(raw)) this.cookies.delete(name);
            else this.cookies.set(name, value);
        }
        const text = await res.text();
        let json: any = undefined;
        try {
            json = JSON.parse(text);
        } catch {
            /* not JSON */
        }
        return { status: res.status, json, text, headers: res.headers };
    }

    get = (url: string) => this.request('GET', url);
    post = (url: string, body?: unknown, headers?: Record<string, string>) => this.request('POST', url, body, headers);
    patch = (url: string, body?: unknown) => this.request('PATCH', url, body);
    delete = (url: string) => this.request('DELETE', url);
}

export interface TestContext {
    baseUrl: string;
    storageDir: string;
    client(): HttpClient;
    /** Direct DB access for arranging data (e.g. promoting a role). */
    setRole(email: string, role: string): Promise<void>;
    stop(): Promise<void>;
}

export interface StartOptions {
    oauthProfile?: { email: string; name: string; avatar: string };
}

export const fakePaymentProvider = {
    calls: [] as any[],
    async createSubscription(params: any) {
        fakePaymentProvider.calls.push({ kind: 'subscription', params });
        return { id: 'sub_test', short_url: 'https://pay.test/sub', notes: params.metadata };
    },
    async createOneTimePayment(params: any) {
        fakePaymentProvider.calls.push({ kind: 'one_time', params });
        return { id: 'order_test', notes: params.metadata };
    },
    verifyWebhook: () => false,
};

export async function startTestApp(options: StartOptions = {}): Promise<TestContext> {
    const dataDir = mkdtempSync(path.join(tmpdir(), 'devdrive-test-'));
    const storageDir = path.join(dataDir, 'storage');
    process.env.STORAGE_DIR = storageDir;

    let mongod: ChildProcess | null = null;
    let mongoUrl = process.env.MONGODB_TEST_URL;
    if (!mongoUrl) {
        const port = await freePort();
        mkdirSync(path.join(dataDir, 'db'), { recursive: true });
        mongod = spawn('mongod', ['--dbpath', path.join(dataDir, 'db'), '--port', String(port), '--bind_ip', '127.0.0.1'], {
            stdio: 'ignore',
        });
        mongoUrl = `mongodb://127.0.0.1:${port}/devdrive_test`;
    }

    let connected = false;
    for (let i = 0; i < 40 && !connected; i++) {
        try {
            await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 500 });
            connected = true;
        } catch {
            await new Promise((r) => setTimeout(r, 250));
        }
    }
    if (!connected) throw new Error('Could not connect to MongoDB for tests (is `mongod` installed?)');

    const { createApp } = await import('../../src/app.js');
    const { AppContainer } = await import('../../src/container.js');
    const { OAuthProvider } = await import('../../src/providers/oauth/oauth.provider.js');

    class FakeOAuthProvider extends OAuthProvider {
        getAuthorizationUrl() {
            return 'https://oauth.test/authorize';
        }
        async exchangeCodeForToken() {
            return 'token';
        }
        async getProfile() {
            return {};
        }
        normalize() {
            return { providerId: '1', provider: 'fake', ...(options.oauthProfile ?? { email: '', name: '', avatar: '' }) };
        }
        async authenticate(credential: string) {
            if (credential !== 'valid-credential') throw new Error('bad credential');
            return this.normalize();
        }
    }

    const container = new AppContainer({
        uploadSigner: null,
        oauthProviderResolver: () => new FakeOAuthProvider(),
        paymentProviderResolver: () => fakePaymentProvider as any,
    });
    const app = createApp(container);
    const server: Server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as net.AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;

    return {
        baseUrl,
        storageDir,
        client: () => new HttpClient(baseUrl),
        async setRole(email, role) {
            await mongoose.connection.collection('users').updateOne({ email }, { $set: { role } });
        },
        async stop() {
            await new Promise<void>((resolve) => server.close(() => resolve()));
            await mongoose.disconnect();
            mongod?.kill();
            await new Promise((r) => setTimeout(r, 500));
            try {
                rmSync(dataDir, { recursive: true, force: true });
            } catch {
                /* mongod may still hold files on Windows */
            }
        },
    };
}
