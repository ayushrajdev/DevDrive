import nodemailer from "nodemailer";
import { IOtpRepository } from "./otp.repository.js";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IOtpService {
  sendOtpToEmail(email: string): Promise<void>;
  verifyOtp(payload: { email: string; otpSentByClient: string }): Promise<boolean>;
}

// ─── Implementation ───────────────────────────────────────────────────────────

export class OtpService implements IOtpService {
  constructor(
    private readonly otpRepository: IOtpRepository,
    private readonly transporter: nodemailer.Transporter | null
  ) {}

  async sendOtpToEmail(email: string): Promise<void> {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    await this.otpRepository.upsertOtp({ otp, email });

    if (this.transporter) {
      await this.transporter.sendMail({
        from: "DevDrive <no-reply@devdrive.com>",
        to: email,
        subject: "Your DevDrive OTP",
        text: `Your one-time password is: ${otp}. It expires shortly.`,
        html: `<p>Your one-time password is: <strong>${otp}</strong>. It expires shortly.</p>`,
      });
    }
  }

  async verifyOtp(payload: { email: string; otpSentByClient: string }): Promise<boolean> {
    const { email, otpSentByClient } = payload;

    const record = await this.otpRepository.getOtp(email);

    if (!record || record.otp !== otpSentByClient) {
      return false;
    }

    await this.otpRepository.deleteOtp(email);
    return true;
  }
}
