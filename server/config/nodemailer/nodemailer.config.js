import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  //   port: 465,
  auth: {
    user: "ayushraj2482@gmail.com",
    pass: "yftf acgb alpy ipge",
  },
});

export default transporter