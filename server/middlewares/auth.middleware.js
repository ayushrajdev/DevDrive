import User from '../models/user.model.js';
import { errorResponse } from '../Response.js';
import crypto from 'crypto';
import { checkAuthToken } from '../utils/helpers/auth.helper.js';

export async function checkUserAuth(req, res, next) {
    const { token } = req.cookies;
    if (!token) return errorResponse(res, 'token is not presentr');

    const id = checkAuthToken(res, token);
    const user = await User.findById(id);
    if (!user) return errorResponse(res);

    req.token = token;
    req.user = user;
    console.log(token);
    console.log(user);

    next();
}

export function dirIdOfCurrentUser(req, res, next) {
    try {
        // const { user, token } = req;
        // const parentDirId = req.headers.parentdirid || user.rootDirID;
        // console.log("Header:", req.headers.parentdirid);
        // console.log("Type:", typeof req.headers.parentdirid);

        // const DirectoryOfUser = directoriesData.find(
        //   (dir) => dir.id == parentDirId && dir.userId == token,
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
