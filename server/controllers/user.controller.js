import { ObjectId } from 'mongodb';
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
    const oidUser = new Types.ObjectId();
    const oidDirectory = new Types.ObjectId();

    session.startTransaction();

    const user = new User({
      _id: oidUser,
      name,
      email,
      password,
      rootDirId: oidDirectory,
    });
    const directory = await Directory.create({
      _id: oidDirectory,
      name: `root-${email}`,
      userId: oidUser,
    });
    await user.save();

    session.commitTransaction();

    res.cookie('uid', oidUser.toString());
    res.status(201).json({ user, directory });
  } catch (error) {
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
    res.cookie('uid', user._id.toString(), {
      httpOnly: true,
    });
    res.json({ message: 'loggineed', user });
  } catch (error) {}
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
