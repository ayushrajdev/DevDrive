import { Request, Response, NextFunction } from "express";
import { IOtpService } from "./otp.service.js";

// ─── Controller ───────────────────────────────────────────────────────────────

export class OtpController {
  constructor(private readonly otpService: IOtpService) {}

  sendOtpToEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body as { email: string };

      await this.otpService.sendOtpToEmail(email);

      res.status(200).json({ message: "OTP sent successfully." });
    } catch (error) {
      next(error);
    }
  };

  verifyOtp = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, otp } = req.body as { email: string; otp: string };

      const isValid = await this.otpService.verifyOtp({
        email,
        otpSentByClient: otp,
      });

      if (!isValid) {
        res.status(400).json({ message: "Invalid or expired OTP." });
        return;
      }

      res.status(200).json({ message: "OTP verified successfully." });
    } catch (error) {
      next(error);
    }
  };
}
