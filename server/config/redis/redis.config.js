import { createClient } from 'redis';

const redisClient = createClient({
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    url: process.env.REDIS_URL || undefined,
    socket: process.env.REDIS_URL ? undefined : {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
    },
});

redisClient.on('error', (err) => console.error('Redis client error:', err.message));

export default redisClient;
