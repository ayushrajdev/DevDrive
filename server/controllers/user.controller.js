import { successResponse } from "../Response.js";
import User from "../models/user.model.js";
import Directory from "../models/directory.model.js";
import mongoose, { Types } from "mongoose";
import { Generate_JWT_Token } from "../utils/helpers/auth.helper.js";
import {
  comparePasswordUsingCrypto,
  hashPasswordUsingCrypto,
} from "../middlewares/auth.middleware.js";
import argon2 from "argon2";
import Session from "../models/session.model.js";
import { ENV } from "../env.js";

async function registerUser(req, res, next) {
  const { db } = req;
  const session = await mongoose.startSession();
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      res.status(409).json({ message: "invalid crediantials" });
    }
    console.log(email, password, name);
    const oidUser = new Types.ObjectId();
    const oidDirectory = new Types.ObjectId();

    session.startTransaction();

    const hashPassword = hashPasswordUsingCrypto(password);

    const user = await User.insertOne(
      {
        _id: oidUser,
        name,
        email,
        password: hashPassword,
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
    const userSession = new Session({ userId: oidUser });
    userSession.save();

    session.commitTransaction();

    // const token =
    //     oidUser.toString() +
    //     Math.round(new Date.now() / 1000 + 4000).toString('16');

    // res.cookie('token', token);
    res.cookie("sessionId", userSession._id.toString(), {
      httpOnly: true,
      signed: true,
    });

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
      return res.status(400).json({ message: "invalid crendiatels" });
    }

    const user = await User.findOne({
      email,
    });

    if (!user || user.password !== password) {
      return res.status(400).json({ message: "invalid email" });
    }
    // const cookiePayload = JSON.stringify({
    //   expiry: Math.round(Date.now() / 1000 + 4000).toString("16"),
    //   id: user._id.toString(),
    // });

    const loggedInUserSessions = await Session.find({ userId: user.id }).lean();

    if (loggedInUserSessions.length > ENV.MAX_DEVICE_LIMIT) {
      console.log(loggedInUserSessions);
      const firstUser = loggedInUserSessions[0];
      console.log(firstUser);
      const removedFirstUser = await Session.deleteOne({
        _id: firstUser._id,
      });
      console.log(removedFirstUser);
    }

    const session = new Session({ userId: user._id });
    session.save();

    // res.cookie("token", Buffer.from(cookiePayload).toString("hex"), {
    //   httpOnly: true,
    //   signed: true,
    // });

    res.cookie("sessionId", session._id.toString(), {
      signed: true,
    });

    return res.json({ message: "loggineed", user });
  } catch (error) {
    console.log(error.message);
  }
}

async function logoutUser(req, res, next) {
  try {
    const sessionId = req.signedCookies.sessionId;
    const session = await Session.findByIdAndDelete(sessionId);
    res.clearCookie("sessionId");
    return successResponse(res, "logged out successfull");
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
  res.json({ message: "logged out from all devices" });
}
async function sendOtp(req, res, next) {
  // const  
}

const userController = {
  registerUser,
  loginUser,
  logoutUser,
  getUserInfo,
  logoutFromAllDevices,
};

export default userController;
