# Belmont Estates website

The Belmont Estates website. It follows the Falcon Manor site's structure section by section: its pages, navigation, docked search bar, site map, area and school maps, journal and AI concierge. It's dressed in the Belmont Estates brand: Spectral Light caps headlines with a script callout, Public Sans body text, and the kit's palette, brushstrokes, crest frames and horseshoe band. All text, photos, logos and maps come from the Belmont Estates brand kit. Nothing comes from the Falcon Manor site.

The kit's script typeface, Seasons Script, isn't a free web font, so Great Vibes (Google Fonts) stands in for it. The "Living" lockup in the hero is the kit's own artwork.

## Pages

The site is a single page, `index.html`, with routes for each section (`#page` or `#page/section`).

- **Home (`#home`):**
  - the hero, then the "About Belmont Estates" statement, which lights up word by word as you scroll;
  - the builder logos and explore tiles;
  - Meet Our Builders, Life at Belmont Estates and "Unbridled Living";
  - the ticker;
  - A Different Breed of Living, with the developer;
  - the location map, Your Path steps, the journal and question categories.
- **Community (`#community`):**
  - the plan poster and the interactive site map;
  - planning notes, at a glance, and homesites and homes;
  - convenience, the developer (Highten Capital), HOA and taxes, and questions.
- **Find Your Home (`#homes`):**
  - the homesite search with a Be First in Line form;
  - the four builders;
  - builder incentives and homesite availability, and questions.
- **Lifestyle (`#lifestyle`):** on-site amenities, a site map call-out, Creating Your Moments, nearby recreation, and questions.
- **Relocation (`#relocation`):** Moving to Fulshear, the area map, getting around, the Fulshear area, and questions. Old `#fulshear` links still work.
- **Schools (`#schools`):** Lamar CISD, the school map, Good to Know, videos (coming soon), photos, and questions.
- **Contact (`#contact`):** the register form, where to find us, and every question, with search.
- **News & Updates (`#news`):** the latest stories, the journal, videos (coming soon) and photos.

On every page:
- the newsletter band and footer;
- the Find Your New Home dock at the bottom of the screen (on wider screens);
- the AI concierge ("Ask Belmont Estates").

## Interactive pieces

- **Site map:** the kit's masterplan artwork with all 74 homesites traced on top of it; Phase 1 homesites are coloured by builder.
  - Numbers run block by block.
  - It works like Falcon's: Map View and Explore Plans, filters for builder and phase, Reset, and Favorites (saved on the visitor's device).
  - It has sorting, zoom, layers, a legend with counts, 2D and 3D, and markers for the ponds, trails, green space and entries.
  - Listings have Homesites, Builders and Amenities tabs in Grid or List view.
  - Each homesite has a detail panel with Register Interest, Save, Share and Directions.
  - `#community/explore/12` opens homesite 12.
- **Area map:** the roads from the kit's Area Attractions map, with its 28 numbered places in the kit's category colours. You can filter by category and select a place. The home page shows a labelled selection, and the school map filters the four campuses by level.
- **AI concierge:** on Vercel, `api/concierge.js` answers with Claude (Claude Opus 5.5 by default), using only `content/knowledge.json` and the masterplan data. Answers can open the site map, a place on the map, the school map, the register form or a page. Without `ANTHROPIC_API_KEY`, and on GitHub Pages, the page's built-in answers reply instead, from the same content.
- **Forms:** a prototype. They show the kit's thank-you message but don't send anything.

## Content and data

- `content/knowledge.json`: the kit's facts, builders, places, categories, roads and question-and-answer pairs. It also holds the masterplan's amenities, the journal entries and the gallery photos. Both the site and the concierge read it.
- `js/plan-data.js`: generated from the kit's masterplan and area map by `tools/kit_site_data.py`.
- `img/`: generated from the kit by `tools/kit_assets.py` (photos, crest frames, brushstrokes, textures, logos) and `tools/kit_vectors.py` (the landing page's map and other vector art).

To rebuild them from the unzipped kit:

```bash
python -I tools/kit_assets.py "<kit folder>"
python -I tools/kit_vectors.py "<kit folder>/Landing Page/Belmont Estates - Unbridled Living.pdf"
python -I tools/kit_site_data.py "<kit folder>"
```

## Run it locally

```bash
python -m http.server 5180
```

Then open http://localhost:5180. The concierge uses its built-in answers locally.

## AI concierge setup (Vercel)

1. Create an API key at https://platform.claude.com and set a monthly spend limit there.
2. In the Vercel project, open Settings, then Environment Variables, and add `ANTHROPIC_API_KEY`.
3. Redeploy.

`CONCIERGE_MODEL` can name another current Claude model.

## Before launch

- **Search engines:** the page is marked `noindex`; remove that at launch.
- **Kit content to confirm:**
  - "New homes slated to begin mid-2025" (the date has passed).
  - "Wespark Tollway", which is spelled that way in the kit's map artwork.
  - The masterplan shows 74 homesites, but the copy says 75.
- **Social links:** Facebook and Instagram are placeholders until the accounts are known.
