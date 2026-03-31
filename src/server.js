const express = require("express");
const dotenv = require("dotenv");
const multer = require("multer");

const { extractEmails } = require("./ingestion/fileHandler");
const { sendEmail } = require("./services/messageGenerator");
const { scheduleJob } = require("./services/scheduler");
const { formatMessage } = require("./decision/decisionEngine");

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: "src/uploads/" });

app.get("/", (req, res) => {
  res.send("🌿 Bulk Email System Running");
});


// 🌱 SEND BULK EMAILS
app.post("/send-bulk", upload.single("file"), async (req, res) => {
  try {
    const emails = extractEmails(req.file.path);

    const { subject, message, type } = req.body;

    const finalMessage = formatMessage(type, message);

    for (let email of emails) {
      await sendEmail(email, subject, finalMessage);
    }

    res.send("✅ Emails sent successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Error sending emails");
  }
});


// 🌱 SCHEDULE EMAILS
app.post("/schedule", upload.single("file"), (req, res) => {
  try {
    const emails = extractEmails(req.file.path);
    const { subject, message, type, cronTime } = req.body;

    const finalMessage = formatMessage(type, message);

    scheduleJob(cronTime, async () => {
      for (let email of emails) {
        await sendEmail(email, subject, finalMessage);
      }
      console.log("⏳ Scheduled emails sent");
    });

    res.send("⏳ Emails scheduled successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Scheduling failed");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});