const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: process.env.EMAIL,
    to,
    subject,
    text
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };