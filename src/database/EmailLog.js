const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  subject: String,
  message: String,
  type: String,
  count: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("EmailLog", logSchema);