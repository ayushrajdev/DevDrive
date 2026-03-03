import { Router } from "express";
import { otpController } from "../controllers/otp.controller.js";

const router = Router();

router.post("/send-otp", otpController.sendOtp);
router.post("/verify-otp", otpController.verifyOtp);

export default router;
