import { useState } from "react";
import { Minus, Plus, LogOut, ShieldCheck } from "lucide-react";
import { useShelters } from "../store/ShelterStore";
import { AnimatedNumber } from "./ui/animated-number";
import { MorphButton } from "./ui/spectrum-morph-button";
import type { Shelter } from "../types/models";

// Signed-in shelter staff: pick "my shelter" once (saved in members/{uid}),
// then publish the number of free beds. Admins may pick any shelter.
export function WorkerPanel() {
  const { shelters, session, logout } = useShelters();
  const [changing, setChanging] = useState(false);
  const [adminPick, setAdminPick] = useState<string | null>(null);
  if (!session) return null;
  const isAdmin = session.role === "admin";
  const ownId = session.shelterIds[0] ?? null;
  const shelterId = isAdmin ? (adminPick ?? ownId ?? shelters[0]?.id) : ownId;
  const shelter = shelters.find((s) => s.id === shelterId);

  return (
    <section className="worker-panel">
      <div className="district">
        <ShieldCheck size={15} />
        Shelter management
      </div>
      {!shelters.length ? (
        <p className="muted">Loading shelters…</p>
      ) : changing || !shelter ? (
        <ShelterPicker
          current={ownId}
          onDone={(id) => {
            setChanging(false);
            setAdminPick(id);
          }}
          onCancel={shelter ? () => setChanging(false) : undefined}
        />
      ) : (
        <>
          <h2>{shelter.name}</h2>
          <p className="muted">
            Signed in as {session.name} · {isAdmin ? "admin" : "your shelter"}
          </p>
          <p className="fine-print">{shelter.address}</p>
          {isAdmin && (
            <label className="admin-pick">
              <span>Admin: edit another shelter</span>
              <select
                value={shelter.id}
                onChange={(e) => setAdminPick(e.target.value)}
              >
                {shelters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <AvailabilityEditor key={shelter.id} shelter={shelter} />
          {!isAdmin && (
            <button className="text-button" onClick={() => setChanging(true)}>
              This is not my shelter
            </button>
          )}
        </>
      )}
      <button className="text-button" onClick={logout}>
        <LogOut size={15} />
        Log out
      </button>
    </section>
  );
}

function ShelterPicker({
  current,
  onDone,
  onCancel,
}: {
  current: string | null;
  onDone: (id: string) => void;
  onCancel?: () => void;
}) {
  const { shelters, chooseShelter } = useShelters();
  const [pick, setPick] = useState(current ?? "");
  return (
    <>
      <h2>Which shelter do you run?</h2>
      <p className="muted">
        You choose this once. It is saved for your account and you can change
        it later.
      </p>
      <fieldset>
        <label htmlFor="my-shelter">Your shelter</label>
        <select
          id="my-shelter"
          value={pick}
          onChange={(e) => setPick(e.target.value)}
        >
          <option value="" disabled>
            Select a shelter…
          </option>
          {shelters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.district}
            </option>
          ))}
        </select>
      </fieldset>
      <MorphButton
        disabled={!pick}
        onAction={async () => {
          await chooseShelter(pick);
          onDone(pick);
        }}
        loadingLabel="Saving"
        successLabel="Saved"
        errorLabel="Saving failed"
        size="lg"
        className="publish-button"
      >
        Save my shelter
      </MorphButton>
      {onCancel && (
        <button className="text-button" onClick={onCancel}>
          Cancel
        </button>
      )}
    </>
  );
}

function AvailabilityEditor({ shelter }: { shelter: Shelter }) {
  const { update } = useShelters();
  const [draft, setDraft] = useState(String(shelter.availableBeds));
  const [notice, setNotice] = useState("");
  const total = shelter.totalCapacity;
  const available = draft.trim() === "" ? NaN : Number(draft);
  const error = !Number.isInteger(available)
    ? "Enter a whole number of free beds."
    : available < 0
      ? "Free beds cannot be negative."
      : available > total
        ? `This shelter has ${total} beds in total.`
        : null;
  async function save() {
    setNotice("");
    if (error) throw Error(error);
    await update(shelter.id, available);
    setNotice(
      "Free beds updated. The new count is now visible on the map and the station board.",
    );
  }
  return (
    <>
      <div className="capacity-grid">
        <div>
          <span>Total capacity</span>
          <b>
            <AnimatedNumber value={total} />
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
      <fieldset>
        <legend>Update free beds</legend>
        <label htmlFor="available">Available beds right now</label>
        <div className="stepper">
          <button
            aria-label="Decrease available beds"
            disabled={!Number.isFinite(available) || available <= 0}
            onClick={() => {
              setDraft(String(Math.min(total, available) - 1));
              setNotice("");
            }}
          >
            <Minus size={18} />
          </button>
          <input
            id="available"
            type="number"
            min="0"
            max={total}
            step="1"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setNotice("");
            }}
          />
          <button
            aria-label="Increase available beds"
            disabled={!Number.isFinite(available) || available >= total}
            onClick={() => {
              setDraft(String(Math.max(0, available) + 1));
              setNotice("");
            }}
          >
            <Plus size={18} />
          </button>
        </div>
        <p className="fine-print">
          Total capacity is fixed for now ({total} beds). Occupied ={" "}
          {total} − available.
        </p>
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
          : "Not published yet."}{" "}
        Counts go to “unknown” after 30 minutes without an update. Draft
        changes stay private until you publish.
      </p>
    </>
  );
}
