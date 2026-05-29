import Session from '../../models/session.model.js';
import User from '../../models/user.model.js';

export async function getUsersDetailsAndLoggedInStatusOfUser() {
    try {
        const users = await User.find()
            .select('email name _id role')
            .lean();
        const sessions = await Session.find();

        const sessionsUserId = sessions.map((session) =>
            session.userId.toString(),
        );
        const sessionUserIdSet = new Set(sessionsUserId);
        const result = users.map(({ name, email, _id, role }) => {
            return {
                id: _id.toString(),
                name,
                email,
                isLoggedIn: sessionUserIdSet.has(_id.toString()),
                role,
            };
        });
        return result;
    } catch (error) {
        return null;
    }
}
