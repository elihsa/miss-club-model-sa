// Contact form handler: local stub mailer only, nothing is ever sent.
const handler = require('../../api/contact');

function call(body, method = 'POST') {
  return new Promise((resolve) => {
    const res = {
      headers: {}, code: 200,
      setHeader(k, v) { this.headers[k] = v; },
      status(c) { this.code = c; return this; },
      json(o) { resolve({ code: this.code, body: o }); },
      end() { resolve({ code: this.code }); }
    };
    handler({ method, headers: {}, body }, res);
  });
}
const good = { name: 'Test Person', email: 'person@example.com', subject: 'venue', message: 'Hello <b>there</b>' };

describe('POST /api/contact', () => {
  let sent;
  beforeEach(() => {
    sent = [];
    handler._setMailer({ send: async (m) => { sent.push(m); return {}; } });
    handler._setSettings(async () => null);
    process.env.CONTACT_RECIPIENT_EMAIL = 'recipient@test.invalid';
  });
  afterEach(() => { delete process.env.CONTACT_RECIPIENT_EMAIL; });

  test('rejects non-POST', async () => { expect((await call(good, 'GET')).code).toBe(405); });
  test('validates name, email, message', async () => {
    expect((await call({ ...good, name: '' })).code).toBe(400);
    expect((await call({ ...good, email: 'nope' })).code).toBe(400);
    expect((await call({ ...good, message: '  ' })).code).toBe(400);
    expect(sent.length).toBe(0);
  });
  test('uses contact_email from Email Settings', async () => {
    handler._setSettings(async () => ({ contact_email: 'settings@test.invalid', send_all_to_same: false, global_email: 'global@test.invalid' }));
    await call(good);
    expect(sent[0].to).toBe('settings@test.invalid');
  });
  test('uses global_email when send_all_to_same is on', async () => {
    handler._setSettings(async () => ({ contact_email: 'settings@test.invalid', send_all_to_same: true, global_email: 'global@test.invalid' }));
    await call(good);
    expect(sent[0].to).toBe('global@test.invalid');
  });
  test('legacy record without contact_email, or no record at all: env then approved default', async () => {
    handler._setSettings(async () => ({ send_all_to_same: false }));
    await call(good);
    expect(sent[0].to).toBe('recipient@test.invalid');
    delete process.env.CONTACT_RECIPIENT_EMAIL;
    handler._setSettings(async () => null);
    await call(good);
    expect(sent[1].to).toBe('elihsa@gmail.com');
  });
  test('settings read error fails closed: 503, nothing sent, no fallback', async () => {
    handler._setSettings(async () => { throw new Error('db down'); });
    const r = await call(good);
    expect(r.code).toBe(503);
    expect(sent.length).toBe(0);
  });
  test('configured but invalid contact_email fails closed', async () => {
    handler._setSettings(async () => ({ contact_email: 'not-an-email' }));
    expect((await call(good)).code).toBe(503);
    expect(sent.length).toBe(0);
  });
  test('send-all with an invalid or empty global_email fails closed and never uses contact_email', async () => {
    handler._setSettings(async () => ({ send_all_to_same: true, global_email: 'bad', contact_email: 'ok@test.invalid' }));
    expect((await call(good)).code).toBe(503);
    handler._setSettings(async () => ({ send_all_to_same: true, global_email: '', contact_email: 'ok@test.invalid' }));
    expect((await call(good)).code).toBe(503);
    expect(sent.length).toBe(0);
  });
  test('503 and nothing sent when no mail provider is configured', async () => {
    handler._setMailer(null);
    delete process.env.RESEND_API_KEY;
    expect((await call(good)).code).toBe(503);
    expect(sent.length).toBe(0);
  });
  test('sends one escaped email to the configured recipient with reply-to', async () => {
    const r = await call(good);
    expect(r.code).toBe(200);
    expect(sent.length).toBe(1);
    expect(sent[0].to).toBe('recipient@test.invalid');
    expect(sent[0].replyTo).toBe('person@example.com');
    expect(sent[0].html).toContain('Hello &lt;b&gt;there&lt;/b&gt;');
    expect(sent[0].subject).toContain('Venue Partnership');
  });
  test('honeypot sends nothing', async () => {
    expect((await call({ ...good, website: 'spam' })).code).toBe(200);
    expect(sent.length).toBe(0);
  });
  test('mailer failure gives 500', async () => {
    handler._setMailer({ send: async () => ({ error: { message: 'boom' } }) });
    expect((await call(good)).code).toBe(500);
  });
});
