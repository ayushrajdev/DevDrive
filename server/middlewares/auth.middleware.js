import User from '../models/user.model.js';
import { errorResponse } from '../Response.js';

export async function checkUserAuth(req, res, next) {
    const { uid } = req.cookies;
    if (!uid) return errorResponse(res);
    console.log(Buffer.from(uid))
    const { expiry, id } = JSON.parse(Buffer.from(
        uid,
        'base64url',
    ).toString('utf8'));
    const expiryTimeInSecond = parseInt(expiry, 16);
    const currentTimeInSecond = Math.floor(Number(Date.now() / 1000));
    console.log({ currentTimeInSecond, expiryTimeInSecond });
    if (expiryTimeInSecond - currentTimeInSecond) {
        res.clearCookie('uid');
        return res.end();
    }
    const user = await User.findById(id);
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
