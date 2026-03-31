function ingestEmail(email) {
  console.log("📩 Email received:", email);
  return email.message;
}

module.exports = { ingestEmail };