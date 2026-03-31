async function sendEmail(to, subject, text, attachments = []) {
  const mailOptions = {
    from: process.env.EMAIL,
    to,
    subject,
    text,
    attachments
  };

  return transporter.sendMail(mailOptions);
}