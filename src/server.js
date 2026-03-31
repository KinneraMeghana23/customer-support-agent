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

app.use(session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, "public")));

const upload = multer({ dest: "src/uploads/" });

function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}

/* LOGIN */
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "1234") {
    req.session.user = username;
    res.redirect("/");
  } else {
    res.send("Invalid credentials");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

/* CREATE ADMIN (run once) */
app.get("/register", async (req, res) => {
  const hashed = await bcrypt.hash("1234", 10);

  await User.create({
    username: "admin",
    password: hashed,
    role: "admin"
  });

  res.send("Admin created");
});

/* DASHBOARD */
app.get("/", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* SEND EMAIL */
app.post("/send-bulk", upload.fields([{ name: "file" }, { name: "attachment" }]), async (req, res) => {

  const emails = extractEmails(req.files.file[0].path);

  const { subject, message, type } = req.body;
  const finalMessage = formatMessage(type, message);

  const attachment = req.files.attachment
    ? [{ path: req.files.attachment[0].path }]
    : [];

  for (let email of emails) {
    await sendEmail(email, subject, finalMessage, attachment);
  }

  await EmailLog.create({
    subject,
    message,
    type,
    count: emails.length
  });

  res.send("Emails sent successfully");
});

/* SCHEDULE */
app.post("/schedule", upload.fields([{ name: "file" }, { name: "attachment" }]), (req, res) => {

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
  }, delay);

  res.send("Scheduled successfully");
});

/* HISTORY */
app.get("/history", isAuthenticated, async (req, res) => {
  const logs = await EmailLog.find().sort({ date: -1 });
  res.json(logs);
});

/* ANALYTICS */
app.get("/analytics", isAuthenticated, async (req, res) => {
  const logs = await EmailLog.find();

  const totalEmails = logs.reduce((sum, l) => sum + l.count, 0);

  res.json({
    totalCampaigns: logs.length,
    totalEmails
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});