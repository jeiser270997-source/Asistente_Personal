const { authorize } = require('../../lib/google_auth');

const SCOPES = ['https://mail.google.com/'];

async function gmailAuthorize() {
  return authorize(SCOPES);
}

module.exports = { authorize: gmailAuthorize };
