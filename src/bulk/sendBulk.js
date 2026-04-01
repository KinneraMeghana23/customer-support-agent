'use strict';

require('dotenv').config();

const nodemailer = require('nodemailer');
const { getFilteredUsers } = require('./filterUsers');
const { generateMessage } = require('../services/messageGenerator');
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');
const SENT_FILE = path.join(LOG_DIR, 'sent.json');
const FAILED_FILE = path.join(LOG_DIR, 'failed.json');

// ensure logs folder
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

// load logs
function loadJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file));
  } catch {
    return [];
  }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

let sentList = loadJSON(SENT_FILE);
let failedList = loadJSON(FAILED_FILE);

// transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// config
const BATCH_SIZE = 5;
const DELAY = 4000;

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// image preview
function generateImagePreviewHTML(attachments) {
  let html = "";
  attachments.forEach(att => {
    if (att.filename.match(/\.(jpg|jpeg|png|gif)$/i)) {
      html += `<div style="text-align:center;margin-top:15px;">
        <img src="cid:${att.cid}" style="max-width:100%;border-radius:8px;" />
      </div>`;
    }
  });
  return html;
}

async function sendBulkEmail(filters, subject, type, customText, link, filePaths = []) {

  let users = getFilteredUsers(filters);

  console.log("📊 Total users:", users.length);

  // remove already sent users (RESUME)
  users = users.filter(user => {
    const email =
      user.email || user.Email || user["Email id"] || user.EMAIL || user.mail || user.Mail;
    return email && !sentList.includes(email);
  });

  console.log("🔄 Remaining users:", users.length);

  await delay(3000);

  for (let i = 0; i < users.length; i += BATCH_SIZE) {

    const batch = users.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (user) => {

      const email =
        user.email || user.Email || user["Email id"] || user.EMAIL || user.mail || user.Mail;

      if (!email) return;

      try {
        const msg = generateMessage(type, customText, user, link);

        const attachments = filePaths.map((file, index) => ({
          filename: file.split('\\').pop(),
          path: file,
          cid: `image${index}`
        }));

        const trackingPixel = `
          <img src="http://localhost:${process.env.PORT}/track/${email}" width="1" height="1" />
        `;

        const finalHTML =
          msg.html +
          generateImagePreviewHTML(attachments) +
          trackingPixel;

        await transporter.sendMail({
          from: `"Nextera Unitech" <${process.env.SMTP_USER}>`,
          to: email,
          subject: msg.subject,
          html: finalHTML,
          attachments,
        });

        console.log("✅ Sent:", email);

        sentList.push(email);
        saveJSON(SENT_FILE, sentList);

      } catch (err) {
        console.log("❌ Failed:", email);

        failedList.push(email);
        saveJSON(FAILED_FILE, failedList);
      }

    }));

    console.log(`⏳ Batch done (${i + BATCH_SIZE}/${users.length})`);

    await delay(DELAY);
  }

  console.log("🎉 Sending complete");
}

// 🔁 retry failed emails
async function retryFailedEmails(type, customText, link, filePaths = []) {

  console.log("🔁 Retrying failed emails:", failedList.length);

  const retryUsers = failedList.map(email => ({ email }));

  failedList = [];

  for (let i = 0; i < retryUsers.length; i += BATCH_SIZE) {

    const batch = retryUsers.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (user) => {

      const email = user.email;

      try {
        const msg = generateMessage(type, customText, user, link);

        await transporter.sendMail({
          from: `"Nextera Unitech" <${process.env.SMTP_USER}>`,
          to: email,
          subject: msg.subject,
          html: msg.html,
        });

        console.log("✅ Retry success:", email);

        sentList.push(email);

      } catch {
        console.log("❌ Retry failed:", email);
        failedList.push(email);
      }

    }));

    await delay(DELAY);
  }

  saveJSON(SENT_FILE, sentList);
  saveJSON(FAILED_FILE, failedList);

  console.log("🔁 Retry complete");
}

module.exports = { sendBulkEmail, retryFailedEmails };