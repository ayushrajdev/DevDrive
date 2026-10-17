import { createClient, RedisClientType } from 'redis';
import { ENV } from '../shared/utils/env.js';

let redisClient: ReturnType<typeof createClient>;

export function getRedisClient(): ReturnType<typeof createClient> {
    if (!redisClient) {
        redisClient = createClient({
            username: ENV.REDIS_USERNAME || undefined,
            password: ENV.REDIS_PASSWORD || undefined,
            url: ENV.REDIS_URL || undefined,
            socket: ENV.REDIS_URL
                ? undefined
                : {
                      host: ENV.REDIS_HOST,
                      port: ENV.REDIS_PORT,
                  },
        });

        redisClient.on('error', (err: Error) =>
            console.error('Redis client error:', err.message),
        );
    }
    return redisClient;
}

export async function connectRedis(): Promise<void> {
    const client = getRedisClient();
    if (!client.isOpen) {
        await client.connect();
        console.info('Redis connected');
    }
}
