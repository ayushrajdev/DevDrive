import usersData from "../usersDB.json" with { type: "json" };
import { errorResponse, successResponse } from "../Response.js";
import filesData from "../fileDB.json" with { type: "json" };
import directoriesData from "../directoriesDB.json" with { type: "json" };

export function checkIsLoggedIn(req, res, next) {
  const { uid } = req.cookies;
  console.log(req.cookies);
  const user = usersData.find((user) => user.id == uid);
  console.log(user);
  if (!uid || !user) return errorResponse(res);
  req.uid = uid;
  req.user = user;
  next();
}

export function dirIdOfCurrentUser(req, res, next) {
  try {
    const { user, uid } = req;
    const parentDirId = req.headers.parentdirid || user.rootDirID;
    console.log("Header:", req.headers.parentdirid);
    console.log("Type:", typeof req.headers.parentdirid);

    const DirectoryOfUser = directoriesData.find(
      (dir) => dir.id == parentDirId && dir.userId == uid,
    );

    console.log(parentDirId);
    console.log(DirectoryOfUser);
    if (!DirectoryOfUser) {
      return errorResponse(res, "this directory is not of yours");
    }
    req.parentDirId = parentDirId;
    req.DirectoryOfUser = DirectoryOfUser;
    next();
  } catch (error) {
    next(error);
  }
}
