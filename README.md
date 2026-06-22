# Forest Plot Recorder

A lightweight, self-contained web app for recording field data about small
forest plots. Built for Charmelle — no install, no accounts, works offline.

## What it does

- Record **plots** (sites): name/ID, date, surveyor, GPS coordinates, shape,
  size, slope, aspect, canopy cover and notes.
- Record **trees** within each plot: species, tag number, DBH (diameter at
  breast height), height, health, status and notes.
- Live per-plot summary: tree count, species richness, average DBH and height.
- **Export to CSV** (one row per tree, plot fields repeated) for Excel / GIS.
- **Export to JSON** for a full backup, and **Import** it back later.
- Captures GPS from the device with one tap (when permission is granted).

## How to use it

Just open `index.html` in any modern web browser — desktop or phone.

1. Fill in the **Plot** form and press *Save plot*.
2. Select the plot in the list, then add **Trees** to it.
3. Use **Export CSV** / **Export JSON** to save the data to a file you can
   email, back up, or open in a spreadsheet.

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
| `index.html` | Page structure and forms         |
| `styles.css` | Styling                          |
| `app.js`     | App logic, storage, export/import|
