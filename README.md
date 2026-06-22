# Forest Plot Recorder

A lightweight, self-contained web app for recording field data about small
forest plots. Built for Charmelle — no install, no accounts, works offline.

## What it does

- Record **plots** (sites): plot number (1–50), name/ID, date, surveyor, GPS
  coordinates, shape, size, slope, aspect, canopy cover, number of gaps, soil
  texture, soil colour, litter depth, drainage, disturbance level and notes.
- Record **trees** within each plot: running number, species (local name),
  species ID, DBH (diameter at breast height), clinometer height measurements,
  canopy diameters (X and Y), crown class, health status and notes.
- **Height is calculated** from three clinometer readings — distance to the
  tree, angle to the base and angle to the top — using the tangent method:
  `height = distance × (tan(angle_top) − tan(angle_base))`. Enter downward
  angles as negative. The result updates live and is saved with the raw
  readings.
- Live per-plot summary: tree count, species richness, average DBH and height.
- **Per-plot export** to CSV (one row per tree, plot fields repeated) for
  Excel / GIS, and to JSON for a full backup that can be re-imported.
- Export files are named **`CG_P_<plot number>`** — e.g. `CG_P_12.csv`,
  `CG_P_12.json` — so the three of you can share files without confusion.
- Captures GPS from the device with one tap (when permission is granted).

## How to use it

Just open `CG_Peanut.html` in any modern web browser — designed for an
Android phone, and works on desktop too.

1. Fill in the **Plot** form (choose the plot number 1–50) and press *Save plot*.
2. Select the plot in the list, then add **Trees** to it.
3. With a plot selected, use **Export plot (CSV)** / **Export plot (JSON)** to
   save that plot to a `CG_P_<number>` file you can email, back up, or open in
   a spreadsheet. Each plot exports as its own file.

### Where is my data?

While you work, data is kept in the browser's local storage on that device, so
a page refresh won't lose it. It is **not** synced to any server. To move data
between devices or keep a permanent copy, use **Export JSON** (and **Import** to
load it elsewhere).

> Tip for fieldwork: export a JSON backup at the end of each day.

## Hosting (optional)

Because it's a static site, you can host it for free anywhere — GitHub Pages,
Netlify, or just share the folder. No build step required.

## Files

| File         | Purpose                          |
|--------------|----------------------------------|
| `CG_Peanut.html` | Page structure and forms     |
| `styles.css` | Styling                          |
| `app.js`     | App logic, storage, export/import|
