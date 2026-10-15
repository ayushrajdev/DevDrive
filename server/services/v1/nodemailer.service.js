import Otp from "../../models/otp.model.js";
import transporter from "../../config/nodemailer/nodemailer.config.js";

export async function sendOtpToEmail(recieverEmail) {
  try {
    if (!transporter) throw new Error("SMTP_HOST is required to send email");
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const savedOtpInDb = await Otp.findOneAndUpdate(
      {
        email: recieverEmail,
      },
      {
        otp,
        // createdAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      },
    );
    await transporter.sendMail({
      from: "DevDrive <devdrive.unaux.com>",
      to: recieverEmail,
      subject: "Verification OTP",
      text: `Your OTP is ${otp}`,
    });
    return {
      success: true,
      error: null,
      message: "Otp sent to the user",
    };
  } catch (error) {
    console.log(error.message);
  }
}
