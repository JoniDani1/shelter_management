import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
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
}: {
  shelter: Shelter;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const element = useMemo(() => document.createElement("div"), []);
  const icon = useMemo(
    () =>
      L.divIcon({
        html: element,
        className: "shelter-marker-host",
        iconSize: [62, 42],
        iconAnchor: [31, 21],
      }),
    [element],
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
        position={[s.coordinates.latitude, s.coordinates.longitude]}
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
            className={`bed-marker ${s.availabilityStatus}`}
            aria-label={`${s.name}: ${s.availabilityStatus === "unknown" ? "unconfirmed" : s.availableBeds} demonstration beds`}
          >
            <BedDouble size={15} />
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
        13,
        {
          duration: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? 0
            : 0.6,
        },
      );
  }, [map, selected?.id]);
  useEffect(() => {
    map.setView([52.52, 13.405], 11);
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
            Find your way
            <br />
            to a warm bed.
          </h2>
          <p>
            <strong>
              <AnimatedNumber value={total} />
            </strong>{" "}
            demo beds (known state) across {filtered.length} shelters
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
          Real places. Demonstration availability.
        </div>
      </aside>
      <div className="map-canvas">
        <MapContainer
          center={[52.52, 13.405]}
          zoom={11}
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
          {filtered.map((s) => (
            <MapMarker
              key={s.id}
              shelter={s}
              selected={selected}
              onSelect={setSelected}
            />
          ))}
        </MapContainer>
        <div className="map-location">
          <span className="live-dot" />
          Berlin, Germany
        </div>
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
                    <option value="limited">Limited availability (1–3)</option>
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
            4+ beds
          </span>
          <span>
            <i className="amber" />
            1–3 beds
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
