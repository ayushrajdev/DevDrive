import {  SCHEMA_FIELD_TYPE } from 'redis';
import redisClient from './redis.config.js';

await redisClient.ft.create(
    'userIdIdx',
    {
        '$.userId': { type: SCHEMA_FIELD_TYPE.TAG, AS: 'userId' },
    },
    {
        ON: 'JSON',
        PREFIX: 'session:',
    },
);

await redisClient.quit();
