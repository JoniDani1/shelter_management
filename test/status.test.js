const test = require('node:test');
const assert = require('node:assert');
const { shelterStatus } = require('../public/shared/status.js');

const STALE = 30 * 60 * 1000;
const now = Date.parse('2026-11-14T20:00:00Z');
const fresh = new Date(now - 60 * 1000).toISOString();
const base = { totalBeds: 40, admissionOpen: true, updatedAt: fresh };

test('thresholds: available, limited, full', () => {
  assert.equal(shelterStatus({ ...base, freeBeds: 5 }, now, STALE).key, 'available');
  assert.equal(shelterStatus({ ...base, freeBeds: 4 }, now, STALE).key, 'limited');
  assert.equal(shelterStatus({ ...base, freeBeds: 1 }, now, STALE).key, 'limited');
  assert.equal(shelterStatus({ ...base, freeBeds: 0 }, now, STALE).key, 'full');
});

test('stale or future timestamps become unknown and hide the count', () => {
  const stale = new Date(now - STALE - 1000).toISOString();
  const future = new Date(now + 60 * 60 * 1000).toISOString();
  for (const updatedAt of [stale, future, 'not a date']) {
    const st = shelterStatus({ ...base, freeBeds: 10, updatedAt }, now, STALE);
    assert.equal(st.key, 'unknown');
    assert.equal(st.showCount, false);
  }
});

test('closed admissions win over a positive count', () => {
  const st = shelterStatus({ ...base, freeBeds: 10, admissionOpen: false }, now, STALE);
  assert.equal(st.key, 'closed');
  assert.equal(st.showCount, false);
});

test('hours label: evening to morning, or open around the clock', () => {
  const { hoursLabel } = require('../public/shared/status.js');
  assert.equal(hoursLabel({ opensAt: '19:00', closesAt: '08:00' }), '19:00–08:00');
  assert.equal(hoursLabel({ opensAt: '00:00', closesAt: '24:00', open24h: true }), 'Open 24h');
  assert.equal(hoursLabel({}), '');
});
