import { Router } from "express";
import { getTransporter } from "../../config/nodemailer.config.js";
import { MongoOtpRepository } from "./otp.repository.js";
import { OtpService } from "./otp.service.js";
import { OtpController } from "./otp.controller.js";

export function createOtpRouter(otpController: OtpController): Router {
    const router = Router();
    router.post("/send-otp", otpController.sendOtpToEmail);
    router.post("/verify-otp", otpController.verifyOtp);
    return router;
}

// Default instance wiring
const otpRepository = new MongoOtpRepository();
const transporter = getTransporter();
const otpService = new OtpService(otpRepository, transporter);
const otpController = new OtpController(otpService);

const router = createOtpRouter(otpController);
export default router;
