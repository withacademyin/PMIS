import { SendMailClient } from "zeptomail";

const url = process.env.ZEPTOMAIL_API_URL || "api.zeptomail.in/";
const token = process.env.ZEPTOMAIL_API_KEY;

// Initialize client lazily or when token is present
let client;

if (token && token.trim() !== "") {
  client = new SendMailClient({url, token});
} else {
  console.warn("⚠️ ZeptoMail token is missing. Emails will be logged to console instead of sent.");
}

export const sendEmailViaZeptoMail = async ({ to, subject, htmlBody }) => {
  if (!client) {
    console.log("Mock ZeptoMail Send:");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${htmlBody}`);
    return { success: true, mocked: true };
  }

  try {
    let fromAddress = "noreply@hiringportal.com";
    let fromName = "Hiring Portal";
    
    if (process.env.EMAIL_FROM) {
      // Parse "Name <email@domain.com>"
      const match = process.env.EMAIL_FROM.match(/(.*)<(.*)>/);
      if (match) {
        fromName = match[1].trim();
        fromAddress = match[2].trim();
      } else {
        fromAddress = process.env.EMAIL_FROM.trim();
      }
    }

    const response = await client.sendMail({
      from: {
        address: fromAddress,
        name: fromName
      },
      to: [
        {
          email_address: {
            address: to,
            name: "User"
          }
        }
      ],
      subject: subject,
      htmlbody: htmlBody,
    });
    return { success: true, data: response };
  } catch (error) {
    console.error("ZeptoMail Send Error:", error);
    throw new Error("Failed to send email via ZeptoMail.");
  }
};
