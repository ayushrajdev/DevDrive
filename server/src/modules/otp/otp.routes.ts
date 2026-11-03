import { Router } from 'express';
import type { OtpController } from './otp.controller.js';

export function createOtpRouter(otpController: OtpController): Router {
    const router = Router();
    router.post('/send-otp', otpController.sendOtpToEmail);
    router.post('/verify-otp', otpController.verifyOtp);
    return router;
}
