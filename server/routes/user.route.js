import express from "express";
import { checkUserAuth } from "../middlewares/auth.middleware.js";
import userController from "../controllers/user.controller.js";
import { checkSessionValid } from "../middlewares/session.middleware.js";
import { checkOtp } from "../middlewares/otp.middleware.js";
const router = express.Router();

router.post("/register", checkOtp.userController.registerUser);

router.post("/login", checkOtp, userController.loginUser);

router.post("/logout", userController.logoutUser);
router.post(
  "/logout/alldevices",
  checkSessionValid,
  checkUserAuth,
  userController.logoutFromAllDevices,
);

router.get(
  "/profile",
  checkSessionValid,
  checkUserAuth,
  userController.getUserInfo,
);

export default router;
