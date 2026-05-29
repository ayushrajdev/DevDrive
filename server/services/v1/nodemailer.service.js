import nodemailer from "nodemailer";
import Otp from "../../models/otp.model.js";
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  //   port: 465,
  auth: {
    user: "ayushraj2482@gmail.com",
    pass: "yftf acgb alpy ipge",
  },
});

export async function sendOtpToEmail(recieverEmail) {
  try {
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
