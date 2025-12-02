export const IS_TEAM_EMAILS = [
  'is@resourcery.com.ng',  // Add your real IS emails here
  'john.doe@resourcery.com.ng',
  'jane.smith@resourcery.com.ng',
].map(email => email.toLowerCase())

export const isISUser = (email: string) => IS_TEAM_EMAILS.includes(email.toLowerCase())
