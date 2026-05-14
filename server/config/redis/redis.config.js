import { createClient } from 'redis';

const redisClient = createClient({
    username: 'default',
    password: 'rUr7fbZkwekvHEn3424M93JLzAemXiVN',
    socket: {
        host: 'redis-11358.crce286.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 11358,
    },
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

await redisClient.connect();

export default redisClient;
