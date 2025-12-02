export const IS_TEAM_EMAILS = [
  'is@resourcery.com',  // Add your real IS emails here
  'ezekiele@resourcery.com.ng',
  'malikm@resourcery.com.ng',
].map(email => email.toLowerCase())

export const isISUser = (email: string) => IS_TEAM_EMAILS.includes(email.toLowerCase())
