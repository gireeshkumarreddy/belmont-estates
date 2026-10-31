# Belmont Estates landing page

A scroll-story landing page for Belmont Estates, a 75-homesite acreage community in Fulshear, Texas.
Static HTML, CSS and JavaScript modules, with no build step.

## Run it locally

The scripts are ES modules, so serve the folder over HTTP rather than opening `index.html` directly:

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

## What's where

- `index.html`: the page.
- `css/styles.css`: all styles, built on the Belmont brand colors and type.
- `js/scenes.js`: the scroll engine (smooth scrolling, pinned scenes and the map stops).
- `js/experience.js`: the intro, the entry tour, reveals, the cursor and the scroll UI.
- `js/areamap.js`: the "Everything close to home" map, from the Belmont Area Attractions Map.
- `js/plan.js` and `js/plan3d.js`: the master plan in 2D and 3D. three.js loads only when someone opens the 3D view.
- `js/schools.js`: the school path in the schools section.
- `blender/build_belmont_model.py`: builds `assets/model/belmont.glb` from the site plan.

## Rebuild the 3D model

```bash
blender -b --factory-startup --python blender/build_belmont_model.py
```

## Before launch

- The interest-list form isn't connected yet. Set `data-endpoint` on `#connect-form` in `index.html` to your CRM or form-service URL. Until then, the form tells people their details weren't sent.
- The page asks search engines not to index it (`<meta name="robots" content="noindex">`). Remove that line when it goes live.
- Great Vibes stands in for the brand's Seasons Script font.
