// One shelter at a glance, in the same order of information as the station
// board (/board/): free beds first, then name, who is admitted, nearest station.
import { AnimatedNumber } from "./ui/animated-number";
import type { Shelter } from "../types/models";

const WHO: Record<Shelter["eligibility"], string | null> = {
  Women: "Women only",
  Men: "Men only",
  "All adults": null,
};

// "S+U Rathaus Steglitz" -> { lines: ["S", "U"], name: "Rathaus Steglitz" }
export function parseStation(raw: string | null) {
  if (!raw) return null;
  const m = raw.match(/^((?:S\+U|U\+S|U|S)\s+)?(.*)$/);
  return {
    lines: (m?.[1] || "").split(/[+\s]+/).filter(Boolean),
    name: m?.[2] ?? raw,
  };
}

const RANK = { available: 0, limited: 1, full: 2, unknown: 3 } as const;
// Most free beds first; full and unknown at the end (like the board).
export function byAvailability(a: Shelter, b: Shelter) {
  return (
    RANK[a.availabilityStatus] - RANK[b.availabilityStatus] ||
    b.availableBeds - a.availableBeds ||
    a.name.localeCompare(b.name)
  );
}

export function ShelterRowContent({ shelter: s }: { shelter: Shelter }) {
  const st = parseStation(s.nearestStation);
  const who = WHO[s.eligibility];
  const unknown = s.availabilityStatus === "unknown";
  return (
    <>
      <span className={`bed-tile ${s.availabilityStatus}`}>
        <b>{unknown ? "?" : <AnimatedNumber value={s.availableBeds} />}</b>
        <small>
          {unknown
            ? "no info"
            : s.availabilityStatus === "full"
              ? "full"
              : s.availableBeds === 1
                ? "bed"
                : "beds"}
        </small>
      </span>
      <span className="row-info">
        <span className="row-name">{s.name}</span>
        <span className="row-meta">
          {who && <span className="who-chip">{who}</span>}
          {st ? (
            <span className="row-station">
              {st.lines.map((l) => (
                <i key={l} className={`line-badge line-${l.toLowerCase()}`}>
                  {l}
                </i>
              ))}
              {st.name}
            </span>
          ) : (
            <span className="row-station">{s.district}</span>
          )}
        </span>
      </span>
    </>
  );
}
