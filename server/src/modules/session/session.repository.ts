import { getRedisClient } from '../../config/redis.config.js';

export interface ISessionRepository {
    createSession(userId: string): Promise<string>;
    verifySession(sessionId: string): Promise<string | null>;
    deleteSession(sessionId: string): Promise<boolean>;
    deleteAllUserSessions(userId: string): Promise<void>;
}

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Redis-backed session strategy.
 * Layout (works on plain Redis, no modules required):
 *   session:<id>        => userId            (TTL)
 *   user-sessions:<uid> => SET of session ids
 */
export class RedisSessionRepository implements ISessionRepository {
    private get client() {
        return getRedisClient();
    }

    async createSession(userId: string): Promise<string> {
        const sessionId = crypto.randomUUID();
        await this.client
            .multi()
            .set(`session:${sessionId}`, userId, { EX: SESSION_TTL_SECONDS })
            .sAdd(`user-sessions:${userId}`, sessionId)
            .expire(`user-sessions:${userId}`, SESSION_TTL_SECONDS)
            .exec();
        return sessionId;
    }

    async verifySession(sessionId: string): Promise<string | null> {
        return (await this.client.get(`session:${sessionId}`)) ?? null;
    }

    async deleteSession(sessionId: string): Promise<boolean> {
        const userId = await this.client.get(`session:${sessionId}`);
        await this.client.del(`session:${sessionId}`);
        if (userId) await this.client.sRem(`user-sessions:${userId}`, sessionId);
        return true;
    }

    async deleteAllUserSessions(userId: string): Promise<void> {
        const setKey = `user-sessions:${userId}`;
        const ids = await this.client.sMembers(setKey);
        if (ids.length > 0) {
            await this.client.del(ids.map((id) => `session:${id}`));
        }
        await this.client.del(setKey);
    }
}

/**
 * In-memory session strategy. Used when Redis is not configured
 * (local development and tests). Sessions are lost on restart.
 */
export class InMemorySessionRepository implements ISessionRepository {
    private readonly sessions = new Map<string, { userId: string; expiresAt: number }>();

    constructor(private readonly ttlMs: number = SESSION_TTL_SECONDS * 1000) {}

    async createSession(userId: string): Promise<string> {
        const sessionId = crypto.randomUUID();
        this.sessions.set(sessionId, { userId, expiresAt: Date.now() + this.ttlMs });
        return sessionId;
    }

    async verifySession(sessionId: string): Promise<string | null> {
        const session = this.sessions.get(sessionId);
        if (!session) return null;
        if (session.expiresAt <= Date.now()) {
            this.sessions.delete(sessionId);
            return null;
        }
        return session.userId;
    }

    async deleteSession(sessionId: string): Promise<boolean> {
        return this.sessions.delete(sessionId);
    }

    async deleteAllUserSessions(userId: string): Promise<void> {
        for (const [id, session] of this.sessions) {
            if (session.userId === userId) this.sessions.delete(id);
        }
    }
}
