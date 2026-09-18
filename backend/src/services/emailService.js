import { sendEmailViaZeptoMail } from './zeptoMailProvider.js';

/**
 * Sends a recruiter invitation email
 * @param {string} toEmail 
 * @param {string} companyName 
 * @param {string} inviteLink 
 */
export const sendRecruiterInvitation = async (toEmail, companyName, inviteLink) => {
  console.log(`\n\n[Email Service] Access link shared to recruiter ${toEmail}: ${inviteLink}\n\n`);
  const subject = `You've been invited to join ${companyName} on Hiring Portal`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Invitation to join ${companyName}</h2>
      <p>Hello,</p>
      <p>You have been invited to join the hiring team for <strong>${companyName}</strong> on the Hiring Portal.</p>
      <p>Please click the button below to accept your invitation and set up your account:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation</a>
      </div>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p><a href="${inviteLink}">${inviteLink}</a></p>
      <p>This invitation will expire in 48 hours.</p>
      <br />
      <p>Best regards,<br/>The Talent Portal Team</p>
    </div>
  `;

  return await sendEmailViaZeptoMail({
    to: toEmail,
    subject,
    htmlBody
  });
};
