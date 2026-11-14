# Berlin Kältehilfe shelters, season 2026/27

Real data on Berlin's emergency overnight shelters, collected for **Tonight** on 2026-11-14.
This is reference/context data only. It does **not** replace `data/seed.json`; the team decides later what to use.

Machine-readable version: [`data/kaeltehilfe/shelters-2026-27.json`](../data/kaeltehilfe/shelters-2026-27.json)

## Source

All shelter facts come from one official, public document:

- **"Notübernachtungen November 2026", Stand 30.10.2026**, published by the Koordinierungsstelle der Berliner Kältehilfe (GEBEWO pro gGmbH) on [kaeltehilfe-berlin.de](https://kaeltehilfe-berlin.de/)
- PDF: https://kaeltehilfe-berlin.de/images/Ubersicht%20NUs%202026_November_____.pdf

The coordination office publishes a new list each month, so places and dates can change during the season.

## Key findings

- There are not 8 or 10 shelters. The November list has **39 places**: 27 night shelters (Notübernachtungen) with about **870 beds**, 2 family shelters, and 10 night cafés (Nachtcafés) that only open on one or a few nights per week.
- Of the 27 night shelters: 10 are mixed (men and women in separate places), 8 are for women only and 9 for men only.
- Only some are open all year (`yearRound: true`); most run from 1 Oct or 1 Nov to the end of March or April. One (Weitlingstraße) only opens on 16 Nov 2026.
- Typical hours are evening to morning (around 18–20:00 to 7:30–8:00). The 24/7 women's shelter in Kreuzberg and the two family shelters are open all day.
- The source gives **no live occupancy** and no website/e-mail per shelter, only a phone number. That is exactly the gap Tonight fills.

## What is from the source and what is derived

| Field | Origin |
|---|---|
| name, address, district (as listed), phone, places (men/women), admission group, opening hours, season dates, notes | **Directly from the PDF** (translated notes, German names and addresses unchanged) |
| `petFriendly`, `accessible` | From the PDF icons. `petFriendly: false` only means "not marked as pet-friendly". `accessible` is `true` if marked barrier-free (*barrierearm*), `false` if the PDF says *nicht barrierefrei*, `null` if nothing is said |
| `district` | Normalised to the official Berlin borough name (e.g. "Marzahn" → "Marzahn-Hellersdorf"); the original is kept in `districtAsListed` |
| `totalBeds` | Sum of the men's and women's places in the PDF (e.g. "65 ♂ / 8 ♀" → 73). Our reading of the icons, please double-check if it matters |
| `seasonStart`, `seasonEnd` | The PDF gives day and month only; we added the years 2026/2027 |
| `location` (lat/lng) | **Derived** by geocoding the address with OpenStreetMap Nominatim. All 39 matched a house number except "Am Containerbahnhof 1" (street level, `locationPrecision: "street"`). Verify before putting pins on a public map |
| `nearestStation` | **Derived** from VBB stop data (v6.bvg.transport.rest): the nearest U- or S-Bahn station, straight-line distance. `null` for Herberge zur Heimat (no U/S-Bahn within 2 km) |
| `id` | Our own stable slug, meant to stay fixed (Firestore document id, operator login) |

### Missing or uncertain

- No live free-bed numbers, no e-mail or website per shelter, no operator (Träger) for most entries (only where the name contains it, e.g. Johanniter, Caritas, GEBEWO, AWO).
- Two entries do not state a closing time ("ab 19 Uhr"): `frauen-mitten-im-kiez`, `marie` (`closesAt: null`).
- Two women's shelters have a `*` next to their bed count that the PDF does not explain (one of them is described as trans-inclusive).
- The family shelter on Wrangelstraße counts **family rooms** (9), not beds, so `totalBeds` is `null`.
- Haus Sophie: the source says postcode 13055, the geocoder puts Wollenberger Straße 10 in 13053.
- Accessibility is only marked for a few places; for most it is unknown.

## JSON fields

Matches the planned Firestore `shelters` model (`name`, `address`, `location`, `totalBeds`, `admits`, `opensAt`, `closesAt`) plus extra context fields:

- `id`: stable slug; `type`: `night_shelter` | `family_shelter` | `night_cafe`
- `admits`: `all` | `women` | `men` | `families` (`families` is new compared with the current app)
- `bedsMen`, `bedsWomen`: split of places where the PDF gives it, else `null`
- `opensAt`, `closesAt`: `"HH:MM"`, local time, the shelter is open overnight; 24/7 places use `"00:00"`/`"24:00"` and `open24h: true`
- `openDays`: `"daily"` or a list like `["tue"]` (night cafés)
- `yearRound`, `seasonStart`, `seasonEnd` (ISO dates)
- `location`: `{ lat, lng }`, ready for a Firestore GeoPoint
- `demo`: `true` for the suggested demo set below

## Suggested demo set (8 shelters)

Picked to be open every night right now, large enough to be interesting, spread across the city, and with a mix of admission groups (4 mixed, 2 men, 2 women). Marked ⭐ below and `demo: true` in the JSON.

| id | Name | District | Beds | Admits |
|---|---|---|---|---|
| `lehrter-strasse` | Notübernachtung Lehrter Str. | Mitte | 100 | all |
| `franklinstrasse` | Notübernachtung Franklinstraße | Charlottenburg-Wilmersdorf | 73 | all |
| `containerbahnhof` | Notübernachtung am Containerbahnhof (NAC) | Friedrichshain-Kreuzberg | 70 | all |
| `haus-sophie` | Haus Sophie | Lichtenberg | 39 | all |
| `johanniter-ohlauer` | Notübernachtung der Johanniter Ohlauer Straße | Friedrichshain-Kreuzberg | 88 | men |
| `kopenhagener-strasse` | Notübernachtung Kopenhagener Strasse | Reinickendorf | 55 | men |
| `evas-obdach` | Notübernachtung Evas Obdach | Neukölln | 30 | women |
| `evas-haltestelle` | Evas Haltestelle | Mitte | 20 | women |

## Full list

Beds "m / w" = places for men / women. Hours are evening to next morning.

### Night shelters (Notübernachtungen)
| | id | Name | Address | District | Beds | Admits | Hours | Season | Pets / access | Nearest U/S (derived) | Phone |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ⭐ | `franklinstrasse` | Notübernachtung Franklinstraße | Franklinstr. 27a, 10587 Berlin | Charlottenburg-Wilmersdorf | 73 (65 m / 8 w) | all | 18:00–08:00 | year-round |  | U Ernst-Reuter-Platz (842 m) | 030 3912722 |
| ⭐ | `containerbahnhof` | Notübernachtung am Containerbahnhof (NAC) | Am Containerbahnhof 1, 10367 Berlin | Friedrichshain-Kreuzberg | 70 (58 m / 12 w) | all | 19:30–07:30 | year-round | 🐾 pets, ♿ accessible | S+U Frankfurter Allee (161 m) | 030 66628770 |
|  | `strassenfeger` | Notübernachtung Strassenfeger | Storkower Str. 101a, 10407 Berlin | Pankow | 30 (22 m / 8 w) | all | 18:00–08:00 | year-round | not barrier-free | S Landsberger Allee (988 m) | 030 47905810 |
|  | `neustart-otto-rosenberg-8` | Neustart Berlin GmbH | Otto-Rosenberg-Str. 8/8a, 12681 Berlin | Marzahn-Hellersdorf | 10 (8 m / 2 w) | all | 20:00–08:00 | 2026-10-01 → 2027-04-30 |  | S Raoul-Wallenberg-Str. (211 m) | 030 93 66 87 39 |
|  | `neustart-otto-rosenberg-3` | Neustart GmbH | Otto-Rosenberg-Str. 3 u. 10, 12681 Berlin | Marzahn-Hellersdorf | 8 (5 m / 3 w) | all | 20:00–08:00 | 2026-10-01 → 2027-04-30 |  | S Raoul-Wallenberg-Str. (210 m) | 030 99 27 33 76 / 030 93 66 10 87 |
|  | `herberge-zur-heimat` | Herberge zur Heimat | Falkenseer Chaussee 154, 13589 Berlin | Spandau | 10 (8 m / 2 w) | all | 18:00–08:00 | 2026-10-01 → 2027-04-30 |  | – | 030 374 99 0 50 |
|  | `kurmaerkische` | NÜ Kurmärkische | Kurmärkische Str. 1-3, 10783 Berlin | Tempelhof-Schöneberg | 30 | all | 18:00–08:00 | 2026-10-01 → 2027-04-30 |  | U Kurfürstenstr. (248 m) | 0171 520 07 30 |
| ⭐ | `haus-sophie` | Haus Sophie | Wollenberger Straße 10, 13055 Berlin | Lichtenberg | 39 (33 m / 6 w) | all | 17:00–08:00 | 2026-10-01 → 2027-04-30 |  | S Gehrenseestr. (1082 m) | 030 98 69 47 01 |
| ⭐ | `lehrter-strasse` | Notübernachtung Lehrter Str. | Lehrter Str. 68, 10557 Berlin | Mitte | 100 (75 m / 25 w) | all | 20:00–08:00 | 2026-11-01 → 2027-04-28 |  | S+U Berlin Hauptbahnhof (389 m) | 030 / 69 03 35 28 |
|  | `neue-chance-steglitz` | Notübernachtung der Neuen Chance am Rathaus Steglitz | Kuhligkshofstr. 5, 12165 Berlin | Steglitz-Zehlendorf | 36 (30 m / 6 w) | all | 19:00–08:00 | 2026-11-01 → 2027-04-30 |  | S+U Rathaus Steglitz (147 m) | 0178 / 88 77 729 |
|  | `frauen-mitten-im-kiez` | Notübernachtung für Frauen 'Mitten im Kiez' | Petersburger Straße 92, 10247 Berlin | Friedrichshain-Kreuzberg | 9 | women | 19:00–? | year-round | not barrier-free | U Frankfurter Tor (181 m) | 030 29350557 |
|  | `frauen-24-7-kreuzberg` | 24/7 Notunterkunft für Frauen Kreuzberg | Hallesches Ufer 30, 10963 Berlin | Friedrichshain-Kreuzberg | 65 | women | 24h | year-round |  | U Möckernbrücke (245 m) | 030 20 215 98 70 |
|  | `lichtblick` | Notübernachtung Lichtblick | Wrangelstr. 30, 10997 Berlin | Friedrichshain-Kreuzberg | 25 | women | 19:00–08:00 | 2026-10-01 → 2027-04-30 |  | U Görlitzer Bahnhof (536 m) | 0174 / 45 86 780 |
|  | `frauen-tieckstrasse-gebewo` | Notübernachtung für Frauen GEBEWO pro | Tieckstr. 17 (Hinterhaus, Quergebäude), 10115 Berlin | Mitte | 9 | women | 19:00–08:00 | year-round |  | S Nordbahnhof (268 m) | 030 2832939 |
|  | `marie` | Notübernachtung „Marie“ | Tieckstr. 17 (Vorderhaus Souterrain), 10115 Berlin | Mitte | 10 | women | 19:10–? | year-round | ♿ accessible | S Nordbahnhof (268 m) | 030 40006209 |
| ⭐ | `evas-obdach` | Notübernachtung Evas Obdach | Fuldastraße 9, 12043 Berlin | Neukölln | 30 | women | 19:00–09:00 | year-round | not barrier-free | U Rathaus Neukölln (251 m) | 030 477 532670 / 0151 1464 8758 |
| ⭐ | `evas-haltestelle` | Evas Haltestelle | Müllerstr. 126, 13349 Berlin | Mitte | 20 | women | 18:00–08:00 | 2026-10-01 → 2027-04-30 |  | U Seestr. (416 m) | 030 46 232 79 |
|  | `home-and-care` | Notübernachtung Home & Care | Finsterwalder Str. 64, 13435 Berlin | Reinickendorf | 7 | women | 20:00–08:00 | 2026-11-01 → 2027-03-31 |  | S+U Wittenau (1111 m) | 0159 04 75 44 17 |
| ⭐ | `johanniter-ohlauer` | Notübernachtung der Johanniter Ohlauer Straße | Ohlauer Straße 22, 10999 Berlin | Friedrichshain-Kreuzberg | 88 | men | 20:00–07:45 | year-round | 🐾 pets | U Görlitzer Bahnhof (338 m) | 030 50562540 |
|  | `st-pius-st-nikolaus` | Notübernachtung St. Pius / St. Nikolaus | Palisadenstraße 72, 10243 Berlin | Friedrichshain-Kreuzberg | 30 | men | 19:00–08:00 | 2026-10-01 → 2027-04-30 |  | U Strausberger Platz (340 m) | 030 53219333 |
|  | `awo-kiezcafe` | AWO Kiezcafé | Petersburger Str. 92, 10247 Berlin | Friedrichshain-Kreuzberg | 8 | men | 20:00–08:00 | 2026-10-01 → 2027-04-30 | 🐾 pets | U Frankfurter Tor (181 m) | 030 29350556 |
|  | `kubus` | KUBUS Kältehilfe | Teupitzer Straße 39, 12059 Berlin | Neukölln | 25 | men | 19:00–07:00 | 2026-10-01 → 2027-04-30 |  | S Sonnenallee (718 m) | 030 810335161 |
|  | `schildkroete` | Kältehilfe Schildkröte | Otto-Suhr-Allee 94, 10585 Berlin | Charlottenburg-Wilmersdorf | 26 | men | 19:00–08:00 | 2026-10-15 → 2027-04-30 |  | U Richard-Wagner-Platz (124 m) | 0162 289 29 72 |
|  | `st-marien-liebfrauen` | Notübernachtung St. Marien-Liebfrauen | Wrangelstr. 50, 10997 Berlin | Friedrichshain-Kreuzberg | 12 | men | 19:30–08:00 | 2026-11-01 → 2027-03-31 |  | U Schlesisches Tor (263 m) | 030 61 12 93 24 |
|  | `weitlingstrasse` | Notübernachtung Weitlingstrasse der GEBEWO | Weitlingstr. 11, 10317 Berlin | Lichtenberg | 16 | men | 19:00–08:00 | 2026-11-16 → 2027-04-30 | 🐾 pets | S+U Lichtenberg Bhf (79 m) | 0176 178 799 99 |
| ⭐ | `kopenhagener-strasse` | Notübernachtung Kopenhagener Strasse | Kopenhagener Str. 29, 13407 Berlin | Reinickendorf | 55 | men | 20:00–08:00 | 2026-11-01 → 2027-04-28 | 🐾 pets | U Residenzstr. (600 m) | 030 69033 6120 |
|  | `caritas-residenzstrasse` | Caritas Kältehilfe Residenzstraße | Residenzstr. 90, 13409 Berlin | Mitte | 28 | men | 19:30–07:30 | 2026-11-01 → 2027-03-31 |  | U Osloer Str. (302 m) | 0172 3927384 |

### Family shelters (only adults with children)
| | id | Name | Address | District | Beds | Admits | Hours | Season | Pets / access | Nearest U/S (derived) | Phone |
|---|---|---|---|---|---|---|---|---|---|---|---|
|  | `familien-wrangelstrasse` | Notunterkunft für wohnungslose Familien | Wrangelstraße 12, 10997 Berlin | Friedrichshain-Kreuzberg | 9 family rooms | families | 24h | year-round |  | U Görlitzer Bahnhof (496 m) | 030 61073256 |
|  | `familien-am-baerensprung` | NÜ für wohnungslose Familien „Am Bärensprung“ | Am Bärensprung 52/56, 13503 Berlin | Reinickendorf | 44 | families | 24h | year-round |  | S Schulzendorf (260 m) | 0175 1885103 |

### Night cafés (open on certain nights only)
| | id | Name | Address | District | Beds | Admits | Hours | Season | Nights | Pets / access | Nearest U/S (derived) | Phone |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
|  | `nachtcafe-die-arche` | Nachtcafé Die Arche | Plesserstr. 3, 12435 Berlin | Treptow-Köpenick | 16 | all | 19:00–08:00 | 2026-10-01 → 2027-04-30 | Mon, Tue, Wed, Thu, Fri, Sun |  | S Treptower Park (830 m) | 030 533 71 04 |
|  | `zum-guten-hirten` | Zum guten Hirten | Goßlerstraße 30, 12161 Berlin | Tempelhof-Schöneberg | 18 | all | 20:30–08:00 | 2026-10-27 → 2027-04-30 | Tue, Wed, Thu, Fri |  | U Friedrich-Wilhelm-Platz (73 m) | 0152 5718 7272 |
|  | `nachtcafe-taborgemeinde` | Nachtcafé Ev. Taborgemeinde | Taborstr. 17, 10997 Berlin | Friedrichshain-Kreuzberg | 40 | all | 21:30–08:00 | 2026-10-14 → 2027-04-24 | Tue | 🐾 pets | U Schlesisches Tor (573 m) | 030 612 858 33 |
|  | `kaelteschutz-mehringhof` | Kälteschutz im Mehringhof | Gneisenaustr. 2a, 10961 Berlin | Friedrichshain-Kreuzberg | 25 | all | 20:00–09:00 | 2026-10-29 → 2027-04-01 | Thu | 🐾 pets | U Mehringdamm (188 m) | 030 120 535 822 |
|  | `nachtcafe-luisen` | Nachtcafé „Luisen“ | Gierkeplatz 4, 10585 Berlin | Charlottenburg-Wilmersdorf | 60 | all | 22:00–07:00 | 2026-11-02 → 2027-03-29 | Mon |  | U Richard-Wagner-Platz (272 m) | 0177 27 03 869 |
|  | `nachtcafe-herz-jesu` | Nachtcafé Herz Jesu | Fehrbelliner Str. 99, 10119 Berlin | Pankow | 17 | all | 17:00–08:00 | 2026-11-01 → 2027-03-31 | Mon |  | U Rosa-Luxemburg-Platz (238 m) | 0162 988 27 64 |
|  | `unter-druck` | UNTER DRUCK – Kultur von der Strasse e.V. | Oudenarder Str. 26, 13347 Berlin | Mitte | 15 | all | 19:00–08:00 | 2026-11-05 → 2027-03-25 | Thu |  | U Nauener Platz (307 m) | 030 24 72 90 40 |
|  | `obdach-bei-unter-druck` | Nachtcafé Obdach e.V. bei UNTER DRUCK | Oudenarder Str. 26, 13347 Berlin | Mitte | 15 | all | 19:00–08:00 | year-round | Fri |  | U Nauener Platz (307 m) | 030 415 088 21 / 0152 34 57 84 22 |
|  | `nachtcafe-fuerbitt-melanchthon` | Nachtcafé der ev. KG Fürbitt-Melanchthon | Kranoldstr. 16, 12051 Berlin | Neukölln | 50 | all | 21:30–08:00 | 2026-11-01 → 2027-03-31 | Sat | ♿ accessible | S+U Hermannstr. (251 m) | 030 625 3002 |
|  | `nachtcafe-neu-westend` | Nachtcafé Neu Westend | Eichenallee 47-53, 14050 Berlin | Charlottenburg-Wilmersdorf | 30 | all | 19:30–07:30 | 2026-11-01 → 2027-03-31 | Sun |  | U Neu-Westend (266 m) | 030 30 42 007 |
