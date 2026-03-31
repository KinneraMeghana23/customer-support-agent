function formatMessage(type, message) {
  switch (type) {
    case "announcement":
      return `📢 ANNOUNCEMENT:\n${message}`;
    case "meeting":
      return `📅 MEETING NOTICE:\n${message}`;
    case "holiday":
      return `🎉 HOLIDAY NOTICE:\n${message}`;
    default:
      return message;
  }
}

module.exports = { formatMessage };