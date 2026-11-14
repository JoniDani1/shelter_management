import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import {
  Search,
  SlidersHorizontal,
  LocateFixed,
  BedDouble,
  MapPin,
  ArrowUpRight,
  RotateCcw,
} from "lucide-react";
import { useShelters } from "../store/ShelterStore";
import { AnimatedNumber } from "./ui/animated-number";
import { TextMorph } from "./ui/text-morph";
import {
  MorphingPopover,
  MorphingPopoverTrigger,
  MorphingPopoverContent,
} from "./ui/morphing-popover";
import ToolbarExpandable from "./ui/toolbar-expandable";
import { ShelterDetails } from "./ShelterDetails";
import type { Shelter } from "../types/models";
function MapMarker({
  shelter: s,
  selected,
  onSelect,
  compact,
  position,
}: {
  shelter: Shelter;
  selected: string | null;
  onSelect: (id: string | null) => void;
  compact: boolean;
  position?: L.LatLngExpression;
}) {
  const element = useMemo(() => document.createElement("div"), []);
  const icon = useMemo(
    () =>
      L.divIcon({
        html: element,
        className: "shelter-marker-host",
        iconSize: compact ? [36, 36] : [62, 42],
        iconAnchor: compact ? [18, 18] : [31, 21],
      }),
    [element, compact],
  );
  const rect = element.getBoundingClientRect();
  const panelStyle = {
    position: "fixed" as const,
    left: Math.max(12, Math.min(rect.right + 12, window.innerWidth - 340)),
    top: Math.max(115, Math.min(rect.top - 150, window.innerHeight - 590)),
  };
  return (
    <>
      <Marker
        position={position ?? [s.coordinates.latitude, s.coordinates.longitude]}
        icon={icon}
        keyboard={false}
        zIndexOffset={selected === s.id ? 10000 : 0}
      />
      {createPortal(
        <MorphingPopover
          open={selected === s.id}
          onOpenChange={(open) => onSelect(open ? s.id : null)}
        >
          <MorphingPopoverTrigger
            className={`bed-marker ${s.availabilityStatus}${compact ? " compact" : ""}`}
            aria-label={`${s.name}: ${s.availabilityStatus === "unknown" ? "unconfirmed" : s.availableBeds} demonstration beds`}
          >
            {!compact && <BedDouble size={15} />}
            {s.availabilityStatus === "unknown" ? (
              "?"
            ) : (
              <AnimatedNumber value={s.availableBeds} />
            )}
          </MorphingPopoverTrigger>
          {createPortal(
            <MorphingPopoverContent
              style={panelStyle}
              className="marker-detail"
              aria-label={s.name}
            >
              <ShelterDetails shelter={s} onClose={() => onSelect(null)} />
            </MorphingPopoverContent>,
            document.body,
          )}
        </MorphingPopover>,
        element,
      )}
    </>
  );
}
// Zoomed out, nearby shelters are merged into one bubble (sum of known free
// beds + number of shelters) so pins never pile up; tapping it zooms in.
// Below DETAIL_ZOOM pins are small round dots without the bed icon.
const DETAIL_ZOOM = 13;
// From here on nothing is merged; shelters at (almost) the same address are
// fanned out around their point instead.
const SPREAD_ZOOM = 16;
type Group = { shelters: Shelter[]; x: number; y: number };

function groupStatus(list: Shelter[]) {
  const known = list.filter((s) => s.availabilityStatus !== "unknown");
  if (!known.length) return { status: "unknown", beds: 0 };
  const beds = known.reduce((a, s) => a + s.availableBeds, 0);
  return { status: beds === 0 ? "full" : beds < 5 ? "limited" : "available", beds };
}

function ClusterMarker({ group }: { group: Group }) {
  const map = useMap();
  const { status, beds } = groupStatus(group.shelters);
  const n = group.shelters.length;
  const lat = group.shelters.reduce((a, s) => a + s.coordinates.latitude, 0) / n;
  const lng = group.shelters.reduce((a, s) => a + s.coordinates.longitude, 0) / n;
  const label = `${n} shelters, ${status === "unknown" ? "unknown" : beds} free demo beds. Zoom in`;
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "shelter-marker-host",
        iconSize: [52, 52],
        iconAnchor: [26, 26],
        html: `<span class="cluster-marker ${status}" role="button" aria-label="${label}"><b>${status === "unknown" ? "?" : beds}</b><small>${n} places</small></span>`,
      }),
    [status, beds, n, label],
  );
  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      title={label}
      eventHandlers={{
        click: () => {
          const bounds = L.latLngBounds(
            group.shelters.map((s) => [s.coordinates.latitude, s.coordinates.longitude]),
          );
          const target = Math.min(map.getBoundsZoom(bounds.pad(0.4)), 17);
          map.flyTo(bounds.getCenter(), Math.max(target, map.getZoom() + 1), {
            duration: 0.5,
          });
        },
      }}
    />
  );
}

function ShelterMarkers({
  shelters,
  selected,
  onSelect,
}: {
  shelters: Shelter[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const compact = zoom < DETAIL_ZOOM;
  const spread = zoom >= SPREAD_ZOOM;
  const radius = compact ? 40 : 64;
  const groups = useMemo(() => {
    const out: Group[] = [];
    for (const s of shelters) {
      const p = map.project([s.coordinates.latitude, s.coordinates.longitude], zoom);
      // The open shelter always keeps its own pin.
      const near =
        s.id === selected
          ? undefined
          : out.find(
              (g) =>
                g.shelters[0].id !== selected &&
                Math.hypot(g.x - p.x, g.y - p.y) < radius,
            );
      if (near) {
        near.shelters.push(s);
        const k = near.shelters.length;
        near.x += (p.x - near.x) / k;
        near.y += (p.y - near.y) / k;
      } else out.push({ shelters: [s], x: p.x, y: p.y });
    }
    return out;
  }, [shelters, zoom, radius, selected, map]);
  return (
    <>
      {groups.map((g) =>
        spread && g.shelters.length > 1 ? (
          g.shelters.map((s, i) => {
            const angle = (2 * Math.PI * i) / g.shelters.length - Math.PI / 2;
            const at = map.unproject(
              [g.x + Math.cos(angle) * 44, g.y + Math.sin(angle) * 34],
              zoom,
            );
            return (
              <MapMarker
                key={s.id}
                shelter={s}
                selected={selected}
                onSelect={onSelect}
                compact={false}
                position={at}
              />
            );
          })
        ) : g.shelters.length === 1 ? (
          <MapMarker
            key={g.shelters[0].id}
            shelter={g.shelters[0]}
            selected={selected}
            onSelect={onSelect}
            compact={compact}
          />
        ) : (
          <ClusterMarker key={g.shelters.map((s) => s.id).join("|")} group={g} />
        ),
      )}
    </>
  );
}

function MapFocus({
  selected,
  reset,
}: {
  selected: Shelter | undefined;
  reset: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (selected)
      map.flyTo(
        [selected.coordinates.latitude, selected.coordinates.longitude],
        Math.max(map.getZoom(), 14),
        {
          duration: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? 0
            : 0.6,
        },
      );
  }, [map, selected?.id]);
  useEffect(() => {
    map.setView([52.51, 13.4], window.innerWidth < 650 ? 11 : 12);
  }, [map, reset]);
  return null;
}
export function BerlinMap() {
  const { shelters } = useShelters();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [eligibility, setEligibility] = useState("all");
  const [accessible, setAccessible] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [reset, setReset] = useState(0);
  const filtered = shelters.filter(
    (s) =>
      `${s.name} ${s.address} ${s.district}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "all" ||
        (status === "available" &&
          s.availableBeds > 0 &&
          s.availabilityStatus !== "unknown") ||
        (status === "limited" && s.availabilityStatus === "limited")) &&
      (eligibility === "all" || s.eligibility === eligibility) &&
      (!accessible || s.accessibility === "Confirmed wheelchair accessible"),
  );
  useEffect(() => {
    if (
      selected &&
      !filtered.some((s) => s.id === selected.replace("list-", ""))
    )
      setSelected(null);
  }, [query, status, eligibility, accessible]);
  const total = filtered
    .filter((s) => s.availabilityStatus !== "unknown")
    .reduce((a, s) => a + s.availableBeds, 0);
  return (
    <div className="map-experience">
      <aside className="shelter-list">
        <div className="list-heading">
          <span className="district">A place for tonight</span>
          <h2>
            Find your way <br />
            to a warm bed.
          </h2>
          <p>
            <strong>
              <AnimatedNumber value={total} />
            </strong>{" "}
            free demo beds in {filtered.length} shelters
          </p>
        </div>
        <div className="list-rows" aria-label="Shelter list alternative to map">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <Search />
              <h3>No shelters match</h3>
              <p>
                Try another district or remove a filter. Wheelchair access is
                not confirmed for these locations.
              </p>
              <button
                className="text-button"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setEligibility("all");
                  setAccessible(false);
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            filtered.map((s) => (
              <MorphingPopover
                className="shelter-row-wrap"
                key={s.id}
                open={selected === `list-${s.id}`}
                onOpenChange={(open) =>
                  setSelected(open ? `list-${s.id}` : null)
                }
              >
                <MorphingPopoverTrigger
                  className="shelter-row"
                  onClick={() => {}}
                >
                  <div>
                    <span className="row-district">
                      {s.district} · {s.eligibility}
                    </span>
                    <h3>{s.name}</h3>
                    <span className="row-address">
                      {s.address.split(",")[0]}
                    </span>
                  </div>
                  <span className={`row-count ${s.availabilityStatus}`}>
                    <strong>
                      {s.availabilityStatus === "unknown" ? (
                        "?"
                      ) : (
                        <AnimatedNumber value={s.availableBeds} />
                      )}
                    </strong>
                    <span>
                      {s.availabilityStatus === "unknown"
                        ? "unknown"
                        : s.availableBeds === 0
                          ? "full"
                          : "beds"}
                    </span>
                  </span>
                </MorphingPopoverTrigger>
                <MorphingPopoverContent
                  className="list-detail"
                  aria-label={s.name}
                >
                  <ShelterDetails
                    shelter={s}
                    onClose={() => setSelected(null)}
                  />
                  <button
                    className="text-button"
                    onClick={() => setSelected(s.id)}
                  >
                    Show on map <ArrowUpRight size={15} />
                  </button>
                </MorphingPopoverContent>
              </MorphingPopover>
            ))
          )}
        </div>
        <div className="list-foot">
          <MapPin size={14} />
          Real places. Demo bed numbers.
        </div>
      </aside>
      <div className="map-canvas">
        <MapContainer
          center={[52.51, 13.4]}
          zoom={window.innerWidth < 650 ? 11 : 12}
          zoomControl={false}
          scrollWheelZoom
          className="leaflet-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ZoomControl position="bottomright" />
          <MapFocus
            selected={shelters.find((s) => s.id === selected)}
            reset={reset}
          />
          <ShelterMarkers
            shelters={filtered}
            selected={selected}
            onSelect={setSelected}
          />
        </MapContainer>
        <ToolbarExpandable
          items={[
            {
              id: 1,
              label: "Search shelters",
              title: <Search size={20} />,
              content: (
                <div className="toolbar-form">
                  <label htmlFor="shelter-search">Where are you looking?</label>
                  <input
                    autoFocus
                    id="shelter-search"
                    placeholder="Shelter, district or address"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <p>
                    {filtered.length} shelters match. Select a shelter in the
                    list.
                  </p>
                </div>
              ),
            },
            {
              id: 2,
              label: "Filter shelters",
              title: <SlidersHorizontal size={20} />,
              content: (
                <div className="toolbar-form">
                  <label htmlFor="status">Bed availability</label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="all">All shelters</option>
                    <option value="available">Beds available</option>
                    <option value="limited">Limited availability (1–4)</option>
                  </select>
                  <label htmlFor="eligibility">Accommodation for</label>
                  <select
                    id="eligibility"
                    value={eligibility}
                    onChange={(e) => setEligibility(e.target.value)}
                  >
                    <option value="all">Everyone</option>
                    <option>All adults</option>
                    <option>Women</option>
                    <option>Men</option>
                  </select>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={accessible}
                      onChange={(e) => setAccessible(e.target.checked)}
                    />
                    Confirmed wheelchair access only
                  </label>
                </div>
              ),
            },
            {
              id: 3,
              label: "Map controls",
              title: <LocateFixed size={20} />,
              content: (
                <div className="toolbar-form">
                  <button
                    className="secondary"
                    onClick={() => setReset((v) => v + 1)}
                  >
                    <RotateCcw size={16} />
                    Reset Berlin view
                  </button>
                  <p>
                    The shelter list remains usable if map tiles cannot load.
                  </p>
                </div>
              ),
            },
          ]}
        />
        <div className="map-legend">
          <span>
            <i className="green" />
            5+ beds
          </span>
          <span>
            <i className="amber" />
            1–4 beds
          </span>
          <span>
            <i className="red" />
            Full
          </span>
          <span>
            <i className="gray" />
            Unknown
          </span>
        </div>
      </div>
    </div>
  );
}
