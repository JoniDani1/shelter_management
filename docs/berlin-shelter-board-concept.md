# Berlin Shelter Bed Availability Board

Reusable concept and requirements brief

Prepared: 14 November 2026, 13:31 UTC  
Status: Planning document only. No application, live integration, or physical installation has been built.

## 1. Project goal

Create a simple public information board that helps people experiencing homelessness and outreach workers see which Berlin shelters have available beds.

The visual reference is a railway departure board: horizontal rows, a dark frame, a blue background, large white text, and information that is easy to scan from a distance.

The essential information is the shelter name, the number of available beds, and its current availability status. This is an information display, not a booking system.

## 2. Confirmed requirements

- Show multiple shelters on one board.
- Clearly display each shelter name and available bed count.
- Distinguish available, limited, full, and unknown availability.
- Keep the interface simple and readable from a distance.
- Use the railway departure board supplied in the conversation as a visual reference.
- Prepare the concept for reuse in another tool or development environment.
- Keep this document and its proposed interface labels in English.
- Do not implement or deploy the application at this stage.

## 3. Proposed first version

These are recommendations for a future implementation, rather than additional requirements already approved by the project owner.

Use a full-screen web page on a standard landscape monitor or television. A separate, authenticated staff interface would allow shelter staff to update bed availability. The public display would refresh automatically from the shared data source.

A first version can start with manual staff updates. Integrate an existing data feed only after confirming its availability, access permission, data meaning, and update frequency. Do not assume a public API exists.

## 4. Public display layout

### Header

- Title: **Shelter Beds — Berlin**
- A visible **DEMO — SAMPLE DATA** label whenever the display uses sample data.
- An optional local clock; it must not be confused with the time the availability was last confirmed.

### Main table

| Column | Purpose | Priority |
| --- | --- | --- |
| Shelter | Official shelter name | Essential |
| Available beds | Latest confirmed available bed count | Essential |
| Status | Available, Limited, Full, Unknown, or Closed | Essential |
| Last confirmed | Time the shelter availability was last verified | Required for a live version |

Show optional details such as address, admission hours, eligible guest groups, accessibility, and pet policy on a secondary page or detail panel. Eligibility restrictions that materially affect entry should remain visible beside the shelter name or through a short subtitle.

### Example rows

**Every name and number below is fictional sample data. These rows must never be presented as actual shelter availability.**

| Shelter | Available beds | Status | Last confirmed |
| --- | ---: | --- | --- |
| Example Shelter Mitte | 12 | Available | Sample only |
| Example Shelter Kreuzberg | 4 | Limited | Sample only |
| Example Shelter Neukölln | 0 | Full | Sample only |
| Example Shelter Steglitz | 8 | Available | Sample only |
| Example Shelter Wedding | — | Unknown | Not confirmed |

### Footer

- Demo mode: **No live data. All names and numbers are examples.**
- Live mode: **Availability may change. Admission depends on shelter rules and confirmation.**
- Display a clear connection warning if the board cannot refresh.
- Keep an optional verified support contact visible; do not embed an unverified telephone number.

## 5. Visual direction

- Dark navy header and dark frame.
- Blue table rows and large white lettering.
- Very large bed counts, using tabular numerals.
- Clear horizontal separators and consistent column alignment.
- Left-align names and status labels; right-align bed counts.
- Use familiar sans-serif typography and strong text contrast.
- Avoid charts, decorative graphics, advertising, and unnecessary controls.
- Do not copy railway logos or imply an official partnership.
- Fit the core information on one screen where possible. If pagination is necessary, keep its timing slow enough to read and show the page number.
- Verify readability on the actual screen at the intended viewing distance.

## 6. Availability and freshness rules

The following thresholds are proposed defaults and require agreement with participating shelters.

| Condition | Public label | Indicator | Bed count |
| --- | --- | --- | --- |
| Confirmed count of 5 or more; admissions open | Available | Green dot + text | Confirmed number |
| Confirmed count of 1–4; admissions open | Limited | Amber dot + text | Confirmed number |
| Confirmed count of 0; admissions open | Full | Red dot + text | 0 |
| Missing, invalid, or stale confirmation | Unknown | Gray dot + text | — |
| Confirmed closed for admissions | Closed | Neutral dot + text | — |

- Never convert missing information into zero beds.
- Never treat total capacity as available capacity.
- A recent page refresh does not mean the shelter has recently confirmed its beds.
- Show the source confirmation time separately from the last successful data fetch.
- Proposed freshness limit: 30 minutes. After that limit, show **Unknown** and hide the old count from the main availability column. Keep its timestamp visible.
- Freshness limits should be configurable and agreed with the data providers.
- A previously available bed must not remain green indefinitely after a connection failure.
- An optional total must include only fresh, verified, non-duplicated counts and state its coverage. Omit the total if these conditions cannot be met.

## 7. Data collection options

| Approach | Benefits | Limitations |
| --- | --- | --- |
| Authorized staff update a shared form | Simple initial workflow; clear responsibility | Requires regular staff participation |
| Authorized integration with an existing feed | Reduces repeated manual entry | Access, reuse permission, schema, and freshness must be confirmed |
| Verified coordinator updates | Can consolidate information across shelters | Adds coordination work and potential delay |

Do not infer exact bed numbers from traffic-light indicators. If the source only provides a status, show the status and **—** for the count. Do not fabricate a number.

## 8. Suggested data model

| Field | Meaning |
| --- | --- |
| shelter_id | Stable unique identifier |
| name | Public shelter name |
| district | Berlin district |
| address | Verified public address |
| total_capacity | Optional confirmed capacity; separate from available beds |
| available_beds | Non-negative integer, or null when unknown |
| admission_state | Open, closed, or unknown |
| eligibility_summary | Short entry restrictions relevant to guests |
| admission_hours | Admission window and last entry time |
| accessibility_summary | Verified accessibility information |
| pets_allowed | Yes, no, or unknown |
| source_type | Staff, coordinator, or authorized external feed |
| source_reference | Reference identifying the source |
| source_confirmed_at | Timestamp when the source confirmed availability |
| received_at | Timestamp when the system received the record |
| expires_at | Time after which the confirmation becomes stale |
| updated_by | Authorized updater identifier; never publicly displayed |

Store timestamps in UTC and display public times in **Europe/Berlin**, including daylight saving changes. Use null for unknown values. Do not collect guest names or other personal guest information for this board.

## 9. Proposed staff workflow

1. An authorized staff member signs in.
2. They select their assigned shelter.
3. They enter the available bed count and confirm whether admissions are open.
4. They review and submit the update.
5. The system records who confirmed it and when.
6. The public board shows the update on its next refresh.
7. If no new confirmation arrives within the freshness limit, the row becomes Unknown.

Reject negative counts, non-integer values, and counts greater than known total capacity. Allow a known capacity to be corrected through an authorized workflow. Prevent an older update from overwriting a newer confirmation without an explicit conflict resolution step.

## 10. Public display behavior

- Proposed refresh interval: 60 seconds. This is a fetch interval, not a guarantee that shelter data changes every minute.
- Remain useful when one shelter has missing data; do not blank the entire board.
- Provide visible text for every color indicator.
- Keep names, numbers, and timestamps readable on smaller screens as well as a landscape public display.
- Avoid flashing content and rapid motion.
- Show a stable fallback screen when no current information is available.
- Do not display a reservation or guarantee message unless a separate confirmed reservation process is implemented.

## 11. Security and operation requirements

- Keep the public board read-only.
- Restrict updates to authorized staff and their assigned shelters.
- Keep credentials and private integration keys off the public display.
- Record an update history for operational review.
- Distinguish sample data from production data at all times.
- Define who maintains shelter records, confirms operating hours, and handles incorrect entries.
- Select hosting, hardware, and software only during the implementation stage. No platform or technology stack is mandated by this brief.

## 12. Acceptance criteria for a future build

- A viewer can identify a shelter, its available bed count, and its status at a glance.
- All sample records carry a prominent demo notice.
- Fresh zero availability appears as Full; missing or expired information appears as Unknown.
- A source without exact counts never produces invented numbers.
- Each live row includes its last confirmation time.
- Closed admission is distinguishable from a full shelter.
- A staff update reaches the public board on the next successful refresh.
- A failed connection produces a visible warning and freshness rules continue to apply.
- The display is understandable without color alone.
- Unauthorized users cannot update records.
- The board has been reviewed on its intended physical screen and viewing distance.

## 13. Open decisions

- Which shelters will participate and provide updates?
- Will the operational interface remain English or also offer German and other languages?
- Will a verified external data source be available, and under what reuse terms?
- What freshness period can participating shelters realistically support?
- Which admission restrictions must appear on the main screen?
- Where will the screen be installed, and how large is it?
- Who will operate, support, and maintain the service?
- Is a public mobile version also needed?

## 14. Reference sources and verification limits

These sources were consulted in the preceding conversation on 14 November 2026. They are context references, not a confirmed machine-readable data integration. Their contents have not been revalidated specifically for this document.

- [Berliner Kältehilfe](https://kaeltehilfe-berlin.de/): shelter and support information.
- [Berliner Kältehilfe directory](https://kaeltehilfe-berlin.de/kaeltehilfe-angebot): individual service listings.
- [Berlin Senate: Berliner Kältehilfe](https://www.berlin.de/sen/soziales/besondere-lebenssituationen/wohnungslose/notversorgung/kaeltehilfe-1293250.php): official description of the service and the app availability indicator.

The existence of an availability indicator does not establish that exact bed counts, a public API, or permission to republish the data are available. Those points remain unverified.

The supplied railway photograph is the visual inspiration. A separate concept image was generated in the conversation with generic example shelter names and fictional bed counts. This Markdown document is self-contained and does not require the image to understand or reuse the requirements.

## 15. Copy-ready handoff prompt

> Use this document as the product brief for a simple Berlin shelter bed availability board inspired by a railway departure display. Preserve the essential columns: shelter name, available beds, status, and last confirmation time. Use large readable text, a blue background, and status labels that work without color. Keep sample data visibly marked as demo data. Treat stale or missing availability as Unknown, never as zero. Do not assume an external API exists or fabricate live bed counts. Before implementation, resolve the open decisions about the data source, participating shelters, freshness rules, language, and screen. At the current stage, review and refine the concept only; do not implement or deploy unless explicitly instructed.

## 16. Completion record

- Completed: English concept brief, sample layout, visual direction, proposed data model, staff workflow, freshness rules, acceptance criteria, and handoff prompt.
- Checked: The document separates confirmed requirements, proposed defaults, fictional examples, and unverified integration assumptions.
- Not completed: Application code, live availability checks, data-provider agreements, API integration, hosting, hardware procurement, and deployment.
- No recurring monitoring task was created for this project.


## 17. Review refinements — 14 November 2026

The supplied concept image is a visual reference only. Its German labels do not change the English interface requirement. Its fictional counts must not be reused as live information.

### Status precedence and validation

For a future build, apply these proposed rules in order:

1. Validate the source confirmation timestamp and record. Missing, invalid, future-dated beyond an agreed clock tolerance, or expired confirmation produces Unknown and an em dash for the count. A stale closed record also becomes Unknown.
2. A fresh, verified closed admission state produces Closed and an em dash, even when a count is present.
3. An unknown admission state produces Unknown until admission eligibility is confirmed.
4. For fresh open admissions and a valid exact count, apply the proposed count thresholds in section 6.
5. A fresh source that supplies only a status may display that verified status with an em dash. Record the source status explicitly; do not derive an exact count.

Add optional `reported_availability_status` and `count_precision` fields to support status-only feeds. Define the permitted values and source mappings with each provider before implementation. All status-only confirmations expire under the same freshness rules.

### Time and connection behavior

Evaluate expiry using the current time even when fetching fails. At or after `expires_at`, hide the previous count and show Unknown. A successful fetch must never advance `source_confirmed_at`. Use an explicit timezone label for displayed confirmation times so daylight-saving transitions are understandable.

Keep connection state separate from shelter status: show a board-level refresh warning while each row independently follows its confirmation expiry. On startup without validated records, show a stable no-current-information message.

### Additional future acceptance checks

- An expired Closed record becomes Unknown.
- A positive count with unconfirmed admissions does not become Available.
- A status-only source shows no invented count.
- A failed fetch does not reset any confirmation age.
- A row expires at the configured boundary without requiring a successful fetch.
- Invalid or future confirmation timestamps cannot keep a row fresh indefinitely.
- The English display includes a prominent demo notice and a last-confirmation column absent from the concept image.

These are proposed refinements, not provider-approved operating rules. No technology stack, participating shelter, live source, implementation, or deployment has been selected or completed. The references in section 14 remain unvalidated in this review.
