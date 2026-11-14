import { useState } from "react";
import { Minus, Plus, LogOut, ShieldCheck } from "lucide-react";
import { useShelters } from "../store/ShelterStore";
import { mockShelterWorkers } from "../data/mockShelterWorkers";
import { AnimatedNumber } from "./ui/animated-number";
import { MorphButton } from "./ui/spectrum-morph-button";
import { validateCapacity } from "../services/shelterService";
export function WorkerPanel() {
  const { shelters, session, update, logout } = useShelters();
  const shelter = shelters.find((s) => s.id === session?.shelterId)!;
  const worker = mockShelterWorkers.find((w) => w.id === session?.workerId)!;
  const [capacity, setCapacity] = useState(String(shelter.totalCapacity));
  const [occupied, setOccupied] = useState(String(shelter.occupiedBeds));
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const values = {
    totalCapacity: capacity.trim() === "" ? NaN : Number(capacity),
    occupiedBeds: occupied.trim() === "" ? NaN : Number(occupied),
  };
  const error = validateCapacity(values);
  const available = values.totalCapacity - values.occupiedBeds;
  async function save() {
    setNotice("");
    if (error) throw Error(error);
    setBusy(true);
    try {
      await update(values);
      setNotice(
        "Availability updated successfully. The new bed count is now visible on the public map.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="worker-panel">
      <div className="district">
        <ShieldCheck size={15} />
        Shelter management
      </div>
      <h2>{shelter.name}</h2>
      <p className="muted">Signed in as {worker.name} · assigned shelter</p>
      <p className="fine-print">{shelter.address}</p>
      <div className="capacity-grid">
        <div>
          <span>Total capacity</span>
          <b>
            <AnimatedNumber value={shelter.totalCapacity} />
          </b>
        </div>
        <div>
          <span>Occupied beds</span>
          <b>
            <AnimatedNumber value={shelter.occupiedBeds} />
          </b>
        </div>
        <div className="available">
          <span>Available beds</span>
          <b>
            <AnimatedNumber value={shelter.availableBeds} />
          </b>
        </div>
      </div>
      <fieldset disabled={busy}>
        <legend>Update demonstration availability</legend>
        <label htmlFor="capacity">Operational bed capacity</label>
        <input
          id="capacity"
          type="number"
          min="0"
          step="1"
          value={capacity}
          onChange={(e) => {
            setCapacity(e.target.value);
            setNotice("");
          }}
        />
        <label htmlFor="available">Available beds</label>
        <div className="stepper">
          <button
            aria-label="Decrease available beds"
            disabled={!Number.isFinite(available) || available <= 0}
            onClick={() => {
              setOccupied(String(values.occupiedBeds + 1));
              setNotice("");
            }}
          >
            <Minus size={18} />
          </button>
          <input
            id="available"
            type="number"
            min="0"
            max={capacity}
            step="1"
            value={Number.isFinite(available) ? available : ""}
            onChange={(e) => {
              setOccupied(
                e.target.value === ""
                  ? ""
                  : String(values.totalCapacity - Number(e.target.value)),
              );
              setNotice("");
            }}
          />
          <button
            aria-label="Increase available beds"
            disabled={
              !Number.isFinite(available) || available >= values.totalCapacity
            }
            onClick={() => {
              setOccupied(String(values.occupiedBeds - 1));
              setNotice("");
            }}
          >
            <Plus size={18} />
          </button>
        </div>
        <label htmlFor="occupied">Occupied beds</label>
        <input
          id="occupied"
          type="number"
          min="0"
          step="1"
          value={occupied}
          onChange={(e) => {
            setOccupied(e.target.value);
            setNotice("");
          }}
        />
      </fieldset>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <MorphButton
        disabled={!!error}
        onAction={save}
        loadingLabel="Updating"
        successLabel="Availability Updated"
        errorLabel="Update failed"
        size="lg"
        className="publish-button"
      >
        Update Availability
      </MorphButton>
      <p role="status" className="save-notice">
        {notice}
      </p>
      <p className="fine-print">
        {shelter.lastUpdated
          ? `Last published: ${new Date(shelter.lastUpdated).toLocaleString("en-GB", { timeZone: "Europe/Berlin" })} Berlin time.`
          : "Not yet published in this demo."}{" "}
        Draft changes remain private until you publish.
      </p>
      <button className="text-button" onClick={logout}>
        <LogOut size={15} />
        Log out
      </button>
    </section>
  );
}
