// Sender address for all outgoing mail. missclubmodelsa.co.za is not a
// verified Resend domain, so sends from noreply@missclubmodelsa.co.za are
// rejected by the Resend API and no mail ever leaves. Until a domain is
// verified, default to Resend's shared test sender, which delivers to the
// account owner's address - enough for dev testing with controlled
// identities. Override with RESEND_FROM once a real domain is verified.
const EMAIL_FROM = process.env.RESEND_FROM || 'Miss Club Model SA <onboarding@resend.dev>';
module.exports = { EMAIL_FROM };
