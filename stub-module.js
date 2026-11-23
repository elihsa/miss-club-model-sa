// Shared Supabase stub builder for admin harness tests.
const EVENTS = [
  { id: 'evt-1', name: 'Gala Dinner', event_date: '2026-12-15', location: 'Sun City', status: 'launched', created_at: '2026-11-01' },
  { id: 'evt-2', name: 'Cape Town Auditions', event_date: '2026-12-20', location: 'Cape Town', status: 'launched', created_at: '2026-11-02' },
];
const TABLE_DATA = {
  events: EVENTS,
  interested_parties: [
    { id: 'reg-1', full_name: 'Test Person', email: 'test@example.com', event_id: 'evt-1', status: 'confirmed', created_at: '2026-11-20' },
  ],
  event_interest_subscriptions: [
    { id: 'sub-1', email: 'sub@example.com', event_id: 'evt-2', favorite_candidate: '', message: 'hi', status: 'active', subscribed_at: '2026-11-20' },
  ],
};
// sessionDelayMs simulates supabase-js async lock/storage timing; 0 = worst-case fast path
function buildStub(sessionDelayMs, withSession = true) {
  const session = withSession
    ? `{ user: { id: 'u1', email: 'test-admin@missclubmodel.test' }, access_token: 'fake' }`
    : 'null';
  return `
export function createClient() {
  const data = ${JSON.stringify(TABLE_DATA)};
  const delay = (ms) => ms ? new Promise(r => setTimeout(r, ms)) : Promise.resolve();
  function makeQuery(table) {
    const q = {
      _table: table,
      select() { return q; }, order() { return q; }, eq() { return q; },
      limit() { return q; }, range() { return q; }, filter() { return q; },
      insert() { return q; }, update() { return q; }, delete() { return q; },
      upsert() { return q; }, single() { return q; },
      then(resolve) { resolve({ data: data[table] || [], error: null }); },
    };
    return q;
  }
  return {
    auth: {
      getSession: async () => { await delay(${sessionDelayMs}); return { data: { session: ${session} }, error: null }; },
      getUser: async () => ({ data: { user: { id: 'u1', email: 'test-admin@missclubmodel.test' } }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: async () => ({ data: { user: { id: 'u1' }, session: {} }, error: null }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ data: {}, error: null }),
    },
    from: (t) => makeQuery(t),
  };
}
`;
}
module.exports = { buildStub };
