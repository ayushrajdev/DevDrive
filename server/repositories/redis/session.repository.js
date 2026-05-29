import redisClient from '../../config/redis/redis.config';

export default class RedisSessionRepository {
    async createSession({ userId }) {
        const sessionId = crypto.randomUUID();
        await redisClient.json.set(`session:${sessionId}`, '$', { userId });
        await redisClient.expire(sessionId, 60 * 60 * 7);
        return sessionId;
    }

    async deleteSession({ sessionId }) {
        await redisClient.json.del(`session:${sessionId}`);
        return true;
    }

    async verifySession({ sessionId }) {
        const result = await redisClient.json.get(`session:${sessionId}`, {
            path: '$',
        });
        if (!result || result.length === 0) {
            return null;
        }

        const session = result[0];
        return session.userId || null;
    }
}
