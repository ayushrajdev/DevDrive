import User from '../../models/user.model.js';
import { errorResponse } from '../../utils/Response.js';
import crypto from 'crypto';
import { checkAuthToken } from '../../utils/helpers/auth.helper.js';
import { ENV } from '../../utils/env.js';

export async function checkUser(req, res, next) {
    // const { token } = req.cookies;
    const userId = req.userId;
    // if (!token) return errorResponse(res, "token is not present");
    // const { expiry, id } = JSON.parse(Buffer.from(token, "hex").toString("utf8"));
    // const expiryTimeInSecond = parseInt(expiry, 16);
    // const currentTimeInSecond = Math.floor(Number(Date.now() / 1000));
    // console.log({ currentTimeInSecond, expiryTimeInSecond });
    // if (!(expiryTimeInSecond - currentTimeInSecond >= 0)) {
    //   res.clearCookie("token");
    //   return res.end();
    // }
    // const id = checkAuthToken(res, token);

    //! you can skip this api call instead of finding the user data we can send the user data from the redis server
    const user = await User.findById(userId).lean();
    if (!user) return errorResponse(res);
    if (user.deleted) {
        return res
            .status(403)
            .json({ message: 'your account have been deleted' });
    }

    // req.token = token;
    req.user = user;
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

export function hashPasswordUsingCrypto(plainPassword) {
    const hashedPassword = crypto
        .createHmac('sha256', ENV.SECRET_KEY)
        .update(plainPassword)
        .digest('hex');

    return hashedPassword;
}
export function comparePasswordUsingCrypto(plainPassword, hashedPassword) {
    const newHash = crypto
        .createHmac('sha256', ENV.SECRET_KEY)
        .update(plainPassword)
        .digest('hex');

    return hashedPassword == newHash;
}
