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

// 🔐 Session
app.use(session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: true
}));

// 🌿 Static files
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({ dest: "src/uploads/" });


// 🔐 AUTH MIDDLEWARE
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
}


// 🌿 LOGIN PAGE
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});


// 🌿 LOGIN LOGIC (simple)
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "1234") {
    req.session.user = username;
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


// 🌿 DASHBOARD (PROTECTED)
app.get("/", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


// 📧 SEND EMAIL
app.post("/send-bulk", upload.fields([
  { name: "file" },
  { name: "attachment" }
]), async (req, res) => {

  try {
    const emails = extractEmails(req.files.file[0].path);

    const { subject, message, type } = req.body;
    const finalMessage = formatMessage(type, message);

    const attachment = req.files.attachment
      ? [{ path: req.files.attachment[0].path }]
      : [];

    for (let email of emails) {
      await sendEmail(email, subject, finalMessage, attachment);
    }

    res.send("✅ Emails sent successfully");

  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Error sending emails");
  }
});


// ⏳ SCHEDULE EMAIL
app.post("/schedule", upload.fields([
  { name: "file" },
  { name: "attachment" }
]), (req, res) => {

  try {
    const emails = extractEmails(req.files.file[0].path);

    const { subject, message, type, time } = req.body;
    const finalMessage = formatMessage(type, message);

    const attachment = req.files.attachment
      ? [{ path: req.files.attachment[0].path }]
      : [];

    const delay = new Date(time).getTime() - Date.now();

    setTimeout(async () => {
      for (let email of emails) {
        await sendEmail(email, subject, finalMessage, attachment);
      }
      console.log("⏳ Scheduled emails sent");
    }, delay);

    res.send("⏳ Scheduled successfully");

  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Scheduling failed");
  }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});