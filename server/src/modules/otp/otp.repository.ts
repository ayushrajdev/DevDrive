import Otp from "../../models/otp.model.js";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IOtpRepository {
  upsertOtp(payload: { otp: string; email: string }): Promise<void>;
  getOtp(email: string): Promise<{ otp: string; email: string } | null>;
  deleteOtp(email: string): Promise<void>;
}

// ─── Implementation ───────────────────────────────────────────────────────────

export class MongoOtpRepository implements IOtpRepository {
  async upsertOtp(payload: { otp: string; email: string }): Promise<void> {
    await Otp.findOneAndUpdate(
      { email: payload.email },
      { otp: payload.otp, email: payload.email },
      { upsert: true, new: true }
    );
  }

  async getOtp(email: string): Promise<{ otp: string; email: string } | null> {
    return Otp.findOne({ email }).lean<{ otp: string; email: string }>();
  }

  async deleteOtp(email: string): Promise<void> {
    await Otp.deleteOne({ email });
  }
}
