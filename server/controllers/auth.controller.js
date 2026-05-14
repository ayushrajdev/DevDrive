import mongoose, { Types } from 'mongoose';
import Session from '../models/session.model.js';
import User from '../models/user.model.js';
import Directory from '../models/directory.model.js';

async function loginWithGoogle(req, res) {
    const { user } = req;
    const { email, name, picture, sub } = user;
    console.log(email, name);

    const transcationSession = await mongoose.startSession();
    try {
        let user;
        user = await User.findOne({
            email,
        });
        if (user.deleted) {
            return res.status(403).json({ message: 'your account has been deleted ' });
        }
        if (!user) {
            const oidUser = new Types.ObjectId();
            const oidDirectory = new Types.ObjectId();

            transcationSession.startTransaction();

            const rootDirectoryOfUser = await Directory.insertOne(
                {
                    userId: oidUser,
                    parentDirId: null,
                    name: `root-${email}`,
                },
                { session: transcationSession },
            );
            user = await User.insertOne(
                {
                    name,
                    email,
                    rootDirId: oidDirectory,
                    picture,
                },
                { session: transcationSession },
            );
            transcationSession.commitTransaction();
        }
        if (user?.picture == '') {
            user.picture = picture;
            user.save();
        }
        const session = await Session.insertOne({
            userId: user._id,
            createdAt: Date.now(),
        });

        res.cookie('sessionId', session._id.toString(), {
            signed: true,
        });
        return res.json({ message: 'login successfull' });
    } catch (error) {
        console.log(error);
        transcationSession.abortTransaction();
    }
}

const authController = {
    loginWithGoogle,
};

export default authController;
