import { successResponse } from "../Response.js";

async function registerUser(req, res, next) {
  try {
    const { db } = req;
    const { email, password, name } = req.body;
    if (!email || !password) {
      res.status(409).json({ message: "invalid crediantials" });
    }
    const usersCollection = db.collection("users");
    const directoriesCollection = db.collection("directories");

    const userCreated = await usersCollection.insertOne({
      name,
      email,
      password,
    });
    const directoryCreated = await directoriesCollection.insertOne({
      name: `root-${email}`,
      parentDirId: null,
      userId: userCreated.insertedId,
    });
    usersCollection.updateOne(
      {
        _id: userCreated.insertedId,
      },
      { $set: { rootDirId: directoryCreated.insertedId } },
    );

    res.cookie("uid", userCreated.insertedId.toString());
    res.status(201).json({ userCreated });
  } catch (error) {
    next(error);
  }
}

async function loginUser(req, res) {
  try {
    const { db } = req;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "invalid crendiatels" });
    }
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      email,
    });

    if (!user || user.password !== password) {
      return res.status(400).json({ message: "invalid email" });
    }

    res.cookie("uid", user._id.toString(), {
      httpOnly: true,
    });
    res.json({ message: "loggineed", user });
  } catch (error) {}
}

async function logoutUser(req, res, next) {
  try {
    res.clearCookie("uid");
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

const userController = {
  registerUser,
  loginUser,
  logoutUser,
  getUserInfo,
};

export default userController;
