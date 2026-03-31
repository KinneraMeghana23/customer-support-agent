// SEND
app.post("/send-bulk", upload.fields([
  { name: "file" },
  { name: "attachment" }
]), async (req, res) => {

  const emails = extractEmails(req.files.file[0].path);

  const { subject, message, type } = req.body;
  const finalMessage = formatMessage(type, message);

  const attachment = req.files.attachment
    ? [{ path: req.files.attachment[0].path }]
    : [];

  for (let email of emails) {
    await sendEmail(email, subject, finalMessage, attachment);
  }

  res.send("Emails sent successfully");
});


// SCHEDULE
app.post("/schedule", upload.fields([
  { name: "file" },
  { name: "attachment" }
]), (req, res) => {

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
    console.log("Scheduled emails sent");
  }, delay);

  res.send("Scheduled successfully");
});