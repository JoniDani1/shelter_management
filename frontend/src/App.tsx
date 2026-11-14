import { createPortal } from "react-dom";
import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  BedDouble,
  Moon,
  ShieldCheck,
  X,
  MapPin,
  Info,
} from "lucide-react";
import { useShelters } from "./store/ShelterStore";
import { officialPopulationStatistic as statistic } from "./data/officialStatistics";
import { AnimatedNumber } from "./components/ui/animated-number";
import { TextMorph } from "./components/ui/text-morph";
import {
  MorphingPopover,
  MorphingPopoverTrigger,
  MorphingPopoverContent,
} from "./components/ui/morphing-popover";
import LoginCard from "./components/ui/spectrum-login";
import { Chart } from "./components/ui/spectrum-animated-chart";
import { WorkerPanel } from "./components/WorkerPanel";
const BerlinMap = lazy(() =>
  import("./components/BerlinMap").then((m) => ({ default: m.BerlinMap })),
);
export const APP_NAME = "Tonight";
function Skyline() {
  return (
    <svg
      className="skyline"
      viewBox="0 0 900 210"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.1">
        <path d="M0 200h900M15 200v-50h44v50m-38-43h7m7 0h7m7 0h7M68 200v-76h42v76m-31-66v58m12-58v58m11-58v58M121 200v-58h45v58m8 0v-93h45v93m-43-92 21-24 22 24m-34 16h22m-22 14h22m-22 14h22m-22 14h22M230 200v-51h47v51m11 0v-89h18v89m-14-90V96h10v14m15 90v-91h18v91m-13-91V95h9v14m14 91v-91h18v91m-14-91V95h10v14m15 91v-89h18v89m-13-90V96h9v14M285 96h99l-11-9h-75zm10-9 3-10h73l3 10m-62 108h11m12 0h11m12 0h11M398 200v-64h35v64m13 0V78h10v122m-5-124V21m-8 59h16m-18 9c0-15 22-15 22 0s-22 15-22 0m11 14v23m22 74v-51h39v51m12 0v-84h35v84m-29-75h21m-21 13h21m-21 13h21m-21 13h21m24 36v-62h54v62m-48-50h40m-40 15h40m-40 15h40M625 200v-89h31v89m-30-89 15-17 15 17m-16-17V77m29 123v-113h26v113m-20-113V67h14v20m-7-20V48m25 152v-63h33v63m10 0v-81h41v81m-36-70h30m-30 15h30m-30 15h30m-30 15h30m15 25v-48h55v48m-40-48v-24h25v24m27 48v-76h38v76m11 0v-42h24v42" />
        <path d="M0 207h900" strokeDasharray="2 6" />
      </g>
    </svg>
  );
}
export default function App() {
  const { shelters, session, login, loading, error } = useShelters();
  const [mapOpen, setMapOpen] = useState(false);
  const [workerOpen, setWorkerOpen] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const mapClose = useRef<HTMLButtonElement>(null);
  const scroll = useRef(0);
  const confirmed = shelters.filter((s) => s.availabilityStatus !== "unknown");
  const available = confirmed.reduce((a, s) => a + s.availableBeds, 0);
  const capacity = shelters.reduce((a, s) => a + s.totalCapacity, 0);
  const occupied = shelters.reduce((a, s) => a + s.occupiedBeds, 0);
  useEffect(() => {
    const background = document.querySelectorAll(".site-header, #main, footer");
    background.forEach((el) => {
      if (mapOpen) {
        el.setAttribute("inert", "");
        el.setAttribute("aria-hidden", "true");
      } else {
        el.removeAttribute("inert");
        el.removeAttribute("aria-hidden");
      }
    });
    if (mapOpen) {
      scroll.current = window.scrollY;
      document.body.style.overflow = "hidden";
      mapClose.current?.focus();
    } else {
      document.body.style.overflow = "";
      window.scrollTo(0, scroll.current);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mapOpen]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !workerOpen) {
        setMapOpen(false);
        opener.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [workerOpen]);
  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <a className="wordmark" href="#" aria-label="Tonight home">
            <span className="brand-icon">
              <Moon size={23} strokeWidth={1.8} />
              <span />
            </span>
            {APP_NAME}
            <span className="berlin-label">BERLIN</span>
          </a>
          <div className="header-right">
            <span className="public-access">
              <span className="live-dot" />A little certainty for tonight.
            </span>
            <MorphingPopover
              open={workerOpen}
              onOpenChange={setWorkerOpen}
              className="worker-popover"
            >
              <MorphingPopoverTrigger className="worker-trigger">
                <ShieldCheck size={16} />
                <TextMorph as="span">
                  {session ? "Manage shelter" : "Shelter Worker Login"}
                </TextMorph>
                <ArrowUpRight size={14} />
              </MorphingPopoverTrigger>
              {createPortal(
                <MorphingPopoverContent
                  className="worker-content"
                  aria-label={
                    session ? "Shelter management" : "Shelter worker login"
                  }
                >
                  <button
                    className="panel-close icon-button"
                    aria-label="Close worker panel"
                    onClick={() => setWorkerOpen(false)}
                  >
                    <X size={20} />
                  </button>
                  {session ? (
                    <WorkerPanel key={session.uid} />
                  ) : (
                    <LoginCard
                      onLogin={async () => {
                        await login();
                        setLoginSuccess(true);
                      }}
                    />
                  )}
                  {loginSuccess && session && (
                    <p className="sr-only" role="status">
                      Logged In
                    </p>
                  )}
                </MorphingPopoverContent>,
                document.body,
              )}
            </MorphingPopover>
          </div>
        </header>
        <main id="main">
          <section className="hero">
            <div className="hero-location">
              <MapPin size={13} />
              BERLIN, EVERY NIGHT
            </div>
            <h1>
              <span className="headline-intro">An estimated</span>
              <span className="hero-number">
                <AnimatedNumber
                  value={statistic.value}
                  springOptions={{ stiffness: 65, damping: 22 }}
                />
                <span className="number-period">.</span>
              </span>
              <span className="headline-end">
                people live without
                <br />
                <em>accommodation</em> in Berlin.
              </span>
            </h1>
            <p className="hero-support">
              Everyone deserves a place to rest.
              <br />
              Find shelter beds across the city, in one place.
            </p>
            <button
              ref={opener}
              className="primary map-launch"
              onClick={() => setMapOpen(true)}
            >
              <span className="button-map">
                <MapPin size={18} />
              </span>
              <TextMorph as="span">
                {mapOpen ? "Close Map" : "View Map"}
              </TextMorph>
              <ArrowUpRight size={19} />
            </button>
            <p className="no-account">Free to use. No account needed.</p>
            <a
              className="statistic-source"
              href={statistic.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Berlin Senate · February 2024 estimate of people without
              accommodation <ArrowUpRight size={11} />
            </a>
            <Skyline />
          </section>
          <section
            className="availability-strip"
            aria-label="Demonstration availability overview"
          >
            <div className="strip-intro">
              <span className="status-pill">
                <span className="live-dot" />
                THE SHELTER DEMO
              </span>
              <h2>
                A bed can make
                <br />
                all the difference.
              </h2>
            </div>
            <div className="strip-stat">
              <span className="stat-icon">
                <BedDouble size={20} />
              </span>
              <strong>
                <AnimatedNumber value={available} />
              </strong>
              <span>demo beds available</span>
              <small>
                {loading
                  ? "Loading live data…"
                  : error
                    ? error
                    : "Live from shelters · excludes counts older than 30 min"}
              </small>
            </div>
            <div className="strip-stat">
              <span className="stat-icon">
                <MapPin size={20} />
              </span>
              <strong>
                <AnimatedNumber value={shelters.length} />
              </strong>
              <span>shelters across Berlin</span>
              <small>Berlin Kältehilfe night shelters</small>
            </div>
            <button className="explore-link" onClick={() => setMapOpen(true)}>
              Explore shelters
              <ArrowRight size={23} />
            </button>
          </section>
          <section className="statistics-section">
            <div className="stats-copy">
              <span className="district">UNDERSTANDING AVAILABILITY</span>
              <h2>
                Small updates.
                <br />A clearer picture.
              </h2>
              <p>
                When a shelter worker updates a bed count, everyone sees the
                change. This chart shows the same demonstration data as the map.
              </p>
              <div className="stats-key">
                <span>
                  <i className="chart-dot" />
                  Available beds by shelter
                </span>
                <span>Prototype data</span>
              </div>
              <div className="totals">
                <span>
                  <b>
                    <AnimatedNumber value={capacity} />
                  </b>
                  Total demo capacity
                </span>
                <span>
                  <b>
                    <AnimatedNumber value={occupied} />
                  </b>
                  Occupied demo beds
                </span>
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-header">
                <h3>A snapshot of shelter beds</h3>
                <span className="demo-tag">DEMO DATA</span>
              </div>
              {shelters.length > 1 ? (
                <Chart
                  values={shelters.map((s) => s.availableBeds)}
                  labels={shelters.map((_, i) => String(i + 1).padStart(2, "0"))}
                />
              ) : (
                <p className="fine-print" role="status">
                  {error ?? "Loading live shelter data…"}
                </p>
              )}
              <p className="fine-print">
                Shelters 01–{String(shelters.length).padStart(2, "0")} in
                directory order, live from the database. Includes counts older
                than 30 minutes. Free-bed numbers are still demo values, not
                real occupancy.
              </p>
            </div>
          </section>
          <div className="prototype-notice">
            <Info size={18} />
            <p>
              <strong>A prototype, built with care.</strong> Shelter names,
              addresses and hours are real; free-bed counts are still demo
              numbers. Do not rely on this app for actual
              accommodation. For current services, visit the{" "}
              <a
                href="https://kaeltehilfe-berlin.de/"
                target="_blank"
                rel="noreferrer"
              >
                Berlin Kältehilfe directory ↗
              </a>
              .
            </p>
          </div>
        </main>
        <footer>
          <a className="wordmark" href="#">
            <Moon size={20} />
            {APP_NAME}
          </a>
          <span>A place to rest. A city that cares.</span>
          <span>Made for Berlin · 2026</span>
        </footer>
        <AnimatePresence>
          {mapOpen && (
            <motion.section
              className="map-screen"
              role="region"
              aria-label="Berlin shelter map"
              initial={{ opacity: 0, scale: 0.96, borderRadius: 32 }}
              animate={{ opacity: 1, scale: 1, borderRadius: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
            >
              <div className="map-header">
                <a
                  className="wordmark"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setMapOpen(false);
                  }}
                >
                  <Moon size={22} />
                  {APP_NAME}
                  <span className="map-header-title">Find a shelter</span>
                </a>
                <div className="map-header-actions">
                  <button
                    className="worker-trigger"
                    onClick={() => setWorkerOpen(true)}
                  >
                    <ShieldCheck size={16} />
                    {session ? "Manage shelter" : "Worker login"}
                  </button>
                  <button
                    ref={mapClose}
                    className="secondary"
                    aria-label="Close map"
                    onClick={() => {
                      setMapOpen(false);
                      opener.current?.focus();
                    }}
                  >
                    <TextMorph as="span">Close Map</TextMorph>
                    <X size={17} />
                  </button>
                </div>
              </div>
              <div className="map-demo-banner">
                <Info size={14} />
                <span>
                  Demo · sample bed numbers. The shelters are real; call
                  before you go.
                </span>
              </div>
              <Suspense
                fallback={
                  <div className="map-loading" role="status">
                    Opening Berlin shelter map…
                  </div>
                }
              >
                <BerlinMap />
              </Suspense>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
