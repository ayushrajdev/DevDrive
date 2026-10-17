import { getRedisClient } from '../../config/redis.config.js';

export interface ISessionRepository {
    createSession(userId: string): Promise<string>;
    verifySession(sessionId: string): Promise<string | null>;
    deleteSession(sessionId: string): Promise<boolean>;
    deleteAllUserSessions(userId: string): Promise<void>;
}

/**
 * Redis-backed session repository.
 * Sessions stored as JSON: session:<uuid> => { userId: string }
 */
export class RedisSessionRepository implements ISessionRepository {
    private get client() {
        return getRedisClient();
    }

    async createSession(userId: string): Promise<string> {
        const sessionId = crypto.randomUUID();
        const key = `session:${sessionId}`;
        await this.client.json.set(key, '$', { userId });
        await this.client.expire(key, 60 * 60 * 24 * 7); // 7 days
        return sessionId;
    }

    async verifySession(sessionId: string): Promise<string | null> {
        const result = await this.client.json.get(`session:${sessionId}`, {
            path: '$',
        });
        if (!result || !Array.isArray(result) || result.length === 0) return null;
        const session = result[0] as { userId?: string };
        return session.userId ?? null;
    }

    async deleteSession(sessionId: string): Promise<boolean> {
        await this.client.json.del(`session:${sessionId}`);
        return true;
    }

    /**
     * Delete all sessions belonging to a user.
     * Uses Redis SCAN to find keys — safe at any scale.
     */
    async deleteAllUserSessions(userId: string): Promise<void> {
        const keys: string[] = [];
        for await (const key of this.client.scanIterator({ MATCH: 'session:*', COUNT: 100 })) {
            if (Array.isArray(key)) {
                keys.push(...(key as unknown as string[]));
            } else {
                keys.push(String(key));
            }
        }

        if (keys.length === 0) return;

        // Filter sessions belonging to this user
        const pipeline = this.client.multi();
        for (const key of keys) {
            pipeline.json.get(key, { path: '$.userId' });
        }
        const results = await pipeline.exec();

        const toDelete: string[] = [];
        results.forEach((result, idx) => {
            const arr = result as unknown as string[] | null;
            if (arr?.[0] === userId) toDelete.push(keys[idx]);
        });

        if (toDelete.length > 0) {
            await Promise.all(toDelete.map((k) => this.client.del(k)));
        }
    }
}
