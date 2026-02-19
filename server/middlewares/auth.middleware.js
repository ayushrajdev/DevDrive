import User from '../models/user.model.js';
import { errorResponse } from '../Response.js';
import { ObjectId } from 'mongodb';

export async function checkIsLoggedIn(req, res, next) {
  const { uid } = req.cookies;
  if (!uid) return errorResponse(res);

  const user = await User.findById(uid);
  if (!user) return errorResponse(res);
  req.uid = uid;
  req.user = user;
  console.log(uid);
  console.log(user);

  next();
}

export function dirIdOfCurrentUser(req, res, next) {
  try {
    // const { user, uid } = req;
    // const parentDirId = req.headers.parentdirid || user.rootDirID;
    // console.log("Header:", req.headers.parentdirid);
    // console.log("Type:", typeof req.headers.parentdirid);

    // const DirectoryOfUser = directoriesData.find(
    //   (dir) => dir.id == parentDirId && dir.userId == uid,
    // );

    // console.log(parentDirId);
    // console.log(DirectoryOfUser);
    // if (!DirectoryOfUser) {
    //   return errorResponse(res, "this directory is not of yours");
    // }

    // req.parentDirId = parentDirId;
    // req.DirectoryOfUser = DirectoryOfUser;
    next();
  } catch (error) {
    next(error);
  }
}
