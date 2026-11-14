# Master Implementation Prompt: Berlin Homeless Shelter Availability Platform

## 1. Project Overview

Design and implement a modern, responsive, accessible web application that helps people experiencing homelessness in Berlin find available beds in homeless shelters.

The platform should connect two primary user groups:

- **People seeking shelter:** Individuals who need to quickly locate nearby shelters, check bed availability, view contact information, and find suitable accommodation.
- **Shelter workers:** Authorized employees who can log in, access their assigned shelter, and update its current bed availability.

The central purpose of this application is to reduce the uncertainty involved in finding emergency accommodation by presenting shelter availability through an intuitive, interactive map of Berlin.

The website should feel like a polished, production-quality civic technology platform rather than a generic hackathon dashboard.

**This task is strictly focused on frontend development and UI/UX. All backend functionality, authentication, database operations, and live data integrations will be implemented separately by other team members.**

For this implementation, simulate all necessary functionality using structured mock data, frontend state management, and realistic interactions.

---

## 2. Mandatory Component Libraries and Implementations

The following components are non-negotiable requirements. You must use the actual implementations from the provided documentation.

Do not replace them with visually similar alternatives, generic UI components, or independently recreated animations.

Read the documentation, retrieve the necessary component source code, install its required dependencies, and integrate it directly into the application.

### 2.1 Text Morph

Documentation:

https://motion-primitives.com/docs/text-morph

Use the **Text Morph** component from Motion Primitives for all applicable button text transitions and confirmation states.

Required implementations include:

- View Map → Close Map
- Log In → Logging In → Logged In
- Save Changes → Saving → Saved
- Update Availability → Updating → Updated
- Confirm → Confirmed
- Open Details → Close Details
- Other meaningful button label transitions throughout the interface

The text must morph naturally between states rather than abruptly disappearing and being replaced.

For icon-only controls, maintain appropriate accessible labels without forcing unnecessary text animations.

Where another mandatory component defines the button container, integrate Text Morph into its text content wherever compatible.

### 2.2 Morphing Popover

Documentation:

https://motion-primitives.com/docs/morphing-popover

Use the **Morphing Popover** component from Motion Primitives for expandable interfaces, contextual panels, and interactive detail views.

Required implementations include:

- Shelter information panels opened from map markers.
- Shelter worker dashboard panels.
- Expandable shelter management controls.
- Additional shelter details.
- Relevant contextual settings and information.

The interaction should visually transition from its originating trigger into an expanded panel, maintaining spatial continuity.

Panels must feel connected to the element that opened them. Avoid abrupt modal appearances or generic, disconnected popups.

For larger interfaces, such as the full-screen map, use the same morphing interaction principles while ensuring the layout remains practical and accessible.

### 2.3 Expandable Toolbar

Documentation:

https://motion-primitives.com/docs/toolbar-expandable

Use the **Toolbar Expandable** component from Motion Primitives for the map's search and utility controls.

Required functionality includes:

- Search for shelters.
- Search by district or address.
- Filter by bed availability.
- Filter by shelter eligibility or accommodation type.
- Access map-related controls.

The toolbar should initially appear compact and expand smoothly when users interact with its controls.

The search interface should transition naturally from a compact search icon into a usable search input.

Do not replace this component with a standard navigation bar or conventional static search field.

### 2.4 Animated Number

Documentation:

https://motion-primitives.com/docs/animated-number

Use the **Animated Number** component from Motion Primitives for the central numerical statistic displayed in the hero section.

Additionally, use it for relevant numerical values throughout the application, including:

- Available shelter beds.
- Occupied beds.
- Total shelter capacity.
- Aggregate available beds across the shelters represented in the application.
- Relevant dashboard statistics.

Numbers should transition smoothly when updated, particularly when a shelter worker modifies availability.

Do not create a separate counter animation implementation.

### 2.5 Spectrum UI Login

Documentation:

https://ui.spectrumhq.in/docs/login

Use the actual **Spectrum UI Login Card** component for the shelter worker authentication interface.

The login component must be integrated into the website's visual identity while preserving its original structure and interaction behavior.

The login interface must include:

- Email address.
- Password.
- Login action.
- Loading state.
- Invalid credentials state.
- Successful authentication state.

Public users seeking shelter must never be required to authenticate.

Authentication is exclusively intended for shelter workers.

### 2.6 Spectrum UI Morph Button

Documentation:

https://ui.spectrumhq.in/docs/morph-button

Use the actual **Morph Button** component from Spectrum UI for updating and saving shelter availability.

Required interaction sequence:

1. The worker modifies the shelter's bed availability.
2. The worker presses the update or save button.
3. The button transitions into a loading state.
4. The update is simulated successfully.
5. The button morphs into a success confirmation state.

Use Text Morph within the button's content wherever technically compatible, ensuring both mandatory components contribute to the interaction without producing conflicting animations.

The interaction must provide clear visual feedback that the availability update has been saved and published.

### 2.7 Spectrum UI Animated Chart

Documentation:

https://ui.spectrumhq.in/docs/animatedchart

Use the actual **Animated SVG Chart** component from Spectrum UI for the homelessness statistics visualization.

The chart must present meaningful, clearly labeled information relating to homelessness in Berlin.

Potential data series include:

- Official historical homelessness accommodation figures.
- Shelter capacity.
- Occupied beds.
- Available beds.
- Changes in availability across the shelters represented in the prototype.

Official historical statistics and simulated real-time availability must be clearly distinguished.

Do not fabricate historical homelessness statistics or present simulated data as verified government figures.

For prototype demonstrations, the availability chart may update reactively when shelter workers modify their shelter's bed count.

---

## 3. Visual Design Direction

Create a clean, sophisticated, contemporary civic technology platform.

The design must communicate:

- Trust.
- Accessibility.
- Human dignity.
- Urgency without unnecessary alarm.
- Clarity.
- Reliability.

The platform is intended for people who may be experiencing stressful or difficult circumstances. Usability must take priority over decorative complexity.

### Visual requirements

- A refined, minimal visual identity.
- Strong typographic hierarchy.
- Generous spacing and readable text.
- High-contrast interface elements.
- A restrained, accessible color palette.
- Carefully designed interactive states.
- Subtle, meaningful animations.
- Consistent component styling.
- Responsive desktop and mobile layouts.

Avoid generic SaaS landing page designs, excessive gradients, decorative glassmorphism, unnecessary eyebrow text, oversized navigation menus, and irrelevant visual effects.

The interface should feel purpose-built for a real public service.

Animations must reinforce usability and provide contextual feedback rather than distract users from finding accommodation.

Respect reduced-motion accessibility preferences.

---

## 4. Homepage Layout

The homepage should have an intentionally simple structure.

The main experience should consist of:

1. A minimal navigation header.
2. A prominent statistical hero section.
3. A central View Map action.
4. An interactive map experience that expands upon activation.
5. A compact statistics visualization that does not interfere with the primary shelter-finding workflow.

The primary user objective is to find a bed. Do not bury that functionality beneath unnecessary marketing sections.

### 4.1 Navigation Header

Create a minimal header containing:

**Left side:**

- Application logo.
- Application name.

**Right side:**

- Shelter Worker Login button.

Use a clear and accessible label such as:

**Shelter Worker Login**

The login button must use the Text Morph component for applicable state transitions.

Do not introduce public account registration, user profiles, or unnecessary navigation destinations.

Once a shelter worker is authenticated, replace the login action with a compact account or shelter management control.

### 4.2 Hero Section

The hero must be visually impactful while maintaining a respectful, human-centered tone.

Use the following headline:

**“There are 6,032 people who do not have beds in Berlin.”**

The numerical value, **6,032**, must be rendered using the mandatory Animated Number component:

https://motion-primitives.com/docs/animated-number

Make the number the strongest visual element in the hero.

Add a short supporting statement, such as:

“Find available shelter beds across Berlin, with availability updated directly by shelter workers.”

#### Statistical accuracy

The figure of 6,032 represents the official February 2024 estimate of people experiencing homelessness without accommodation in Berlin.

Official source:

https://www.berlin.de/sen/soziales/besondere-lebenssituationen/wohnungslose/statistik/

Display a subtle but readable source attribution and reference date below the statistic.

For example:

“Source: Berlin Senate, February 2024 estimate of people without accommodation.”

The preferred headline wording may be retained for its emotional impact, but the accompanying source description must clarify precisely what the statistic measures. It is not an exact count of currently missing shelter beds.

If greater statistical precision is required, use:

**“An estimated 6,032 people live without accommodation in Berlin.”**

Do not confuse this figure with the total number of people experiencing homelessness, which includes individuals already accommodated in shelters and other institutional housing.

If a verified official API becomes available during backend integration, the numerical value should be replaceable through the application's data layer.

For now, use the verified historical value as a frontend fixture.

Do not simulate random increases or decreases in the official population statistic.

### 4.3 Primary Call to Action

Directly beneath the hero, place a prominent button:

**View Map**

Use Text Morph for its changing label.

This should be the main public-facing action.

When pressed, the map must expand smoothly into a full-screen or near-full-screen interactive experience.

The transition must feel like a natural expansion of the homepage rather than navigation to an unrelated application.

When the user closes the map, restore the original homepage layout and scroll position where practical.

On mobile devices, the map should occupy the full available screen space, providing an immersive and practical navigation experience.

---

## 5. Interactive Berlin Shelter Map

### 5.1 Map Technology

Implement the map using an open-source mapping solution.

Preferred options:

- MapLibre GL JS with an appropriate OpenStreetMap-based tile provider.
- Leaflet with OpenStreetMap-based tiles.

The map must initially focus on Berlin, Germany.

Ensure that all required OpenStreetMap attribution is visible and that the selected map tile provider's usage requirements are respected.

The map must support:

- Panning.
- Zooming.
- Interactive markers.
- Marker selection.
- Search.
- Filtering.
- Responsive layouts.

Do not use a static map image.

The map must be a genuinely interactive, functional frontend experience.

### 5.2 Shelter Locations

Populate the map with real, publicly listed homeless shelters in Berlin.

Use reputable sources to identify official shelter locations.

Primary shelter directory:

https://www.kaeltehilfe-berlin.de/

Additional official information:

https://www.berlin.de/sen/soziales/besondere-lebenssituationen/wohnungslose/

Include a representative selection of approximately 8–15 verified shelters or emergency overnight accommodation facilities across Berlin, prioritizing locations suitable for people seeking immediate accommodation.

Where possible, use genuine:

- Shelter names.
- Public addresses.
- Geographic coordinates.
- Public contact information.
- Shelter operator names.
- Published eligibility requirements.
- Published operating hours.

All dynamic operational values may be mocked for this prototype, including:

- Total capacity.
- Occupied beds.
- Available beds.
- Current availability.
- Last-updated timestamps.

Do not invent addresses or telephone numbers for real shelters. If a field cannot be verified, leave it unavailable or use a clearly identified placeholder.

Include a visible prototype notice explaining that displayed bed availability is demonstration data and must not be relied upon for actual accommodation decisions.

### 5.3 Map Marker Design

Design custom, visually consistent markers that communicate bed availability at a glance.

Each marker should display the number of currently available beds.

Example availability states:

- Green: Beds available.
- Amber: Limited beds available.
- Red: No beds available.
- Gray: Availability unknown or not recently confirmed.

Example numerical states:

- 12 beds available.
- 3 beds available.
- 0 beds available.

Do not rely on color alone. Include numerical values, icons, or textual status indicators to ensure accessibility.

Markers should respond smoothly to selection, hover where supported, and availability changes.

When bed availability changes through the worker dashboard, the relevant marker must update automatically.

Use Animated Number for numerical marker transitions where appropriate.

### 5.4 Shelter Information Panel

When a user selects a shelter marker, display an expandable information panel using the mandatory Morphing Popover component.

Documentation:

https://motion-primitives.com/docs/morphing-popover

The panel should appear visually connected to the selected marker or originating control.

On desktop, it may expand into a floating card or side panel.

On mobile, it may expand into an accessible bottom panel while retaining the Morphing Popover transition.

The information panel must include:

- Shelter name.
- Shelter operator, where available.
- Availability status.
- Available bed count.
- Total bed capacity.
- Occupied bed count.
- Full address.
- Public contact number.
- Opening hours.
- Admission or eligibility requirements.
- Relevant accessibility information.
- Last availability update.

Include appropriate actions such as:

- Get Directions.
- Call Shelter.
- View More Information.
- Close Details.

Use Animated Number for the availability count and Text Morph for applicable action label transitions.

Do not imply that a bed has been reserved simply because it is shown as available.

Include a concise notice where appropriate:

“Availability may change. Contact the shelter to confirm admission requirements.”

The interface should make finding and understanding accommodation information as quick as possible.

### 5.5 Search and Filtering

Use the mandatory Toolbar Expandable component:

https://motion-primitives.com/docs/toolbar-expandable

Create a compact, floating map toolbar containing relevant controls.

Search functionality should support:

- Shelter name.
- Berlin district.
- Street address.

Filtering functionality should support:

- Shelters with available beds.
- Shelters with limited availability.
- All shelters.
- Relevant eligibility requirements, where known.
- Accessible accommodation, where confirmed.

When search results or filters change, update the visible map markers immediately.

Selecting a search result should move the map to the corresponding shelter and open its information panel.

The search interface must remain compact when inactive and expand naturally when selected.

Include an accessible empty state when no shelters match the selected criteria.

---

## 6. Shelter Worker Authentication Experience

### 6.1 Login Entry Point

The Shelter Worker Login button must remain visible in the homepage header.

When clicked, open the mandatory Spectrum UI Login Card:

https://ui.spectrumhq.in/docs/login

Use a polished opening transition, preferably integrated with the Morphing Popover component where technically appropriate.

The public-facing website must remain accessible without authentication.

### 6.2 Simulated Authentication

Implement frontend-only mock authentication.

Create a structured mock collection of shelter worker accounts.

Each mock worker must have a unique identifier and an assigned shelter identifier.

Example mock data:

```typescript
const mockShelterWorkers = [
  {
    id: "worker-001",
    name: "Anna Müller",
    email: "anna@demo-shelter.example",
    password: "Demo123!",
    shelterId: "shelter-001",
    role: "shelter_worker"
  },
  {
    id: "worker-002",
    name: "David Schneider",
    email: "david@demo-shelter.example",
    password: "Demo456!",
    shelterId: "shelter-002",
    role: "shelter_worker"
  }
];
```

These are fictional demonstration accounts and must never be presented as real shelter employee credentials.

The login interaction should simulate the following process:

1. The shelter worker enters an email address and password.
2. The frontend checks the credentials against the mock worker collection.
3. The corresponding worker record is identified.
4. The worker's assigned shelter identifier is retrieved.
5. The application retrieves the shelter associated with that identifier.
6. The worker is automatically authenticated within the simulated frontend environment.
7. The assigned shelter's management panel opens automatically.

**The worker must never be asked to manually select which shelter they represent.**

The relationship between the worker account and the assigned shelter must determine the dashboard automatically.

### 6.3 Authentication States

Implement realistic UI states for:

- Initial login.
- Empty required fields.
- Invalid credentials.
- Loading.
- Successful login.
- Logout.
- Expired or missing mock session, if applicable.

Use Text Morph for login-related button text transitions.

A successful login should transition smoothly into the corresponding shelter management interface.

Do not implement an actual authentication server, password hashing infrastructure, external authentication provider, or real user database.

Mock authentication is exclusively a demonstration mechanism and does not constitute production security.

---

## 7. Shelter Worker Management Dashboard

### 7.1 Dashboard Purpose

The shelter worker dashboard must be intentionally minimal.

Its primary function is to allow shelter workers to update the current operational bed availability of their assigned shelter.

Do not create a complex administration platform with unrelated functionality.

The worker should be able to log in and update availability within seconds.

### 7.2 Dashboard Opening Behavior

Following a successful login:

- Automatically identify the worker's assigned shelter.
- Retrieve the corresponding shelter's mock data.
- Open the shelter management panel.
- Display the shelter's name and current availability.
- Present the controls necessary to update bed availability.

Use the mandatory Morphing Popover component for the management panel's expandable interaction.

Documentation:

https://motion-primitives.com/docs/morphing-popover

The management panel should feel like a natural extension of the existing application rather than a completely separate product.

On desktop, use a spacious floating panel or side panel.

On mobile, provide a responsive full-screen or bottom-sheet-style management experience.

### 7.3 Dashboard Header

The header should display:

- Shelter name.
- Shelter address.
- Worker name.
- Current operational status.
- Last availability update.
- Logout action.

Example:

**Shelter Management**

Assigned shelter: [Shelter Name]

Signed in as: Anna Müller

Last updated: Today at 15:42

The assigned shelter must be read-only within the worker interface.

### 7.4 Capacity Overview

Display three clearly differentiated numerical statistics:

**Total Capacity**

The total number of operational beds in the shelter.

**Occupied Beds**

The number of beds currently occupied.

**Available Beds**

The number of beds currently available for accommodation.

Use the mandatory Animated Number component for all three values.

The available bed count should receive the strongest visual emphasis.

Example:

- Total capacity: 50
- Occupied beds: 38
- Available beds: 12

These values are demonstration data.

### 7.5 Availability Editing Controls

Provide a straightforward interface for adjusting bed availability.

The worker must be able to:

- Increase the available bed count.
- Decrease the available bed count.
- Enter a specific available bed count directly.
- Adjust operational bed capacity when necessary.
- Save or publish the changes.

Provide accessible increment and decrement controls alongside a numerical input.

Use the following relationship:

```typescript
availableBeds = totalCapacity - occupiedBeds;
```

Treat total capacity and occupied beds as the canonical values.

When the worker directly modifies available beds, automatically recalculate occupied beds.

When the worker modifies total capacity, preserve the occupied bed count unless explicitly adjusted.

Validation must prevent:

- Negative bed counts.
- Available beds exceeding total capacity.
- Occupied beds exceeding total capacity.
- Non-integer bed counts.
- Contradictory capacity values.

Display clear inline validation errors.

Changing form values should initially affect a draft state. Public availability must update only after the worker successfully saves the changes.

### 7.6 Saving and Publishing Availability

Use the mandatory Spectrum UI Morph Button for the primary save action:

https://ui.spectrumhq.in/docs/morph-button

Button label:

**Update Availability**

Required state sequence:

1. Update Availability
2. Updating
3. Availability Updated

Integrate Text Morph for label transitions wherever compatible.

When the worker presses the button:

1. Validate the new capacity values.
2. Display a simulated loading state.
3. Update the shelter record in shared frontend state.
4. Update the last-modified timestamp.
5. Update the worker dashboard's statistics.
6. Update the corresponding marker on the public map.
7. Update the shelter information panel if it is open.
8. Update any affected aggregate availability statistics or charts.
9. Display a clear success confirmation.

Example confirmation:

“Availability updated successfully. The new bed count is now visible on the public map.”

The worker must not need to refresh the website for changes to appear.

---

## 8. Simulated Real-Time Synchronization

Although the backend is outside the scope of this task, the frontend prototype must demonstrate how real-time shelter availability will work.

Implement a shared frontend state architecture that acts as the single source of truth for shelter data.

All of the following components must subscribe to or consume the same shelter data:

- Public shelter map.
- Map markers.
- Shelter information panels.
- Search results.
- Shelter worker dashboard.
- Aggregate availability statistics.
- Relevant animated charts.

When the worker updates a shelter's available bed count, every dependent interface must react immediately.

### Example Demonstration

Initial state:

```typescript
{
  id: "shelter-001",
  totalCapacity: 50,
  occupiedBeds: 38,
  availableBeds: 12
}
```

The worker changes available beds from 12 to 7 and saves.

Updated state:

```typescript
{
  id: "shelter-001",
  totalCapacity: 50,
  occupiedBeds: 43,
  availableBeds: 7
}
```

Expected frontend behavior:

- The dashboard transitions from 12 to 7 available beds.
- The occupied bed count transitions from 38 to 43.
- The corresponding map marker updates from 12 to 7.
- The shelter information panel displays the updated availability.
- The aggregate available bed count decreases by 5.
- The relevant availability chart updates reactively.
- The timestamp changes to reflect the update.

Use the Animated Number component for numerical transitions and the Spectrum UI Animated Chart for relevant visualizations.

Optionally persist demonstration state using localStorage so the prototype retains updates after a page refresh.

If demonstrating two browser tabs, synchronize changes using the storage event or BroadcastChannel where practical.

Clearly distinguish this local demonstration from actual multi-user server synchronization.

Do not implement WebSocket infrastructure, a production database, or real-time backend services.

---

## 9. Homelessness and Shelter Statistics

Create a compact statistics experience using the mandatory Spectrum UI Animated Chart:

https://ui.spectrumhq.in/docs/animatedchart

Separate statistics into two clearly identified categories.

### 9.1 Official Berlin Homelessness Statistics

Use verified historical figures where available.

Official sources:

https://www.berlin.de/sen/soziales/besondere-lebenssituationen/wohnungslose/statistik/

https://www.statistik-berlin-brandenburg.de/gesellschaft/soziales/untergebrachte-wohnungslose/

Example official figures for people accommodated through the homelessness assistance system:

```typescript
const officialAccommodationStatistics = [
  { year: 2022, value: 25975 },
  { year: 2023, value: 39375 },
  { year: 2024, value: 47260 },
  { year: 2025, value: 53610 },
  { year: 2026, value: 57575 }
];
```

Label the chart accurately:

**People accommodated through Berlin's homelessness assistance system**

Do not label these figures as people currently sleeping on the streets.

Official population statistics must remain unchanged when shelter workers update bed availability.

### 9.2 Simulated Live Shelter Availability

Use the shared shelter state to calculate:

- Total represented shelter capacity.
- Total occupied beds.
- Total available beds.
- Number of shelters with available beds.
- Availability changes following worker updates.

Label this section clearly as prototype availability data.

This section may react immediately to worker updates.

The chart should animate smoothly when its underlying data changes.

Do not fabricate a live government statistics feed or generate random numbers to create the impression of real-time homelessness reporting.

---

## 10. Frontend Data Architecture

Use a clean, modular architecture so the backend team can replace mock implementations without rebuilding the UI.

Create clearly separated models for shelters, workers, statistics, and authentication sessions.

Example shelter model:

```typescript
interface Shelter {
  id: string;
  name: string;
  operator?: string;
  address: string;
  district: string;

  coordinates: {
    latitude: number;
    longitude: number;
  };

  phone?: string;
  website?: string;
  openingHours?: string;

  totalCapacity: number;
  occupiedBeds: number;
  availableBeds: number;

  eligibility?: string[];
  accessibility?: string[];
  services?: string[];

  availabilityStatus:
    | "available"
    | "limited"
    | "full"
    | "unknown";

  lastUpdated: string;

  sourceUrl?: string;
  isMockAvailability: boolean;
}
```

Example worker model:

```typescript
interface ShelterWorker {
  id: string;
  name: string;
  email: string;
  shelterId: string;
  role: "shelter_worker";
}
```

Example authentication session:

```typescript
interface AuthSession {
  workerId: string;
  shelterId: string;
}
```

Example statistics model:

```typescript
interface PopulationStatistic {
  id: string;
  value: number;
  referenceDate: string;
  sourceUrl: string;
  category:
    | "without_accommodation"
    | "accommodated"
    | "total_homelessness";
}
```

Structure the data layer so future API integration is straightforward.

Suggested service interfaces:

```typescript
interface ShelterService {
  getShelters(): Promise<Shelter[]>;

  getShelterById(id: string): Promise<Shelter>;

  updateAvailability(
    shelterId: string,
    values: {
      totalCapacity: number;
      occupiedBeds: number;
    }
  ): Promise<Shelter>;
}
```

```typescript
interface AuthService {
  login(
    email: string,
    password: string
  ): Promise<AuthSession>;

  logout(): Promise<void>;

  getCurrentSession(): Promise<AuthSession | null>;
}
```

Implement mock versions of these interfaces for the current prototype.

The backend team should later be able to replace the mock services with real API implementations without significantly modifying the visual components.

Production authentication and authorization, including verification that workers may only modify their assigned shelters, must be enforced by the eventual backend.

---

## 11. Recommended Technical Stack

Use the following stack unless the existing project already defines equivalent technologies:

- React or Next.js.
- TypeScript.
- Tailwind CSS.
- Motion, as required by the provided animation components.
- Motion Primitives.
- Spectrum UI.
- MapLibre GL JS or Leaflet.
- React Context, Zustand, or another lightweight shared state solution.

Preserve the existing project structure and dependencies where practical.

Install only the additional dependencies necessary to implement the mandatory components and mapping functionality.

Do not introduce unnecessary frameworks, architectural complexity, or unrelated packages.

---

## 12. Suggested Component Architecture

Organize the application into reusable, clearly scoped components.

```text
components/
  layout/
    Header
    AppShell

  hero/
    HomelessnessHero
    HeroStatistic
    ViewMapButton

  map/
    BerlinShelterMap
    ShelterMarker
    ShelterMapToolbar
    ShelterSearch
    ShelterFilters
    ShelterDetailsPanel
    MapLegend

  authentication/
    ShelterWorkerLogin
    WorkerAccountControl

  dashboard/
    ShelterManagementPanel
    CapacityOverview
    AvailabilityEditor
    UpdateAvailabilityButton

  statistics/
    HomelessnessChart
    LiveAvailabilityChart

  ui/
    text-morph
    morphing-popover
    toolbar-expandable
    animated-number
    spectrum-login
    spectrum-morph-button
    spectrum-animated-chart

data/
  mockShelters.ts
  mockShelterWorkers.ts
  officialStatistics.ts

services/
  shelterService.ts
  authService.ts
  statisticsService.ts

store/
  shelterStore.ts
  authStore.ts

types/
  shelter.ts
  worker.ts
  statistics.ts
```

This structure is a recommendation. Adapt it to the existing repository where necessary without changing the required user experience.

---

## 13. Accessibility and User Experience Requirements

The application must be designed for a diverse public audience, including individuals who may have limited internet access, older mobile devices, limited digital literacy, or accessibility requirements.

Implement:

- Mobile-first responsive layouts.
- Large, readable text.
- Accessible touch targets.
- Keyboard navigation.
- Clear focus states.
- Appropriate semantic HTML.
- Accessible form labels.
- Reduced-motion support.
- Strong foreground and background contrast.
- Accessible error messages.
- Plain, understandable language.
- Loading and empty states.

Provide an accessible list-based alternative to the map so that users can find shelter information without relying entirely on map interactions.

The public interface should support English and German where feasible. Structure text so additional languages can be introduced easily during later development.

Avoid mandatory geolocation permissions, mandatory account creation, complex navigation, and unnecessary user data collection.

If geolocation is offered, make it optional and request permission only after a deliberate user action.

Keep the core shelter-finding experience usable even if optional animations or map tiles fail to load.

---

## 14. Complete User Workflows

### Workflow A: Person Seeking Accommodation

1. The user visits the homepage.
2. The hero displays the animated official homelessness statistic.
3. The user presses View Map.
4. The map expands smoothly into an interactive map of Berlin.
5. Shelter markers display current demonstration bed availability.
6. The user searches or filters shelters using the expandable toolbar.
7. The user selects a shelter.
8. A Morphing Popover reveals the shelter's details.
9. The user checks availability, address, admission requirements, and contact information.
10. The user opens directions or contacts the shelter.

No authentication is required at any stage.

### Workflow B: Shelter Worker Updating Availability

1. The worker visits the same homepage.
2. The worker presses Shelter Worker Login.
3. The Spectrum UI Login Card opens.
4. The worker enters their demonstration credentials.
5. The frontend identifies the matching mock worker.
6. The worker's assigned shelter is resolved automatically.
7. The shelter management panel opens using the appropriate morphing transition.
8. The dashboard displays total capacity, occupied beds, and available beds.
9. The worker modifies the available bed count.
10. The worker presses Update Availability.
11. The Spectrum UI Morph Button transitions through loading and success states.
12. The shared shelter state updates.
13. The public map immediately displays the new bed count.
14. Related statistics and charts update.
15. The worker can close the panel or log out.

At no point should the worker manually select or switch to an unrelated shelter.

---

## 15. Implementation Priorities

This project is being developed in a time-constrained hackathon environment.

Prioritize a complete, polished end-to-end demonstration over additional features.

### Priority 1: Essential Public Experience

- Hero section with Animated Number.
- View Map interaction.
- Functional Berlin map.
- Real shelter locations with mocked availability.
- Interactive markers.
- Morphing shelter detail panels.
- Expandable search toolbar.

### Priority 2: Essential Shelter Worker Experience

- Spectrum UI Login Card.
- Mock worker authentication.
- Automatic worker-to-shelter assignment.
- Shelter management panel.
- Capacity editing controls.
- Spectrum UI Morph Button.
- Immediate public map synchronization.

### Priority 3: Visual Polish and Statistics

- Animated SVG Chart.
- Text Morph interactions throughout the application.
- Responsive refinements.
- Additional accessibility improvements.
- Loading and confirmation states.
- Optional frontend persistence.

All seven mandatory components must be implemented within the completed prototype.

Do not treat the component requirements as optional polish.

---

## 16. Strict Implementation Constraints

The following requirements must be respected throughout development:

1. **Frontend and UI/UX only.** Do not implement an actual backend.

2. **Use all seven provided components.** Their original implementations are mandatory.

3. **Do not substitute the provided components with generic alternatives.**

4. **Use structured mock data.** Separate mock services from visual components.

5. **Use genuine publicly listed Berlin shelter locations.** Dynamic availability may be simulated.

6. **Do not present mocked availability as verified public-service information.**

7. **Automatically assign workers to their corresponding shelters.** Do not add a manual shelter selection screen.

8. **Maintain shared frontend state.** Worker updates must immediately propagate to the public-facing interface.

9. **Keep the public shelter-finding experience authentication-free.**

10. **Preserve statistical accuracy.** Official historical homelessness figures and simulated live availability are separate concepts.

11. **Maintain accessibility and responsive behavior.**

12. **Avoid unnecessary features.** Do not introduce booking systems, donations, public user accounts, chatbots, shelter registration, or unrelated administration functionality.

13. **Do not introduce regressions.** Preserve working application behavior and existing project functionality throughout implementation.

14. **Do not stop at static mockups.** The delivered website must be interactive and demonstrate the complete user workflow.

---

## 17. Final Deliverables and Acceptance Criteria

Deliver a complete, polished, runnable frontend application.

The implementation is considered successful only if:

- The homepage displays the official homelessness statistic using Animated Number.
- View Map expands into a functional interactive map of Berlin.
- Real publicly listed shelters appear as map markers.
- Markers display clearly identified mocked bed availability.
- Selecting a marker opens a detailed Morphing Popover.
- The map search uses the mandatory expandable toolbar.
- Shelter workers can access the Spectrum UI Login Card.
- Demonstration credentials successfully authenticate mock workers.
- Workers are automatically assigned to their corresponding shelters.
- The shelter management panel allows capacity and availability adjustments.
- Invalid availability values are rejected.
- The Spectrum UI Morph Button handles saving and confirmation.
- Updated bed counts immediately appear on the public map.
- Animated Number reflects numerical changes.
- The Spectrum UI Animated Chart displays appropriately labeled statistics.
- Text Morph is integrated into applicable button state transitions.
- The experience works on desktop and mobile devices.
- All seven specified components are present and functional.
- Backend integration points are clearly documented.
- Demonstration data is visibly distinguished from verified live operational information.

Provide a short README containing:

- Installation and startup instructions.
- A list of implemented mandatory components.
- Demonstration login credentials.
- An explanation of the frontend state architecture.
- The locations of the mock data and mock services.
- Instructions for replacing mock services with real backend APIs.
- Official data sources and the reference dates of statistics.
- Any known limitations.

Before concluding, test the complete demonstration flow from opening the homepage to logging in as a shelter worker, updating available beds, and observing the corresponding marker change on the public map.

The final experience should make one idea immediately understandable:

**A shelter worker updates the number of available beds, and a person seeking accommodation can immediately see where those beds are available.**

That interaction is the core of this product. Everything else should support it.
