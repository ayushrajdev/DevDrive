import { successResponse } from '../Response.js';
import User from '../models/user.model.js';
import Directory from '../models/directory.model.js';
import mongoose, { Types } from 'mongoose';
import { Generate_JWT_Token } from '../utils/helpers/auth.helper.js';

import {
    checkUser,
    hashPasswordUsingCrypto,
} from '../middlewares/auth.middleware.js';
import Session from '../models/session.model.js';
import { ENV } from '../utils/env.js';
import { createSessionAndReturnSessionId } from '../services/session.service.js';
import {
    checkUserPassword,
    hashPasswordAndReturnHashedPassword,
} from '../services/bcrypt.service.js';
import redisClient from '../config/redis/redis.config.js';

async function registerUser(req, res, next) {
    const { email, password, name } = req.body;
    if (!email || !password) {
        res.status(409).json({ message: 'invalid crediantials' });
    }
    const session = await mongoose.startSession();
    try {
        const oidUser = new Types.ObjectId();
        const oidDirectory = new Types.ObjectId();

        session.startTransaction();

        const hashedPassword =
            await hashPasswordAndReturnHashedPassword(password);

        const user = await User.insertOne(
            {
                _id: oidUser,
                name,
                email,
                password: hashedPassword,
                rootDirId: oidDirectory,
            },
            { session },
        );
        const directory = await Directory.insertOne(
            {
                _id: oidDirectory,
                name: `root-${email}`,
                userId: oidUser,
                size: 0,    
            },
            { session },
        );
        // const userSession = new Session({ userId: oidUser });
        // userSession.save();

        const userSessionId = await createSessionAndReturnSessionId(oidUser);

        session.commitTransaction();

        // const token =
        //     oidUser.toString() +
        //     Math.round(new Date.now() / 1000 + 4000).toString('16');

        // res.cookie('token', token);
        res.cookie('sessionId', userSessionId, {
            httpOnly: true,
            signed: true,
            sameSite: 'lax',
        });

        res.status(201).json({ user, directory });
    } catch (error) {
        if (error.code == 11000) {
            res.status(409).json({ error: error.message });
        }
        next(error);
        session.abortTransaction();
    }
}

async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'invalid crendiatels' });
        }

        const user = await User.findOne({
            email,
        });

        const isPasswordValid = await checkUserPassword(
            password,
            user.password,
        );

        if (!user || !isPasswordValid) {
            return res.status(400).json({ message: 'invalid email' });
        }
        // const cookiePayload = JSON.stringify({
        //   expiry: Math.round(Date.now() / 1000 + 4000).toString("16"),
        //   id: user._id.toString(),
        // });

        // const loggedInUserSessions = await Session.find({
        //     userId: user.id,
        // }).lean();

        // if (loggedInUserSessions.length > ENV.MAX_DEVICE_LIMIT) {
        //     console.log(loggedInUserSessions);
        //     const firstUser = loggedInUserSessions[0];
        //     console.log(firstUser);
        //     const removedFirstUser = await Session.deleteOne({
        //         _id: firstUser._id,
        //     });
        //     console.log(removedFirstUser);
        // }

        // const session = new Session({ userId: user._id });
        // session.save();

        // res.cookie("token", Buffer.from(cookiePayload).toString("hex"), {
        //   httpOnly: true,
        //   signed: true,
        // });

        const sessionId = await createSessionAndReturnSessionId(user.id);

        res.cookie('sessionId', sessionId, {
            signed: true,
            sameSite: 'lax',
        });

        return res.json({ message: 'loggineed', user });
    } catch (error) {
        console.log(error.message);
    }
}

async function logoutUser(req, res, next) {
    try {
        const sessionId = req.signedCookies.sessionId;
        const session = await Session.findByIdAndDelete(sessionId);
        res.clearCookie('sessionId');
        return successResponse(res, 'logged out successfull');
    } catch (error) {
        next(error);
    }
}

async function getUserInfo(req, res, next) {
    try {
        const { user } = req;
        return res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
}

async function logoutFromAllDevices(req, res, next) {
    const session = req.session;
    const userId = session.userId;

    await Session.deleteMany({ userId });
    res.json({ message: 'logged out from all devices' });
}

const getAllUsers = async (req, res, next) => {
    try {
        const result = await getUsersDetailsAndLoggedInStatusOfUser();
        console.log(result);
        if (!result) {
            return errorResponse(res);
        }
        return res.json(result);
    } catch (error) {
        console.log(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const { userId } = req.body;
        const { admin } = req;
        if (admin._id.toString() == userId) {
            return errorResponse(res);
        }
        await User.findByIdAndDelete(userId);
        await File.deleteMany({
            userId,
        });
        await Directory.deleteMany({
            userId,
        });
        await Session.deleteMany({
            userId,
        });
        await User.findByIdAndUpdate(userId, {
            deleted: true,
        });
        res.json({ message: 'user deleted ' });
    } catch (error) {
        console.log(error);
    }
};

const disableUser = async (req, res) => {
    try {
        const { userId } = req.body;

        await Session.deleteMany({
            userId,
        });
        await User.findByIdAndUpdate(userId, {
            deleted: true,
        });
        res.json({ message: 'user disabled ' });
    } catch (error) {}
};
const recoverUser = async (req, res) => {
    try {
        const { userId } = req.body;
        await User.findByIdAndUpdate(userId, {
            deleted: false,
        });
        res.json({ message: 'user account recovered ' });
    } catch (error) {}
};

const userController = {
    registerUser,
    loginUser,
    logoutUser,
    getUserInfo,
    logoutFromAllDevices,
    getAllUsers,
    deleteUser,
    disableUser,
    recoverUser,
};

export default userController;
