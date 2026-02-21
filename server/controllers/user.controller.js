import { successResponse } from '../Response.js';
import User from '../models/user.model.js';
import Directory from '../models/directory.model.js';
import mongoose, { Types } from 'mongoose';

async function registerUser(req, res, next) {
    const { db } = req;
    const session = await mongoose.startSession();
    try {
        const { email, password, name } = req.body;
        if (!email || !password) {
            res.status(409).json({ message: 'invalid crediantials' });
        }
        console.log(email, password, name);
        const oidUser = new Types.ObjectId();
        const oidDirectory = new Types.ObjectId();

        session.startTransaction();

        const user = await User.insertOne(
            {
                _id: oidUser,
                name,
                email,
                password,
                rootDirId: oidDirectory,
            },
            { session },
        );
        const directory = await Directory.insertOne(
            {
                _id: oidDirectory,
                name: `root-${email}`,
                userId: oidUser,
            },
            { session },
        );

        session.commitTransaction();

        // const token =
        //     oidUser.toString() +
        //     Math.round(new Date.now() / 1000 + 4000).toString('16');

        // res.cookie('uid', token);
        res.status(201).json({ user, directory });
    } catch (error) {
        if (error.code == 11000) {
            res.status(409).json({ error: error.message });
        }
        console.log(error);
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

        if (!user || user.password !== password) {
            return res.status(400).json({ message: 'invalid email' });
        }
        console.log(user);
        // const token =
        //     user._id.toString() +
        //     Math.round(Date.now() / 1000 + 4000).toString('16');
        const customJWT = JSON.stringify({
            expiry: Math.round(Date.now() / 1000 + 4000).toString('16'),
            id: user._id.toString(),
        });

        res.cookie('uid', Buffer.from(customJWT).toString('base64url'), {
            httpOnly: true,
        });
        res.json({ message: 'loggineed', user });
    } catch (error) {
        console.log(error.message);
    }
}

async function logoutUser(req, res, next) {
    try {
        res.clearCookie('uid');
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

const userController = {
    registerUser,
    loginUser,
    logoutUser,
    getUserInfo,
};

export default userController;
