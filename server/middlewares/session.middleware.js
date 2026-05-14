import redisClient from '../config/redis/redis.config.js';
import Session from '../models/session.model.js';
import { verifySessionAndReturnUserId } from '../services/session.service.js';

export async function checkSession(req, res, next) {
    const { sessionId } = req.signedCookies;
    if (!sessionId) {
        return res.json({ meassage: 'please login!!!!!' });
    }
    const userId = await verifySessionAndReturnUserId(sessionId);
    if (!userId) {
        res.clearCookie('sessionId');
        return res.json({ meassage: 'session expired, please login' });
    }

    //   const loggedInDevices = await Session.find({ userId: session.userId });

    //   if (loggedInDevices.length >  2) {
    //     console.log(loggedInDevices.length);
    //     const firstDevice = loggedInDevices[0];
    //     const logoutFirstDevice = await Session.deleteOne({ _id: firstDevice.id });
    //     console.log("logged out first device", logoutFirstDevice);
    //   }

    // const allSessions = await redisClient.ft.search(
    //     'userIdIdx',
    //     `@userId:{${session.userId}`,
    //     {
    //         RETURN: [],
    //     },
    // );

    // if (allSessions.total >= 2) {
    //     //! restrict the user login in three devices
    //     const firstUserSessionId = allSessions.documents[0].id;
    //     try {
    //         await redisClient.json.del(`session:${firstUserSessionId}`);
    //     } catch (error) {}
    // }

    req.userId = userId;
    next();
}
