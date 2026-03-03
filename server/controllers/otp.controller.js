import Otp from "../models/otp.model.js";
import { sendOtpWithMail } from "../services/nodemailer.service.js";

async function sendOtp(req, res, next) {
  try {
    const email = req.body.email;
    console.log(req.body);
    const result = await sendOtpWithMail(email);
    console.log(email);
    return res.json(result);
  } catch (error) {
    console.log(error.message);
  }
}
async function verifyOtp(req, res, next) {
  try {
    const otpSentByClient = req.body.otp;
    const email = req.body.email;
    const savedOtp = await Otp.findOne({
      email,
    });
    console.log(otpSentByClient, savedOtp.otp);
    if (!(otpSentByClient === savedOtp.otp)) {
      return res
        .status(404)
        .json({ success: false, message: "not valid user" });
    }

    return res.status(200).json({ success: true, message: "valid user" });
  } catch (error) {
    console.log(error.message);
  }
}

export const otpController = {
  sendOtp,
  verifyOtp,
};
