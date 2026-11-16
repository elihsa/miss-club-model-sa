// tests/unit/submit-validation.spec.js
// Regression test for POST /api/submit handler.
// Previously it returned 500 on both an empty body ("Cannot set properties of
// undefined") and a JSON body missing required fields (DB not-null violation),
// because it had no request validation and treated every DB error as 5xx.
// It must now return 4xx for invalid input, never a bare 500.
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

// Mutable fake client captured by the jest.mock factory (lazily invoked at require time).
const mockClient = {
  from: jest.fn(),
  auth: { autoRefreshToken: false, persistSession: false }
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockClient)
}));
jest.mock('resend', () => {
  class Resend { constructor() {} }
  return Resend;
});

const submitHandler = require('../../api/submit.js');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  return res;
}

// Pre-arrange: a well-formed insert resolves successfully.
function setupSuccessfulInsert() {
  const single = jest.fn().mockResolvedValue({ data: { id: 'app-1' }, error: null });
  const insert = jest.fn(() => ({ select: jest.fn(() => ({ single })) }));
  mockClient.from.mockImplementation((table) => {
    if (table === 'applications') return { insert };
    // Other tables (site_settings, events) resolve to null so async emails no-op.
    return { select: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: null, error: null }) })) };
  });
  return insert;
}

describe('POST /api/submit handler validation', () => {
  test('empty body returns 400 (not 500)', async () => {
    setupSuccessfulInsert();
    const req = { method: 'POST', body: undefined, headers: {} };
    const res = makeRes();
    await submitHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('empty object body returns 400 for missing required fields (not 500)', async () => {
    setupSuccessfulInsert();
    const req = { method: 'POST', body: {}, headers: {} };
    const res = makeRes();
    await submitHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe('error');
    expect(body.missing).toContain('fullName');
  });

  test('body missing only essay returns 400 and names essay', async () => {
    setupSuccessfulInsert();
    const req = { method: 'POST', body: { fullName: 'A', platform: 'Instagram' }, headers: {} };
    const res = makeRes();
    await submitHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].missing).toContain('essay');
  });

  test('OPTIONS returns 200', async () => {
    const req = { method: 'OPTIONS', headers: {} };
    const res = makeRes();
    await submitHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});