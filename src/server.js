const express = require("express");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const session = require("express-session");

const { extractEmails } = require("./ingestion/fileHandler");
const { sendEmail } = require("./services/messageGenerator");
const { formatMessage } = require("./decision/decisionEngine");

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔐 SESSION
app.use(session({
  secret: "secure-key",
  resave: false,
  saveUninitialized: true
}));

// ⚠️ STATIC FIX
app.use("/static", express.static(path.join(__dirname, "public")));

const upload = multer({ dest: "src/uploads/" });


// 🔐 AUTH MIDDLEWARE
function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}


// 🌿 LOGIN PAGE
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});


// 🌿 LOGIN LOGIC
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.LOGIN_USER &&
    password === process.env.LOGIN_PASS
  ) {
    req.session.user = true;
    res.redirect("/");
  } else {
    res.send("❌ Invalid credentials");
  }
});


// 🌿 LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});


// 🌿 DASHBOARD
app.get("/", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


// 📊 IN-MEMORY LOG STORAGE
let logs = [];


// 📧 SEND EMAIL
app.post("/send-bulk", upload.fields([
  { name: "file" },
  { name: "attachment" }
]), async (req, res) => {

  try {
    // ⚠️ SAFE CHECKS
    if (!req.files || !req.files.file) {
      return res.status(400).send("❌ Excel file missing");
    }

    const filePath = req.files.file[0].path;
    const emails = extractEmails(filePath);

    if (!emails || emails.length === 0) {
      return res.status(400).send("❌ No emails found in file");
    }

    const { subject, message, type } = req.body;
    const finalMessage = formatMessage(type, message);

    const attachment = req.files.attachment
      ? [{ path: req.files.attachment[0].path }]
      : [];

    for (let email of emails) {
      await sendEmail(email, subject, finalMessage, attachment);
    }

    // 📊 Save log
    logs.push({
      subject,
      count: emails.length,
      date: new Date()
    });

    res.send("✅ Emails sent successfully");

  } catch (err) {
    console.error("FULL ERROR:", err);
    res.status(500).send("❌ " + err.message);
  }
});


// ⏳ SCHEDULE EMAIL
app.post("/schedule", upload.fields([
  { name: "file" },
  { name: "attachment" }
]), (req, res) => {

  try {
    if (!req.files || !req.files.file) {
      return res.status(400).send("❌ Excel file missing");
    }

    const filePath = req.files.file[0].path;
    const emails = extractEmails(filePath);

    const { subject, message, type, time } = req.body;
    const finalMessage = formatMessage(type, message);

    const attachment = req.files.attachment
      ? [{ path: req.files.attachment[0].path }]
      : [];

    const delay = new Date(time).getTime() - Date.now();

    if (delay < 0) {
      return res.status(400).send("❌ Invalid time selected");
    }

    setTimeout(async () => {
      for (let email of emails) {
        await sendEmail(email, subject, finalMessage, attachment);
      }

      logs.push({
        subject,
        count: emails.length,
        date: new Date()
      });

      console.log("⏳ Scheduled emails sent");

    }, delay);

    res.send("⏳ Scheduled successfully");

  } catch (err) {
    console.error("SCHEDULE ERROR:", err);
    res.status(500).send("❌ Scheduling failed");
  }
});


// 📊 ANALYTICS API
app.get("/analytics", (req, res) => {
  const totalEmails = logs.reduce((sum, l) => sum + l.count, 0);

  res.json({
    totalCampaigns: logs.length,
    totalEmails
  });
});


// 📜 HISTORY API
app.get("/history", (req, res) => {
  res.json(logs);
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});