import Otp from "../../models/otp.model.js";

export async function checkOtp(req, res, next) {
  const { otp, email } = req.body;

  const savedOtp = await Otp.findOne({
    email,
  });

  if (!(savedOtp.otp == otp)) {
    return res.json({ message: "not verified" });
  }

  savedOtp.deleteOne();
  next();
}
