const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

async function sendEmail(to, subject, text, attachments = []) {
  return transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject,
    text,
    attachments
  });
}

module.exports = { sendEmail };