'use strict';

function formatTextToHTML(text) {
  if (!text) return "";

  return text
    // clickable links
    .replace(/(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" style="color:#1a73e8; text-decoration:none;">$1</a>')
    // line breaks
    .replace(/\n/g, "<br>");
}

function generateMessage(type, customText, user, link) {
  let subject = "Training Program Invitation";

  const formattedText = formatTextToHTML(customText);

  const html = `
    <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
      
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; padding:20px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <h2 style="color:#2c3e50; text-align:center;">
          🚀 AI, ML & Gen-AI Training Program
        </h2>

        <!-- Greeting -->
        <p style="font-size:15px;">
          Dear ${user.name || "Participant"},
        </p>

        <!-- Main Content -->
        <p style="font-size:14px; line-height:1.7;">
          ${formattedText}
        </p>

        <!-- Button -->
        ${link ? `
          <div style="text-align:center; margin:20px 0;">
            <a href="${link}" target="_blank"
              style="background:#1a73e8; color:#fff; padding:12px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">
              🔗 Register Now
            </a>
          </div>
        ` : ""}

        <!-- Footer -->
        <hr style="margin:20px 0;" />

        <p style="font-size:13px; color:#555;">
          Regards,<br/>
          <b>Nextera Unitech</b><br/>
          📞 8121983182
        </p>

      </div>
    </div>
  `;

  return { subject, html };
}

module.exports = { generateMessage };