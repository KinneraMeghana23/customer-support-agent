const express = require("express");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");

const { extractEmails } = require("./ingestion/fileHandler");
const { sendEmail } = require("./services/messageGenerator");
const { scheduleJob } = require("./services/scheduler");
const { formatMessage } = require("./decision/decisionEngine");

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🌿 Serve frontend (IMPORTANT)
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({ dest: "src/uploads/" });

// 🌿 Show dashboard instead of plain text
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
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