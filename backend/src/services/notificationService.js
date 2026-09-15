// mock candidate notification service

export const notifyApplicationSubmitted = async ({
  studentName,
  studentEmail,
  jobTitle,
  companyName,
  matchScore,
}) => {
  const timestamp = new Date().toISOString();
  console.log(`[notification] application received: ${studentName} (${studentEmail}) applied for ${jobTitle} at ${companyName} with match score ${matchScore}% at ${timestamp}`);
  return { delivered: true, timestamp, type: 'application_submitted' };
};

export const notifyStatusUpdated = async ({
  studentName,
  studentEmail,
  jobTitle,
  companyName,
  status,
  interviewDate,
  interviewLink,
}) => {
  const timestamp = new Date().toISOString();
  console.log(`[notification] status update: ${studentName} (${studentEmail}) application for ${jobTitle} at ${companyName} is now ${status} at ${timestamp}`);

  if (interviewDate && interviewLink) {
    console.log(`[notification] interview invite: meeting scheduled for ${interviewDate} via link ${interviewLink}`);
  }

  return { delivered: true, timestamp, type: 'status_updated' };
};
