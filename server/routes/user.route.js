import express from "express";
import { writeFile } from "fs/promises";
import usersData from "../usersDB.json" with { type: "json" };
import directoriesData from "../directoriesDB.json" with { type: "json" };
import { successResponse } from "../Response.js ";
const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      res.status(409).json({ message: "invalid crediantials" });
    }
    const isEmailRegistered = usersData.find((user) => user.email == email);
    // if (isEmailRegistered !== -1) {
    //   return res.status(400).json({ message: "email already exits!!" });
    // }

    const randomUserId = crypto.randomUUID();
    const randomRootDirId = crypto.randomUUID();
    directoriesData.push({
      id: randomRootDirId,
      name: `root-${email}`,
      parentDirId: null,
      userId: randomUserId,
      files: [],
      directories: [],
    });
    usersData.push({
      id: randomUserId,
      name,
      email,
      password,
      rootDirID: randomRootDirId,
    });

    await writeFile("./directoriesDB.json", JSON.stringify(directoriesData));
    await writeFile("./usersDB.json", JSON.stringify(usersData));
    res.cookie("uid", JSON.stringify(randomUserId));
    res.status(201).json({ message: "user registered" });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);
    if (!email || !password) {
      return res.status(400).json({ message: "invalid crendiatels" });
    }
    const user = usersData.find((user) => user.email == email);
    if (user == -1 || user.password !== password) {
      return res.status(400).json({ message: "invalid email" });
    }

    res.cookie("uid", user.id, {
      httpOnly: true,
    });
    res.json({ message: "loggineed" });
  } catch (error) {}
});

router.post("/log-out", async (req, res, next) => {
  try {
    res.clearCookie("uid")
    return successResponse(res, "logged out successfull");
  } catch (error) {
    next(error);
  }
});

router.get("/profile", async (req, res, next) => {
  try {
    const { user } = req;
    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
