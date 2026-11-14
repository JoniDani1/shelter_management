// Availability status rules, shared by the browser pages and the server tests.
// Thresholds follow docs/berlin-shelter-board-concept.md (section 6):
//   stale or missing confirmation -> Unknown (count hidden, never shown as 0)
//   admissions closed            -> Closed  (count hidden)
//   0 free beds                  -> Full
//   1-4 free beds                -> Limited
//   5+ free beds                 -> Available
(function (root) {
  const LIMITED_BELOW = 5;

  function shelterStatus(shelter, now, staleAfterMs) {
    const updated = Date.parse(shelter.updatedAt);
    const age = now - updated;
    // Also treat timestamps far in the future as invalid (clock tolerance: 5 min).
    if (!Number.isFinite(updated) || age > staleAfterMs || age < -5 * 60 * 1000) {
      return { key: 'unknown', label: 'Unknown', showCount: false };
    }
    if (!shelter.admissionOpen) return { key: 'closed', label: 'Closed', showCount: false };
    if (!Number.isInteger(shelter.freeBeds)) {
      return { key: 'unknown', label: 'Unknown', showCount: false };
    }
    if (shelter.freeBeds === 0) return { key: 'full', label: 'Full', showCount: true };
    if (shelter.freeBeds < LIMITED_BELOW) return { key: 'limited', label: 'Limited', showCount: true };
    return { key: 'available', label: 'Available', showCount: true };
  }

  // Who a shelter admits. Values: "all", "women", "men".
  const ADMITS_LABELS = { all: 'Women & men', women: 'Women only', men: 'Men only' };
  function admitsLabel(admits) {
    return ADMITS_LABELS[admits] || 'Ask at the door';
  }

  function hoursLabel(shelter) {
    if (shelter.open24h) return 'Open 24h';
    return shelter.opensAt && shelter.closesAt ? `${shelter.opensAt}–${shelter.closesAt}` : '';
  }

  const api = { shelterStatus, admitsLabel, hoursLabel, LIMITED_BELOW };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TonightStatus = api;
})(this);
