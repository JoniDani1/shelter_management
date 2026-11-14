import {
  BedDouble,
  MapPin,
  Clock,
  Phone,
  ExternalLink,
  X,
  ArrowUpRight,
} from "lucide-react";
import { AnimatedNumber } from "./ui/animated-number";
import { TextMorph } from "./ui/text-morph";
import type { Shelter } from "../types/models";
export function ShelterDetails({
  shelter: s,
  onClose,
}: {
  shelter: Shelter;
  onClose: () => void;
}) {
  return (
    <article className="shelter-details">
      <div className="panel-heading">
        <span className="district">{s.district}</span>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close Details"
        >
          <X size={19} />
        </button>
      </div>
      <h2>{s.name}</h2>
      <div className="detail-bed">
        <BedDouble size={26} />
        <strong>
          <AnimatedNumber value={s.availableBeds} />
        </strong>
        <span>
          {s.availabilityStatus === "unknown"
            ? "not updated in 30 min"
            : "demo beds available"}
        </span>
      </div>
      <div className="mini-stats">
        <span>
          Capacity{" "}
          <b>
            <AnimatedNumber value={s.totalCapacity} />
          </b>
        </span>
        <span>
          Occupied{" "}
          <b>
            <AnimatedNumber value={s.occupiedBeds} />
          </b>
        </span>
      </div>
      <dl>
        <div>
          <dt>
            <MapPin size={17} />
            Address
          </dt>
          <dd>{s.address}</dd>
        </div>
        <div>
          <dt>
            <Clock size={17} />
            Opening hours
          </dt>
          <dd>{s.openingHours}</dd>
        </div>
        {s.nearestStation && (
          <div>
            <dt>Nearest station</dt>
            <dd>{s.nearestStation}</dd>
          </div>
        )}
        <div>
          <dt>Admission</dt>
          <dd>{s.eligibility}. Contact the shelter to confirm requirements.</dd>
        </div>
        <div>
          <dt>Accessibility</dt>
          <dd>{s.accessibility}</dd>
        </div>
      </dl>
      <div className="detail-actions">
        <a
          className="primary"
          target="_blank"
          rel="noreferrer"
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address)}`}
        >
          Get directions <ArrowUpRight size={16} />
        </a>
        {s.phone && (
          <a className="secondary" href={`tel:${s.phone.replaceAll(" ", "")}`}>
            <Phone size={16} />
            Call shelter
          </a>
        )}
      </div>
      <a
        className="source-link"
        href={s.sourceUrl}
        target="_blank"
        rel="noreferrer"
      >
        Official shelter directory <ExternalLink size={12} />
      </a>
      <p className="fine-print">
        {s.lastUpdated
          ? `Demo updated ${new Date(s.lastUpdated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" })} Berlin time.`
          : "No update published yet."}{" "}
        Availability may change. No bed is reserved.
      </p>
      <button className="text-button" onClick={onClose}>
        <TextMorph as="span">Close Details</TextMorph>
      </button>
    </article>
  );
}
