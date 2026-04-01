'use strict';

const nodemailer = require("nodemailer");

function formatTextToHTML(text) {
  if (!text) return "";

  return text
    .replace(/(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" style="color:#1a73e8; text-decoration:none;">$1</a>')
    .replace(/\n/g, "<br>");
}

function generateMessage(customText) {
  const formattedText = formatTextToHTML(customText);

  return `
    <div style="font-family: Arial; background:#f4f6f8; padding:20px;">
      <div style="max-width:600px; margin:auto; background:#fff; padding:20px; border-radius:10px;">
        <h2 style="text-align:center;">🚀 Training Program</h2>
        <p>${formattedText}</p>
        <hr/>
        <p><b>Nextera Unitech</b></p>
      </div>
    </div>
  `;
}

// ✅ EMAIL TRANSPORT
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

// ✅ MAIN FUNCTION USED BY SERVER
async function sendEmail(to, subject, text, attachments = []) {

  const html = generateMessage(text);

  return transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject,
    html,
    attachments
  });
}

module.exports = { sendEmail };