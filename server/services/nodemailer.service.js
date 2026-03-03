import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  //   port: 465,
  auth: {
    user: "ayushraj2482@gmail.com",
    pass: "yftf acgb alpy ipge",
  },
});

export async function sendMail(recieverEmail) {
  try {
    await transporter.sendMail({
      from: "DevDrive <devdrive.unaux.com>",
      to: recieverEmail,
      subject: "Verification OTP",
      text: "Your OTP is 837997",
    });
    console.log("Email sent to ", recieverEmail);
  } catch (error) {
    console.log(error.message);
  }
}

