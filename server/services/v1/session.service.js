import redisClient from '../../config/redis/redis.config.js';

// return session-id
export async function createSessionAndReturnSessionId(userId) {
    try {
        const sessionId = crypto.randomUUID();
        await redisClient.json.set(`session:${sessionId}`, '$', { userId });
        await redisClient.expire(sessionId, 60 * 60);
        return sessionId;
    } catch (error) {
        return null;
    }
}

export async function verifySessionAndReturnUserId(sessionId) {
    try {
        console.log(`session:${sessionId}`);
        const result = await redisClient.json.get(`session:${sessionId}`, {
            path: '$',
        });
        if (!result || result.length === 0) {
            return null;
        }

        const session = result[0];
        return session.userId || null;
    } catch (error) {}
}


async function deleteSessionFromDatabase(sessionId) {
    try {
        await redisClient.json.del(`session:${sessionId}`);
        return true;
    } catch (error) {
        return false;
    }
}

const sessionService = {
    createSessionAndReturnSessionId,
    verifySessionAndReturnUserId,
    deleteSessionFromDatabase,
};




export class SessionService{
    constructor(){
        
    }
}
