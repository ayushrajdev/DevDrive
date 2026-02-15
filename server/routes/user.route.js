import express from "express";
import { checkIsLoggedIn } from "../middlewares/auth.middleware.js";
import userController from "../controllers/user.controller.js";
const router = express.Router();

router.post("/register", userController.registerUser);

router.post("/login", userController.loginUser);

router.post("/logout", userController.logoutUser);

router.get("/profile", checkIsLoggedIn, userController.getUserInfo);

export default router;
