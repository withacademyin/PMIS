import { sendEmailViaZeptoMail } from './zeptoMailProvider.js';

/**
 * Sends an ITI Nodal Officer invitation email
 * @param {string} toEmail 
 * @param {string} itiName 
 * @param {string} inviteLink 
 */
export const sendOfficerInvitation = async (toEmail, itiName, inviteLink) => {
  console.log(`\n\n[Email Service] Access link shared to nodal officer ${toEmail}: ${inviteLink}\n\n`);
  const subject = `You've been invited as a Nodal Officer for ${itiName} on ITI Portal`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Nodal Officer Invitation - ${itiName}</h2>
      <p>Hello,</p>
      <p>You have been nominated to serve as a Nodal Officer for <strong>${itiName}</strong> on the National ITI Portal.</p>
      <p>Please click the button below to accept your invitation and activate your officer profile:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}" style="background-color: #0F172A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Activate Officer Account</a>
      </div>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p><a href="${inviteLink}">${inviteLink}</a></p>
      <p>This invitation will expire in 48 hours.</p>
      <br />
      <p>Best regards,<br/>ITI Portal Administration</p>
    </div>
  `;

  return await sendEmailViaZeptoMail({
    to: toEmail,
    subject,
    htmlBody
  });
};

export const sendRecruiterInvitation = sendOfficerInvitation;
